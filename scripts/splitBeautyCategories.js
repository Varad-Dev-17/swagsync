import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

import Department from "../server/models/department.js";
import Category from "../server/models/category.js";
import Product from "../server/models/product.js";
import AttributeMapping from "../server/models/attributeMapping.js";

const MONGO_URI = process.env.MONGO_URI;

const slugify = (text) =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

async function splitCategories() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected successfully.\n");

    const dept = await Department.findOne({
      $or: [
        { slug: "beauty-personal-care" },
        { slug: "beauty-and-personal-care" },
        { name: "Beauty & Personal Care" },
        { name: "Beauty" }
      ]
    });

    if (!dept) {
      console.error("Beauty department not found!");
      process.exit(1);
    }

    const deptId = dept._id;

    // Helper to ensure category exists
    async function ensureCategory(name, slug, fallbackImage = null) {
      let cat = await Category.findOne({ $or: [{ name }, { slug }] });
      if (!cat) {
        cat = await Category.create({
          name,
          slug,
          departmentIds: [deptId],
          status: "Active",
          ...(fallbackImage ? { image: fallbackImage } : {})
        });
        console.log(`Created new category: ${name}`);
      } else {
        cat.name = name;
        cat.slug = slug;
        if (!cat.departmentIds.some(id => id.toString() === deptId.toString())) {
          cat.departmentIds.push(deptId);
        }
        cat.status = "Active";
        if (fallbackImage && !cat.image?.url) cat.image = fallbackImage;
        await cat.save();
        console.log(`Ensured category: ${name}`);
      }
      return cat;
    }

    // Helper to copy attribute mappings
    async function copyAttributeMappings(sourceCatId, targetCatId) {
      if (!sourceCatId || !targetCatId || sourceCatId.toString() === targetCatId.toString()) return;
      const mappings = await AttributeMapping.find({ categoryId: sourceCatId });
      for (const m of mappings) {
        const exists = await AttributeMapping.findOne({ categoryId: targetCatId, attributeId: m.attributeId });
        if (!exists) {
          await AttributeMapping.create({
            categoryId: targetCatId,
            attributeId: m.attributeId,
            isRequired: m.isRequired,
            isFilterable: m.isFilterable,
            displayOrder: m.displayOrder,
            section: m.section
          });
        }
      }
    }

    // 1. Foundation and Primer (from Foundation & Concealer)
    console.log("\n--- 1. Handling Foundation & Primer ---");
    const oldFoundationCat = await Category.findOne({
      $or: [{ name: "Foundation & Concealer" }, { slug: "foundation-concealer" }]
    });

    const foundationCat = await ensureCategory("Foundation", "foundation", oldFoundationCat?.image);
    const primerCat = await ensureCategory("Primer", "primer", oldFoundationCat?.image);

    if (oldFoundationCat) {
      await copyAttributeMappings(oldFoundationCat._id, foundationCat._id);
      await copyAttributeMappings(oldFoundationCat._id, primerCat._id);

      // Reassign products
      const prods = await Product.find({ category: oldFoundationCat._id });
      for (const p of prods) {
        if (/primer/i.test(p.title) || /primer/i.test(p.description || "")) {
          p.category = primerCat._id;
          await p.save();
          console.log(`Reassigned product "${p.title}" -> Primer`);
        } else {
          p.category = foundationCat._id;
          await p.save();
          console.log(`Reassigned product "${p.title}" -> Foundation`);
        }
      }

      // Remove the old combined category if different
      if (oldFoundationCat._id.toString() !== foundationCat._id.toString() && oldFoundationCat._id.toString() !== primerCat._id.toString()) {
        await Category.deleteOne({ _id: oldFoundationCat._id });
        console.log(`Removed old combined category: Foundation & Concealer`);
      }
    }

    // 2. Eyeshadow & Eyeliner
    console.log("\n--- 2. Handling Eyeshadow & Eyeliner ---");
    const oldEyeCat = await Category.findOne({
      $or: [{ name: "Eyeshadow & Eyeliner" }, { slug: "eyeshadow-eyeliner" }]
    });

    const eyeshadowCat = await ensureCategory("Eyeshadow", "eyeshadow", oldEyeCat?.image);
    const eyelinerCat = await ensureCategory("Eyeliner", "eyeliner", oldEyeCat?.image);

    if (oldEyeCat) {
      await copyAttributeMappings(oldEyeCat._id, eyeshadowCat._id);
      await copyAttributeMappings(oldEyeCat._id, eyelinerCat._id);

      const prods = await Product.find({ category: oldEyeCat._id });
      for (const p of prods) {
        if (/eyeliner|kajal|liner/i.test(p.title)) {
          p.category = eyelinerCat._id;
          await p.save();
          console.log(`Reassigned product "${p.title}" -> Eyeliner`);
        } else {
          p.category = eyeshadowCat._id;
          await p.save();
          console.log(`Reassigned product "${p.title}" -> Eyeshadow`);
        }
      }

      if (oldEyeCat._id.toString() !== eyeshadowCat._id.toString() && oldEyeCat._id.toString() !== eyelinerCat._id.toString()) {
        await Category.deleteOne({ _id: oldEyeCat._id });
        console.log(`Removed old combined category: Eyeshadow & Eyeliner`);
      }
    }

    // 3. Face Wash & Cleanser
    console.log("\n--- 3. Handling Face Wash & Cleanser ---");
    const oldWashCat = await Category.findOne({
      $or: [{ name: "Face Wash & Cleanser" }, { slug: "face-wash-cleanser" }]
    });

    const faceWashCat = await ensureCategory("Face Wash", "face-wash", oldWashCat?.image);
    const cleanserCat = await ensureCategory("Cleanser", "cleanser", oldWashCat?.image);

    if (oldWashCat) {
      await copyAttributeMappings(oldWashCat._id, faceWashCat._id);
      await copyAttributeMappings(oldWashCat._id, cleanserCat._id);

      const prods = await Product.find({ category: oldWashCat._id });
      for (const p of prods) {
        if (/cleanser|micellar|cleansing/i.test(p.title)) {
          p.category = cleanserCat._id;
          await p.save();
          console.log(`Reassigned product "${p.title}" -> Cleanser`);
        } else {
          p.category = faceWashCat._id;
          await p.save();
          console.log(`Reassigned product "${p.title}" -> Face Wash`);
        }
      }

      if (oldWashCat._id.toString() !== faceWashCat._id.toString() && oldWashCat._id.toString() !== cleanserCat._id.toString()) {
        await Category.deleteOne({ _id: oldWashCat._id });
        console.log(`Removed old combined category: Face Wash & Cleanser`);
      }
    }

    console.log("\n✅ Finished separating Beauty categories successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error during category separation:", error);
    process.exit(1);
  }
}

splitCategories();
