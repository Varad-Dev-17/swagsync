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

// Strict IPv4 DNS resolution for Nodemailer sockets
const ipv4Lookup = (hostname, options, callback) => {
  dns.lookup(hostname, { family: 4 }, (err, address, family) => {
    callback(err, address, family);
  });
};

const emailUser = process.env.SMTP_USER || process.env.NODE_CODE_SENDING_EMAIL_ADDRESS;
const emailPass = process.env.SMTP_PASS || process.env.NODE_CODE_SENDING_EMAIL_PASSWORD;
const emailHost = process.env.SMTP_HOST || "smtp.gmail.com";

if (!emailUser || !emailPass) {
  console.warn(
    "[Mail] Warning: SMTP user or password environment variable is missing!"
  );
}

// Dynamic transporter factory - no hardcoded fixed port objects
const createSmtpTransport = (port, secure) => {
  const isSecure = secure !== undefined ? secure : (Number(port) === 465);

  const options = {
    host: emailHost,
    port: Number(port),
    secure: isSecure,
    auth: {
      user: emailUser,
      pass: emailPass,
    },
    lookup: ipv4Lookup,
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 8000,
  };

  if (process.env.SMTP_SERVICE) {
    options.service = process.env.SMTP_SERVICE;
  }

  return nodemailer.createTransport(options);
};

// Determine ports to use:
// If process.env.SMTP_PORT is specified in env, use only that port.
// Otherwise, try standard SMTP ports dynamically (465, 587, 25).
const getPortsToTry = () => {
  if (process.env.SMTP_PORT) {
    const configuredPort = Number(process.env.SMTP_PORT);
    const configuredSecure = process.env.SMTP_SECURE !== undefined
      ? process.env.SMTP_SECURE === "true"
      : (configuredPort === 465);
    return [{ port: configuredPort, secure: configuredSecure }];
  }

  return [
    { port: 465, secure: true },
    { port: 587, secure: false },
    { port: 25, secure: false },
  ];
};

const transport = {
  sendMail: async (mailOptions) => {
    const formattedMailOptions = {
      ...mailOptions,
      from: mailOptions.from || `"SwagSync" <${emailUser}>`,
    };

    const portsToTry = getPortsToTry();
    let lastError = null;

    for (const { port, secure } of portsToTry) {
      try {
        console.log(`[Mail] Attempting SMTP delivery via ${emailHost}:${port} (secure: ${secure}) to ${formattedMailOptions.to}...`);
        const dynamicTransporter = createSmtpTransport(port, secure);
        const info = await dynamicTransporter.sendMail(formattedMailOptions);
        console.log(`[Mail] Email successfully sent via SMTP port ${port}. MessageId: ${info.messageId}`);
        return info;
      } catch (err) {
        lastError = err;
        console.warn(`[Mail] Delivery failed on SMTP port ${port}: ${err.message}`);
      }
    }

    console.error("[Mail] All configured SMTP ports failed:", lastError?.message || lastError);
    throw lastError;
  },

  verify: async () => {
    const portsToTry = getPortsToTry();
    let lastError = null;

    for (const { port, secure } of portsToTry) {
      try {
        const dynamicTransporter = createSmtpTransport(port, secure);
        await dynamicTransporter.verify();
        console.log(`[Mail] SMTP verification successful on port ${port}`);
        return true;
      } catch (err) {
        lastError = err;
      }
    }

    throw lastError;
  },
};

export default transport;
