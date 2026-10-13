import cron from "node-cron";
import Coupon from "../models/coupon.js";
import Subscriber from "../models/subscriber.js";
import Product from "../models/product.js";
import Variant from "../models/variant.js";
import Cart from "../models/cart.js";
import User from "../models/user.js";
import transport from "../middlewares/sendMail.js";
import { generateCouponEmailHtml } from "../utils/couponEmailTemplate.js";

const getSenderEmail = () =>
  process.env.NODE_CODE_SENDING_EMAIL_ADDRESS ||
  process.env.SMTP_USER ||
  "no-reply@swagsync.com";

const getSiteUrl = () =>
  process.env.FRONTEND_URL || "https://swagsync.onrender.com";

/**
 * 1. AUTOMATION: Expiring Coupon Reminder (Runs daily at 10:00 AM)
 * Sends an urgent "Last Chance" reminder 24-36 hours before active coupon expiry.
 */
export const checkAndSendExpiringCouponAlerts = async () => {
  try {
    const now = new Date();
    const in36Hours = new Date(now.getTime() + 36 * 60 * 60 * 1000);

    const expiringCoupons = await Coupon.find({
      status: "active",
      expiryDate: { $gt: now, $lte: in36Hours },
      expiryReminderSent: { $ne: true },
    });

    if (!expiringCoupons || expiringCoupons.length === 0) {
      return 0;
    }

    const subscribers = await Subscriber.find({ isSubscribed: true }).select("email").lean();
    const customerUsers = await User.find({ role: "customer" }).select("email").lean();

    const subscriberEmails = (subscribers || []).map((s) => s.email?.trim().toLowerCase());
    const customerEmails = (customerUsers || []).map((u) => u.email?.trim().toLowerCase());
    const emails = [...new Set([...subscriberEmails, ...customerEmails])].filter(Boolean);

    if (emails.length === 0) return 0;
    let totalSent = 0;

    for (const coupon of expiringCoupons) {
      const discountText =
        coupon.discountType === "percentage"
          ? `${coupon.discountValue}% OFF`
          : `₹${coupon.discountValue} FLAT OFF`;

      const subject = `⏰ Last Chance! Code ${coupon.code} for ${discountText} expires soon!`;

      for (let i = 0; i < emails.length; i += 25) {
        const batch = emails.slice(i, i + 25);
        await Promise.allSettled(
          batch.map((targetEmail) => {
            const emailHtml = generateCouponEmailHtml({
              couponCode: coupon.code,
              description: `⚠️ Final Hours: Your special ${coupon.code} discount is expiring soon! Complete your purchase today before the voucher ends.`,
              discountType: coupon.discountType,
              discountValue: coupon.discountValue,
              minimumOrderAmount: coupon.minimumOrderAmount,
              maximumDiscount: coupon.maximumDiscount,
              expiryDate: coupon.expiryDate,
              siteUrl: getSiteUrl(),
              recipientEmail: targetEmail,
            });

            return transport.sendMail({
              from: `"SwagSync Flash Deals" <${getSenderEmail()}>`,
              to: targetEmail,
              subject,
              html: emailHtml,
            });
          })
        );
      }

      // Mark reminder as sent to avoid repeated spam
      coupon.expiryReminderSent = true;
      await coupon.save();
      totalSent += emails.length;
    }

    return totalSent;
  } catch (err) {
    console.error("[Promo Cron - Expiring Coupons Error]:", err.message);
    return 0;
  }
};

/**
 * 2. AUTOMATION: Weekly New Arrivals Showcase (Runs every Friday at 11:00 AM)
 */
