
export const generateCouponEmailHtml = ({
  couponCode,
  description,
  discountType,
  discountValue,
  minimumOrderAmount,
  maximumDiscount,
  expiryDate,
  siteUrl = process.env.FRONTEND_URL || "https://swagsync.onrender.com",
  recipientEmail = "",
}) => {
  const code = (couponCode || "").toUpperCase();
  const desc = description || "";
  const combinedText = `${code} ${desc}`.toLowerCase();

  let themeBadge = "🎉 SPECIAL OFFER";
  let themeHeader = "Exclusive Savings Just for You!";
  let primaryColor = "#FD7100";
  let gradientBanner = "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)";
  let bannerBgColor = "#0F172A";

  if (combinedText.includes("navratri") || combinedText.includes("garba") || combinedText.includes("dandiya")) {
    themeBadge = "✨ NAVRATRI SPECIAL CELEBRATION";
    themeHeader = "Celebrate Navratri in Style with Exclusive Savings!";
    primaryColor = "#EA580C";
    gradientBanner = "linear-gradient(135deg, #7C2D12 0%, #C2410C 50%, #FD7100 100%)";
    bannerBgColor = "#C2410C";
  } else if (combinedText.includes("diwali") || combinedText.includes("deepavali")) {
    themeBadge = "🪔 DIWALI DHAMAKA OFFER";
    themeHeader = "Light Up Your Wardrobe This Diwali!";
    primaryColor = "#D97706";
    gradientBanner = "linear-gradient(135deg, #78350F 0%, #B45309 50%, #F59E0B 100%)";
    bannerBgColor = "#B45309";
  } else if (combinedText.includes("ganesh") || combinedText.includes("morya") || combinedText.includes("chaturthi")) {
    themeBadge = "🌺 GANESHOTSAV SPECIAL";
    themeHeader = "Celebrate Festivities with Special Savings!";
    primaryColor = "#E11D48";
    gradientBanner = "linear-gradient(135deg, #881337 0%, #BE123C 50%, #FB7185 100%)";
    bannerBgColor = "#BE123C";
  } else if (combinedText.includes("festive") || combinedText.includes("festival")) {
    themeBadge = "✨ FESTIVE CELEBRATION OFFER";
    themeHeader = "Special Festive Deals Curated for You!";
    gradientBanner = "linear-gradient(135deg, #1E1B4B 0%, #4338CA 50%, #FD7100 100%)";
    bannerBgColor = "#4338CA";
  } else if (combinedText.includes("flash") || combinedText.includes("hour") || combinedText.includes("today")) {
    themeBadge = "⚡ FLASH SALE ALERT";
    themeHeader = "Limited-Time Flash Deal: Hurry Before It Ends!";
    gradientBanner = "linear-gradient(135deg, #111827 0%, #1F2937 100%)";
    bannerBgColor = "#111827";
  }

  // Format discount text
  const discountHighlight =
    discountType === "percentage"
      ? `${discountValue}% OFF`
      : `₹${discountValue} FLAT OFF`;

  // Format expiry date
  let formattedExpiry = "";
  if (expiryDate) {
    const exp = new Date(expiryDate);
    formattedExpiry = exp.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no" />
  <title>${code} - Special Offer from SwagSync</title>
  <style type="text/css">
    /* Global Resets */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; min-width: 100% !important; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }

    /* Mobile Responsive Rules */
    @media only screen and (max-width: 620px) {
      .email-wrapper { width: 100% !important; }
      .email-card { width: 100% !important; border-radius: 0 !important; }
      .header-pad { padding: 26px 18px !important; }
      .header-title-mob { font-size: 20px !important; line-height: 1.3 !important; }
      .body-pad { padding: 24px 16px !important; }
      .coupon-box-mob { padding: 18px 14px !important; margin: 18px 0 !important; }
      .discount-mob { font-size: 28px !important; margin: 4px 0 10px !important; }
      .code-pill-mob { font-size: 20px !important; padding: 10px 18px !important; letter-spacing: 2px !important; width: auto !important; max-width: 85% !important; word-break: break-all !important; }
      .details-pad { padding: 10px 12px !important; font-size: 13px !important; }
      .steps-mob { padding: 16px 14px !important; margin: 20px 0 !important; }
      .btn-mob { display: block !important; width: 100% !important; max-width: 280px !important; padding: 14px 16px !important; font-size: 15px !important; box-sizing: border-box !important; }
      .footer-pad { padding: 20px 16px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9;">
  <!-- Outer Table Wrapper -->
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f1f5f9; table-layout: fixed;">
    <tr>
      <td align="center" style="padding: 20px 0 30px;">
        <!-- Inner Email Container (Max 600px) -->
        <table role="presentation" class="email-wrapper email-card" border="0" cellpadding="0" cellspacing="0" width="600" style="width: 600px; max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(15,23,42,0.08);">
          
          <!-- 1. Header Banner -->
          <tr>
            <td class="header-pad" style="background: ${bannerBgColor}; background-image: ${gradientBanner}; padding: 34px 28px; text-align: center; color: #ffffff;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <div style="font-size: 28px; font-weight: 900; letter-spacing: -0.5px; color: #ffffff; margin: 0; line-height: 1;">
                      Swag<span style="color: #FD7100;">Sync</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 14px;">
                    <div style="display: inline-block; background-color: rgba(255,255,255,0.18); border: 1px solid rgba(255,255,255,0.35); color: #ffffff; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; padding: 6px 16px; border-radius: 999px;">
                      ${themeBadge}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 14px;">
                    <h2 class="header-title-mob" style="font-size: 22px; font-weight: 800; margin: 0; line-height: 1.35; color: #ffffff;">
                      ${themeHeader}
                    </h2>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 2. Body Content -->
          <tr>
            <td class="body-pad" style="padding: 32px 28px; background-color: #ffffff;">
              <!-- Intro Paragraph -->
              <p style="font-size: 15px; color: #64748b; line-height: 1.6; margin: 0 0 20px; text-align: center;">
                ${desc || "We have a special treat for you! Shop your favorite items on SwagSync and apply this limited-time voucher code at checkout to enjoy instant savings."}
              </p>

              <!-- Coupon Highlight Card -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="coupon-box-mob" style="background-color: #FFF7ED; background-image: linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%); border: 2px dashed #FD7100; border-radius: 14px; margin: 22px 0;">
                <tr>
                  <td align="center" style="padding: 22px 16px;">
                    <div style="font-size: 12px; font-weight: 800; color: #C2410C; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px;">
                      YOUR EXCLUSIVE VOUCHER
                    </div>
                    <div class="discount-mob" style="font-size: 32px; font-weight: 900; color: #0F172A; margin: 4px 0 12px; letter-spacing: -0.5px;">
                      ${discountHighlight}
                    </div>
                    <div>
                      <span class="code-pill-mob" style="display: inline-block; background-color: #FD7100; color: #ffffff; font-size: 24px; font-weight: 900; letter-spacing: 3px; padding: 11px 26px; border-radius: 10px; box-shadow: 0 4px 14px rgba(253,113,0,0.35); text-transform: uppercase;">
                        ${code}
                      </span>
                    </div>
                    <div style="font-size: 13px; color: #9A3412; font-weight: 600; margin-top: 12px; line-height: 1.4;">
                      ${minimumOrderAmount > 0 ? `Valid on orders above ₹${minimumOrderAmount}` : "No minimum spend required"}
                      ${maximumDiscount > 0 ? ` • Max discount: ₹${maximumDiscount}` : ""}
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Terms Table -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border-radius: 12px; border-collapse: collapse; margin: 20px 0; overflow: hidden;">
                <tr>
                  <td class="details-pad" style="padding: 11px 16px; font-size: 13.5px; color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0; width: 44%;">
                    Coupon Code:
                  </td>
                  <td class="details-pad" style="padding: 11px 16px; font-size: 13.5px; color: #0F172A; font-weight: 800; border-bottom: 1px solid #e2e8f0;">
                    ${code}
                  </td>
                </tr>
                <tr>
                  <td class="details-pad" style="padding: 11px 16px; font-size: 13.5px; color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0;">
                    Discount:
                  </td>
                  <td class="details-pad" style="padding: 11px 16px; font-size: 13.5px; color: #0F172A; font-weight: 800; border-bottom: 1px solid #e2e8f0;">
                    ${discountHighlight}
                  </td>
                </tr>
                ${
                  minimumOrderAmount > 0
                    ? `<tr>
                        <td class="details-pad" style="padding: 11px 16px; font-size: 13.5px; color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0;">Min. Order Value:</td>
                        <td class="details-pad" style="padding: 11px 16px; font-size: 13.5px; color: #0F172A; font-weight: 800; border-bottom: 1px solid #e2e8f0;">₹${minimumOrderAmount}</td>
                      </tr>`
                    : ""
                }
                ${
                  formattedExpiry
                    ? `<tr>
                        <td class="details-pad" style="padding: 11px 16px; font-size: 13.5px; color: #64748b; font-weight: 600;">Valid Until:</td>
                        <td class="details-pad" style="padding: 11px 16px; font-size: 13.5px; color: #EA580C; font-weight: 800;">${formattedExpiry}</td>
                      </tr>`
                    : ""
                }
              </table>

              <!-- Steps to Redeem -->
              <div class="steps-mob" style="padding: 18px 20px; background-color: #fafafa; border-radius: 12px; border: 1px solid #f1f5f9; margin: 22px 0;">
                <div style="font-size: 13px; font-weight: 800; color: #0F172A; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px;">
                  How to Redeem:
                </div>
                <div style="font-size: 13px; color: #475569; margin-bottom: 6px; line-height: 1.5;">
                  1. Browse and add your favorite items to your cart.
                </div>
                <div style="font-size: 13px; color: #475569; margin-bottom: 6px; line-height: 1.5;">
                  2. Head over to your <strong>Bag</strong>.
                </div>
                <div style="font-size: 13px; color: #475569; line-height: 1.5;">
                  3. Enter coupon code <strong>${code}</strong> in the promo box and click <strong>Apply</strong>.
                </div>
              </div>

              <!-- CTA Button (Touch-Friendly) -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 28px 0 10px;">
                <tr>
                  <td align="center">
                    <a href="${siteUrl}/products" class="btn-mob" style="display: inline-block; background-color: #FD7100; color: #ffffff !important; text-decoration: none; font-size: 15px; font-weight: 800; padding: 15px 38px; border-radius: 9999px; box-shadow: 0 4px 16px rgba(253,113,0,0.35); text-transform: uppercase; letter-spacing: 0.5px; text-align: center;">
                      Shop Now & Save →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 3. Footer -->
          <tr>
            <td class="footer-pad" style="background-color: #f8fafc; padding: 22px 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; line-height: 1.6;">
              <p style="margin: 0 0 6px;">© ${new Date().getFullYear()} SwagSync. All rights reserved.</p>
              <p style="margin: 0 0 8px;">You received this email because you are a valued customer/subscriber of SwagSync.</p>
              ${
                recipientEmail
                  ? `<p style="margin: 0;"><a href="${siteUrl}/newsletter/unsubscribe?email=${encodeURIComponent(recipientEmail)}" style="color: #64748b; text-decoration: underline;">Unsubscribe from future marketing emails</a></p>`
                  : ""
              }
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};
