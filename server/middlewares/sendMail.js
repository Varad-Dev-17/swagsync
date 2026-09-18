import nodemailer from "nodemailer";
import shared from "nodemailer/lib/shared/index.js";
import os from "node:os";
import dns from "node:dns";
import dotenv from "dotenv";
dotenv.config();

// 1. Force Node DNS to prioritize IPv4 over IPv6
dns.setDefaultResultOrder?.("ipv4first");

// 2. Render containers have link-local IPv6 interfaces without IPv6 internet routes.
// Nodemailer checks `shared.networkInterfaces` and `os.networkInterfaces()` to decide
// whether to query AAAA (IPv6) records. If present, it resolves IPv6 and randomly picks
// an address, resulting in `connect ENETUNREACH [2607:...]:587`.
// By filtering out IPv6 entries, Nodemailer's internal `isFamilySupported(6)` returns false,
// ensuring only IPv4 addresses are resolved and connected to.
const filterOutIpv6 = (interfaces) => {
  if (!interfaces) return interfaces;
  const sanitized = {};
  for (const [name, list] of Object.entries(interfaces)) {
    sanitized[name] = list.filter(
      (iface) => iface.family !== "IPv6" && iface.family !== 6
    );
  }
  return sanitized;
};

const originalNetworkInterfaces = os.networkInterfaces;
os.networkInterfaces = function () {
  return filterOutIpv6(originalNetworkInterfaces.apply(this, arguments));
};

if (shared.networkInterfaces) {
  shared.networkInterfaces = filterOutIpv6(shared.networkInterfaces);
}

const emailUser = process.env.NODE_CODE_SENDING_EMAIL_ADDRESS;
const emailPass = process.env.NODE_CODE_SENDING_EMAIL_PASSWORD;

if (!emailUser || !emailPass) {
  console.warn(
    "[Mail] Warning: NODE_CODE_SENDING_EMAIL_ADDRESS or NODE_CODE_SENDING_EMAIL_PASSWORD environment variable is missing!"
  );
}

// Direct TLS on port 465 (most reliable on cloud platforms like Render)
const transport465 = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: emailUser,
    pass: emailPass,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
});

// Fallback STARTTLS on port 587
const transport587 = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: emailUser,
    pass: emailPass,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
});

const transport = {
  sendMail: async (mailOptions) => {
    try {
      return await transport465.sendMail(mailOptions);
    } catch (primaryError) {
      console.warn(
        `[Mail] Primary port 465 delivery failed (${primaryError.code || primaryError.message}), attempting fallback to port 587...`
      );
      try {
        return await transport587.sendMail(mailOptions);
      } catch (fallbackError) {
        console.error("[Mail] Both port 465 and port 587 deliveries failed:", {
          primary: primaryError.message,
          fallback: fallbackError.message,
        });
        throw fallbackError;
      }
    }
  },
  verify: async () => {
    try {
      return await transport465.verify();
    } catch (err) {
      return await transport587.verify();
    }
  },
  close: () => {
    transport465.close();
    transport587.close();
  },
};

export default transport;
