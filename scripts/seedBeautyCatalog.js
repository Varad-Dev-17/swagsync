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

// Helper to generate slug
const slugify = (text) =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// High quality beauty images fallback catalogue
const BEAUTY_IMAGES = {
  skincare: {
    moisturizer: {
      url: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80",
      publicId: "beauty/skincare_moisturizer"
    },
    serum: {
      url: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80",
      publicId: "beauty/skincare_serum"
    },
    facewash: {
      url: "https://images.unsplash.com/photo-1556228722-d0b5be7490bf?auto=format&fit=crop&w=800&q=80",
      publicId: "beauty/skincare_facewash"
    },
    handcream: {
      url: "https://images.unsplash.com/photo-1608248597359-002166311650?auto=format&fit=crop&w=800&q=80",
      publicId: "beauty/skincare_handcream"
    },
    sunscreen: {
      url: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=800&q=80",
      publicId: "beauty/skincare_sunscreen"
    }
  },
  haircare: {
    shampoo: {
      url: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=800&q=80",
      publicId: "beauty/haircare_shampoo"
    },
    conditioner: {
      url: "https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&w=800&q=80",
      publicId: "beauty/haircare_conditioner"
    },
    hairoil: {
      url: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=800&q=80",
      publicId: "beauty/haircare_oil"
    },
    hairserum: {
      url: "https://images.unsplash.com/photo-1608248597359-002166311650?auto=format&fit=crop&w=800&q=80",
      publicId: "beauty/haircare_serum"
    },
    hairgel: {
      url: "https://images.unsplash.com/photo-1519735777090-ec97162dc266?auto=format&fit=crop&w=800&q=80",
      publicId: "beauty/haircare_gel"
    }
  },
  fragrance: {
    deodorant: {
      url: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80",
      publicId: "beauty/fragrance_deodorant"
    },
    perfume: {
      url: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=800&q=80",
      publicId: "beauty/fragrance_perfume"
    }
  },
  grooming: {
    beardoil: {
      url: "https://images.unsplash.com/photo-1621607512214-68297480165e?auto=format&fit=crop&w=800&q=80",
      publicId: "beauty/grooming_beardoil"
    },
    razor: {
      url: "https://images.unsplash.com/photo-1626285861696-9f0bf5a49c6d?auto=format&fit=crop&w=800&q=80",
      publicId: "beauty/grooming_razor"
    }
  },
  makeup: {
    lipstick: {
      url: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=800&q=80",
      publicId: "beauty/makeup_lipstick"
    },
    liquidlipstick: {
      url: "https://images.unsplash.com/photo-1625093742435-6fa192b6fb10?auto=format&fit=crop&w=800&q=80",
      publicId: "beauty/makeup_liquid_lipstick"
    },
    foundation: {
      url: "https://images.unsplash.com/photo-1599733589046-10c005738ef9?auto=format&fit=crop&w=800&q=80",
      publicId: "beauty/makeup_foundation"
    },
    nailpolish: {
      url: "https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=800&q=80",
      publicId: "beauty/makeup_nailpolish"
    }
  }
};

