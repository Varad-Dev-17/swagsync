import mongoose from "mongoose";

const migrateAccounts = async () => {
  try {
    const rawUsersCollection = mongoose.connection.collection("users");
    const rawAdminsCollection = mongoose.connection.collection("admins");
    const rawVendorsCollection = mongoose.connection.collection("vendors");

    // 1. Migrate Vendors from 'users' to 'vendors'
    const vendorDocs = await rawUsersCollection
      .find({
        $or: [
          { role: "vendor" },
          { vendorId: { $exists: true } },
          { vendorStatus: { $ne: null } },
        ],
      })
      .toArray();

    if (vendorDocs.length > 0) {
      console.log(
        `[DB Migration] Found ${vendorDocs.length} vendor account(s) in 'users' collection. Migrating to 'vendors'...`
      );
      for (const v of vendorDocs) {
        const vendorPayload = {
          _id: v._id,
          username: v.username || `vendor_${v.email?.split("@")[0]}`,
          email: v.email,
          password: v.password,
          mobileNo: v.mobileNo || v.vendorProfile?.phone,
          role: "vendor",
          verified: v.verified || false,
          emailVerified: v.emailVerified || v.verified || false,
          verificationCode: v.verificationCode,
          verificationCodeValidation: v.verificationCodeValidation,
          vendorStatus: v.vendorStatus || "PENDING",
          vendorProfile: v.vendorProfile || {},
          createdAt: v.createdAt || new Date(),
          updatedAt: v.updatedAt || new Date(),
        };

        if (v.vendorId) {
          vendorPayload.vendorId = v.vendorId;
        }

        const existingVendor = await rawVendorsCollection.findOne({
          $or: [{ _id: v._id }, { email: v.email }],
        });

        if (existingVendor) {
          await rawVendorsCollection.updateOne(
            { _id: existingVendor._id },
            { $set: { ...vendorPayload, _id: existingVendor._id } }
          );
        } else {
          await rawVendorsCollection.insertOne(vendorPayload);
        }

        // Remove from users collection so users table is dedicated to customers
        await rawUsersCollection.deleteOne({ _id: v._id });
      }
      console.log(
        `[DB Migration] Successfully migrated ${vendorDocs.length} vendor(s) to 'vendors' collection.`
      );
    }

    // 2. Migrate Admins from 'users' to 'admins'
    const adminDocs = await rawUsersCollection
      .find({ $or: [{ isAdmin: true }, { role: "admin" }] })
      .toArray();

    if (adminDocs.length > 0) {
      console.log(
        `[DB Migration] Found ${adminDocs.length} admin account(s) in 'users' collection. Syncing to 'admins'...`
      );
      for (const a of adminDocs) {
        const adminPayload = {
          _id: a._id,
          username: a.username || "admin",
          email: a.email,
          password: a.password,
          role: "admin",
          isAdmin: true,
          mobileNo: a.mobileNo,
          profileImage: a.profileImage,
          createdAt: a.createdAt || new Date(),
          updatedAt: a.updatedAt || new Date(),
        };

        const existingAdmin = await rawAdminsCollection.findOne({
          $or: [{ _id: a._id }, { email: a.email }, { username: a.username }],
        });

        if (existingAdmin) {
          const { _id, ...updateFields } = adminPayload;
          await rawAdminsCollection.updateOne({ _id: existingAdmin._id }, { $set: updateFields });
        } else {
          await rawAdminsCollection.insertOne(adminPayload);
        }
      }
      console.log(
        `[DB Migration] Successfully synced ${adminDocs.length} admin(s) to 'admins' collection.`
      );
    }
  } catch (migErr) {
    console.error("[DB Migration] Error during automatic account separation:", migErr);
  }
};

// mongodb connect with async await
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB database connected...");
    await migrateAccounts();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

export default connectDB;
