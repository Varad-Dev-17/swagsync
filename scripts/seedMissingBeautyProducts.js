import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

import Department from "../server/models/department.js";
import Category from "../server/models/category.js";
import Brand from "../server/models/brand.js";
import Attribute from "../server/models/attribute.js";
import AttributeOption from "../server/models/attributeOption.js";
import AttributeMapping from "../server/models/attributeMapping.js";
import Product from "../server/models/product.js";
import Variant from "../server/models/variant.js";
import Counter from "../server/models/counter.js";

const MONGO_URI = process.env.MONGO_URI;

const slugify = (text) =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

async function getNextProductSeq() {
  const counter = await Counter.findByIdAndUpdate(
    "productId",
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return `PROD-${counter.seq}`;
}

const BEAUTY_IMAGES = {
  primer: {
    maybelline: {
      url: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=80",
      publicId: "beauty/makeup_primer_maybelline"
    },
    lakme: {
      url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80",
      publicId: "beauty/makeup_primer_lakme"
    }
  },
  eyeshadow: {
    huda: {
      url: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=800&q=80",
      publicId: "beauty/makeup_eyeshadow_huda"
    },
    maybelline: {
      url: "https://images.unsplash.com/photo-1583241800698-e8ab01830a07?auto=format&fit=crop&w=800&q=80",
      publicId: "beauty/makeup_eyeshadow_maybelline"
    }
  },
  eyeliner: {
    maybelline: {
      url: "https://images.unsplash.com/photo-1597225244660-1cd128c64284?auto=format&fit=crop&w=800&q=80",
      publicId: "beauty/makeup_eyeliner_maybelline"
    },
    lakme: {
      url: "https://images.unsplash.com/photo-1631214524020-7e18db9a8f92?auto=format&fit=crop&w=800&q=80",
      publicId: "beauty/makeup_eyeliner_lakme"
    }
  }
};

const PRODUCTS_TO_SEED = [
  // ==========================================
  // 1. PRIMER
  // ==========================================
  {
    title: "Maybelline New York Fit Me Matte + Poreless Primer",
    category: "Primer",
    brand: "Maybelline New York",
    shortDescription: "Pore-blurring matte primer that controls shine and smooths skin for a 16-hour fresh makeup base.",
    longDescription: "Formulated with clay and blurring micro-powders, Maybelline Fit Me Matte + Poreless Primer instantly mattifies skin, minimizes enlarged pores, and extends foundation wear for up to 16 hours.",
    attributes: [
      { name: "Product Type", value: "Primer" },
      { name: "Formulation", value: "Gel" },
      { name: "Finish", value: "Matte" },
      { name: "Skin Type", value: "Normal to Oily Skin" },
      { name: "Specialty / Claims", value: "Dermatologically Tested" }
    ],
    variants: [
      {
        size: "30ml",
        sku: "MAY-FITME-PRIMER-30ML",
        mrp: 599,
        price: 499,
        stock: 50,
        image: BEAUTY_IMAGES.primer.maybelline
      }
    ]
  },
  {
    title: "Lakmé Absolute Blur Perfect Makeup Primer",
    category: "Primer",
    brand: "Lakmé",
    shortDescription: "Silky lightweight face primer that softens blemishes and creates an even, velvety canvas.",
    longDescription: "Lakmé Absolute Blur Perfect Makeup Primer instantly hides skin imperfections and provides an even tone for seamless foundation application. Waterproof and lightweight formula keeps makeup looking radiant all day.",
    attributes: [
      { name: "Product Type", value: "Primer" },
      { name: "Formulation", value: "Cream/Lotion" },
      { name: "Finish", value: "Velvet" },
      { name: "Skin Type", value: "All Skin Types" },
      { name: "Specialty / Claims", value: "Cruelty-Free" }
    ],
    variants: [
      {
        size: "30g",
        sku: "LAK-ABS-BLUR-PRIMER-30G",
        mrp: 799,
        price: 649,
        stock: 45,
        image: BEAUTY_IMAGES.primer.lakme
      }
    ]
  },

  // ==========================================
  // 2. EYESHADOW
  // ==========================================
  {
    title: "Huda Beauty The New Nude Eyeshadow Palette",
    category: "Eyeshadow",
    brand: "Huda Beauty",
    shortDescription: "Game-changing 18-shade eyeshadow palette featuring velvety mattes, reflective metallics, and glitter toppers.",
    longDescription: "Revolutionize your nude eye looks with 18 versatile shades. Includes buttery smooth matte eyeshadows, high-shine duo-chromes, pressed pearl pigments, and a concealer base for high-intensity payoff.",
    attributes: [
      { name: "Product Type", value: "Eyeshadow Palette" },
      { name: "Formulation", value: "Pressed Powder" },
      { name: "Finish", value: "Shimmer" },
      { name: "Specialty / Claims", value: "Cruelty-Free" }
    ],
    variants: [
      {
        shade: "Nude Medium",
        size: "19.7g",
        sku: "HUDA-NUDE-EYESHADOW-MED",
        mrp: 5350,
        price: 4799,
        stock: 30,
        image: BEAUTY_IMAGES.eyeshadow.huda
      },
      {
        shade: "Nude Light",
        size: "19.7g",
        sku: "HUDA-NUDE-EYESHADOW-LIGHT",
        mrp: 5350,
        price: 4799,
        stock: 25,
        image: BEAUTY_IMAGES.eyeshadow.huda
      }
    ]
  },
  {
    title: "Maybelline New York The Blushed Nudes Eyeshadow Palette",
    category: "Eyeshadow",
    brand: "Maybelline New York",
    shortDescription: "12 expertly curated rose gold-infused nude shades for effortlessly soft and sensual day-to-night eyes.",
    longDescription: "Specially curated 12 rose gold blushed shades that flatter all skin tones. Features satins, shimmers, and rich matte textures to sculpt, line, and highlight your eyes with endless creative looks.",
    attributes: [
      { name: "Product Type", value: "Eyeshadow Palette" },
      { name: "Formulation", value: "Pressed Powder" },
      { name: "Finish", value: "Satin" },
      { name: "Specialty / Claims", value: "Dermatologically Tested" }
    ],
    variants: [
      {
        shade: "Blushed Nudes",
        size: "9.6g",
        sku: "MAY-BLUSHED-NUDES-9G",
        mrp: 899,
        price: 699,
        stock: 55,
        image: BEAUTY_IMAGES.eyeshadow.maybelline
      }
    ]
  },

  // ==========================================
  // 3. EYELINER
  // ==========================================
  {
    title: "Maybelline New York Colossal Bold Eyeliner",
    category: "Eyeliner",
    brand: "Maybelline New York",
    shortDescription: "Intense black waterproof liquid eyeliner with precision tip brush for smudge-proof 24-hour definition.",
    longDescription: "Maybelline Colossal Bold Eyeliner delivers rich bold pigmentation in one single stroke. Its quick-dry, smudge-resistant, and waterproof formula stays intact through sweat and humidity for up to 24 hours.",
    attributes: [
      { name: "Product Type", value: "Liquid Eyeliner" },
      { name: "Formulation", value: "Liquid" },
      { name: "Finish", value: "Glossy" },
      { name: "Specialty / Claims", value: "Dermatologically Tested" }
    ],
    variants: [
      {
        shade: "Bold Black",
        size: "3ml",
        sku: "MAY-COLOSSAL-LINER-BOLDBLK-3ML",
        mrp: 249,
        price: 199,
        stock: 80,
        image: BEAUTY_IMAGES.eyeliner.maybelline
      }
    ]
  },
  {
    title: "Lakmé Eyeconic Liquid Eyeliner",
    category: "Eyeliner",
    brand: "Lakmé",
    shortDescription: "Ultra-matte liquid eyeliner with flexible brush applicator for dramatic wings and all-day smudge-free wear.",
    longDescription: "Make an eyeconic statement with Lakmé Eyeconic Liquid Eyeliner. Features an ultra-matte waterproof finish with a flexible applicator brush that glides effortlessly for fine, sleek, or bold winged lines.",
    attributes: [
      { name: "Product Type", value: "Liquid Eyeliner" },
      { name: "Formulation", value: "Liquid" },
      { name: "Finish", value: "Matte" },
      { name: "Specialty / Claims", value: "Paraben-Free" }
    ],
    variants: [
      {
        shade: "Classic Black",
        size: "4.5ml",
        sku: "LAK-EYECONIC-LINER-BLK-4.5ML",
        mrp: 275,
        price: 220,
        stock: 75,
        image: BEAUTY_IMAGES.eyeliner.lakme
      },
      {
        shade: "Royal Blue",
        size: "4.5ml",
        sku: "LAK-EYECONIC-LINER-BLU-4.5ML",
        mrp: 275,
        price: 220,
        stock: 50,
        image: BEAUTY_IMAGES.eyeliner.lakme
      }
    ]
  }
];

export async function seedMissingBeautyProducts() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected successfully.\n");

    const dept = await Department.findOne({
      $or: [
        { slug: "beauty-personal-care" },
        { slug: "beauty-and-personal-care" },
        { name: "Beauty & Personal Care" }
      ]
    });

    if (!dept) {
      console.error("Beauty department not found!");
      process.exit(1);
    }

    const deptId = dept._id;

    // 1. Fetch Categories
    const categories = await Category.find({ departmentIds: deptId });
    const categoryMap = {};
    categories.forEach((c) => {
      categoryMap[c.name] = c;
      categoryMap[c.slug] = c;
    });

    // Ensure category images
    if (categoryMap["Primer"] && !categoryMap["Primer"].image?.url) {
      categoryMap["Primer"].image = BEAUTY_IMAGES.primer.maybelline;
      await categoryMap["Primer"].save();
    }
    if (categoryMap["Eyeshadow"] && (!categoryMap["Eyeshadow"].image?.url || categoryMap["Eyeshadow"].image?.url.includes("lipstick"))) {
      categoryMap["Eyeshadow"].image = BEAUTY_IMAGES.eyeshadow.huda;
      await categoryMap["Eyeshadow"].save();
    }
    if (categoryMap["Eyeliner"] && (!categoryMap["Eyeliner"].image?.url || categoryMap["Eyeliner"].image?.url.includes("lipstick"))) {
      categoryMap["Eyeliner"].image = BEAUTY_IMAGES.eyeliner.maybelline;
      await categoryMap["Eyeliner"].save();
    }

    // 2. Fetch Brands
    const brands = await Brand.find({ departmentIds: deptId });
    const brandMap = {};
    brands.forEach((b) => {
      brandMap[b.name] = b;
      brandMap[b.slug] = b;
    });

    // 3. Fetch Attributes
    const allAttributes = await Attribute.find({});
    const attributeMap = {};
    allAttributes.forEach((a) => {
      attributeMap[a.name] = a;
    });

    // Helper to ensure AttributeOption exists
    async function ensureAttributeOption(attrName, displayName, hex = null) {
      const attr = attributeMap[attrName];
      if (!attr) return null;

      const storedValue = slugify(displayName);
      let opt = await AttributeOption.findOne({
        attribute: attr._id,
        $or: [{ storedValue }, { displayName }]
      });

      if (!opt) {
        opt = await AttributeOption.create({
          attribute: attr._id,
          displayName,
          storedValue,
          ...(hex ? { hex } : {}),
          status: "active"
        });
      }
      return opt;
    }

    // Ensure needed shade and size options
    const newOptionsNeeded = [
      { attr: "Color / Shade", val: "Nude Medium", hex: "#C48A73" },
      { attr: "Color / Shade", val: "Nude Light", hex: "#E8B4A2" },
      { attr: "Color / Shade", val: "Blushed Nudes", hex: "#D9A0A0" },
      { attr: "Color / Shade", val: "Bold Black", hex: "#0A0A0A" },
      { attr: "Color / Shade", val: "Classic Black", hex: "#1A1A1A" },
      { attr: "Color / Shade", val: "Royal Blue", hex: "#1C39BB" },
      { attr: "Size / Net Quantity", val: "30ml" },
      { attr: "Size / Net Quantity", val: "30g" },
      { attr: "Size / Net Quantity", val: "19.7g" },
      { attr: "Size / Net Quantity", val: "9.6g" },
      { attr: "Size / Net Quantity", val: "3ml" },
      { attr: "Size / Net Quantity", val: "4.5ml" }
    ];

    for (const opt of newOptionsNeeded) {
      await ensureAttributeOption(opt.attr, opt.val, opt.hex);
    }

    // 4. Ensure Attribute Mappings for Primer, Eyeshadow, Eyeliner
    const requiredMappings = {
      "Primer": ["Skin Type", "Product Type", "Formulation", "Finish", "Specialty / Claims", "Size / Net Quantity"],
      "Eyeshadow": ["Product Type", "Formulation", "Finish", "Specialty / Claims", "Color / Shade", "Size / Net Quantity"],
      "Eyeliner": ["Product Type", "Formulation", "Finish", "Specialty / Claims", "Color / Shade", "Size / Net Quantity"]
    };

    for (const [catName, attrList] of Object.entries(requiredMappings)) {
      const cat = categoryMap[catName];
      if (!cat) continue;

      for (const attrName of attrList) {
        const attr = attributeMap[attrName];
        if (!attr) continue;

        await AttributeMapping.findOneAndUpdate(
          { category: cat._id, attribute: attr._id },
          { category: cat._id, attribute: attr._id },
          { upsert: true, new: true }
        );
      }
    }
    console.log("Attribute mappings ensured for Primer, Eyeshadow, and Eyeliner.");

    // 5. Seed Products & Variants
    console.log("\n--- Seeding Products & Variants ---");
    let productsCreated = 0;
    let variantsCreated = 0;

    for (const pData of PRODUCTS_TO_SEED) {
      const cat = categoryMap[pData.category];
      const brand = brandMap[pData.brand];

      if (!cat) {
        console.warn(`Category '${pData.category}' not found for ${pData.title}`);
        continue;
      }
      if (!brand) {
        console.warn(`Brand '${pData.brand}' not found for ${pData.title}`);
        continue;
      }

      const pSlug = slugify(pData.title);

      // Build product-level attributes
      const pAttributes = [];
      for (const attrItem of pData.attributes) {
        const attrDoc = attributeMap[attrItem.name];
        if (attrDoc) {
          pAttributes.push({
            attribute: attrDoc._id,
            values: [slugify(attrItem.value)]
          });
        }
      }

      let product = await Product.findOne({ slug: pSlug });
      if (!product) {
        const seqId = await getNextProductSeq();
        product = await Product.create({
          productId: seqId,
          title: pData.title,
          slug: pSlug,
          shortDescription: pData.shortDescription,
          longDescription: pData.longDescription,
          department: deptId,
          category: cat._id,
          brand: brand._id,
          attributes: pAttributes,
          returnPolicy: {
            returnable: false,
            exchangeable: false,
            returnDays: 0
          },
          status: "Active"
        });
        console.log(`Created Product: "${product.title}" (${product.productId})`);
      } else {
        product.title = pData.title;
        product.shortDescription = pData.shortDescription;
        product.longDescription = pData.longDescription;
        product.department = deptId;
        product.category = cat._id;
        product.brand = brand._id;
        product.attributes = pAttributes;
        product.status = "Active";
        await product.save();
        console.log(`Updated Product: "${product.title}" (${product.productId})`);
      }
      productsCreated++;

      // Seed Variants
      for (const vData of pData.variants) {
        const variantAttributes = [];

        // Color / Shade
        if (vData.shade) {
          const shadeAttr = attributeMap["Color / Shade"];
          const shadeOpt = await ensureAttributeOption("Color / Shade", vData.shade);
          if (shadeAttr && shadeOpt) {
            variantAttributes.push({
              attribute: shadeAttr._id,
              option: shadeOpt._id
            });
          }
        }

        // Size / Net Quantity
        if (vData.size) {
          const sizeAttr = attributeMap["Size / Net Quantity"];
          const sizeOpt = await ensureAttributeOption("Size / Net Quantity", vData.size);
          if (sizeAttr && sizeOpt) {
            variantAttributes.push({
              attribute: sizeAttr._id,
              option: sizeOpt._id
            });
          }
        }

        let variant = await Variant.findOne({ sku: vData.sku });
        const variantPayload = {
          product: product._id,
          attributes: variantAttributes,
          sku: vData.sku,
          mrp: vData.mrp,
          price: vData.price,
          gstRate: 18,
          stock: vData.stock,
          status: "Active",
          mainImage: vData.image,
          galleryImages: [vData.image]
        };

        if (!variant) {
          variant = await Variant.create(variantPayload);
          console.log(`  + Created Variant: ${variant.sku} (₹${variant.price})`);
        } else {
          Object.assign(variant, variantPayload);
          await variant.save();
          console.log(`  * Updated Variant: ${variant.sku} (₹${variant.price})`);
        }
        variantsCreated++;
      }
    }

    console.log(`\n✅ Finished seeding: ${productsCreated} products, ${variantsCreated} variants.`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Error seeding missing beauty products:", error);
    process.exit(1);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seedMissingBeautyProducts();
}
