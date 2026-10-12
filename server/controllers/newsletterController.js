import Subscriber from "../models/subscriber.js";
import Coupon from "../models/coupon.js";
import Admin from "../models/admin.js";
import Vendor from "../models/vendor.js";
import User from "../models/user.js";
import transport from "../middlewares/sendMail.js";

// Helper to ensure a welcome coupon exists in DB
const getOrCreateWelcomeCoupon = async () => {
  try {
    let coupon = await Coupon.findOne({ code: "WELCOME10" });
    if (!coupon) {
      coupon = await Coupon.create({
        code: "WELCOME10",
        description: "Welcome discount for newsletter subscribers",
        discountType: "percentage",
        discountValue: 10,
        minimumOrderAmount: 499,
        maximumDiscount: 200,
        startDate: new Date(),
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        status: "active",
      });
    }
    return coupon;
  } catch (err) {
    console.error("Error creating/fetching welcome coupon:", err.message);
    return null;
  }
};

// POST /newsletter/subscribe
export const subscribe = async (req, res) => {
  try {
    const { email, source = "footer" } = req.body;

    if (!email || typeof email !== "string") {
      return res.status(400).json({
        success: false,
        message: "Email address is required",
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    // Role Validation: Only customer/user accounts are allowed to subscribe
    const [adminDoc, adminUserDoc, vendorDoc] = await Promise.all([
      Admin.findOne({ email: cleanEmail }),
      User.findOne({ email: cleanEmail, isAdmin: true }),
      Vendor.findOne({ email: cleanEmail }),
    ]);

    if (adminDoc || adminUserDoc) {
      return res.status(400).json({
        success: false,
        message: "Admin accounts cannot subscribe to the customer newsletter.",
      });
    }

    if (vendorDoc) {
      return res.status(400).json({
        success: false,
        message: "Vendor accounts cannot subscribe to the customer newsletter.",
      });
    }

    // Check if already in subscribers list
    let subscriber = await Subscriber.findOne({ email: cleanEmail });

    if (subscriber && subscriber.isSubscribed) {
      return res.status(200).json({
        success: true,
        alreadySubscribed: true,
        message: "You are already subscribed to the SwagSync newsletter!",
      });
    }

    // If previously unsubscribed, reactivate
    if (subscriber && !subscriber.isSubscribed) {
      subscriber.isSubscribed = true;
      subscriber.subscribedAt = new Date();
      subscriber.unsubscribedAt = null;
      await subscriber.save();
    } else {
      subscriber = await Subscriber.create({
        email: cleanEmail,
        source,
        isSubscribed: true,
      });
    }

    // Ensure welcome coupon exists
    const welcomeCoupon = await getOrCreateWelcomeCoupon();
    const couponCode = welcomeCoupon?.code || "WELCOME10";
    const discountText =
      welcomeCoupon?.discountType === "percentage"
        ? `${welcomeCoupon.discountValue}% OFF`
        : `₹${welcomeCoupon?.discountValue || 100} OFF`;

    // Attempt to send welcome email
    const senderEmail =
      process.env.NODE_CODE_SENDING_EMAIL_ADDRESS ||
      process.env.SMTP_USER ||
      "no-reply@swagsync.com";
    const siteUrl = process.env.FRONTEND_URL || "http://localhost:3000";

    const emailHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Welcome to SwagSync</title>
      <style>
        body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #1e293b; }
        .wrapper { width: 100%; max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
        .header { background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); padding: 36px 30px; text-align: center; }
        .brand { font-size: 28px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; }
        .brand span { color: #FD7100; }
        .content { padding: 36px 32px; }
        .title { font-size: 24px; font-weight: 800; color: #0F172A; margin-top: 0; margin-bottom: 12px; }
        .desc { font-size: 15px; line-height: 1.6; color: #64748b; margin-bottom: 24px; }
        .coupon-card { background: linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%); border: 2px dashed #FD7100; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0; }
        .coupon-label { font-size: 12px; font-weight: 700; color: #C2410C; text-transform: uppercase; letter-spacing: 1.2px; margin-bottom: 8px; }
        .coupon-code { display: inline-block; background-color: #FD7100; color: #ffffff; font-size: 26px; font-weight: 900; letter-spacing: 3px; padding: 10px 24px; border-radius: 8px; box-shadow: 0 4px 12px rgba(253,113,0,0.3); }
        .coupon-desc { font-size: 13px; color: #9A3412; margin-top: 10px; font-weight: 600; }
        .perks { margin: 28px 0; border-top: 1px solid #f1f5f9; padding-top: 24px; }
        .perk-item { display: flex; align-items: flex-start; margin-bottom: 14px; }
        .perk-dot { color: #FD7100; font-weight: bold; margin-right: 10px; font-size: 16px; }
        .perk-text { font-size: 14px; color: #334155; line-height: 1.4; }
        .btn-container { text-align: center; margin: 32px 0 16px; }
        .btn { display: inline-block; background-color: #FD7100; color: #ffffff !important; text-decoration: none; font-size: 15px; font-weight: 700; padding: 14px 36px; border-radius: 9999px; box-shadow: 0 4px 14px rgba(253,113,0,0.35); }
        .footer { background-color: #f8fafc; padding: 24px 32px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
        .footer a { color: #64748b; text-decoration: underline; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <div class="brand">Swag<span>Sync</span></div>
        </div>
        <div class="content">
          <h1 class="title">Welcome to SwagSync! 🎉</h1>
          <p class="desc">
            Thank you for subscribing to our newsletter! You're now on the VIP list to receive exclusive drops, secret deals, and curated fashion recommendations.
          </p>

          <div class="coupon-card">
            <div class="coupon-label">Your Exclusive Welcome Gift</div>
            <div class="coupon-code">${couponCode}</div>
            <div class="coupon-desc">Get ${discountText} on your next order (Min. spend ₹499)</div>
          </div>

          <div class="perks">
            <div class="perk-item">
              <span class="perk-dot">✓</span>
              <span class="perk-text"><strong>Flash Deals & Secret Discounts:</strong> Early access before public sales.</span>
            </div>
            <div class="perk-item">
              <span class="perk-dot">✓</span>
              <span class="perk-text"><strong>New Arrivals:</strong> First look at trending fashion, lifestyle & tech.</span>
            </div>
            <div class="perk-item">
              <span class="perk-dot">✓</span>
              <span class="perk-text"><strong>Curated Picks:</strong> Handpicked selections matching the season.</span>
            </div>
          </div>

          <div class="btn-container">
            <a href="${siteUrl}/products" class="btn">Explore Collections →</a>
          </div>
        </div>

        <div class="footer">
          <p>© ${new Date().getFullYear()} SwagSync. All rights reserved.</p>
          <p>You received this email because you subscribed to our newsletter on our website.</p>
          <p><a href="${siteUrl}/newsletter/unsubscribe?email=${encodeURIComponent(cleanEmail)}">Unsubscribe from future emails</a></p>
        </div>
      </div>
    </body>
    </html>
    `;

    try {
      await transport.sendMail({
        from: `"SwagSync" <${senderEmail}>`,
        to: cleanEmail,
        subject: "Welcome to SwagSync! 🎉 Enjoy your exclusive 10% welcome discount",
        html: emailHtml,
      });

      subscriber.welcomeEmailSent = true;
      await subscriber.save();
    } catch (mailErr) {
      console.error("[Newsletter Welcome Email Error]:", mailErr.message);
      // We still return success since the subscription succeeded in DB
    }

    return res.status(200).json({
      success: true,
      message: "Thank you for subscribing! We've sent a welcome surprise to your inbox.",
      couponCode,
    });
  } catch (error) {
    console.error("Error in newsletter subscribe:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while subscribing. Please try again later.",
    });
  }
};

// GET /newsletter/unsubscribe?email=...
export const unsubscribe = async (req, res) => {
  try {
    const email = req.query.email || req.body?.email;
    if (!email) {
      return res.status(400).send("Email is required to unsubscribe.");
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const subscriber = await Subscriber.findOne({ email: cleanEmail });

    if (subscriber) {
      subscriber.isSubscribed = false;
      subscriber.unsubscribedAt = new Date();
      await subscriber.save();
    }

    // Return friendly HTML page
    return res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Unsubscribed - SwagSync</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f8fafc; color: #1e293b; }
            .box { background: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); text-align: center; max-width: 440px; }
            h2 { color: #0F172A; margin-top: 0; }
            p { color: #64748b; font-size: 15px; }
            a { display: inline-block; margin-top: 20px; background: #FD7100; color: white; padding: 10px 24px; border-radius: 999px; text-decoration: none; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="box">
            <h2>You have been unsubscribed</h2>
            <p>You will no longer receive newsletter emails from SwagSync for <strong>${cleanEmail}</strong>.</p>
            <p>You can resubscribe anytime on our website!</p>
            <a href="${process.env.FRONTEND_URL || "/"}">Return to SwagSync</a>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("Error in unsubscribe:", error);
    return res.status(500).send("Failed to unsubscribe. Please try again.");
  }
};

// GET /admin/newsletter/subscribers (Admin)
export const getSubscribers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = "", status = "all" } = req.query;

    const query = {};
    if (search && search.trim()) {
      query.email = { $regex: search.trim(), $options: "i" };
    }
    if (status === "active") {
      query.isSubscribed = true;
    } else if (status === "inactive") {
      query.isSubscribed = false;
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));
    const skip = (pageNum - 1) * limitNum;

    const [subscribers, total, totalActive] = await Promise.all([
      Subscriber.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      Subscriber.countDocuments(query),
      Subscriber.countDocuments({ isSubscribed: true }),
    ]);

    return res.status(200).json({
      success: true,
      data: subscribers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
      stats: {
        total,
        totalActive,
      },
    });
  } catch (error) {
    console.error("Error fetching subscribers:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch subscribers",
    });
  }
};

// POST /admin/newsletter/broadcast (Admin)
export const broadcastNewsletter = async (req, res) => {
  try {
    const { subject, title, message, ctaLink, ctaText = "Shop Now", couponCode } = req.body;

    if (!subject || !title || !message) {
      return res.status(400).json({
        success: false,
        message: "Subject, title, and message are required for broadcast.",
      });
    }

    const activeSubscribers = await Subscriber.find({ isSubscribed: true }).select("email").lean();
    if (!activeSubscribers || activeSubscribers.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No active subscribers found.",
        sentCount: 0,
      });
    }

    const siteUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const senderEmail =
      process.env.NODE_CODE_SENDING_EMAIL_ADDRESS ||
      process.env.SMTP_USER ||
      "no-reply@swagsync.com";

    const emails = activeSubscribers.map((s) => s.email);

    // Send emails in batches of 25
    const batchSize = 25;
    let sentCount = 0;

    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      await Promise.allSettled(
        batch.map((targetEmail) => {
          const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8" />
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 20px; }
              .card { max-width: 600px; margin: 0 auto; background: white; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
              .header { background: #0F172A; padding: 28px; text-align: center; }
              .header h2 { color: white; margin: 0; }
              .header h2 span { color: #FD7100; }
              .body { padding: 32px; }
              .title { font-size: 22px; font-weight: 800; color: #0F172A; margin-top: 0; }
              .msg { font-size: 15px; line-height: 1.6; color: #475569; }
              .coupon { background: #FFF7ED; border: 2px dashed #FD7100; border-radius: 8px; padding: 16px; text-align: center; margin: 20px 0; font-size: 20px; font-weight: bold; color: #FD7100; }
              .btn { display: inline-block; background: #FD7100; color: white !important; padding: 12px 30px; border-radius: 999px; text-decoration: none; font-weight: bold; margin-top: 15px; }
              .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="header">
                <h2>Swag<span>Sync</span></h2>
              </div>
              <div class="body">
                <h3 class="title">${title}</h3>
                <div class="msg">${message.replace(/\n/g, "<br/>")}</div>
                ${
                  couponCode
                    ? `<div class="coupon">Use Coupon: ${couponCode}</div>`
                    : ""
                }
                <div style="text-align: center; margin-top: 25px;">
                  <a href="${ctaLink || `${siteUrl}/products`}" class="btn">${ctaText}</a>
                </div>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} SwagSync. All rights reserved.</p>
                <p><a href="${siteUrl}/newsletter/unsubscribe?email=${encodeURIComponent(targetEmail)}" style="color: #64748b;">Unsubscribe</a></p>
              </div>
            </div>
          </body>
          </html>
          `;

          return transport.sendMail({
            from: `"SwagSync" <${senderEmail}>`,
            to: targetEmail,
            subject,
            html: emailHtml,
          });
        })
      );
      sentCount += batch.length;
    }

    return res.status(200).json({
      success: true,
      message: `Newsletter broadcast dispatched to ${sentCount} subscriber(s).`,
      sentCount,
    });
  } catch (error) {
    console.error("Error in newsletter broadcast:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to broadcast newsletter",
    });
  }
};