async function getNextProductSeq() {
  const counter = await Counter.findByIdAndUpdate(
    "productId",
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return `PROD-${counter.seq}`;
}

async function seedBeautyCatalog() {
  try {
    console.log("🚀 Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected to database successfully.\n");

    // ==========================================
    // 1. DEPARTMENT
    // ==========================================
    console.log("--- 1. Setting up Department ---");
    let department = await Department.findOne({
      $or: [
        { slug: "beauty-personal-care" },
        { slug: "beauty-and-personal-care" },
        { name: "Beauty & Personal Care" },
        { name: "Beauty" }
      ]
    });

    if (department) {
      department.name = "Beauty & Personal Care";
      department.slug = "beauty-personal-care";
      department.status = "Active";
      department.description = "Beauty, Skincare, Haircare, Makeup & Grooming Products";
      department.iconName = "Sparkles";
      await department.save();
      console.log(`Updated existing department: ${department.name} (${department._id})`);
    } else {
      department = await Department.create({
        name: "Beauty & Personal Care",
        slug: "beauty-personal-care",
        status: "Active",
        description: "Beauty, Skincare, Haircare, Makeup & Grooming Products",
        iconName: "Sparkles"
      });
      console.log(`Created new department: ${department.name} (${department._id})`);
    }

    const deptId = department._id;

    // ==========================================
    // 2. CATEGORIES
    // ==========================================
    console.log("\n--- 2. Setting up Categories ---");
    const categoryDefinitions = [
      { name: "Face Moisturizer", slug: "face-moisturizer", image: BEAUTY_IMAGES.skincare.moisturizer },
      { name: "Face Serum", slug: "face-serum", image: BEAUTY_IMAGES.skincare.serum },
      { name: "Face Wash & Cleanser", slug: "face-wash-cleanser", image: BEAUTY_IMAGES.skincare.facewash },
      { name: "Hand Cream", slug: "hand-cream", image: BEAUTY_IMAGES.skincare.handcream },
      { name: "Sunscreen", slug: "sunscreen", image: BEAUTY_IMAGES.skincare.sunscreen },
      { name: "Shampoo", slug: "shampoo", image: BEAUTY_IMAGES.haircare.shampoo },
      { name: "Conditioner", slug: "conditioner", image: BEAUTY_IMAGES.haircare.conditioner },
      { name: "Hair Oil", slug: "hair-oil", image: BEAUTY_IMAGES.haircare.hairoil },
      { name: "Hair Serum", slug: "hair-serum", image: BEAUTY_IMAGES.haircare.hairserum },
      { name: "Hair Gel", slug: "hair-gel", image: BEAUTY_IMAGES.haircare.hairgel },
      { name: "Lipstick", slug: "lipstick", image: BEAUTY_IMAGES.makeup.lipstick },
      { name: "Liquid Lipstick", slug: "liquid-lipstick", image: BEAUTY_IMAGES.makeup.liquidlipstick },
      { name: "Foundation & Concealer", slug: "foundation-concealer", image: BEAUTY_IMAGES.makeup.foundation },
      { name: "Eyeshadow & Eyeliner", slug: "eyeshadow-eyeliner", image: BEAUTY_IMAGES.makeup.lipstick },
      { name: "Nail Polish", slug: "nail-polish", image: BEAUTY_IMAGES.makeup.nailpolish },
      { name: "Deodorants", slug: "deodorants", image: BEAUTY_IMAGES.fragrance.deodorant },
      { name: "Perfumes", slug: "perfumes", image: BEAUTY_IMAGES.fragrance.perfume },
      { name: "Beard Oil", slug: "beard-oil", image: BEAUTY_IMAGES.grooming.beardoil },
      { name: "Shaving Razors", slug: "shaving-razors", image: BEAUTY_IMAGES.grooming.razor }
    ];

    const categoryMap = {}; // name -> Category doc
    for (const c of categoryDefinitions) {
      let cat = await Category.findOne({ $or: [{ slug: c.slug }, { name: c.name }] });
      if (!cat) {
        cat = await Category.create({
          name: c.name,
          slug: c.slug,
          departmentIds: [deptId],
          status: "Active",
          image: c.image
        });
        console.log(`Created category: ${cat.name}`);
      } else {
        if (!cat.departmentIds.some(id => id.toString() === deptId.toString())) {
          cat.departmentIds.push(deptId);
        }
        cat.name = c.name;
        cat.status = "Active";
        if (c.image && !cat.image?.url) cat.image = c.image;
        await cat.save();
        console.log(`Updated category: ${cat.name}`);
      }
      categoryMap[c.name] = cat;
    }

    // ==========================================
    // 3. BRANDS
    // ==========================================
    console.log("\n--- 3. Setting up Brands ---");
    const brandNames = [
      // From PDF
      "Cetaphil",
      "Minimalist",
      "The Derma Co",
      "Mamaearth",
      "NIVEA",
      "Vaseline",
      "Lakmé",
      "Dot & Key",
      "L'Oréal Paris",
      "TRESemmé",
      "Dove",
      "Parachute Advansed",
      "LIVON",
      "Garnier",
      "Streax Professional",
      "Wild Stone",
      "Denver",
      "Ustraa",
      "Beardo",
      "Gillette",
      "Bombay Shaving Company",
      "M.A.C",
      "Maybelline New York",
      "Nykaa Cosmetics",
      "SUGAR Cosmetics",
      "Huda Beauty"
    ];

    const brandMap = {}; // name -> Brand doc
    for (const bName of brandNames) {
      const bSlug = slugify(bName);
      let brand = await Brand.findOne({ $or: [{ name: bName }, { slug: bSlug }] });
      if (!brand) {
        brand = await Brand.create({
          name: bName,
          slug: bSlug,
          departmentIds: [deptId],
          status: "Active"
        });
        console.log(`Created brand: ${brand.name}`);
      } else {
        if (!brand.departmentIds.some(id => id.toString() === deptId.toString())) {
          brand.departmentIds.push(deptId);
        }
        brand.status = "Active";
        await brand.save();
        console.log(`Updated brand: ${brand.name}`);
      }
      brandMap[bName] = brand;
    }

    // ==========================================
    // 4. ATTRIBUTES
    // ==========================================
    console.log("\n--- 4. Setting up Attributes ---");
    const attributeDefs = [
      // Variant attributes
      { name: "Color / Shade", fieldType: "color", usage: "Variant" },
      { name: "Fragrance / Scent", fieldType: "select", usage: "Variant" },
      { name: "Size / Net Quantity", fieldType: "select", usage: "Variant" },

      // Product attributes
      { name: "Skin Type", fieldType: "select", usage: "Product" },
      { name: "Product Type", fieldType: "select", usage: "Product" },
      { name: "Formulation", fieldType: "select", usage: "Product" },
      { name: "Skin Concern", fieldType: "select", usage: "Product" },
      { name: "Specialty / Claims", fieldType: "select", usage: "Product" },
      { name: "SPF", fieldType: "number", usage: "Product" },
      { name: "PA Rating", fieldType: "select", usage: "Product" },
      { name: "Hair Type", fieldType: "select", usage: "Product" },
      { name: "Hair Concern", fieldType: "select", usage: "Product" },
      { name: "Range", fieldType: "select", usage: "Product" },
      { name: "Finish", fieldType: "select", usage: "Product" },
      { name: "Coverage", fieldType: "select", usage: "Product" },
      { name: "Gender", fieldType: "select", usage: "Product" },
      { name: "Form", fieldType: "select", usage: "Product" },
      { name: "Concentration", fieldType: "select", usage: "Product" },
      { name: "Fragrance Type", fieldType: "select", usage: "Product" },
      { name: "Fragrance Family", fieldType: "select", usage: "Product" },
      { name: "Benefits", fieldType: "select", usage: "Product" },
      { name: "Usage", fieldType: "select", usage: "Product" },
      { name: "Country of Origin", fieldType: "select", usage: "Product" },
      { name: "Shelf Life", fieldType: "select", usage: "Product" },
      { name: "Beard Type", fieldType: "select", usage: "Product" },
      { name: "Key Ingredients", fieldType: "select", usage: "Product" },
      { name: "Razor Type", fieldType: "select", usage: "Product" },
      { name: "Blade Count", fieldType: "number", usage: "Product" },
      { name: "Blade Technology", fieldType: "select", usage: "Product" },
      { name: "Handle Material", fieldType: "select", usage: "Product" },
      { name: "Lubrication Strip", fieldType: "select", usage: "Product" }
    ];

    const attributeMap = {}; // name -> Attribute doc
    for (const a of attributeDefs) {
      let attr = await Attribute.findOne({ name: a.name });
      if (!attr) {
        attr = await Attribute.create({
          name: a.name,
          fieldType: a.fieldType,
          usage: a.usage,
          status: "Active"
        });
        console.log(`Created attribute: ${attr.name} (${attr.usage}, ${attr.fieldType})`);
      } else {
        attr.fieldType = a.fieldType;
        attr.usage = a.usage;
        attr.status = "Active";
        await attr.save();
        console.log(`Updated attribute: ${attr.name}`);
      }
      attributeMap[a.name] = attr;
    }

    // ==========================================
    // 5. ATTRIBUTE OPTIONS
    // ==========================================
    console.log("\n--- 5. Setting up Attribute Options ---");
    const attributeOptionsData = {
      "Color / Shade": [
        { displayName: "Ruby Red", storedValue: "ruby-red", hex: "#9B111E" },
        { displayName: "Classic Red", storedValue: "classic-red", hex: "#C1121F" },
        { displayName: "Wine", storedValue: "wine", hex: "#722F37" },
        { displayName: "Nude Pink", storedValue: "nude-pink", hex: "#C98286" },
        { displayName: "Rose Brown", storedValue: "rose-brown", hex: "#955E55" },
        { displayName: "Peach Nude", storedValue: "peach-nude", hex: "#D99A7C" },
        { displayName: "Coral", storedValue: "coral", hex: "#FF6F61" },
        { displayName: "Berry", storedValue: "berry", hex: "#8A2E4E" },
        { displayName: "Deep Plum", storedValue: "deep-plum", hex: "#5A1830" },
        { displayName: "Warm Beige", storedValue: "warm-beige", hex: "#C99A78" },
        { displayName: "Natural Beige", storedValue: "natural-beige", hex: "#D2A679" },
        { displayName: "Medium Sand", storedValue: "medium-sand", hex: "#B9825B" },
        { displayName: "Golden Beige", storedValue: "golden-beige", hex: "#C68B5B" },
        { displayName: "Tan", storedValue: "tan", hex: "#A66A45" },
        { displayName: "Deep Tan", storedValue: "deep-tan", hex: "#7A4935" }
      ],
      "Fragrance / Scent": [
        "Code", "Edge", "Hydra Energy", "Night Rider", "Forest Spice", "Ultra Sensual",
        "Hamilton", "Imperial", "Pride", "Caliber", "Stealth", "Whiskey Smoke", "Godfather",
        "Original", "Woody Musk"
      ],
      "Size / Net Quantity": [
        "1g", "2g", "3g", "3.5g", "5g", "10ml", "15ml", "20ml", "30ml", "35ml",
        "50ml", "59ml", "60ml", "80ml", "100ml", "150ml", "175ml", "180ml",
        "185ml", "190ml", "200ml", "250ml", "300ml", "340ml", "650ml", "1 Unit", "1 Unit + 2 Blades", "Mini", "Full Size"
      ],
      "Skin Type": [
        "Dry to Normal & Sensitive Skin",
        "Normal to Dry Skin",
        "Oily / Combination",
        "All / Combination / Oily",
        "All / Oily",
        "Oily / Combination / Sensitive",
        "Dry / Normal",
        "Normal / Dry / Combination",
        "All Skin Types"
      ],
      "Product Type": [
        "Moisturizer",
        "Face Serum",
        "Face Wash",
        "Cleanser",
        "Hand Cream",
        "Sunscreen",
        "Shampoo",
        "Conditioner",
        "Hair Oil",
        "Hair Serum",
        "Hair Serum / Hair Treatment",
        "Hair Gel",
        "Lipstick",
        "Liquid Lipstick",
        "Foundation",
        "Concealer",
        "Eyeshadow",
        "Eyeliner",
        "Nail Polish",
        "Deodorant",
        "Eau de Parfum",
        "Beard Oil",
        "Shaving Razor"
      ],
      "Formulation": [
        "Cream/Lotion",
        "Cream",
        "Lightweight Serum",
        "Gel",
        "Gel / Gentle Cleanser",
        "Water-Light",
        "Lightweight",
        "Liquid",
        "Oil",
        "Serum",
        "Bullet",
        "Stick",
        "Aerosol Spray",
        "Spray"
      ],
      "Skin Concern": [
        "Dryness",
        "Dryness / Skin Barrier",
        "Oil Control / Uneven Skin Tone",
        "Dark Spots / Uneven Skin Tone",
        "Acne / Dullness",
        "Acne / Excess Oil / Dryness",
        "Dryness / Roughness",
        "Sun Protection",
        "Sun Protection / Dullness / Dehydration"
      ],
      "Specialty / Claims": [
        "Sensitive Skin Care",
        "Barrier Care",
        "Active Ingredient Serum",
        "Daily Cleansing",
        "Gentle / Deep Cleansing",
        "Hand Moisturization",
        "Intensive Moisturization",
        "Lightweight Sunscreen",
        "Daily Sun Protection",
        "Hair Repair / Moisturization",
        "Hair Strengthening / Smoothing",
        "Smoothing / Hair Strengthening",
        "Hair Repair / Strengthening",
        "Hair Nourishment / Conditioning",
        "Hair Nourishment / Scalp Care",
        "Frizz Control / Hair Smoothing",
        "Hair Growth / Hair Repair",
        "Hair Styling / Shine",
        "Strong Hold / Hair Styling",
        "Long-lasting fragrance and freshness",
        "Long-lasting masculine fragrance",
        "Long-lasting Eau de Parfum fragrance",
        "Beard conditioning and grooming",
        "Multi-blade shaving system with precision trimming capability",
        "Men's shaving and grooming",
        "Cruelty-Free",
        "100% Vegan",
        "Paraben-Free",
        "Dermatologically Tested"
      ],
      "SPF": ["30", "50", "55"],
      "PA Rating": ["PA+++", "PA++++"],
      "Hair Type": [
        "Dry / Damaged Hair",
        "All Hair Types",
        "Frizzy Hair",
        "Normal Hair"
      ],
      "Hair Concern": [
        "Dryness / Damage",
        "Hair Fall / Frizz",
        "Hair Fall / Damage",
        "Frizz / Roughness / Hair Fall",
        "Dryness / Hair Nourishment",
        "Hair Growth / Hair Fall / Scalp Care",
        "Frizz / Hair Damage",
        "Hair Growth / Hair Damage",
        "Hair Styling / Hold"
      ],
      "Range": [
        "Total Repair 5",
        "Hair Therapy",
        "Keratin Smooth",
        "Hyaluron Moisture",
        "Fructis Style"
      ],
      "Finish": [
        "Matte",
        "Liquid Matte",
        "Glossy",
        "Satin",
        "Velvet",
        "Natural",
        "Lightweight",
        "Non-Greasy",
        "Shimmer"
      ],
      "Coverage": [
        "Full Coverage",
        "Medium Coverage",
        "Sheer Coverage",
        "Buildable"
      ],
      "Gender": ["Men", "Women", "Unisex"],
      "Form": ["Aerosol Spray", "Spray", "Roll-On", "Solid"],
      "Concentration": ["Eau de Parfum", "Eau de Toilette", "Deodorant Spray", "Body Mist"],
      "Fragrance Type": ["Masculine", "Feminine", "Unisex", "Fresh"],
      "Fragrance Family": [
        "Woody / Aromatic",
        "Woody / Spicy",
        "Citrus / Fresh",
        "Floral / Fruity",
        "Oriental"
      ],
      "Benefits": [
        "Long-lasting freshness",
        "Long-lasting fragrance",
        "Helps nourish, soften and condition beard hair",
        "Close and comfortable shave",
        "Close and controlled shaving",
        "Deep Hydration"
      ],
      "Usage": [
        "Daily Wear / Casual Wear",
        "Daily Wear / Casual Wear / Office Wear",
        "Daily Wear / Casual Wear / Occasions",
        "Daily Wear / Casual Wear / Office Wear / Evening Wear",
        "Daily Beard Grooming",
        "Facial Shaving / Beard Grooming"
      ],
      "Country of Origin": ["India", "USA", "France", "Germany", "Italy"],
      "Shelf Life": ["24 Months", "36 Months", "48 Months"],
      "Beard Type": ["All Beard Types", "Stubble", "Full Beard"],
      "Key Ingredients": [
        "Beard-conditioning oils",
        "Argan & Almond Oil",
        "Red Onion & Rosemary",
        "Niacinamide",
        "Ceramides",
        "Salicylic Acid",
        "Tea Tree",
        "Vitamin C",
        "Hyaluronic Acid"
      ],
      "Razor Type": [
        "Cartridge Razor",
        "Cartridge Razor / Safety Razor",
        "Safety Razor",
        "Disposable Razor"
      ],
      "Blade Count": ["1", "2", "3", "5"],
      "Blade Technology": [
        "Five-blade shaving system",
        "Precision and multi-blade shaving systems",
        "Triple blade system"
      ],
      "Handle Material": ["Plastic", "Metal / Polymer", "Ergonomic Rubber"],
      "Lubrication Strip": ["Yes", "No", "Product dependent", "Aloe Vera Strip"]
    };

    const attributeOptionMap = {}; // `${attrName}_${storedValue}` -> AttributeOption doc

    for (const [attrName, options] of Object.entries(attributeOptionsData)) {
      const attr = attributeMap[attrName];
      if (!attr) continue;

      for (const opt of options) {
        let displayName, storedValue, hex;
        if (typeof opt === "object") {
          displayName = opt.displayName;
          storedValue = opt.storedValue;
          hex = opt.hex;
        } else {
          displayName = opt.toString();
          storedValue = slugify(opt.toString());
        }

        let optionDoc = await AttributeOption.findOne({
          attribute: attr._id,
          $or: [{ storedValue }, { displayName }]
        });

        if (!optionDoc) {
          optionDoc = await AttributeOption.create({
            attribute: attr._id,
            displayName,
            storedValue,
            hex: hex || undefined,
            status: "active"
          });
        } else {
          optionDoc.displayName = displayName;
          optionDoc.storedValue = storedValue;
          if (hex) optionDoc.hex = hex;
          optionDoc.status = "active";
          await optionDoc.save();
        }

        attributeOptionMap[`${attrName}_${storedValue}`] = optionDoc;
        attributeOptionMap[`${attrName}_${displayName}`] = optionDoc;
      }
    }
    console.log(`Attribute options seeded and mapped.`);

    // ==========================================
    // 6. CATEGORY -> ATTRIBUTE MAPPINGS
    // ==========================================
    console.log("\n--- 6. Setting up Category Attribute Mappings ---");
    const categoryAttributeMappings = {
      "Face Moisturizer": [
        "Skin Type", "Product Type", "Formulation", "Skin Concern", "Specialty / Claims", "Size / Net Quantity"
      ],
      "Face Serum": [
        "Skin Type", "Product Type", "Formulation", "Skin Concern", "Specialty / Claims", "Size / Net Quantity"
      ],
      "Face Wash & Cleanser": [
        "Skin Type", "Product Type", "Formulation", "Skin Concern", "Specialty / Claims", "Size / Net Quantity"
      ],
      "Hand Cream": [
        "Skin Type", "Product Type", "Formulation", "Skin Concern", "Specialty / Claims", "Size / Net Quantity"
      ],
      "Sunscreen": [
        "Skin Type", "Product Type", "Formulation", "Skin Concern", "Specialty / Claims", "SPF", "PA Rating", "Size / Net Quantity"
      ],
      "Shampoo": [
        "Hair Type", "Product Type", "Formulation", "Hair Concern", "Specialty / Claims", "Range", "Size / Net Quantity"
      ],
      "Conditioner": [
        "Hair Type", "Product Type", "Formulation", "Hair Concern", "Specialty / Claims", "Range", "Size / Net Quantity"
      ],
      "Hair Oil": [
        "Hair Type", "Product Type", "Formulation", "Hair Concern", "Specialty / Claims", "Size / Net Quantity"
      ],
      "Hair Serum": [
        "Hair Type", "Product Type", "Formulation", "Hair Concern", "Specialty / Claims", "Size / Net Quantity"
      ],
      "Hair Gel": [
        "Hair Type", "Product Type", "Formulation", "Hair Concern", "Specialty / Claims", "Size / Net Quantity"
      ],
      "Lipstick": [
        "Product Type", "Formulation", "Finish", "Coverage", "Specialty / Claims", "Color / Shade", "Size / Net Quantity"
      ],
      "Liquid Lipstick": [
        "Product Type", "Formulation", "Finish", "Coverage", "Specialty / Claims", "Color / Shade", "Size / Net Quantity"
      ],
      "Foundation & Concealer": [
        "Product Type", "Formulation", "Finish", "Coverage", "Skin Type", "Specialty / Claims", "Color / Shade", "Size / Net Quantity"
      ],
      "Eyeshadow & Eyeliner": [
        "Product Type", "Formulation", "Finish", "Specialty / Claims", "Color / Shade", "Size / Net Quantity"
      ],
      "Nail Polish": [
        "Product Type", "Formulation", "Finish", "Specialty / Claims", "Color / Shade", "Size / Net Quantity"
      ],
      "Deodorants": [
        "Gender", "Product Type", "Form", "Fragrance Type", "Fragrance Family", "Benefits", "Usage", "Country of Origin", "Shelf Life", "Specialty / Claims", "Fragrance / Scent", "Size / Net Quantity"
      ],
      "Perfumes": [
        "Gender", "Product Type", "Form", "Concentration", "Fragrance Type", "Fragrance Family", "Benefits", "Usage", "Country of Origin", "Shelf Life", "Specialty / Claims", "Fragrance / Scent", "Size / Net Quantity"
      ],
      "Beard Oil": [
        "Gender", "Product Type", "Beard Type", "Key Ingredients", "Benefits", "Usage", "Finish", "Country of Origin", "Shelf Life", "Specialty / Claims", "Size / Net Quantity"
      ],
      "Shaving Razors": [
        "Gender", "Product Type", "Razor Type", "Blade Count", "Blade Technology", "Handle Material", "Lubrication Strip", "Skin Type", "Benefits", "Usage", "Specialty / Claims", "Size / Net Quantity"
      ]
    };

    let totalMappings = 0;
    for (const [catName, attrNames] of Object.entries(categoryAttributeMappings)) {
      const cat = categoryMap[catName];
      if (!cat) continue;

      for (const attrName of attrNames) {
        const attr = attributeMap[attrName];
        if (!attr) continue;

        await AttributeMapping.findOneAndUpdate(
          { category: cat._id, attribute: attr._id },
          { category: cat._id, attribute: attr._id },
          { upsert: true, new: true }
        );
        totalMappings++;
      }
    }
    console.log(`Mapped ${totalMappings} attributes across 19 categories.`);

    // ==========================================
    // 7. PRODUCTS AND VARIANTS
    // ==========================================
    console.log("\n--- 7. Setting up Products & Variants ---");

    const productsData = [
      // ----------------------------------------------------
      // SKINCARE
      // ----------------------------------------------------
      {
        title: "Cetaphil Facial Moisturizer",
        category: "Face Moisturizer",
        brand: "Cetaphil",
        shortDescription: "Gentle daily facial moisturizer providing long-lasting hydration for sensitive skin.",
        longDescription: "Cetaphil Facial Moisturizer is formulated with clinically proven ingredients to nourish and soothe dry to normal & sensitive skin. Non-comedogenic and fragrance-free for all-day comfort.",
        attributes: [
          { name: "Skin Type", value: "Dry to Normal & Sensitive Skin" },
          { name: "Product Type", value: "Moisturizer" },
          { name: "Formulation", value: "Cream/Lotion" },
          { name: "Skin Concern", value: "Dryness" },
          { name: "Specialty / Claims", value: "Sensitive Skin Care" }
        ],
        variants: [
          {
            name: "Cetaphil Facial Moisturizer — Dry to Normal & Sensitive Skin",
            size: "50ml",
            sku: "CET-FAC-MOIST-50ML",
            mrp: 549,
            price: 499,
            stock: 60,
            image: BEAUTY_IMAGES.skincare.moisturizer
          },
          {
            name: "Cetaphil Facial Moisturizer — Very Dry to Dry & Sensitive Skin",
            size: "100ml",
            sku: "CET-FAC-MOIST-100ML",
            mrp: 999,
            price: 899,
            stock: 45,
            image: BEAUTY_IMAGES.skincare.moisturizer
          }
        ]
      },
      {
        title: "Minimalist Face Moisturizer",
        category: "Face Moisturizer",
        brand: "Minimalist",
        shortDescription: "Ceramides and Vitamin B5 enriched barrier repair daily face moisturizer.",
        longDescription: "Lightweight cream formulated with 0.3% Ceramides and Vitamin B5 to restore the skin barrier, lock in essential moisture, and prevent trans-epidermal water loss.",
        attributes: [
          { name: "Skin Type", value: "Normal to Dry Skin" },
          { name: "Product Type", value: "Moisturizer" },
          { name: "Formulation", value: "Cream" },
          { name: "Skin Concern", value: "Dryness / Skin Barrier" },
          { name: "Specialty / Claims", value: "Barrier Care" }
        ],
        variants: [
          {
            name: "Minimalist Ceramides 0.3%",
            size: "30ml",
            sku: "MIN-CER-MOIST-30ML",
            mrp: 399,
            price: 349,
            stock: 50,
            image: BEAUTY_IMAGES.skincare.moisturizer
          },
          {
            name: "Minimalist Vitamin B5 10% Moisturizer",
            size: "50ml",
            sku: "MIN-VITB5-MOIST-50ML",
            mrp: 599,
            price: 529,
            stock: 40,
            image: BEAUTY_IMAGES.skincare.moisturizer
          }
        ]
      },
      {
        title: "Minimalist Face Serum",
        category: "Face Serum",
        brand: "Minimalist",
        shortDescription: "High-efficacy active ingredient face serum targeting oiliness and hyperpigmentation.",
        longDescription: "A potent water-based serum enriched with pure Niacinamide and Alpha Arbutin to control excess sebum, reduce dark spots, and provide an even, radiant complexion.",
        attributes: [
          { name: "Skin Type", value: "Oily / Combination" },
          { name: "Product Type", value: "Face Serum" },
          { name: "Formulation", value: "Lightweight Serum" },
          { name: "Skin Concern", value: "Oil Control / Uneven Skin Tone" },
          { name: "Specialty / Claims", value: "Active Ingredient Serum" }
        ],
        variants: [
          {
            name: "Minimalist 10% Niacinamide Face Serum",
            size: "30ml",
            sku: "MIN-NIAC-SERUM-30ML",
            mrp: 599,
            price: 499,
            stock: 75,
            image: BEAUTY_IMAGES.skincare.serum
          },
          {
            name: "Minimalist 2% Alpha Arbutin Face Serum",
            size: "60ml",
            sku: "MIN-ARBUTIN-SERUM-60ML",
            mrp: 899,
            price: 799,
            stock: 50,
            image: BEAUTY_IMAGES.skincare.serum
          }
        ]
      },
      {
        title: "The Derma Co Face Serum",
        category: "Face Serum",
        brand: "The Derma Co",
        shortDescription: "Dermatologist-designed face serum for blemish control and dark spot reduction.",
        longDescription: "Formulated with 10% Niacinamide and 2% Kojic Acid to gently exfoliate, lighten stubborn pigmentation, and promote a clear, blemish-free skin tone.",
        attributes: [
          { name: "Skin Type", value: "All / Combination / Oily" },
          { name: "Product Type", value: "Face Serum" },
          { name: "Formulation", value: "Lightweight Serum" },
          { name: "Skin Concern", value: "Dark Spots / Uneven Skin Tone" },
          { name: "Specialty / Claims", value: "Active Ingredient Serum" }
        ],
        variants: [
          {
            name: "The Derma Co 10% Niacinamide Face Serum",
            size: "30ml",
            sku: "TDC-NIAC-SERUM-30ML",
            mrp: 599,
            price: 529,
            stock: 65,
            image: BEAUTY_IMAGES.skincare.serum
          },
          {
            name: "The Derma Co 2% Kojic Acid Face Serum",
            size: "60ml",
            sku: "TDC-KOJIC-SERUM-60ML",
            mrp: 999,
            price: 849,
            stock: 45,
            image: BEAUTY_IMAGES.skincare.serum
          }
        ]
      },
      {
        title: "Mamaearth Face Wash",
        category: "Face Wash & Cleanser",
        brand: "Mamaearth",
        shortDescription: "Toxin-free natural foaming gel face wash for clear, glowing skin.",
        longDescription: "Powered by natural Tea Tree Oil and Vitamin C to purify pores, eliminate acne-causing bacteria, and brighten dull skin with every wash.",
        attributes: [
          { name: "Skin Type", value: "All / Oily" },
          { name: "Product Type", value: "Face Wash" },
          { name: "Formulation", value: "Gel" },
          { name: "Skin Concern", value: "Acne / Dullness" },
          { name: "Specialty / Claims", value: "Daily Cleansing" }
        ],
        variants: [
          {
            name: "Tea Tree Face Wash",
            size: "100ml",
            sku: "MAM-TT-FW-100ML",
            mrp: 259,
            price: 229,
            stock: 80,
            image: BEAUTY_IMAGES.skincare.facewash
          },
          {
            name: "Vitamin C Face Wash",
            size: "150ml",
            sku: "MAM-VITC-FW-150ML",
            mrp: 399,
            price: 349,
            stock: 60,
            image: BEAUTY_IMAGES.skincare.facewash
          }
        ]
      },
      {
        title: "Minimalist Face Cleanser",
        category: "Face Wash & Cleanser",
        brand: "Minimalist",
        shortDescription: "Gentle non-drying facial cleanser for deep pore unclogging and barrier support.",
        longDescription: "Formulated with 2% Salicylic Acid and Oat Extract to gently remove excess sebum and impurities while preserving the delicate skin moisture barrier.",
        attributes: [
          { name: "Skin Type", value: "Oily / Combination / Sensitive" },
          { name: "Product Type", value: "Cleanser" },
          { name: "Formulation", value: "Gel / Gentle Cleanser" },
          { name: "Skin Concern", value: "Acne / Excess Oil / Dryness" },
          { name: "Specialty / Claims", value: "Gentle / Deep Cleansing" }
        ],
        variants: [
          {
            name: "2% Salicylic Acid + LHA Face Cleanser",
            size: "100ml",
            sku: "MIN-SA-CLEANSER-100ML",
            mrp: 299,
            price: 269,
            stock: 90,
            image: BEAUTY_IMAGES.skincare.facewash
          },
          {
            name: "Oat Extract 6% Gentle Cleanser",
            size: "150ml",
            sku: "MIN-OAT-CLEANSER-150ML",
            mrp: 399,
            price: 359,
            stock: 70,
            image: BEAUTY_IMAGES.skincare.facewash
          }
        ]
      },
      {
        title: "NIVEA Hand Cream",
        category: "Hand Cream",
        brand: "NIVEA",
        shortDescription: "Intensive moisturizing cream for soft, smooth, protected hands.",
        longDescription: "Enriched with caring oils and natural provitamins to repair cracked skin, soften cuticles, and provide 24-hour non-greasy hand moisturization.",
        attributes: [
          { name: "Skin Type", value: "Dry / Normal" },
          { name: "Product Type", value: "Hand Cream" },
          { name: "Formulation", value: "Cream" },
          { name: "Skin Concern", value: "Dryness / Roughness" },
          { name: "Specialty / Claims", value: "Hand Moisturization" }
        ],
        variants: [
          {
            name: "NIVEA Hand Cream — Intensive Moisture",
            size: "50ml",
            sku: "NIV-HC-INTENSE-50ML",
            mrp: 199,
            price: 179,
            stock: 60,
            image: BEAUTY_IMAGES.skincare.handcream
          },
          {
            name: "NIVEA Hand Cream — Repair & Care",
            size: "100ml",
            sku: "NIV-HC-REPAIR-100ML",
            mrp: 349,
            price: 299,
            stock: 50,
            image: BEAUTY_IMAGES.skincare.handcream
          }
        ]
      },
      {
        title: "Vaseline Hand Cream",
        category: "Hand Cream",
        brand: "Vaseline",
        shortDescription: "Advanced recovery hand cream with micro-droplets of Vaseline jelly.",
        longDescription: "Clinically proven to deeply heal very dry hands from first use. Absorbs quickly to soothe roughness without leaving any sticky residue.",
        attributes: [
          { name: "Skin Type", value: "Dry / Normal" },
          { name: "Product Type", value: "Hand Cream" },
          { name: "Formulation", value: "Cream" },
          { name: "Skin Concern", value: "Dryness / Roughness" },
          { name: "Specialty / Claims", value: "Intensive Moisturization" }
        ],
        variants: [
          {
            name: "Vaseline Intensive Care Advanced Repair Hand Cream",
            size: "50ml",
            sku: "VAS-HC-ADVREP-50ML",
            mrp: 180,
            price: 159,
            stock: 75,
            image: BEAUTY_IMAGES.skincare.handcream
          },
          {
            name: "Vaseline Intensive Care Essential Healing Hand Cream",
            size: "100ml",
            sku: "VAS-HC-ESSHEAL-100ML",
            mrp: 320,
            price: 279,
            stock: 60,
            image: BEAUTY_IMAGES.skincare.handcream
          }
        ]
      },
      {
        title: "Lakmé Sunscreen",
        category: "Sunscreen",
        brand: "Lakmé",
        shortDescription: "Water-light SPF 50 PA+++ daily sunscreen with ultra-matte finish.",
        longDescription: "High broad-spectrum UVA & UVB protection with 5% Hyaluronic Acid and Niacinamide. Leaves zero white cast and keeps skin hydrated throughout the day.",
        attributes: [
          { name: "Skin Type", value: "Normal / Dry / Combination" },
          { name: "Product Type", value: "Sunscreen" },
          { name: "Formulation", value: "Water-Light" },
          { name: "Skin Concern", value: "Sun Protection" },
          { name: "Specialty / Claims", value: "Lightweight Sunscreen" },
          { name: "SPF", value: "50" },
          { name: "PA Rating", value: "PA+++" }
        ],
        variants: [
          {
            name: "Lakmé 5% Hyaluronic Water-Light Sunscreen",
            size: "50ml",
            sku: "LAK-SUN-HYAL-50ML",
            mrp: 499,
            price: 429,
            stock: 80,
            image: BEAUTY_IMAGES.skincare.sunscreen
          },
          {
            name: "Lakmé 5% Niacinamide & Vitamin C Water-Light Sunscreen",
            size: "100ml",
            sku: "LAK-SUN-NIAC-100ML",
            mrp: 899,
            price: 749,
            stock: 55,
            image: BEAUTY_IMAGES.skincare.sunscreen
          }
        ]
      },
      {
        title: "Dot & Key Sunscreen",
        category: "Sunscreen",
        brand: "Dot & Key",
        shortDescription: "Ultra-fluid Vitamin C & Watermelon infused broad spectrum SPF 50 sunscreen.",
        longDescription: "Instantly cooling, weightless sunscreen packed with Watermelon extract and Hyaluronic acid for luminous, deeply hydrated, sun-safe skin without stickiness.",
        attributes: [
          { name: "Skin Type", value: "All Skin Types" },
          { name: "Product Type", value: "Sunscreen" },
          { name: "Formulation", value: "Lightweight" },
          { name: "Skin Concern", value: "Sun Protection / Dullness / Dehydration" },
          { name: "Specialty / Claims", value: "Daily Sun Protection" },
          { name: "SPF", value: "50" },
          { name: "PA Rating", value: "PA+++" }
        ],
        variants: [
          {
            name: "Dot & Key Vitamin C + E Super Bright Sunscreen",
            size: "30ml",
            sku: "DNK-SUN-VITC-30ML",
            mrp: 395,
            price: 345,
            stock: 90,
            image: BEAUTY_IMAGES.skincare.sunscreen
          },
          {
            name: "Dot & Key Watermelon Hyaluronic Sunscreen",
            size: "80ml",
            sku: "DNK-SUN-WATERMELON-80ML",
            mrp: 695,
            price: 599,
            stock: 70,
            image: BEAUTY_IMAGES.skincare.sunscreen
          }
        ]
      },

      // ----------------------------------------------------
      // HAIRCARE
      // ----------------------------------------------------
      {
        title: "L'Oréal Paris Total Repair 5 Shampoo",
        category: "Shampoo",
        brand: "L'Oréal Paris",
        shortDescription: "Pro-Keratin infused shampoo fighting 5 visible signs of damaged hair.",
        longDescription: "Repairs dry, dull, rough, brittle, and split-ended hair. Deeply nourishes fibers and leaves hair soft, resilient, and easy to manage.",
        attributes: [
          { name: "Hair Type", value: "Dry / Damaged Hair" },
          { name: "Product Type", value: "Shampoo" },
          { name: "Formulation", value: "Liquid" },
          { name: "Hair Concern", value: "Dryness / Damage" },
          { name: "Specialty / Claims", value: "Hair Repair / Moisturization" },
          { name: "Range", value: "Total Repair 5" }
        ],
        variants: [
          {
            name: "L'Oréal Paris Total Repair 5 Shampoo — Hyaluron Moisture",
            size: "180ml",
            sku: "LOR-TR5-HYAL-SHAMP-180ML",
            mrp: 299,
            price: 249,
            stock: 65,
            image: BEAUTY_IMAGES.haircare.shampoo
          },
          {
            name: "L'Oréal Paris Total Repair 5 Shampoo — Repairing",
            size: "340ml",
            sku: "LOR-TR5-REP-SHAMP-340ML",
            mrp: 499,
            price: 419,
            stock: 65,
            image: BEAUTY_IMAGES.haircare.shampoo
          }
        ]
      },
      {
        title: "TRESemmé Shampoo",
        category: "Shampoo",
        brand: "TRESemmé",
        shortDescription: "Salon-quality smoothing and hair-strengthening daily shampoo.",
        longDescription: "Enriched with Keratin and Vitamin H to gently cleanse hair, control unruly frizz for up to 48 hours, and fortify fragile strands against breakage.",
        attributes: [
          { name: "Hair Type", value: "All Hair Types" },
          { name: "Product Type", value: "Shampoo" },
          { name: "Formulation", value: "Liquid" },
          { name: "Hair Concern", value: "Hair Fall / Frizz" },
          { name: "Specialty / Claims", value: "Hair Strengthening / Smoothing" },
          { name: "Range", value: "Keratin Smooth" }
        ],
        variants: [
          {
            name: "TRESemmé Shampoo — Hair Fall Defense",
            size: "185ml",
            sku: "TRE-HFD-SHAMP-185ML",
            mrp: 275,
            price: 229,
            stock: 70,
            image: BEAUTY_IMAGES.haircare.shampoo
          },
          {
            name: "TRESemmé Shampoo — Keratin Smooth",
            size: "340ml",
            sku: "TRE-KS-SHAMP-340ML",
            mrp: 475,
            price: 399,
            stock: 80,
            image: BEAUTY_IMAGES.haircare.shampoo
          }
        ]
      },
      {
        title: "Dove Hair Therapy Shampoo",
        category: "Shampoo",
        brand: "Dove",
        shortDescription: "Bio-Cellular complex shampoo for intensive hair repair and fall defense.",
        longDescription: "Targets hair damage at the cellular level. Restores strength, enhances natural hair shine, and reduces hair breakage by up to 98%.",
        attributes: [
          { name: "Hair Type", value: "Dry / Damaged Hair" },
          { name: "Product Type", value: "Shampoo" },
          { name: "Formulation", value: "Liquid" },
          { name: "Hair Concern", value: "Hair Fall / Damage" },
          { name: "Specialty / Claims", value: "Hair Repair / Strengthening" },
          { name: "Range", value: "Hair Therapy" }
        ],
        variants: [
          {
            name: "Dove Hair Therapy Shampoo — Hair Fall Rescue",
            size: "250ml",
            sku: "DOV-HT-HFR-SHAMP-250ML",
            mrp: 350,
            price: 299,
            stock: 75,
            image: BEAUTY_IMAGES.haircare.shampoo
          },
          {
            name: "Dove Hair Therapy Shampoo — Intense Repair",
            size: "650ml",
            sku: "DOV-HT-IR-SHAMP-650ML",
            mrp: 750,
            price: 629,
            stock: 70,
            image: BEAUTY_IMAGES.haircare.shampoo
          }
        ]
      },
      {
        title: "L'Oréal Paris Total Repair 5 Conditioner",
        category: "Conditioner",
        brand: "L'Oréal Paris",
        shortDescription: "Deep conditioning rinse for damaged, tangled, and unruly hair.",
        longDescription: "Enriched with Ceramide-Cement technology to instantly seal split ends, smooth hair cuticle, and impart mirror-like gloss and bounce.",
        attributes: [
          { name: "Hair Type", value: "Dry / Damaged Hair" },
          { name: "Product Type", value: "Conditioner" },
          { name: "Formulation", value: "Cream" },
          { name: "Hair Concern", value: "Dryness / Damage" },
          { name: "Specialty / Claims", value: "Hair Repair / Moisturization" },
          { name: "Range", value: "Total Repair 5" }
        ],
        variants: [
          {
            name: "L'Oréal Paris Total Repair 5 Conditioner — Hyaluron Moisture",
            size: "180ml",
            sku: "LOR-TR5-HYAL-COND-180ML",
            mrp: 319,
            price: 269,
            stock: 60,
            image: BEAUTY_IMAGES.haircare.conditioner
          },
          {
            name: "L'Oréal Paris Total Repair 5 Conditioner — Repairing",
            size: "340ml",
            sku: "LOR-TR5-REP-COND-340ML",
            mrp: 529,
            price: 449,
            stock: 60,
            image: BEAUTY_IMAGES.haircare.conditioner
          }
        ]
      },
      {
        title: "TRESemmé Keratin Smooth Conditioner",
        category: "Conditioner",
        brand: "TRESemmé",
        shortDescription: "Keratin and Marula oil infused conditioner for sleek, salon-smooth hair.",
        longDescription: "Deeply detangles, calms frizz, and locks in sleekness without weighing hair down. Perfect for daily post-shampoo nourishment.",
        attributes: [
          { name: "Hair Type", value: "All Hair Types" },
          { name: "Product Type", value: "Conditioner" },
          { name: "Formulation", value: "Cream" },
          { name: "Hair Concern", value: "Frizz / Roughness / Hair Fall" },
          { name: "Specialty / Claims", value: "Smoothing / Hair Strengthening" },
          { name: "Range", value: "Keratin Smooth" }
        ],
        variants: [
          {
            name: "TRESemmé Keratin Smooth Conditioner — Hairfall Dense",
            size: "190ml",
            sku: "TRE-KS-HFD-COND-190ML",
            mrp: 325,
            price: 279,
            stock: 55,
            image: BEAUTY_IMAGES.haircare.conditioner
          },
          {
            name: "TRESemmé Keratin Smooth Conditioner — Keratin Smooth",
            size: "300ml",
            sku: "TRE-KS-SMOOTH-COND-300ML",
            mrp: 495,
            price: 419,
            stock: 65,
            image: BEAUTY_IMAGES.haircare.conditioner
          }
        ]
      },
      {
        title: "Dove Hair Therapy Conditioner",
        category: "Conditioner",
        brand: "Dove",
        shortDescription: "Cellular level hair hydration and restorative smoothing conditioner.",
        longDescription: "Delivers deep nourishment to dry strands, strengthens fiber bonds, and provides effortless detangling with a lightweight finish.",
        attributes: [
          { name: "Hair Type", value: "Dry / Damaged Hair" },
          { name: "Product Type", value: "Conditioner" },
          { name: "Formulation", value: "Cream" },
          { name: "Hair Concern", value: "Hair Fall / Damage" },
          { name: "Specialty / Claims", value: "Hair Repair / Strengthening" },
          { name: "Range", value: "Hair Therapy" }
        ],
        variants: [
          {
            name: "Dove Hair Therapy Conditioner — Hair Fall Rescue",
            size: "175ml",
            sku: "DOV-HT-HFR-COND-175ML",
            mrp: 320,
            price: 275,
            stock: 60,
            image: BEAUTY_IMAGES.haircare.conditioner
          },
          {
            name: "Dove Hair Therapy Conditioner — Intense Repair",
            size: "300ml",
            sku: "DOV-HT-IR-COND-300ML",
            mrp: 520,
            price: 439,
            stock: 60,
            image: BEAUTY_IMAGES.haircare.conditioner
          }
        ]
      },
      {
        title: "Parachute Advansed Hair Oil",
        category: "Hair Oil",
        brand: "Parachute Advansed",
        shortDescription: "100% pure coconut and aloe vera enriched deep scalp nourishment hair oil.",
        longDescription: "Penetrates 10 layers deep into the hair shafts to condition from within, prevent split ends, and promote soft, healthy hair growth.",
        attributes: [
          { name: "Hair Type", value: "All Hair Types" },
          { name: "Product Type", value: "Hair Oil" },
          { name: "Formulation", value: "Oil" },
          { name: "Hair Concern", value: "Dryness / Hair Nourishment" },
          { name: "Specialty / Claims", value: "Hair Nourishment / Conditioning" }
        ],
        variants: [
          {
            name: "Parachute Advansed Aloe Vera Hair Oil",
            size: "200ml",
            sku: "PAR-ADV-ALOE-OIL-200ML",
            mrp: 199,
            price: 169,
            stock: 90,
            image: BEAUTY_IMAGES.haircare.hairoil
          },
          {
            name: "Parachute Advansed Coconut Hair Oil",
            size: "300ml",
            sku: "PAR-ADV-COCO-OIL-300ML",
            mrp: 280,
            price: 239,
            stock: 100,
            image: BEAUTY_IMAGES.haircare.hairoil
          }
        ]
      },
      {
        title: "Mamaearth Hair Oil",
        category: "Hair Oil",
        brand: "Mamaearth",
        shortDescription: "Onion and Rosemary infused hair growth booster and scalp revitalizing oil.",
        longDescription: "Blended with pure Red Onion Oil, Plant Keratin, and Rosemary to stimulate follicles, reduce hair fall, and restore strong, thick hair.",
        attributes: [
          { name: "Hair Type", value: "All Hair Types" },
          { name: "Product Type", value: "Hair Oil" },
          { name: "Formulation", value: "Oil" },
          { name: "Hair Concern", value: "Hair Growth / Hair Fall / Scalp Care" },
          { name: "Specialty / Claims", value: "Hair Nourishment / Scalp Care" }
        ],
        variants: [
          {
            name: "Mamaearth Onion Hair Oil — Red Onion",
            size: "150ml",
            sku: "MAM-ONION-OIL-150ML",
            mrp: 419,
            price: 369,
            stock: 80,
            image: BEAUTY_IMAGES.haircare.hairoil
          },
          {
            name: "Mamaearth Rosemary Hair Oil — Rosemary",
            size: "250ml",
            sku: "MAM-ROSEMARY-OIL-250ML",
            mrp: 599,
            price: 499,
            stock: 75,
            image: BEAUTY_IMAGES.haircare.hairoil
          }
        ]
      },
      {
        title: "LIVON Hair Serum",
        category: "Hair Serum",
        brand: "LIVON",
        shortDescription: "Ultra-lightweight salon finish hair serum for instant frizz control and gloss.",
        longDescription: "Infused with Vitamin E and Moroccan Argan Oil. Gives an ultra-glossy finish, tames flyaways, and provides heat protection during styling.",
        attributes: [
          { name: "Hair Type", value: "All Hair Types" },
          { name: "Product Type", value: "Hair Serum" },
          { name: "Formulation", value: "Serum" },
          { name: "Hair Concern", value: "Frizz / Hair Damage" },
          { name: "Specialty / Claims", value: "Frizz Control / Hair Smoothing" }
        ],
        variants: [
          {
            name: "LIVON Anti-Frizz Serum",
            size: "59ml",
            sku: "LIV-AF-SERUM-59ML",
            mrp: 315,
            price: 279,
            stock: 85,
            image: BEAUTY_IMAGES.haircare.hairserum
          },
          {
            name: "LIVON Damage Repair Serum",
            size: "100ml",
            sku: "LIV-DR-SERUM-100ML",
            mrp: 495,
            price: 419,
            stock: 70,
            image: BEAUTY_IMAGES.haircare.hairserum
          }
        ]
      },
      {
        title: "Minimalist Hair Treatment",
        category: "Hair Serum",
        brand: "Minimalist",
        shortDescription: "Multi-peptide and Maleic acid advanced hair growth and bond repair treatment.",
        longDescription: "Formulated with 18% Hair Growth Actives (Redensyl, Procapil, Capixyl) to reverse hair thinning and 5% Maleic complex to repair chemically damaged hair bonds.",
        attributes: [
          { name: "Hair Type", value: "All Hair Types" },
          { name: "Product Type", value: "Hair Serum / Hair Treatment" },
          { name: "Formulation", value: "Serum" },
          { name: "Hair Concern", value: "Hair Growth / Hair Damage" },
          { name: "Specialty / Claims", value: "Hair Growth / Hair Repair" }
        ],
        variants: [
          {
            name: "Minimalist Hair Growth Actives 18%",
            size: "30ml",
            sku: "MIN-HG-ACTIVES-30ML",
            mrp: 799,
            price: 699,
            stock: 65,
            image: BEAUTY_IMAGES.haircare.hairserum
          },
          {
            name: "Minimalist Maleic Bond Repair Complex 5%",
            size: "50ml",
            sku: "MIN-MALEIC-BOND-50ML",
            mrp: 1199,
            price: 999,
            stock: 55,
            image: BEAUTY_IMAGES.haircare.hairserum
          }
        ]
      },
      {
        title: "Garnier Hair Gel",
        category: "Hair Gel",
        brand: "Garnier",
        shortDescription: "Fructis style long-lasting wet shine strong hold styling gel.",
        longDescription: "Fruit micro-waxes formulation delivering strong hold and wet-look shine without flakes or residue. Resists humidity all day long.",
        attributes: [
          { name: "Hair Type", value: "All Hair Types" },
          { name: "Product Type", value: "Hair Gel" },
          { name: "Formulation", value: "Gel" },
          { name: "Hair Concern", value: "Hair Styling / Hold" },
          { name: "Specialty / Claims", value: "Hair Styling / Shine" }
        ],
        variants: [
          {
            name: "Garnier Fructis Style Wet Shine Hair Gel",
            size: "100ml",
            sku: "GAR-FRUC-WETSHINE-100ML",
            mrp: 149,
            price: 129,
            stock: 60,
            image: BEAUTY_IMAGES.haircare.hairgel
          },
          {
            name: "Garnier Fructis Styling Gel",
            size: "200ml",
            sku: "GAR-FRUC-STYLE-200ML",
            mrp: 249,
            price: 219,
            stock: 60,
            image: BEAUTY_IMAGES.haircare.hairgel
          }
        ]
      },
      {
        title: "Streax Professional Hair Gel",
        category: "Hair Gel",
        brand: "Streax Professional",
        shortDescription: "Professional salon styling gel for extreme hold and high-gloss texture.",
        longDescription: "Formulated with Vitariche gloss active to sculpt, define, and freeze hairstyles while maintaining moisture and preventing flaking.",
        attributes: [
          { name: "Hair Type", value: "All Hair Types" },
          { name: "Product Type", value: "Hair Gel" },
          { name: "Formulation", value: "Gel" },
          { name: "Hair Concern", value: "Hair Styling / Hold" },
          { name: "Specialty / Claims", value: "Strong Hold / Hair Styling" }
        ],
        variants: [
          {
            name: "Streax Professional Hair Gel Ultra Hold",
            size: "100ml",
            sku: "STRX-HG-ULTRAHOLD-100ML",
            mrp: 180,
            price: 155,
            stock: 70,
            image: BEAUTY_IMAGES.haircare.hairgel
          },
          {
            name: "Streax Professional Vitariche Gloss Hair Gel",
            size: "200ml",
            sku: "STRX-HG-VITGLOSS-200ML",
            mrp: 320,
            price: 275,
            stock: 65,
            image: BEAUTY_IMAGES.haircare.hairgel
          }
        ]
      },

      // ----------------------------------------------------
      // FRAGRANCE
      // ----------------------------------------------------
      {
        title: "Wild Stone Men Deodorant",
        category: "Deodorants",
        brand: "Wild Stone",
        shortDescription: "Long-lasting masculine deodorant spray for all-day freshness.",
        longDescription: "A burst of aromatic woody freshness engineered to control body odor and keep you feeling revitalized and confident through work and workouts.",
        attributes: [
          { name: "Gender", value: "Men" },
          { name: "Product Type", value: "Deodorant" },
          { name: "Form", value: "Aerosol Spray" },
          { name: "Fragrance Type", value: "Masculine" },
          { name: "Fragrance Family", value: "Woody / Aromatic" },
          { name: "Benefits", value: "Long-lasting freshness" },
          { name: "Usage", value: "Daily Wear / Casual Wear" },
          { name: "Country of Origin", value: "India" },
          { name: "Shelf Life", value: "36 Months" },
          { name: "Specialty / Claims", value: "Long-lasting fragrance and freshness" }
        ],
        variants: [
          {
            name: "Wild Stone Code Deodorant 150ml",
            scent: "Code",
            size: "150ml",
            sku: "WS-CODE-DEODORANT-150ML",
            mrp: 275,
            price: 235,
            stock: 90,
            image: BEAUTY_IMAGES.fragrance.deodorant
          },
          {
            name: "Wild Stone Code Deodorant 200ml",
            scent: "Code",
            size: "200ml",
            sku: "WS-CODE-DEODORANT-200ML",
            mrp: 349,
            price: 299,
            stock: 85,
            image: BEAUTY_IMAGES.fragrance.deodorant
          },
          {
            name: "Wild Stone Edge Deodorant 150ml",
            scent: "Edge",
            size: "150ml",
            sku: "WS-EDGE-DEODORANT-150ML",
            mrp: 275,
            price: 235,
            stock: 85,
            image: BEAUTY_IMAGES.fragrance.deodorant
          },
          {
            name: "Wild Stone Edge Deodorant 200ml",
            scent: "Edge",
            size: "200ml",
            sku: "WS-EDGE-DEODORANT-200ML",
            mrp: 349,
            price: 299,
            stock: 80,
            image: BEAUTY_IMAGES.fragrance.deodorant
          }
        ]
      },
      {
        title: "Denver Men Deodorant",
        category: "Deodorants",
        brand: "Denver",
        shortDescription: "Rich masculine deodorant spray for everyday office and casual wear.",
        longDescription: "Infused with woody aromatic notes to neutralize sweat odor, leaving an irresistible fragrance that commands respect throughout the day.",
        attributes: [
          { name: "Gender", value: "Men" },
          { name: "Product Type", value: "Deodorant" },
          { name: "Form", value: "Aerosol Spray" },
          { name: "Fragrance Type", value: "Masculine" },
          { name: "Fragrance Family", value: "Woody / Aromatic" },
          { name: "Benefits", value: "Long-lasting freshness" },
          { name: "Usage", value: "Daily Wear / Casual Wear / Office Wear" },
          { name: "Country of Origin", value: "India" },
          { name: "Shelf Life", value: "36 Months" },
          { name: "Specialty / Claims", value: "Long-lasting masculine fragrance" }
        ],
        variants: [
          {
            name: "Denver Hamilton Deodorant 150ml",
            scent: "Hamilton",
            size: "150ml",
            sku: "DEN-HAMILTON-DEODORANT-150ML",
            mrp: 260,
            price: 220,
            stock: 80,
            image: BEAUTY_IMAGES.fragrance.deodorant
          },
          {
            name: "Denver Hamilton Deodorant 200ml",
            scent: "Hamilton",
            size: "200ml",
            sku: "DEN-HAMILTON-DEODORANT-200ML",
            mrp: 325,
            price: 275,
            stock: 75,
            image: BEAUTY_IMAGES.fragrance.deodorant
          },
          {
            name: "Denver Imperial Deodorant 150ml",
            scent: "Imperial",
            size: "150ml",
            sku: "DEN-IMPERIAL-DEODORANT-150ML",
            mrp: 260,
            price: 220,
            stock: 80,
            image: BEAUTY_IMAGES.fragrance.deodorant
          },
          {
            name: "Denver Imperial Deodorant 200ml",
            scent: "Imperial",
            size: "200ml",
            sku: "DEN-IMPERIAL-DEODORANT-200ML",
            mrp: 325,
            price: 275,
            stock: 70,
            image: BEAUTY_IMAGES.fragrance.deodorant
          }
        ]
      },
      {
        title: "Wild Stone Men Eau de Parfum",
        category: "Perfumes",
        brand: "Wild Stone",
        shortDescription: "Premium Eau de Parfum with sophisticated woody and aromatic notes.",
        longDescription: "High-concentration artisanal Eau de Parfum delivering luxurious sillage and 12-hour staying power for evening parties and special occasions.",
        attributes: [
          { name: "Gender", value: "Men" },
          { name: "Product Type", value: "Eau de Parfum" },
          { name: "Form", value: "Spray" },
          { name: "Concentration", value: "Eau de Parfum" },
          { name: "Fragrance Type", value: "Masculine" },
          { name: "Fragrance Family", value: "Woody / Aromatic" },
          { name: "Benefits", value: "Long-lasting fragrance" },
          { name: "Usage", value: "Daily Wear / Casual Wear / Occasions" },
          { name: "Country of Origin", value: "India" },
          { name: "Shelf Life", value: "36 Months" },
          { name: "Specialty / Claims", value: "Long-lasting Eau de Parfum fragrance" }
        ],
        variants: [
          {
            name: "Wild Stone Men Code Eau de Parfum 50ml",
            scent: "Code",
            size: "50ml",
            sku: "WS-CODE-EAU-DE-PARFUM-50ML",
            mrp: 499,
            price: 399,
            stock: 50,
            image: BEAUTY_IMAGES.fragrance.perfume
          },
          {
            name: "Wild Stone Men Code Eau de Parfum 100ml",
            scent: "Code",
            size: "100ml",
            sku: "WS-CODE-EAU-DE-PARFUM-100ML",
            mrp: 799,
            price: 649,
            stock: 50,
            image: BEAUTY_IMAGES.fragrance.perfume
          },
          {
            name: "Wild Stone Men Edge Eau de Parfum 50ml",
            scent: "Edge",
            size: "50ml",
            sku: "WS-EDGE-EAU-DE-PARFUM-50ML",
            mrp: 499,
            price: 399,
            stock: 45,
            image: BEAUTY_IMAGES.fragrance.perfume
          },
          {
            name: "Wild Stone Men Edge Eau de Parfum 100ml",
            scent: "Edge",
            size: "100ml",
            sku: "WS-EDGE-EAU-DE-PARFUM-100ML",
            mrp: 799,
            price: 649,
            stock: 50,
            image: BEAUTY_IMAGES.fragrance.perfume
          }
        ]
      },
      {
        title: "Denver Eau de Parfum",
        category: "Perfumes",
        brand: "Denver",
        shortDescription: "Intense woody spicy Eau de Parfum tailored for charismatic men.",
        longDescription: "Features an alluring blend of spices, exotic amber, and cedarwood notes, crafted for unforgettable first impressions.",
        attributes: [
          { name: "Gender", value: "Men" },
          { name: "Product Type", value: "Eau de Parfum" },
          { name: "Form", value: "Spray" },
          { name: "Concentration", value: "Eau de Parfum" },
          { name: "Fragrance Type", value: "Masculine" },
          { name: "Fragrance Family", value: "Woody / Spicy" },
          { name: "Benefits", value: "Long-lasting fragrance" },
          { name: "Usage", value: "Daily Wear / Casual Wear / Office Wear / Evening Wear" },
          { name: "Country of Origin", value: "India" },
          { name: "Shelf Life", value: "36 Months" },
          { name: "Specialty / Claims", value: "Long-lasting masculine fragrance" }
        ],
        variants: [
          {
            name: "Denver Hamilton Eau de Parfum 50ml",
            scent: "Hamilton",
            size: "50ml",
            sku: "DEN-HAMILTON-EAU-DE-PARFUM-50ML",
            mrp: 449,
            price: 379,
            stock: 45,
            image: BEAUTY_IMAGES.fragrance.perfume
          },
          {
            name: "Denver Hamilton Eau de Parfum 100ml",
            scent: "Hamilton",
            size: "100ml",
            sku: "DEN-HAMILTON-EAU-DE-PARFUM-100ML",
            mrp: 699,
            price: 579,
            stock: 45,
            image: BEAUTY_IMAGES.fragrance.perfume
          },
          {
            name: "Denver Imperial Eau de Parfum 50ml",
            scent: "Imperial",
            size: "50ml",
            sku: "DEN-IMPERIAL-EAU-DE-PARFUM-50ML",
            mrp: 449,
            price: 379,
            stock: 40,
            image: BEAUTY_IMAGES.fragrance.perfume
          },
          {
            name: "Denver Imperial Eau de Parfum 100ml",
            scent: "Imperial",
            size: "100ml",
            sku: "DEN-IMPERIAL-EAU-DE-PARFUM-100ML",
            mrp: 699,
            price: 579,
            stock: 45,
            image: BEAUTY_IMAGES.fragrance.perfume
          }
        ]
      },

      // ----------------------------------------------------
      // MEN'S GROOMING
      // ----------------------------------------------------
      {
        title: "Ustraa Beard Oil",
        category: "Beard Oil",
        brand: "Ustraa",
        shortDescription: "Natural essential oils blend to nourish and soften thick, coarse beards.",
        longDescription: "Formulated with 8 natural oils including Argan and Jojoba. Tames unruly beard hair, relieves itchiness, and gives a clean, lightweight shine.",
        attributes: [
          { name: "Gender", value: "Men" },
          { name: "Product Type", value: "Beard Oil" },
          { name: "Beard Type", value: "All Beard Types" },
          { name: "Key Ingredients", value: "Beard-conditioning oils" },
          { name: "Benefits", value: "Helps nourish, soften and condition beard hair" },
          { name: "Usage", value: "Daily Beard Grooming" },
          { name: "Finish", value: "Lightweight" },
          { name: "Country of Origin", value: "India" },
          { name: "Shelf Life", value: "36 Months" },
          { name: "Specialty / Claims", value: "Beard conditioning and grooming" }
        ],
        variants: [
          {
            name: "Ustraa Original Beard Oil",
            size: "35ml",
            sku: "UST-ORIGINAL-BEARD-OIL-35ML",
            mrp: 399,
            price: 349,
            stock: 60,
            image: BEAUTY_IMAGES.grooming.beardoil
          },
          {
            name: "Ustraa Woody Musk Beard Oil",
            size: "50ml",
            sku: "UST-WOODY-MUSK-BEARD-OIL-50ML",
            mrp: 499,
            price: 429,
            stock: 55,
            image: BEAUTY_IMAGES.grooming.beardoil
          }
        ]
      },
      {
        title: "Beardo Beard Oil",
        category: "Beard Oil",
        brand: "Beardo",
        shortDescription: "Non-greasy beard growth and conditioning oil with distinct aromas.",
        longDescription: "Nourishes the hair roots from deep within, promoting dense, healthy beard growth while providing a non-greasy, all-day conditioned feel.",
        attributes: [
          { name: "Gender", value: "Men" },
          { name: "Product Type", value: "Beard Oil" },
          { name: "Beard Type", value: "All Beard Types" },
          { name: "Key Ingredients", value: "Beard-conditioning oils" },
          { name: "Benefits", value: "Helps nourish, soften and condition beard hair" },
          { name: "Usage", value: "Daily Beard Grooming" },
          { name: "Finish", value: "Non-Greasy" },
          { name: "Country of Origin", value: "India" },
          { name: "Shelf Life", value: "36 Months" },
          { name: "Specialty / Claims", value: "Beard conditioning and grooming" }
        ],
        variants: [
          {
            name: "Beardo Godfather Beard Oil",
            size: "30ml",
            sku: "BEARDO-GODFATHER-BEARD-OIL-30ML",
            mrp: 350,
            price: 299,
            stock: 70,
            image: BEAUTY_IMAGES.grooming.beardoil
          },
          {
            name: "Beardo Whiskey Smoke Beard Oil",
            size: "50ml",
            sku: "BEARDO-WHISKEY-SMOKE-BEARD-OIL-50ML",
            mrp: 499,
            price: 429,
            stock: 65,
            image: BEAUTY_IMAGES.grooming.beardoil
          }
        ]
      },
      {
        title: "Gillette Men's Razor",
        category: "Shaving Razors",
        brand: "Gillette",
        shortDescription: "Advanced multi-blade precision shaving razor for the smoothest glide.",
        longDescription: "Equipped with precision-engineered blades, lubrication strip with soothing aloe, and an ergonomic grip for an ultra-close, nick-free shave.",
        attributes: [
          { name: "Gender", value: "Men" },
          { name: "Product Type", value: "Shaving Razor" },
          { name: "Razor Type", value: "Cartridge Razor" },
          { name: "Blade Count", value: "5" },
          { name: "Blade Technology", value: "Five-blade shaving system" },
          { name: "Handle Material", value: "Plastic" },
          { name: "Lubrication Strip", value: "Yes" },
          { name: "Skin Type", value: "All Skin Types" },
          { name: "Benefits", value: "Close and comfortable shave" },
          { name: "Usage", value: "Facial Shaving / Beard Grooming" },
          { name: "Country of Origin", value: "India" },
          { name: "Specialty / Claims", value: "Multi-blade shaving system with precision trimming capability" }
        ],
        variants: [
          {
            name: "Gillette Fusion5 Razor",
            size: "1 Unit",
            sku: "GILLETTE-FUSION5-RAZOR-1U",
            mrp: 699,
            price: 599,
            stock: 50,
            image: BEAUTY_IMAGES.grooming.razor
          },
          {
            name: "Gillette Mach3 Turbo Razor",
            size: "1 Unit + 2 Blades",
            sku: "GILLETTE-MACH3-TURBO-RAZOR-1U-2B",
            mrp: 849,
            price: 729,
            stock: 65,
            image: BEAUTY_IMAGES.grooming.razor
          }
        ]
      },
      {
        title: "Bombay Shaving Company Men's Razor",
        category: "Shaving Razors",
        brand: "Bombay Shaving Company",
        shortDescription: "Precision engineered safety razor for an effortless master barber shave.",
        longDescription: "Crafted with durable metal-polymer materials to deliver maximum control, reduce skin irritation, and achieve impeccably defined beard lines.",
        attributes: [
          { name: "Gender", value: "Men" },
          { name: "Product Type", value: "Shaving Razor" },
          { name: "Razor Type", value: "Cartridge Razor / Safety Razor" },
          { name: "Blade Technology", value: "Precision and multi-blade shaving systems" },
          { name: "Handle Material", value: "Metal / Polymer" },
          { name: "Lubrication Strip", value: "Product dependent" },
          { name: "Skin Type", value: "All Skin Types" },
          { name: "Benefits", value: "Close and controlled shaving" },
          { name: "Usage", value: "Facial Shaving / Beard Grooming" },
          { name: "Country of Origin", value: "India" },
          { name: "Specialty / Claims", value: "Men's shaving and grooming" }
        ],
        variants: [
          {
            name: "Bombay Shaving Company Precision Safety Razor",
            size: "1 Unit",
            sku: "BSC-PRECISION-SAFETY-RAZOR-1U",
            mrp: 899,
            price: 749,
            stock: 40,
            image: BEAUTY_IMAGES.grooming.razor
          },
          {
            name: "Bombay Shaving Company Premium 5-Blade Razor",
            size: "1 Unit + 2 Blades",
            sku: "BSC-PREMIUM-5-BLADE-RAZOR-1U-2B",
            mrp: 1199,
            price: 999,
            stock: 35,
            image: BEAUTY_IMAGES.grooming.razor
          }
        ]
      },

      // ----------------------------------------------------
      // MAKEUP SAMPLE PRODUCTS (3+ shades each with hex swatches)
      // ----------------------------------------------------
      {
        title: "M.A.C Matte Lipstick",
        category: "Lipstick",
        brand: "M.A.C",
        shortDescription: "Iconic ultra-matte bullet lipstick offering intense 10-hour pigment payoff.",
        longDescription: "The iconic formula that made M.A.C famous. Features a creamy rich formula with high colour payoff in a no-shine matte finish.",
        attributes: [
          { name: "Product Type", value: "Lipstick" },
          { name: "Formulation", value: "Bullet" },
          { name: "Finish", value: "Matte" },
          { name: "Coverage", value: "Full Coverage" },
          { name: "Specialty / Claims", value: "Cruelty-Free" }
        ],
        variants: [
          {
            shade: "Ruby Red",
            size: "3.5g",
            sku: "MAC-MATTE-LIP-RUBYRED-3.5G",
            mrp: 2300,
            price: 1950,
            stock: 45,
            image: BEAUTY_IMAGES.makeup.lipstick
          },
          {
            shade: "Classic Red",
            size: "3.5g",
            sku: "MAC-MATTE-LIP-CLASSICRED-3.5G",
            mrp: 2300,
            price: 1950,
            stock: 40,
            image: BEAUTY_IMAGES.makeup.lipstick
          },
          {
            shade: "Nude Pink",
            size: "3.5g",
            sku: "MAC-MATTE-LIP-NUDEPINK-3.5G",
            mrp: 2300,
            price: 1950,
            stock: 50,
            image: BEAUTY_IMAGES.makeup.lipstick
          }
        ]
      },
      {
        title: "Maybelline New York Fit Me Foundation",
        category: "Foundation & Concealer",
        brand: "Maybelline New York",
        shortDescription: "Matte + poreless liquid foundation adapting seamlessly to natural skin tones.",
        longDescription: "Formulated with micro-powders to control shine and blur pores for a natural, seamless matte finish all day long.",
        attributes: [
          { name: "Product Type", value: "Foundation" },
          { name: "Formulation", value: "Liquid" },
          { name: "Finish", value: "Matte" },
          { name: "Coverage", value: "Medium Coverage" },
          { name: "Skin Type", value: "All Skin Types" },
          { name: "Specialty / Claims", value: "Dermatologically Tested" }
        ],
        variants: [
          {
            shade: "Warm Beige",
            size: "30ml",
            sku: "MAY-FITME-FND-WARMBEIGE-30ML",
            mrp: 649,
            price: 549,
            stock: 60,
            image: BEAUTY_IMAGES.makeup.foundation
          },
          {
            shade: "Natural Beige",
            size: "30ml",
            sku: "MAY-FITME-FND-NATBEIGE-30ML",
            mrp: 649,
            price: 549,
            stock: 55,
            image: BEAUTY_IMAGES.makeup.foundation
          },
          {
            shade: "Golden Beige",
            size: "30ml",
            sku: "MAY-FITME-FND-GOLDBEIGE-30ML",
            mrp: 649,
            price: 549,
            stock: 45,
            image: BEAUTY_IMAGES.makeup.foundation
          }
        ]
      },
      {
        title: "Lakmé Liquid Lipstick",
        category: "Liquid Lipstick",
        brand: "Lakmé",
        shortDescription: "Weightless velvety matte liquid lipstick with 16-hour transfer-proof wear.",
        longDescription: "Glides on like liquid velvet and sets into a non-drying, comfortable matte finish with intense color saturation.",
        attributes: [
          { name: "Product Type", value: "Liquid Lipstick" },
          { name: "Formulation", value: "Liquid" },
          { name: "Finish", value: "Liquid Matte" },
          { name: "Coverage", value: "Full Coverage" },
          { name: "Specialty / Claims", value: "Paraben-Free" }
        ],
        variants: [
          {
            shade: "Wine",
            size: "5g",
            sku: "LAK-LIQ-LIP-WINE-5G",
            mrp: 599,
            price: 499,
            stock: 50,
            image: BEAUTY_IMAGES.makeup.liquidlipstick
          },
          {
            shade: "Rose Brown",
            size: "5g",
            sku: "LAK-LIQ-LIP-ROSEBROWN-5G",
            mrp: 599,
            price: 499,
            stock: 40,
            image: BEAUTY_IMAGES.makeup.liquidlipstick
          },
          {
            shade: "Peach Nude",
            size: "5g",
            sku: "LAK-LIQ-LIP-PEACHNUDE-5G",
            mrp: 599,
            price: 499,
            stock: 60,
            image: BEAUTY_IMAGES.makeup.liquidlipstick
          }
        ]
      },
      {
        title: "Nykaa Cosmetics Nail Polish",
        category: "Nail Polish",
        brand: "Nykaa Cosmetics",
        shortDescription: "Ultra-pigmented glossy nail enamel delivering salon-perfect gel finish.",
        longDescription: "High-shine, chip-resistant formula with wide brush applicator for smooth, streak-free single-stroke color application.",
        attributes: [
          { name: "Product Type", value: "Nail Polish" },
          { name: "Formulation", value: "Liquid" },
          { name: "Finish", value: "Glossy" },
          { name: "Specialty / Claims", value: "100% Vegan" }
        ],
        variants: [
          {
            shade: "Berry",
            size: "10ml",
            sku: "NYK-NAIL-POLISH-BERRY-10ML",
            mrp: 249,
            price: 199,
            stock: 70,
            image: BEAUTY_IMAGES.makeup.nailpolish
          },
          {
            shade: "Deep Plum",
            size: "10ml",
            sku: "NYK-NAIL-POLISH-DEEPPLUM-10ML",
            mrp: 249,
            price: 199,
            stock: 65,
            image: BEAUTY_IMAGES.makeup.nailpolish
          },
          {
            shade: "Coral",
            size: "10ml",
            sku: "NYK-NAIL-POLISH-CORAL-10ML",
            mrp: 249,
            price: 199,
            stock: 60,
            image: BEAUTY_IMAGES.makeup.nailpolish
          }
        ]
      }
    ];

    let productsCreated = 0;
    let variantsCreated = 0;

    for (const pData of productsData) {
      const cat = categoryMap[pData.category];
      const brand = brandMap[pData.brand];

      if (!cat || !brand) {
        console.warn(`Category '${pData.category}' or Brand '${pData.brand}' not found for ${pData.title}`);
        continue;
      }

      const pSlug = slugify(pData.title);

      // Build validated product-level attributes
      const pAttributes = [];
      for (const attrItem of pData.attributes) {
        const attrDoc = attributeMap[attrItem.name];
        if (attrDoc) {
          const optDoc = attributeOptionMap[`${attrItem.name}_${attrItem.value}`] || 
                         attributeOptionMap[`${attrItem.name}_${slugify(attrItem.value)}`];
          const valToStore = optDoc ? optDoc.storedValue : attrItem.value.toString();
          pAttributes.push({
            attribute: attrDoc._id,
            values: [valToStore]
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
        console.log(`Created Product: ${product.title} (${product.productId})`);
      } else {
        product.title = pData.title;
        product.shortDescription = pData.shortDescription;
        product.longDescription = pData.longDescription;
        product.department = deptId;
        product.category = cat._id;
        product.brand = brand._id;
        product.attributes = pAttributes;
        product.returnPolicy = {
          returnable: false,
          exchangeable: false,
          returnDays: 0
        };
        product.status = "Active";
        await product.save();
        console.log(`Updated Product: ${product.title}`);
      }
      productsCreated++;

      // Create Variants for this product
      for (const vData of pData.variants) {
        const variantAttributes = [];

        // 1. Color / Shade (Primary) if applicable
        if (vData.shade) {
          const shadeAttr = attributeMap["Color / Shade"];
          const shadeOpt = attributeOptionMap[`Color / Shade_${vData.shade}`];
          if (shadeAttr && shadeOpt) {
            variantAttributes.push({
              attribute: shadeAttr._id,
              option: shadeOpt._id
            });
          }
        }

        // 2. Fragrance / Scent (Primary) if applicable
        if (vData.scent) {
          const scentAttr = attributeMap["Fragrance / Scent"];
          const scentOpt = attributeOptionMap[`Fragrance / Scent_${vData.scent}`];
          if (scentAttr && scentOpt) {
            variantAttributes.push({
              attribute: scentAttr._id,
              option: scentOpt._id
            });
          }
        }

        // 3. Size / Net Quantity (Secondary)
        if (vData.size) {
          const sizeAttr = attributeMap["Size / Net Quantity"];
          const sizeOpt = attributeOptionMap[`Size / Net Quantity_${vData.size}`];
          if (sizeAttr && sizeOpt) {
            variantAttributes.push({
              attribute: sizeAttr._id,
              option: sizeOpt._id
            });
          }
        }

        let variant = await Variant.findOne({ sku: vData.sku });
        const variantImage = vData.image || BEAUTY_IMAGES.skincare.moisturizer;

        if (!variant) {
          variant = await Variant.create({
            product: product._id,
            attributes: variantAttributes,
            sku: vData.sku,
            mrp: vData.mrp,
            price: vData.price,
            gstRate: 18,
            stock: vData.stock || 50,
            status: "Active",
            mainImage: variantImage,
            galleryImages: [variantImage]
          });
          console.log(`  -> Created Variant: ${variant.sku} (₹${variant.price})`);
        } else {
          variant.product = product._id;
          variant.attributes = variantAttributes;
          variant.mrp = vData.mrp;
          variant.price = vData.price;
          variant.gstRate = 18;
          variant.stock = vData.stock || 50;
          variant.status = "Active";
          if (!variant.mainImage?.url) {
            variant.mainImage = variantImage;
            variant.galleryImages = [variantImage];
          }
          await variant.save();
          console.log(`  -> Updated Variant: ${variant.sku}`);
        }
        variantsCreated++;
      }
    }

    console.log("\n==========================================");
    console.log("🎉 BEAUTY CATALOG SEEDING COMPLETED 🎉");
    console.log("==========================================");
    console.log(`- Department: 1 (Beauty & Personal Care)`);
    console.log(`- Categories: ${Object.keys(categoryMap).length}`);
    console.log(`- Brands: ${Object.keys(brandMap).length}`);
    console.log(`- Attributes: ${Object.keys(attributeMap).length}`);
    console.log(`- Category Mappings: ${totalMappings}`);
    console.log(`- Products: ${productsCreated}`);
    console.log(`- Variants: ${variantsCreated}`);
    console.log("==========================================\n");

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error during seeding:", error);
    process.exit(1);
  }
}

seedBeautyCatalog();
