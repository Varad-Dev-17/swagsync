import dns from "node:dns";
dns.setDefaultResultOrder?.("ipv4first");

import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";

async function runMigration() {
  console.log("=================================================");
  console.log("   SWAGSYNC ACCOUNT SEPARATION MIGRATION TOOL    ");
  console.log("=================================================");

  if (!process.env.MONGO_URI) {
    console.error("ERROR: MONGO_URI is missing from environment variables.");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✓ Connected to MongoDB.\n");

    const usersCollection = mongoose.connection.collection("users");
    const adminsCollection = mongoose.connection.collection("admins");
    const vendorsCollection = mongoose.connection.collection("vendors");

    // -------------------------------------------------------------------------
    // 1. CHECK & MOVE ADMINS
    // -------------------------------------------------------------------------
    console.log("Step 1: Checking for Admin accounts in 'users' collection...");
    const adminQuery = {
      $or: [{ isAdmin: true }, { role: "admin" }],
    };

    const adminsInUsers = await usersCollection.find(adminQuery).toArray();
    console.log(`Found ${adminsInUsers.length} admin account(s) in 'users' collection.`);

    for (const a of adminsInUsers) {
      console.log(` - Moving Admin: ${a.email} (${a.username || "admin"})...`);

      const adminDoc = {
        _id: a._id,
        username: a.username || "admin",
        email: a.email.toLowerCase().trim(),
        password: a.password,
        role: "admin",
        isAdmin: true,
        mobileNo: a.mobileNo || "",
        profileImage: a.profileImage || null,
        isBlocked: a.isBlocked || false,
        createdAt: a.createdAt || new Date(),
        updatedAt: a.updatedAt || new Date(),
      };

      await adminsCollection.updateOne(
        { _id: a._id },
        { $set: adminDoc },
        { upsert: true }
      );

      // Remove from users collection
      await usersCollection.deleteOne({ _id: a._id });
      console.log(`   ✓ Moved to 'admins' collection and removed from 'users'.`);
    }

    // -------------------------------------------------------------------------
    // 2. CHECK & MOVE VENDORS
    // -------------------------------------------------------------------------
    console.log("\nStep 2: Checking for Vendor accounts in 'users' collection...");
    const vendorQuery = {
      $or: [
        { role: "vendor" },
        { vendorId: { $exists: true } },
        { vendorStatus: { $ne: null } },
        { vendorProfile: { $exists: true } },
      ],
    };

    const vendorsInUsers = await usersCollection.find(vendorQuery).toArray();
    console.log(`Found ${vendorsInUsers.length} vendor account(s) in 'users' collection.`);

    for (const v of vendorsInUsers) {
      console.log(
        ` - Moving Vendor: ${v.email} (VendorId: ${v.vendorId || "N/A"}, Store: ${
          v.vendorProfile?.storeName || v.username || "N/A"
        })...`
      );

      const vendorDoc = {
        _id: v._id,
        vendorId: v.vendorId,
        username: v.username || `vendor_${v.email?.split("@")[0]}`,
        email: v.email.toLowerCase().trim(),
        password: v.password,
        mobileNo: v.mobileNo || v.vendorProfile?.phone || "",
        role: "vendor",
        verified: v.verified || false,
        emailVerified: v.emailVerified || v.verified || false,
        verificationCode: v.verificationCode,
        verificationCodeValidation: v.verificationCodeValidation,
        isBlocked: v.isBlocked || false,
        vendorStatus: v.vendorStatus || "PENDING",
        vendorProfile: v.vendorProfile || {},
        createdAt: v.createdAt || new Date(),
        updatedAt: v.updatedAt || new Date(),
      };

      await vendorsCollection.updateOne(
        { _id: v._id },
        { $set: vendorDoc },
        { upsert: true }
      );

      // Remove from users collection
      await usersCollection.deleteOne({ _id: v._id });
      console.log(`   ✓ Moved to 'vendors' collection and removed from 'users'.`);
    }

    // -------------------------------------------------------------------------
    // 3. SUMMARY & VERIFICATION
    // -------------------------------------------------------------------------
    const [finalUsersCount, finalAdminsCount, finalVendorsCount] = await Promise.all([
      usersCollection.countDocuments(),
      adminsCollection.countDocuments(),
      vendorsCollection.countDocuments(),
    ]);

    console.log("\n=================================================");
    console.log("              MIGRATION COMPLETE                 ");
    console.log("=================================================");
    console.log(`✓ 'users'   collection (Customers only): ${finalUsersCount}`);
    console.log(`✓ 'admins'  collection (Admins only):    ${finalAdminsCount}`);
    console.log(`✓ 'vendors' collection (Vendors only):   ${finalVendorsCount}`);
    console.log("=================================================\n");

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Migration error:", err);
    process.exit(1);
  }
}

runMigration();
