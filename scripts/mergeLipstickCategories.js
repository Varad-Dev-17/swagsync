import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

import Category from "../server/models/category.js";
import Product from "../server/models/product.js";
import AttributeMapping from "../server/models/attributeMapping.js";

const MONGO_URI = process.env.MONGO_URI;

async function mergeLipstickCategories() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected successfully.\n");

    const lipstickCat = await Category.findOne({
      $or: [{ slug: "lipstick" }, { name: "Lipstick" }]
    });

    const liquidLipstickCat = await Category.findOne({
      $or: [{ slug: "liquid-lipstick" }, { name: "Liquid Lipstick" }]
    });

    if (!lipstickCat) {
      console.error("Main Lipstick category not found!");
      process.exit(1);
    }

    if (!liquidLipstickCat) {
      console.log("No separate 'Liquid Lipstick' category found. Nothing to merge.");
      await mongoose.disconnect();
      process.exit(0);
    }

    console.log(`Found main Lipstick category: "${lipstickCat.name}" (${lipstickCat._id})`);
    console.log(`Found Liquid Lipstick category: "${liquidLipstickCat.name}" (${liquidLipstickCat._id})`);

    // 1. Reassign all products from Liquid Lipstick to Lipstick
    const productsToUpdate = await Product.find({ category: liquidLipstickCat._id });
    console.log(`\nReassigning ${productsToUpdate.length} product(s) to Lipstick category:`);
    for (const prod of productsToUpdate) {
      prod.category = lipstickCat._id;
      await prod.save();
      console.log(`  -> Reassigned "${prod.title}" (${prod.productId}) to Lipstick`);
    }

    // 2. Copy attribute mappings if any are missing on Lipstick
    const liquidMappings = await AttributeMapping.find({
      $or: [{ category: liquidLipstickCat._id }, { categoryId: liquidLipstickCat._id }]
    });
    for (const m of liquidMappings) {
      const attrId = m.attribute || m.attributeId;
      const exists = await AttributeMapping.findOne({
        $or: [
          { category: lipstickCat._id, attribute: attrId },
          { categoryId: lipstickCat._id, attributeId: attrId }
        ]
      });
      if (!exists) {
        await AttributeMapping.create({
          category: lipstickCat._id,
          attribute: attrId
        });
      }
    }
    // Remove old mappings
    await AttributeMapping.deleteMany({
      $or: [{ category: liquidLipstickCat._id }, { categoryId: liquidLipstickCat._id }]
    });
    console.log(`Cleaned up attribute mappings for Liquid Lipstick.`);

    // 3. Delete the Liquid Lipstick category
    await Category.deleteOne({ _id: liquidLipstickCat._id });
    console.log(`\n✅ Deleted 'Liquid Lipstick' category document (${liquidLipstickCat._id}) successfully!`);

    // Verify products under Lipstick
    const totalLipstickProducts = await Product.find({ category: lipstickCat._id }, "title productId");
    console.log(`\nTotal products now under 'Lipstick' (${totalLipstickProducts.length}):`);
    totalLipstickProducts.forEach(p => console.log(`  - ${p.title} (${p.productId})`));

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Error merging lipstick categories:", error);
    process.exit(1);
  }
}

mergeLipstickCategories();
