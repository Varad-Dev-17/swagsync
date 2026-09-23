import dotenv from "dotenv";
dotenv.config();

import transport from "../middlewares/sendMail.js";
import { orderEmailTemplate } from "./orderEmailTemplate.js";

const runTest = async () => {
  const targetEmail = process.argv[2] || process.env.NODE_CODE_SENDING_EMAIL_ADDRESS;
  console.log("==========================================");
  console.log("       SwagSync Email Diagnostic Tool      ");
  console.log("==========================================");
  console.log(`Sender:    ${process.env.NODE_CODE_SENDING_EMAIL_ADDRESS}`);
  console.log(`Recipient: ${targetEmail}`);
  console.log("------------------------------------------");

  // Step 1: Verify transporter connection
  console.log("Step 1: Testing SMTP connection and authentication...");
  try {
    const verified = await transport.verify();
    console.log("✓ SMTP Server verified successfully!");
  } catch (verifyErr) {
    console.error("✗ SMTP Connection verification failed:", verifyErr.message);
    process.exit(1);
  }

  // Step 2: Render sample order email template
  console.log("\nStep 2: Rendering sample order confirmation email template...");
  const sampleOrder = {
    orderId: `TEST-${Date.now().toString().slice(-6)}`,
    createdAt: new Date(),
    paymentMethod: "cod",
    paymentStatus: "pending",
    shippingAddress: {
      name: "Test Customer",
      address: "123 Swag Street, Suite 4B",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400001",
      phone: "+91 9876543210",
    },
    subtotal: 1299,
    discountAmount: 100,
    shippingAmount: 0,
    taxAmount: 65,
    totalAmount: 1264,
    items: [
      {
        product: {
          title: "Premium Cotton Oversized T-Shirt",
          brand: { name: "SwagSync Originals" },
        },
        variant: {
          price: 1299,
          mrp: 1999,
          attributes: [
            { attribute: { name: "Color" }, option: { displayName: "Vintage Black" } },
            { attribute: { name: "Size" }, option: { displayName: "L" } },
          ],
        },
        quantity: 1,
        sellingPrice: 1299,
        mrp: 1999,
      },
    ],
  };

  const sampleUser = {
    username: "Test Customer",
    email: targetEmail,
  };

  const html = orderEmailTemplate(sampleOrder, sampleUser);
  console.log(`✓ Email HTML template rendered successfully (${html.length} bytes)`);

  // Step 3: Dispatch test email
  console.log("\nStep 3: Dispatching test email via Gmail SMTP...");
  const startTime = Date.now();
  try {
    const info = await transport.sendMail({
      from: `"SwagSync Orders" <${process.env.NODE_CODE_SENDING_EMAIL_ADDRESS}>`,
      to: targetEmail,
      subject: `[TEST] Order Confirmed #${sampleOrder.orderId} - SwagSync`,
      html,
    });
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✓ Email dispatched successfully in ${duration}s!`);
    console.log(`✓ Message ID: ${info.messageId}`);
    console.log(`✓ Accepted by: ${info.accepted?.join(", ") || targetEmail}`);
    console.log("==========================================");
    console.log("Result: Email delivery is WORKING correctly!");
    console.log("==========================================");
    process.exit(0);
  } catch (sendErr) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error(`✗ Email dispatch failed after ${duration}s:`, sendErr.message || sendErr);
    console.log("==========================================");
    console.log("Result: Email delivery FAILED!");
    console.log("==========================================");
    process.exit(1);
  }
};

runTest();
