import nodemailer from "nodemailer";
import dns from "node:dns";
import dotenv from "dotenv";
dotenv.config();

// Prioritize IPv4 resolution
dns.setDefaultResultOrder?.("ipv4first");

const emailHost = process.env.SMTP_HOST || "smtp.gmail.com";
const emailPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 465;
const isSecure = process.env.SMTP_SECURE !== undefined
  ? process.env.SMTP_SECURE === "true"
  : (emailPort === 465);

const transport = nodemailer.createTransport({
  host: emailHost,
  port: emailPort,
  secure: isSecure,
  family: 4, // Force IPv4 to prevent ENETUNREACH on cloud environments like Render
  auth: {
    user: process.env.SMTP_USER || process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
    pass: process.env.SMTP_PASS || process.env.NODE_CODE_SENDING_EMAIL_PASSWORD,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
});

export default transport;
