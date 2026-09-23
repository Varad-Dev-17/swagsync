import nodemailer from "nodemailer";
import dns from "node:dns";
import dotenv from "dotenv";
dotenv.config();

// Prioritize IPv4 resolution
dns.setDefaultResultOrder?.("ipv4first");

const transport = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
    pass: process.env.NODE_CODE_SENDING_EMAIL_PASSWORD,
  },
  connectionTimeout: 10000,
});

export default transport;