export const sendWeeklyNewArrivalsDigest = async () => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const latestProducts = await Product.find({
      status: "Active",
      createdAt: { $gte: sevenDaysAgo },
    })
      .sort({ createdAt: -1 })
      .limit(4)
      .lean();

    // If fewer than 2 new products this week, fetch latest 4 active products
    const productsToFeature =
      latestProducts.length >= 2
        ? latestProducts
        : await Product.find({ status: "Active" }).sort({ createdAt: -1 }).limit(4).lean();

    if (!productsToFeature || productsToFeature.length === 0) {
      return 0;
    }

    // Attach primary variant info (price & image)
    const productCards = await Promise.all(
      productsToFeature.map(async (prod) => {
        const variant = await Variant.findOne({ product: prod._id }).lean();
        return {
          title: prod.title,
          price: variant?.price || 999,
          mrp: variant?.mrp || 1499,
          image: variant?.images?.[0]?.url || "https://images.unsplash.com/photo-1441986300917-64674bd600d8",
          link: `${getSiteUrl()}/products`,
        };
      })
    );

    const subscribers = await Subscriber.find({ isSubscribed: true }).select("email").lean();
    if (!subscribers || subscribers.length === 0) return 0;

    const emails = [...new Set(subscribers.map((s) => s.email.trim().toLowerCase()))];
    const subject = `🔥 Fresh Drops: Discover This Week's New Arrivals on SwagSync`;

    const productRowsHtml = productCards
      .map(
        (p) => `
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border-radius: 12px; margin-bottom: 14px; overflow: hidden; border: 1px solid #e2e8f0;">
          <tr>
            <td width="110" style="padding: 10px; text-align: center;">
              <img src="${p.image}" alt="${p.title}" width="90" height="90" style="width: 90px; height: 90px; object-fit: cover; border-radius: 8px; display: block;" />
            </td>
            <td style="padding: 12px 14px; vertical-align: middle;">
              <div style="font-size: 14px; font-weight: 700; color: #0F172A; line-height: 1.3; margin-bottom: 6px;">
                ${p.title}
              </div>
              <div style="font-size: 15px; font-weight: 800; color: #FD7100;">
                ₹${p.price} <span style="font-size: 12px; color: #94a3b8; text-decoration: line-through; font-weight: normal; margin-left: 6px;">₹${p.mrp}</span>
              </div>
              <div style="margin-top: 8px;">
                <a href="${p.link}" style="display: inline-block; font-size: 11px; font-weight: 700; color: #ffffff; background-color: #0F172A; padding: 6px 14px; border-radius: 999px; text-decoration: none;">View Item →</a>
              </div>
            </td>
          </tr>
        </table>
      `
      )
      .join("");

    for (let i = 0; i < emails.length; i += 25) {
      const batch = emails.slice(i, i + 25);
      await Promise.allSettled(
        batch.map((targetEmail) => {
          const emailHtml = `
          <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
          <html xmlns="http://www.w3.org/1999/xhtml">
          <head>
            <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
            <title>New Arrivals on SwagSync</title>
            <style type="text/css">
              body { margin: 0 !important; padding: 0 !important; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
              @media only screen and (max-width: 620px) {
                .email-card { width: 100% !important; border-radius: 0 !important; }
                .pad-mob { padding: 22px 16px !important; }
              }
            </style>
          </head>
          <body style="margin: 0; padding: 0; background-color: #f1f5f9;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f1f5f9;">
              <tr>
                <td align="center" style="padding: 20px 0 30px;">
                  <table role="presentation" class="email-card" border="0" cellpadding="0" cellspacing="0" width="600" style="width: 600px; max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(15,23,42,0.08);">
                    <tr>
                      <td style="background: #0F172A; padding: 32px 24px; text-align: center; color: #ffffff;">
                        <div style="font-size: 26px; font-weight: 900; letter-spacing: -0.5px;">Swag<span style="color: #FD7100;">Sync</span></div>
                        <div style="display: inline-block; background-color: rgba(255,255,255,0.18); border: 1px solid rgba(255,255,255,0.3); font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; padding: 6px 14px; border-radius: 999px; margin-top: 12px;">
                          WEEKLY NEW DROPS
                        </div>
                        <h2 style="font-size: 22px; font-weight: 800; margin: 14px 0 0; line-height: 1.3;">Fresh Styles Just Landed!</h2>
                      </td>
                    </tr>
                    <tr>
                      <td class="pad-mob" style="padding: 30px 24px; background-color: #ffffff;">
                        <p style="font-size: 15px; color: #64748b; line-height: 1.6; margin: 0 0 20px; text-align: center;">
                          Check out the latest handpicked additions to our fashion & lifestyle collections this week.
                        </p>
                        ${productRowsHtml}
                        <div style="text-align: center; margin-top: 28px;">
                          <a href="${getSiteUrl()}/products" style="display: inline-block; background-color: #FD7100; color: #ffffff !important; text-decoration: none; font-size: 15px; font-weight: 800; padding: 14px 38px; border-radius: 9999px; box-shadow: 0 4px 14px rgba(253,113,0,0.35);">
                            Explore All New Arrivals →
                          </a>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td style="background-color: #f8fafc; padding: 20px 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; line-height: 1.6;">
                        <p style="margin: 0 0 4px;">© ${new Date().getFullYear()} SwagSync. All rights reserved.</p>
                        <p style="margin: 0;"><a href="${getSiteUrl()}/newsletter/unsubscribe?email=${encodeURIComponent(targetEmail)}" style="color: #64748b; text-decoration: underline;">Unsubscribe</a></p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
          `;

          return transport.sendMail({
            from: `"SwagSync New Arrivals" <${getSenderEmail()}>`,
            to: targetEmail,
            subject,
            html: emailHtml,
          });
        })
      );
    }

    return emails.length;
  } catch (err) {
    console.error("[Promo Cron - New Arrivals Digest Error]:", err.message);
    return 0;
  }
};

