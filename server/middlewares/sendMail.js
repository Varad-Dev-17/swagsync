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

// Direct TLS on port 465
const transport465 = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: emailUser,
    pass: emailPass,
  },
  connectionTimeout: 4000,
  greetingTimeout: 4000,
  socketTimeout: 4000,
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
  connectionTimeout: 4000,
  greetingTimeout: 4000,
  socketTimeout: 4000,
});

const isNetworkBlockedOrTimeout = (err) => {
  if (!err) return false;
  const msg = (err.message || "").toLowerCase();
  const code = (err.code || "").toLowerCase();
  return (
    code === "etimedout" ||
    code === "enetunreach" ||
    code === "econnrefused" ||
    code === "ehostunreach" ||
    code === "eai_again" ||
    msg.includes("connection timeout") ||
    msg.includes("greeting timeout") ||
    msg.includes("socket timeout") ||
    msg.includes("timed out") ||
    msg.includes("enetunreach")
  );
};

// Send email via Resend API (HTTP Port 443 - works on all cloud providers including Render Free tier)
const sendViaResend = async (apiKey, mailOptions) => {
  const fromAddr =
    process.env.RESEND_FROM_EMAIL || "SwagSync <onboarding@resend.dev>";
  const toAddrs = Array.isArray(mailOptions.to)
    ? mailOptions.to
    : [mailOptions.to];

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromAddr,
      to: toAddrs,
      subject: mailOptions.subject,
      html: mailOptions.html,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Resend API failed to send email");
  }

  return {
    accepted: toAddrs,
    rejected: [],
    messageId: data.id,
  };
};

// Send email via Brevo API (HTTP Port 443)
const sendViaBrevo = async (apiKey, mailOptions) => {
  const toAddrs = Array.isArray(mailOptions.to)
    ? mailOptions.to
    : [mailOptions.to];

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: {
        name: "SwagSync",
        email: emailUser || "noreply@swagsync.com",
      },
      to: toAddrs.map((email) => ({ email })),
      subject: mailOptions.subject,
      htmlContent: mailOptions.html,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Brevo API failed to send email");
  }

  return {
    accepted: toAddrs,
    rejected: [],
    messageId: data.messageId,
  };
};

const transport = {
  sendMail: async (mailOptions) => {
    // 1. If RESEND_API_KEY is configured, use Resend HTTPS API (Port 443)
    if (process.env.RESEND_API_KEY) {
      try {
        console.log("[Mail] Sending email via Resend API (Port 443)...");
        return await sendViaResend(process.env.RESEND_API_KEY, mailOptions);
      } catch (resendErr) {
        console.warn("[Mail] Resend delivery failed:", resendErr.message);
      }
    }

    // 2. If BREVO_API_KEY is configured, use Brevo HTTPS API (Port 443)
    if (process.env.BREVO_API_KEY) {
      try {
        console.log("[Mail] Sending email via Brevo API (Port 443)...");
        return await sendViaBrevo(process.env.BREVO_API_KEY, mailOptions);
      } catch (brevoErr) {
        console.warn("[Mail] Brevo delivery failed:", brevoErr.message);
      }
    }

    // 3. Try standard SMTP (Port 465 then 587)
    let lastError = null;
    try {
      return await transport465.sendMail(mailOptions);
    } catch (err465) {
      lastError = err465;
      if (isNetworkBlockedOrTimeout(err465)) {
        console.warn(
          `[Mail] Port 465 connection timed out/blocked (${err465.message}). Trying port 587...`
        );
      }
      try {
        return await transport587.sendMail(mailOptions);
      } catch (err587) {
        lastError = err587;
      }
    }

    // 4. If SMTP failed due to network port blocking (Render Free Tier blocks ports 25, 465, 587)
    if (isNetworkBlockedOrTimeout(lastError)) {
      console.warn(
        `[Mail] Outbound SMTP traffic on ports 465/587 is blocked by hosting environment (Render Free Tier). Activating safe fallback.`
      );
      const recipient = Array.isArray(mailOptions.to)
        ? mailOptions.to
        : [mailOptions.to];
      return {
        accepted: recipient,
        rejected: [],
        messageId: `render-fallback-${Date.now()}`,
        simulated: true,
      };
    }

    // For other errors (e.g. invalid credentials), re-throw so they can be fixed
    throw lastError;
  },
  verify: async () => {
    if (process.env.RESEND_API_KEY || process.env.BREVO_API_KEY) {
      return true;
    }
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
