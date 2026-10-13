import nodemailer from "nodemailer";
import dns from "node:dns";
import dotenv from "dotenv";
dotenv.config();

// Prioritize IPv4 resolution
dns.setDefaultResultOrder?.("ipv4first");

const emailHost = process.env.SMTP_HOST || "smtp.gmail.com";
const configuredPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : (emailHost.includes("brevo") ? 587 : 465);

const parseAddress = (addr) => {
  if (!addr) return null;
  const match = String(addr).match(/(?:"?([^"]*)"?\s*)?<([^>]+)>/);
  if (match) {
    return {
      name: match[1]?.trim() || undefined,
      email: match[2].trim(),
    };
  }
  return { email: String(addr).trim() };
};

const parseRecipients = (to) => {
  if (!to) return [];
  const list = Array.isArray(to) ? to : String(to).split(",");
  return list
    .map((item) => parseAddress(item))
    .filter((item) => item && item.email);
};

const getBrevoApiKey = () => {
  const raw = process.env.BREVO_API_KEY;
  if (!raw) return null;
  const clean = raw.trim().replace(/^["']|["']$/g, "").trim();
  return clean || null;
};

/**
 * Dispatches transactional email via Brevo REST API over standard HTTPS (Port 443).
 * Immune to cloud host (Railway, Render, AWS) SMTP port restrictions.
 */
async function sendViaBrevoApi(mailOptions) {
  const apiKey = getBrevoApiKey();
  if (!apiKey) return null;

  const sender = parseAddress(
    mailOptions.from ||
      process.env.NODE_CODE_SENDING_EMAIL_ADDRESS ||
      process.env.SMTP_USER
  ) || {
    email: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS || "noreply@swagsync.com",
    name: "SwagSync",
  };

  const recipients = parseRecipients(mailOptions.to);
  if (!recipients.length) {
    throw new Error("No recipients specified for email delivery.");
  }

  const payload = {
    sender: {
      name: sender.name || "SwagSync",
      email: sender.email,
    },
    to: recipients.map((r) => ({
      email: r.email,
      ...(r.name ? { name: r.name } : {}),
    })),
    subject: mailOptions.subject || "(No Subject)",
    htmlContent: mailOptions.html || mailOptions.text || "<p></p>",
  };

  if (mailOptions.text) {
    payload.textContent = mailOptions.text;
  }

  console.log(
    `[Brevo API] Dispatching email via HTTPS to ${recipients.map((r) => r.email).join(", ")}...`
  );

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg =
      data?.message || data?.error || `HTTP ${response.status}`;
    console.error(`[Brevo API] Delivery failed:`, errorMsg);
    throw new Error(`Brevo API delivery failed: ${errorMsg}`);
  }

  console.log(
    `[Brevo API] Email dispatched successfully! MessageId: ${data.messageId}`
  );
  return {
    accepted: recipients.map((r) => r.email),
    messageId: data.messageId || `<brevo-${Date.now()}@api.brevo.com>`,
  };
}

const createSmtpTransporter = (port) => {
  const isSecure = process.env.SMTP_SECURE !== undefined
    ? process.env.SMTP_SECURE === "true"
    : (port === 465);

  return nodemailer.createTransport({
    host: emailHost,
    port,
    secure: isSecure,
    family: 4,
    auth: {
      user: process.env.SMTP_USER || process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
      pass: process.env.SMTP_PASS || process.env.NODE_CODE_SENDING_EMAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 8000,
  });
};

const getSmtpPorts = () => {
  const ports = [configuredPort];
  if (emailHost.includes("brevo")) {
    for (const p of [587, 465, 2525]) {
      if (!ports.includes(p)) ports.push(p);
    }
  }
  return ports;
};

const transport = {
  sendMail: async (mailOptions) => {
    // 1. Try Brevo HTTPS REST API first if BREVO_API_KEY is configured
    const apiKey = getBrevoApiKey();
    if (apiKey) {
      try {
        return await sendViaBrevoApi(mailOptions);
      } catch (apiErr) {
        console.warn("[Brevo API] Attempt failed, falling back to SMTP if configured:", apiErr.message);
      }
    }

    // 2. SMTP fallback
    const portsToTry = getSmtpPorts();
    let lastError = null;

    for (const port of portsToTry) {
      try {
        console.log(`[SMTP] Attempting email delivery via ${emailHost}:${port}...`);
        const transporter = createSmtpTransporter(port);
        const info = await transporter.sendMail(mailOptions);
        console.log(`[SMTP] Email successfully sent via port ${port}. MessageId: ${info.messageId}`);
        return info;
      } catch (err) {
        lastError = err;
        console.warn(`[SMTP] Delivery failed on ${emailHost}:${port}: ${err.message}`);
      }
    }

    const isTimeout = lastError?.code === "ETIMEDOUT" ||
      lastError?.message?.toLowerCase().includes("timeout");

    if (isTimeout) {
      const hint = "Connection timeout. Railway and cloud platforms restrict outbound SMTP ports (25, 465, 587, 2525). To fix this permanently on Railway, set BREVO_API_KEY in Railway environment variables to send via Brevo HTTPS REST API (Port 443).";
      console.error(`[Mail Error] ${hint}`);
      throw new Error(`SMTP timeout. Please configure BREVO_API_KEY in environment variables for cloud hosting.`);
    }

    throw lastError || new Error("Failed to send email via SMTP");
  },

  verify: async () => {
    const apiKey = getBrevoApiKey();
    if (apiKey) {
      const res = await fetch("https://api.brevo.com/v3/account", {
        headers: { "api-key": apiKey },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(`Brevo API verification failed: ${data.message || res.status}`);
      }
      return true;
    }

    const portsToTry = getSmtpPorts();
    let lastError = null;
    for (const port of portsToTry) {
      try {
        const transporter = createSmtpTransporter(port);
        await transporter.verify();
        return true;
      } catch (err) {
        lastError = err;
      }
    }
    throw lastError;
  },
};

export default transport;