/**
 * 3. AUTOMATION: Abandoned Cart Recovery (Runs daily at 7:00 PM)
 * Detects carts with items not touched for 3-24 hours and prompts checkout.
 */
export const checkAndSendAbandonedCartAlerts = async () => {
  try {
    const now = Date.now();
    const threeHoursAgo = new Date(now - 3 * 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000);

    const abandonedCarts = await Cart.find({
      items: { $exists: true, $not: { $size: 0 } },
      updatedAt: { $gte: twentyFourHoursAgo, $lte: threeHoursAgo },
    })
      .populate("user", "email username")
      .lean();

    if (!abandonedCarts || abandonedCarts.length === 0) {
      return 0;
    }

    let sentCount = 0;
    for (const cart of abandonedCarts) {
      const userEmail = cart.user?.email;
      if (!userEmail) continue;

      const userName = cart.user?.username || "Shopper";
      const itemCount = cart.items.length;

      const emailHtml = `
      <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
        <title>Items Waiting in Your Bag</title>
        <style type="text/css">
          body { margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        </style>
      </head>
      <body style="background-color: #f1f5f9; margin: 0; padding: 0;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f1f5f9;">
          <tr>
            <td align="center" style="padding: 24px 0;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="width: 600px; max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(15,23,42,0.08);">
                <tr>
                  <td style="background: #0F172A; padding: 32px 24px; text-align: center; color: #ffffff;">
                    <div style="font-size: 26px; font-weight: 900;">Swag<span style="color: #FD7100;">Sync</span></div>
                    <h2 style="font-size: 22px; font-weight: 800; margin: 14px 0 0;">Did you forget something? 🛍️</h2>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 32px 28px; background-color: #ffffff; text-align: center;">
                    <p style="font-size: 16px; color: #334155; line-height: 1.6; margin: 0 0 16px;">
                      Hi <strong>${userName}</strong>, you left <strong>${itemCount} item(s)</strong> in your shopping bag!
                    </p>
                    <p style="font-size: 14px; color: #64748b; line-height: 1.5; margin: 0 0 24px;">
                      Stocks move fast. Complete your purchase now to secure your favorite styles before they sell out.
                    </p>
                    <div style="margin: 28px 0 12px;">
                      <a href="${getSiteUrl()}/bag" style="display: inline-block; background-color: #FD7100; color: #ffffff !important; text-decoration: none; font-size: 15px; font-weight: 800; padding: 15px 38px; border-radius: 9999px; box-shadow: 0 4px 14px rgba(253,113,0,0.35);">
                        Complete Your Order Now →
                      </a>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="background-color: #f8fafc; padding: 20px 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
                    <p style="margin: 0;">© ${new Date().getFullYear()} SwagSync. All rights reserved.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
      `;

      try {
        await transport.sendMail({
          from: `"SwagSync Reminder" <${getSenderEmail()}>`,
          to: userEmail,
          subject: `🛍️ Hi ${userName}, you left items in your SwagSync bag!`,
          html: emailHtml,
        });
        sentCount++;
      } catch (mailErr) {
        console.error(`[Abandoned Cart Mail Error for ${userEmail}]:`, mailErr.message);
      }
    }

    return sentCount;
  } catch (err) {
    console.error("[Promo Cron - Abandoned Cart Error]:", err.message);
    return 0;
  }
};

/**
 * Initializes all cron schedules.
 */
export const initPromoCronJobs = () => {
  // 1. Expiring coupons check: Daily at 10:00 AM (0 10 * * *)
  cron.schedule(
    "0 10 * * *",
    () => {
      checkAndSendExpiringCouponAlerts();
    },
    { timezone: "Asia/Kolkata" }
  );

  // 2. Weekly New Arrivals: Every Friday at 11:00 AM (0 11 * * 5)
  cron.schedule(
    "0 11 * * 5",
    () => {
      sendWeeklyNewArrivalsDigest();
    },
    { timezone: "Asia/Kolkata" }
  );

  // 3. Abandoned Cart Recovery: Daily at 7:00 PM (0 19 * * *)
  cron.schedule(
    "0 19 * * *",
    () => {
      checkAndSendAbandonedCartAlerts();
    },
    { timezone: "Asia/Kolkata" }
  );
};
