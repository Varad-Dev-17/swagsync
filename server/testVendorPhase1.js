import dns from "node:dns";
dns.setDefaultResultOrder?.("ipv4first");

import dotenv from "dotenv";
dotenv.config();
import axios from "axios";
import mongoose from "mongoose";
import Vendor from "./models/vendor.js";
import { hmacProcess } from "./utils/hash.js";

const BASE_URL = "http://127.0.0.1:8000";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runVendorPhase1Tests() {
  console.log("======================================================");
  console.log("  PHASE 1: VENDOR SYSTEM FULL VERIFICATION TEST SUITE  ");
  console.log("======================================================");

  await mongoose.connect(process.env.MONGO_URI);
  console.log("✓ Connected to MongoDB for test verification.\n");

  const testTimestamp = Date.now();
  const testVendorEmail = `testvendor_${testTimestamp}@example.com`;
  const testVendorPassword = "Password123!";
  const testUnverifiedVendorEmail = `unverified_${testTimestamp}@example.com`;
  const testCustomerEmail = `testcustomer_${testTimestamp}@example.com`;
  const testCustomerPassword = "Password123!";

  let adminToken = null;
  let vendorUserId = null;
  let approvedVendorToken = null;

  try {
    // --------------------------------------------------------------------
    // PRE-TEST: ADMIN AUTHENTICATION
    // --------------------------------------------------------------------
    console.log("--- Authenticating Admin ---");
    const adminLoginRes = await axios.post(`${BASE_URL}/admin/signin`, {
      email: "varadmule17@gmail.com",
      password: "P@ssword17",
    });
    if (!adminLoginRes.data.success || !adminLoginRes.data.token) {
      throw new Error("Admin login failed");
    }
    adminToken = adminLoginRes.data.token;
    console.log("✓ Admin authenticated successfully.\n");

    // --------------------------------------------------------------------
    // TEST 1: REGISTRATION & EMAIL VERIFICATION
    // --------------------------------------------------------------------
    console.log("--- TEST 1: Vendor Registration & Email Verification ---");
    const regPayload = {
      fullName: "Test Vendor Owner",
      email: testVendorEmail,
      phone: "9876543210",
      password: testVendorPassword,
      storeName: `Test Store ${testTimestamp}`,
      storeDescription: "High-grade fashion and street apparel",
      addressLine1: "123 Commercial Hub, MG Road",
      addressLine2: "Suite 401",
      city: "Bangalore",
      state: "Karnataka",
      country: "India",
      pincode: "560001",
      businessName: "Test Merchant Pvt Ltd",
      businessType: "Private Limited Company",
      gstNumber: "29AAAAA0000A1Z5",
      panNumber: "ABCDE1234F",
      accountHolderName: "Test Merchant Pvt Ltd",
      bankName: "HDFC Bank",
      accountNumber: "50100012345678",
      ifscCode: "HDFC0000001",
      documents: [
        {
          name: "GST Certificate",
          url: "https://res.cloudinary.com/dbjw0t8lz/image/upload/sample.jpg",
          publicId: "sample_gst",
          fileType: "image/jpeg",
        },
      ],
    };

    const regRes = await axios.post(`${BASE_URL}/vendor/register`, regPayload);
    if (!regRes.data.success) {
      throw new Error(`Vendor registration failed: ${regRes.data.message}`);
    }
    console.log("✓ Vendor registration submitted successfully.");

    // Verify DB state prior to OTP verification
    const preVerifyUser = await User.findOne({ email: testVendorEmail }).select(
      "+verificationCode +verificationCodeValidation"
    );
    if (!preVerifyUser) throw new Error("Vendor user document not created in DB");
    vendorUserId = preVerifyUser._id.toString();

    if (preVerifyUser.emailVerified !== false || preVerifyUser.verified !== false) {
      throw new Error("System field violation: emailVerified must be false before OTP!");
    }
    if (preVerifyUser.role !== "vendor") {
      throw new Error("User role is not 'vendor'!");
    }
    console.log(`✓ Initial state verified: emailVerified = false, role = 'vendor', vendorStatus = '${preVerifyUser.vendorStatus}'`);

    // Verify OTP using known test code to avoid event loop CPU starvation
    const foundCode = 654321;
    preVerifyUser.verificationCode = hmacProcess(foundCode.toString(), process.env.HMAC_VERIFICATION_CODE_SECRET);
    await preVerifyUser.save();
    console.log(`✓ Set known test OTP code: ${foundCode}`);

    // Call verify-email endpoint
    const verifyRes = await axios.patch(`${BASE_URL}/vendor/verify-email`, {
      email: testVendorEmail,
      codeProvided: foundCode,
    });
    if (!verifyRes.data.success) {
      throw new Error(`Email verification endpoint failed: ${verifyRes.data.message}`);
    }

    const postVerifyUser = await User.findById(vendorUserId);
    if (!postVerifyUser.emailVerified || !postVerifyUser.verified) {
      throw new Error("emailVerified did not update to true!");
    }
    if (postVerifyUser.vendorStatus !== "PENDING") {
      throw new Error(`vendorStatus must be PENDING, got: ${postVerifyUser.vendorStatus}`);
    }
    console.log("✓ Test 1 Passed: emailVerified = true, vendorStatus = PENDING.\n");

    // --------------------------------------------------------------------
    // TEST 2: EMAIL NOT VERIFIED (Unverified vendor cannot complete application)
    // --------------------------------------------------------------------
    console.log("--- TEST 2: Email Not Verified Vendor ---");
    const unverifiedPayload = { ...regPayload, email: testUnverifiedVendorEmail };
    await axios.post(`${BASE_URL}/vendor/register`, unverifiedPayload);

    const unverifiedUser = await User.findOne({ email: testUnverifiedVendorEmail });
    if (unverifiedUser.emailVerified !== false) {
      throw new Error("Unverified vendor has emailVerified = true!");
    }

    // Try logging in with unverified vendor
    try {
      await axios.post(`${BASE_URL}/vendor/login`, {
        email: testUnverifiedVendorEmail,
        password: testVendorPassword,
      });
      throw new Error("Unverified vendor was able to log in!");
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.message?.includes("verify your email")) {
        console.log("✓ Unverified vendor login blocked as expected (403):", err.response.data.message);
      } else {
        throw new Error(`Unexpected error on unverified login: ${err.message}`);
      }
    }
    console.log("✓ Test 2 Passed: Email Not Verified vendor cannot complete login or access portal.\n");

    // --------------------------------------------------------------------
    // TEST 3: PENDING VENDOR ACCESS CONTROL
    // --------------------------------------------------------------------
    console.log("--- TEST 3: Pending Vendor Login & Portal Access ---");
    try {
      await axios.post(`${BASE_URL}/vendor/login`, {
        email: testVendorEmail,
        password: testVendorPassword,
      });
      throw new Error("Pending vendor was able to log in!");
    } catch (err) {
      if (
        err.response?.status === 403 &&
        err.response?.data?.message === "Your Vendor account is awaiting Admin approval."
      ) {
        console.log("✓ Pending vendor login denied with required message (403):", err.response.data.message);
      } else {
        throw new Error(`Unexpected response on pending vendor login: ${err.message}`);
      }
    }

    // Check protected endpoint /vendor/me with unauthenticated request
    try {
      await axios.get(`${BASE_URL}/vendor/me`);
      throw new Error("Unauthenticated user accessed /vendor/me!");
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        console.log("✓ /vendor/me correctly protected from unauthenticated access.");
      } else {
        throw err;
      }
    }
    console.log("✓ Test 3 Passed: Pending vendor cannot access portal.\n");

    // --------------------------------------------------------------------
    // TEST 4: ADMIN APPROVAL
    // --------------------------------------------------------------------
    console.log("--- TEST 4: Admin Approval Workflow ---");
    // Admin lists vendors
    const listRes = await axios.get(`${BASE_URL}/admin/vendors?status=pending`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (!listRes.data.success) throw new Error("Admin vendors list request failed");
    const foundInList = listRes.data.vendors.some((v) => v._id === vendorUserId);
    if (!foundInList) throw new Error("Vendor not found in pending list");
    console.log("✓ Vendor successfully visible in Admin Pending list.");

    // Admin views vendor details
    const viewRes = await axios.get(`${BASE_URL}/admin/vendors/${vendorUserId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (!viewRes.data.success || !viewRes.data.vendor) throw new Error("Admin view vendor details failed");
    console.log("✓ Admin successfully viewed full Vendor details.");

    // Admin approves vendor
    const approveRes = await axios.patch(
      `${BASE_URL}/admin/vendors/${vendorUserId}/approve`,
      {},
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    if (!approveRes.data.success) throw new Error("Admin vendor approval failed");

    const approvedUser = await User.findById(vendorUserId);
    if (approvedUser.vendorStatus !== "APPROVED") {
      throw new Error("Vendor status not updated to APPROVED in DB!");
    }
    console.log("✓ Vendor status updated to APPROVED in DB.");

    // Vendor can now log in
    const vendorLoginRes = await axios.post(`${BASE_URL}/vendor/login`, {
      email: testVendorEmail,
      password: testVendorPassword,
    });
    if (!vendorLoginRes.data.success || !vendorLoginRes.data.token) {
      throw new Error("Approved vendor login failed!");
    }
    approvedVendorToken = vendorLoginRes.data.token;
    console.log("✓ Approved vendor successfully logged in and received JWT token.");

    // Approved vendor accesses protected /vendor/me
    const meRes = await axios.get(`${BASE_URL}/vendor/me`, {
      headers: { Authorization: `Bearer ${approvedVendorToken}` },
    });
    if (!meRes.data.success || meRes.data.vendor?.vendorStatus !== "APPROVED") {
      throw new Error("Approved vendor could not access /vendor/me!");
    }
    console.log("✓ Approved vendor successfully accessed protected /vendor/me endpoint.");
    console.log("✓ Test 4 Passed: Admin approval enables vendor login & portal access.\n");

    // --------------------------------------------------------------------
    // TEST 5: REJECTION WORKFLOW
    // --------------------------------------------------------------------
    console.log("--- TEST 5: Rejection Workflow ---");
    // Register another vendor to reject
    const rejectEmail = `reject_${testTimestamp}@example.com`;
    await axios.post(`${BASE_URL}/vendor/register`, { ...regPayload, email: rejectEmail });
    const rejectUser = await User.findOne({ email: rejectEmail }).select(
      "+verificationCode +verificationCodeValidation"
    );
    // Set known code and verify email
    const rejectCode = 654321;
    rejectUser.verificationCode = hmacProcess(rejectCode.toString(), process.env.HMAC_VERIFICATION_CODE_SECRET);
    await rejectUser.save();
    await axios.patch(`${BASE_URL}/vendor/verify-email`, { email: rejectEmail, codeProvided: rejectCode });

    // Admin rejects vendor
    const rejectRes = await axios.patch(
      `${BASE_URL}/admin/vendors/${rejectUser._id}/reject`,
      { reason: "Compliance documentation invalid." },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    if (!rejectRes.data.success) throw new Error("Admin reject failed");

    const rejectedInDb = await User.findById(rejectUser._id);
    if (rejectedInDb.vendorStatus !== "REJECTED") {
      throw new Error("vendorStatus was not set to REJECTED in DB!");
    }

    // Rejected vendor login is blocked
    try {
      await axios.post(`${BASE_URL}/vendor/login`, {
        email: rejectEmail,
        password: testVendorPassword,
      });
      throw new Error("Rejected vendor was able to log in!");
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.message?.includes("rejected")) {
        console.log("✓ Rejected vendor login blocked as expected (403):", err.response.data.message);
      } else {
        throw new Error(`Unexpected error on rejected login: ${err.message}`);
      }
    }
    console.log("✓ Test 5 Passed: Rejection updates status to REJECTED and blocks access.\n");

    // --------------------------------------------------------------------
    // TEST 6: SUSPENSION WORKFLOW (Server-side status validation)
    // --------------------------------------------------------------------
    console.log("--- TEST 6: Suspension Workflow (Server-Side Validation) ---");
    // Admin suspends the approved vendor
    const suspendRes = await axios.patch(
      `${BASE_URL}/admin/vendors/${vendorUserId}/suspend`,
      {},
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    if (!suspendRes.data.success) throw new Error("Admin suspend failed");

    const suspendedInDb = await User.findById(vendorUserId);
    if (suspendedInDb.vendorStatus !== "SUSPENDED") {
      throw new Error("vendorStatus was not set to SUSPENDED in DB!");
    }

    // A) Login attempt should be blocked
    try {
      await axios.post(`${BASE_URL}/vendor/login`, {
        email: testVendorEmail,
        password: testVendorPassword,
      });
      throw new Error("Suspended vendor was able to log in!");
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.message?.includes("suspended")) {
        console.log("✓ Suspended vendor login blocked (403):", err.response.data.message);
      } else {
        throw new Error(`Unexpected error on suspended login: ${err.message}`);
      }
    }

    // B) Server-side validation: ALREADY-ISSUED token must immediately fail!
    try {
      await axios.get(`${BASE_URL}/vendor/me`, {
        headers: { Authorization: `Bearer ${approvedVendorToken}` },
      });
      throw new Error("Suspended vendor was able to access /vendor/me with old token!");
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.message?.includes("suspended")) {
        console.log("✓ Already-issued token immediately blocked by isApprovedVendor middleware (403):", err.response.data.message);
      } else {
        throw new Error(`Token invalidation check failed: ${err.message}`);
      }
    }
    console.log("✓ Test 6 Passed: Suspension immediately revokes access even for active sessions.\n");

    // --------------------------------------------------------------------
    // TEST 7: REACTIVATION WORKFLOW
    // --------------------------------------------------------------------
    console.log("--- TEST 7: Reactivation Workflow ---");
    // Admin reactivates vendor
    const reactivateRes = await axios.patch(
      `${BASE_URL}/admin/vendors/${vendorUserId}/reactivate`,
      {},
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    if (!reactivateRes.data.success) throw new Error("Admin reactivate failed");

    const reactivatedInDb = await User.findById(vendorUserId);
    if (reactivatedInDb.vendorStatus !== "APPROVED") {
      throw new Error("vendorStatus was not restored to APPROVED in DB!");
    }

    // Vendor can log in again
    const reactivatedLoginRes = await axios.post(`${BASE_URL}/vendor/login`, {
      email: testVendorEmail,
      password: testVendorPassword,
    });
    if (!reactivatedLoginRes.data.success || !reactivatedLoginRes.data.token) {
      throw new Error("Reactivated vendor login failed!");
    }
    const newVendorToken = reactivatedLoginRes.data.token;

    // Vendor can access /vendor/me again
    const reactivatedMeRes = await axios.get(`${BASE_URL}/vendor/me`, {
      headers: { Authorization: `Bearer ${newVendorToken}` },
    });
    if (!reactivatedMeRes.data.success) {
      throw new Error("Reactivated vendor cannot access /vendor/me!");
    }
    console.log("✓ Reactivated vendor can log in and access protected endpoints again.");
    console.log("✓ Test 7 Passed: Reactivation restores access.\n");

    // --------------------------------------------------------------------
    // TEST 8: EXISTING SYSTEM REGRESSION
    // --------------------------------------------------------------------
    console.log("--- TEST 8: Existing System Regression ---");

    // 1. Customer registration
    const custUsername = `cust_${testTimestamp.toString().slice(-6)}`;
    const custSignupRes = await axios.post(`${BASE_URL}/auth/signup`, {
      username: custUsername,
      email: testCustomerEmail,
      password: testCustomerPassword,
    });
    if (!custSignupRes.data.success) {
      throw new Error(`Customer signup failed: ${custSignupRes.data.message}`);
    }
    console.log("✓ Customer signup working.");

    console.log("Setting customer verification code in DB...");
    await sleep(1000);
    const custInDb = await User.findOne({ email: testCustomerEmail }).select(
      "+verificationCode +verificationCodeValidation"
    );
    if (!custInDb) throw new Error("Customer not found in DB after signup");

    const custCode = 654321;
    custInDb.verificationCode = hmacProcess(custCode.toString(), process.env.HMAC_VERIFICATION_CODE_SECRET);
    await custInDb.save();
    console.log(`✓ Customer OTP prepared: ${custCode}`);

    // 2. Customer email verification
    console.log("Calling customer /auth/verify-verification-code...");
    const custVerifyRes = await axios.patch(`${BASE_URL}/auth/verify-verification-code`, {
      email: testCustomerEmail,
      codeProvided: custCode,
    });
    if (!custVerifyRes.data.success || !custVerifyRes.data.token) {
      throw new Error("Customer verification failed");
    }
    console.log("✓ Customer verification working.");

    // 3. Customer login
    console.log("Calling customer /auth/signin...");
    const custLoginRes = await axios.post(`${BASE_URL}/auth/signin`, {
      email: testCustomerEmail,
      password: testCustomerPassword,
    });
    if (!custLoginRes.data.success || !custLoginRes.data.token) {
      throw new Error("Customer signin failed");
    }
    console.log("✓ Customer login working.");

    // 4. Verify Vendor cannot sign in via customer login
    try {
      await axios.post(`${BASE_URL}/auth/signin`, {
        email: testVendorEmail,
        password: testVendorPassword,
      });
      throw new Error("Vendor was able to log in through customer login!");
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.message?.includes("vendor portal login")) {
        console.log("✓ Vendor login via customer signin correctly rejected (403):", err.response.data.message);
      } else {
        throw new Error(`Unexpected response for vendor on customer signin: ${err.message}`);
      }
    }

    // 5. Existing Admin users endpoint
    const adminUsersRes = await axios.get(`${BASE_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (!adminUsersRes.data.success) {
      throw new Error("Admin /admin/users endpoint failed");
    }
    console.log(`✓ Admin users list working (returned ${adminUsersRes.data.users.length} users).`);

    console.log("✓ Test 8 Passed: Existing Customer and Admin functionality intact with zero regressions!\n");

    // Clean up test users
    console.log("--- Cleanup: Removing test records ---");
    await User.deleteMany({
      email: {
        $in: [testVendorEmail, testUnverifiedVendorEmail, testCustomerEmail, rejectEmail],
      },
    });
    console.log("✓ Test records cleaned up.\n");

    console.log("======================================================");
    console.log("  ALL 8 TESTS PASSED SUCCESSFULLY! PHASE 1 IS READY.  ");
    console.log("======================================================");
  } catch (err) {
    console.error("\n❌ TEST SUITE FAILED:", err.stack || err.message);
    if (err.response) {
      console.error("Status:", err.response.status);
      console.error("Response Data:", err.response.data);
    }
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

runVendorPhase1Tests();
