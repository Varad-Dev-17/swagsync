export const cancelEmailTemplate = (order, user) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const ordersUrl = `${frontendUrl}/account/orders`;
  const userName = user?.username || order?.shippingAddress?.name || "Shopper";

  const formatInr = (amount) => {
    const num = Number(amount);
    if (isNaN(num)) return "₹0.00";
    return `₹${num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Cancelled #${order?.orderId || ""}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F1F5F9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1E293B; -webkit-font-smoothing: antialiased;">

  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F1F5F9; padding: 30px 10px;">
    <tr>
      <td align="center">
        <!-- Main Card Container (Max 600px) -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05); border: 1px solid #E2E8F0;">
          
          <!-- Top Accent Stripe (Red for cancellation) -->
          <tr>
            <td style="height: 4px; background-color: #EF4444; line-height: 4px; font-size: 4px;">&nbsp;</td>
          </tr>

          <!-- Header Section -->
          <tr>
            <td style="background-color: #0F172A; padding: 24px 32px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="left" style="vertical-align: middle;">
                    <a href="${frontendUrl}" target="_blank" style="text-decoration: none; color: #FFFFFF; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">
                      Swag<span style="color: #FD7100;">Sync</span>
                    </a>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <span style="display: inline-block; background-color: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.35); color: #F87171; padding: 6px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
                      Cancelled
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Cancellation Notice Body -->
          <tr>
            <td style="padding: 32px 32px 20px 32px; text-align: left;">
              <h1 style="margin: 0 0 10px 0; font-size: 22px; font-weight: 700; color: #0F172A;">
                Your Order Has Been Cancelled
              </h1>
              <p style="margin: 0 0 12px 0; font-size: 14px; line-height: 22px; color: #475569;">
                Hi <strong>${userName}</strong>, as requested, your order <strong style="color: #0F172A;">#${order?.orderId}</strong> has been cancelled.
              </p>
              <div style="background-color: #FEF2F2; border: 1px solid #FEE2E2; border-radius: 8px; padding: 14px 16px; font-size: 13px; color: #991B1B; line-height: 20px;">
                ${
                  order?.paymentStatus === "paid"
                    ? "If you have already made an online payment, a full refund will be credited to your original payment method within 5 to 7 business days."
                    : "Since this was a Pay on Delivery (COD) order, no payment was charged."
                }
              </div>
            </td>
          </tr>

          <!-- Cancelled Items Section -->
          <tr>
            <td style="padding: 10px 32px 8px 32px;">
              <div style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #64748B; border-bottom: 1px solid #E2E8F0; padding-bottom: 8px;">
                Cancelled Items
              </div>
            </td>
          </tr>

          <!-- Items Table -->
          <tr>
            <td style="padding: 0 32px 20px 32px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                ${(order?.items || []).map((item, index) => {
                  let imageUrl = "";
                  if (item?.variant?.mainImage?.url) {
                    imageUrl = item.variant.mainImage.url;
                  } else if (typeof item?.variant?.mainImage === "string" && item.variant.mainImage.trim() !== "") {
                    imageUrl = item.variant.mainImage;
                  } else if (item?.variant?.galleryImages?.[0]?.url) {
                    imageUrl = item.variant.galleryImages[0].url;
                  } else if (typeof item?.variant?.galleryImages?.[0] === "string" && item.variant.galleryImages[0].trim() !== "") {
                    imageUrl = item.variant.galleryImages[0];
                  } else if (item?.product?.images?.[0]?.url) {
                    imageUrl = item.product.images[0].url;
                  } else if (typeof item?.product?.images?.[0] === "string" && item.product.images[0].trim() !== "") {
                    imageUrl = item.product.images[0];
                  }

                  const attributesList = [];
                  if (item?.variant?.attributes && Array.isArray(item.variant.attributes)) {
                    item.variant.attributes.forEach((attr) => {
                      const attrName = attr?.attribute?.name || "";
                      const optionValue = attr?.option?.displayName || attr?.option?.storedValue || "";
                      if (attrName && optionValue) {
                        attributesList.push(`${attrName}: ${optionValue}`);
                      }
                    });
                  }

                  const productTitle = item?.product?.title || "Product";
                  const itemQuantity = item?.quantity || 1;
                  const unitPrice = Number(item?.sellingPrice || item?.price || 0);
                  const lineTotal = unitPrice * itemQuantity;
                  const isLastItem = index === (order.items.length - 1);

                  return `
                    <tr>
                      <td style="padding: 14px 0; ${isLastItem ? "" : "border-bottom: 1px solid #F1F5F9;"}">
                        <table width="100%" border="0" cellspacing="0" cellpadding="0">
                          <tr>
                            <td width="64" style="vertical-align: top; width: 64px; padding-right: 14px;">
                              ${
                                imageUrl
                                  ? `<img src="${imageUrl}" alt="${productTitle}" width="64" height="64" style="display: block; width: 64px; height: 64px; object-fit: cover; border-radius: 6px; border: 1px solid #E2E8F0;" />`
                                  : `<div style="width: 64px; height: 64px; background-color: #F1F5F9; border: 1px solid #E2E8F0; border-radius: 6px; text-align: center; line-height: 64px; color: #94A3B8; font-size: 10px;">No Image</div>`
                              }
                            </td>
                            <td style="vertical-align: top; text-align: left;">
                              <div style="font-size: 14px; font-weight: 600; color: #0F172A; line-height: 18px; margin-bottom: 4px;">
                                ${productTitle}
                              </div>
                              <div style="font-size: 12px; color: #64748B;">
                                Qty: ${itemQuantity} ${attributesList.length > 0 ? `• ${attributesList.join(" • ")}` : ""}
                              </div>
                            </td>
                            <td width="90" style="vertical-align: top; text-align: right; width: 90px;">
                              <div style="font-size: 14px; font-weight: 700; color: #0F172A;">
                                ${formatInr(lineTotal)}
                              </div>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  `;
                }).join("")}
              </table>
            </td>
          </tr>

          <!-- Total Refund / Amount Box -->
          <tr>
            <td style="padding: 0 32px 28px 32px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 14px 18px;">
                <tr>
                  <td style="font-size: 14px; font-weight: 700; color: #0F172A;">
                    ${order?.paymentStatus === "paid" ? "Total Refund Amount" : "Order Value"}
                  </td>
                  <td align="right" style="font-size: 16px; font-weight: 800; color: #0F172A;">
                    ${formatInr(order?.totalAmount)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Explore More CTA Button -->
          <tr>
            <td align="center" style="padding: 0 32px 32px 32px;">
              <table border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="border-radius: 8px; background-color: #0F172A;">
                    <a href="${frontendUrl}" target="_blank" style="display: inline-block; padding: 12px 28px; font-size: 13px; font-weight: 700; color: #FFFFFF; text-decoration: none; border-radius: 8px;">
                      Continue Shopping on SwagSync →
                    </a>
                  </td>
                </tr>
              </table>
              <div style="margin-top: 10px; font-size: 12px; color: #94A3B8;">
                Need help or have questions? Contact our support anytime.
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0F172A; padding: 20px 32px; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #64748B;">
                © ${new Date().getFullYear()} SwagSync. All rights reserved.
              </p>
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
