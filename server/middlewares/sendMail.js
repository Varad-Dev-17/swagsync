import nodemailer from "nodemailer";
import shared from "nodemailer/lib/shared/index.js";
import os from "node:os";
import dns from "node:dns";
import dotenv from "dotenv";
dotenv.config();

// 1. Force Node DNS to prioritize IPv4 over IPv6
dns.setDefaultResultOrder?.("ipv4first");

// 2. Render and cloud containers often have link-local IPv6 interfaces without IPv6 internet routes.
// Filter out IPv6 entries so Nodemailer resolves and connects only using IPv4.
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

// Enforce strict IPv4 resolution for Nodemailer sockets
const ipv4Lookup = (hostname, options, callback) => {
  dns.lookup(hostname, { family: 4 }, (err, address, family) => {
    callback(err, address, family);
  });
};

const emailUser = process.env.NODE_CODE_SENDING_EMAIL_ADDRESS;
const emailPass = process.env.NODE_CODE_SENDING_EMAIL_PASSWORD;

if (!emailUser || !emailPass) {
  console.warn(
    "[Mail] Warning: NODE_CODE_SENDING_EMAIL_ADDRESS or NODE_CODE_SENDING_EMAIL_PASSWORD environment variable is missing!"
  );
}

// Primary Gmail SMTP: Direct TLS on port 465 (20s timeout)
const transport465 = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: emailUser,
    pass: emailPass,
  },
  lookup: ipv4Lookup,
  connectionTimeout: 20000,
  greetingTimeout: 20000,
  socketTimeout: 20000,
});

// Fallback Gmail SMTP: STARTTLS on port 587 (20s timeout)
const transport587 = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: emailUser,
    pass: emailPass,
  },
  lookup: ipv4Lookup,
  connectionTimeout: 20000,
  greetingTimeout: 20000,
  socketTimeout: 20000,
});

const transport = {
  sendMail: async (mailOptions) => {
    const formattedMailOptions = {
      ...mailOptions,
      from: mailOptions.from || `"SwagSync" <${emailUser}>`,
    };

    let lastError = null;

    // 1. Try primary Gmail SMTP (Port 465 SSL/TLS)
    try {
      console.log(`[Mail] Connecting to smtp.gmail.com:465 to send email to ${formattedMailOptions.to}...`);
      const info = await transport465.sendMail(formattedMailOptions);
      console.log(`[Mail] Email successfully sent via Gmail (Port 465). MessageId: ${info.messageId}`);
      return info;
    } catch (err465) {
      lastError = err465;
      console.warn(`[Mail] Port 465 failed (${err465.message}). Trying fallback Port 587...`);

      // 2. Try fallback Gmail SMTP (Port 587 STARTTLS)
      try {
        const info = await transport587.sendMail(formattedMailOptions);
        console.log(`[Mail] Email successfully sent via Gmail (Port 587). MessageId: ${info.messageId}`);
        return info;
      } catch (err587) {
        lastError = err587;
        console.error(`[Mail] Port 587 delivery also failed: ${err587.message}`);
      }
    }

    // If both ports fail, throw the real error
    console.error("[Mail] Gmail SMTP delivery failed:", lastError?.message || lastError);
    throw lastError;
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
