export const orderEmailTemplate = (order, user) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const orderDetailUrl = order?._id ? `${frontendUrl}/account/orders/${order._id}` : `${frontendUrl}/account/orders`;

  // Format creation date
  const orderDateObj = order?.createdAt ? new Date(order.createdAt) : new Date();
  const orderDate = orderDateObj.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  // Calculate delivery date estimate (~4-5 days)
  const deliveryDateObj = new Date(orderDateObj);
  deliveryDateObj.setDate(deliveryDateObj.getDate() + 5);
  const deliveryDay = deliveryDateObj.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  const userName = user?.username || order?.shippingAddress?.name || "Shopper";
  const paymentMethodLabel = order?.paymentMethod === "cod"
    ? "Cash on Delivery"
    : order?.paymentMethod === "razorpay"
    ? "Paid Online (Razorpay)"
    : (order?.paymentMethod || "Prepaid").toUpperCase();

  const isPaid = order?.paymentStatus === "paid";

  // Helper for safe currency formatting
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
  <title>Order Confirmation #${order?.orderId || ""}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F1F5F9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1E293B; -webkit-font-smoothing: antialiased;">

  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F1F5F9; padding: 30px 10px;">
    <tr>
      <td align="center">
        <!-- Main Card Container (Max 600px) -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05); border: 1px solid #E2E8F0;">
          
          <!-- Top Accent Stripe -->
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #FD7100 0%, #EA580C 100%); line-height: 4px; font-size: 4px;">&nbsp;</td>
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
                    <span style="display: inline-block; background-color: rgba(253, 113, 0, 0.15); border: 1px solid rgba(253, 113, 0, 0.35); color: #FB923C; padding: 6px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
                      ✓ Confirmed
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Greeting & Order Hero Banner -->
          <tr>
            <td style="padding: 32px 32px 20px 32px; text-align: left;">
              <h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 700; color: #0F172A;">
                Thank you for your order, ${userName}!
              </h1>
              <p style="margin: 0; font-size: 14px; line-height: 22px; color: #64748B;">
                We've received your order <strong style="color: #0F172A;">#${order?.orderId}</strong> and are preparing it for shipment. We'll send you another email as soon as it's on its way.
              </p>
            </td>
          </tr>

          <!-- Progress Stepper -->
          <tr>
            <td style="padding: 10px 32px 24px 32px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 10px 0;">
                <tr>
                  <!-- Step 1: Confirmed -->
                  <td width="25%" align="center" style="vertical-align: top;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="50%"></td>
                        <td width="26" align="center">
                          <div style="width: 26px; height: 26px; border-radius: 50%; background-color: #FD7100; color: #FFFFFF; font-size: 13px; font-weight: bold; line-height: 26px; text-align: center;">✓</div>
                        </td>
                        <td width="50%" style="height: 3px; background-color: #FD7100;"></td>
                      </tr>
                    </table>
                    <div style="font-size: 11px; font-weight: 700; color: #FD7100; margin-top: 6px;">Confirmed</div>
                  </td>
                  <!-- Step 2: Processing -->
                  <td width="25%" align="center" style="vertical-align: top;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="50%" style="height: 3px; background-color: #FD7100;"></td>
                        <td width="26" align="center">
                          <div style="width: 26px; height: 26px; border-radius: 50%; background-color: #FED7AA; border: 2px solid #FD7100; color: #EA580C; font-size: 11px; font-weight: bold; line-height: 22px; text-align: center;">2</div>
                        </td>
                        <td width="50%" style="height: 3px; background-color: #E2E8F0;"></td>
                      </tr>
                    </table>
                    <div style="font-size: 11px; font-weight: 600; color: #0F172A; margin-top: 6px;">Processing</div>
                  </td>
                  <!-- Step 3: Shipped -->
                  <td width="25%" align="center" style="vertical-align: top;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="50%" style="height: 3px; background-color: #E2E8F0;"></td>
                        <td width="26" align="center">
                          <div style="width: 26px; height: 26px; border-radius: 50%; background-color: #F1F5F9; border: 2px solid #CBD5E1; color: #94A3B8; font-size: 11px; font-weight: bold; line-height: 22px; text-align: center;">3</div>
                        </td>
                        <td width="50%" style="height: 3px; background-color: #E2E8F0;"></td>
                      </tr>
                    </table>
                    <div style="font-size: 11px; font-weight: 500; color: #94A3B8; margin-top: 6px;">Shipped</div>
                  </td>
                  <!-- Step 4: Delivered -->
                  <td width="25%" align="center" style="vertical-align: top;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="50%" style="height: 3px; background-color: #E2E8F0;"></td>
                        <td width="26" align="center">
                          <div style="width: 26px; height: 26px; border-radius: 50%; background-color: #F1F5F9; border: 2px solid #CBD5E1; color: #94A3B8; font-size: 11px; font-weight: bold; line-height: 22px; text-align: center;">4</div>
                        </td>
                        <td width="50%"></td>
                      </tr>
                    </table>
                    <div style="font-size: 11px; font-weight: 500; color: #94A3B8; margin-top: 6px;">Delivered</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Order Summary Meta Highlights Box -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 16px 20px;">
                <tr>
                  <td width="50%" style="vertical-align: top; padding-right: 12px;">
                    <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748B; letter-spacing: 0.5px; margin-bottom: 4px;">Order Number</div>
                    <div style="font-size: 15px; font-weight: 700; color: #0F172A; font-family: monospace;">#${order?.orderId}</div>
                    <div style="font-size: 12px; color: #64748B; margin-top: 4px;">Placed on ${orderDate}</div>
                  </td>
                  <td width="50%" style="vertical-align: top; padding-left: 12px; border-left: 1px solid #E2E8F0;">
                    <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748B; letter-spacing: 0.5px; margin-bottom: 4px;">Expected Delivery</div>
                    <div style="font-size: 15px; font-weight: 700; color: #059669;">Arriving by ${deliveryDay}</div>
                    <div style="font-size: 12px; color: #64748B; margin-top: 4px;">Standard Express Delivery</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Section Heading: Items -->
          <tr>
            <td style="padding: 0 32px 12px 32px;">
              <div style="font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #0F172A; border-bottom: 2px solid #F1F5F9; padding-bottom: 8px;">
                Ordered Items (${order?.items?.length || 0})
              </div>
            </td>
          </tr>

          <!-- Order Items Table -->
          <tr>
            <td style="padding: 0 32px 20px 32px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                ${(order?.items || []).map((item, index) => {
                  // Resilient Image Resolution:
                  // 1. Variant mainImage object (mainImage.url)
                  // 2. Variant mainImage string
                  // 3. Variant galleryImages[0] object or string
                  // 4. Product images fallback (if present)
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

                  // Resolve attributes (Color, Size, Shade, Storage, etc.)
                  const attributesList = [];
                  if (item?.variant?.attributes && Array.isArray(item.variant.attributes)) {
                    item.variant.attributes.forEach((attr) => {
                      const attrName = attr?.attribute?.name || "";
                      const optionValue = attr?.option?.displayName || attr?.option?.storedValue || "";
                      const hex = attr?.option?.hex || "";
                      if (attrName && optionValue) {
                        attributesList.push({ name: attrName, value: optionValue, hex });
                      }
                    });
                  }

                  const productTitle = item?.product?.title || "Product";
                  const brandName = item?.product?.brand?.name || "";
                  const itemQuantity = item?.quantity || 1;
                  const unitPrice = Number(item?.sellingPrice || item?.price || 0);
                  const unitMrp = Number(item?.mrp || 0);
                  const lineTotal = unitPrice * itemQuantity;
                  const isDiscounted = unitMrp > unitPrice;
                  const discountPercent = isDiscounted ? Math.round(((unitMrp - unitPrice) / unitMrp) * 100) : 0;
                  const isLastItem = index === (order.items.length - 1);

                  return `
                    <tr>
                      <td style="padding: 16px 0; ${isLastItem ? "" : "border-bottom: 1px solid #F1F5F9;"}">
                        <table width="100%" border="0" cellspacing="0" cellpadding="0">
                          <tr>
                            <!-- Product Image Column (76px fixed) -->
                            <td width="76" style="vertical-align: top; width: 76px; padding-right: 16px;">
                              ${
                                imageUrl
                                  ? `<img src="${imageUrl}" alt="${productTitle}" width="76" height="76" style="display: block; width: 76px; height: 76px; object-fit: cover; border-radius: 8px; border: 1px solid #E2E8F0;" />`
                                  : `<div style="width: 76px; height: 76px; background-color: #F1F5F9; border: 1px solid #E2E8F0; border-radius: 8px; text-align: center; line-height: 76px; color: #94A3B8; font-size: 11px; font-weight: 600;">No Image</div>`
                              }
                            </td>

                            <!-- Product Information Column -->
                            <td style="vertical-align: top; text-align: left;">
                              ${brandName ? `<div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #FD7100; margin-bottom: 2px;">${brandName}</div>` : ""}
                              <div style="font-size: 14px; font-weight: 600; color: #0F172A; line-height: 19px; margin-bottom: 6px;">
                                ${productTitle}
                              </div>

                              <!-- Attributes Pills -->
                              ${
                                attributesList.length > 0
                                  ? `<div style="margin-bottom: 6px;">
                                      ${attributesList.map((attr) => `
                                        <span style="display: inline-block; background-color: #F1F5F9; border: 1px solid #E2E8F0; color: #475569; font-size: 11px; padding: 2px 7px; border-radius: 4px; margin-right: 4px; margin-bottom: 4px;">
                                          ${attr.hex ? `<span style="display: inline-block; width: 7px; height: 7px; border-radius: 50%; background-color: ${attr.hex}; margin-right: 4px; vertical-align: middle;"></span>` : ""}<strong style="color: #334155;">${attr.name}:</strong> ${attr.value}
                                        </span>
                                      `).join("")}
                                    </div>`
                                  : ""
                              }

                              <div style="font-size: 12px; color: #64748B;">
                                Qty: <strong style="color: #0F172A;">${itemQuantity}</strong>
                                <span style="margin: 0 4px; color: #CBD5E1;">•</span>
                                Unit Price: <strong style="color: #0F172A;">${formatInr(unitPrice)}</strong>
                              </div>
                            </td>

                            <!-- Price Column -->
                            <td width="110" style="vertical-align: top; text-align: right; width: 110px;">
                              <div style="font-size: 15px; font-weight: 700; color: #0F172A;">
                                ${formatInr(lineTotal)}
                              </div>
                              ${
                                isDiscounted
                                  ? `<div style="font-size: 12px; color: #94A3B8; text-decoration: line-through; margin-top: 2px;">
                                      ${formatInr(unitMrp * itemQuantity)}
                                    </div>
                                    <div style="font-size: 11px; color: #059669; font-weight: 600; margin-top: 2px;">
                                      ${discountPercent}% OFF
                                    </div>`
                                  : ""
                              }
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

          <!-- Price Summary & Financial Breakdown -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 18px 20px;">
                <tr>
                  <td style="vertical-align: top;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <!-- Subtotal -->
                      <tr>
                        <td style="font-size: 13px; color: #64748B; padding-bottom: 8px;">Items Subtotal</td>
                        <td align="right" style="font-size: 13px; font-weight: 600; color: #0F172A; padding-bottom: 8px;">
                          ${formatInr(order?.subtotal || order?.totalMRP || order?.totalAmount)}
                        </td>
                      </tr>

                      <!-- Coupon Discount if applicable -->
                      ${
                        Number(order?.discountAmount || 0) > 0
                          ? `<tr>
                              <td style="font-size: 13px; color: #059669; padding-bottom: 8px;">
                                Coupon Discount ${order?.coupon?.code ? `<span style="font-family: monospace; font-size: 11px; background-color: #DCFCE7; padding: 1px 5px; border-radius: 3px; font-weight: 600;">${order.coupon.code}</span>` : ""}
                              </td>
                              <td align="right" style="font-size: 13px; font-weight: 600; color: #059669; padding-bottom: 8px;">
                                - ${formatInr(order.discountAmount)}
                              </td>
                            </tr>`
                          : ""
                      }

                      <!-- Shipping -->
                      <tr>
                        <td style="font-size: 13px; color: #64748B; padding-bottom: 8px;">Delivery & Handling</td>
                        <td align="right" style="font-size: 13px; font-weight: 600; color: ${Number(order?.shippingAmount || 0) === 0 ? "#059669" : "#0F172A"}; padding-bottom: 8px;">
                          ${Number(order?.shippingAmount || 0) === 0 ? "FREE" : formatInr(order.shippingAmount)}
                        </td>
                      </tr>

                      <!-- Estimated Taxes -->
                      ${
                        Number(order?.taxAmount || 0) > 0
                          ? `<tr>
                              <td style="font-size: 13px; color: #64748B; padding-bottom: 8px;">Estimated Tax / GST</td>
                              <td align="right" style="font-size: 13px; font-weight: 600; color: #0F172A; padding-bottom: 8px;">
                                ${formatInr(order.taxAmount)}
                              </td>
                            </tr>`
                          : ""
                      }

                      <!-- Divider -->
                      <tr>
                        <td colspan="2" style="border-top: 1px solid #E2E8F0; padding-top: 12px; margin-top: 4px;"></td>
                      </tr>

                      <!-- Grand Total -->
                      <tr>
                        <td style="font-size: 16px; font-weight: 700; color: #0F172A;">Total Amount</td>
                        <td align="right" style="font-size: 18px; font-weight: 800; color: #FD7100;">
                          ${formatInr(order?.totalAmount)}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Shipping Address & Payment Method Cards -->
          <tr>
            <td style="padding: 0 32px 28px 32px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <!-- Shipping Address Card -->
                  <td width="48%" style="vertical-align: top; background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px;">
                    <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; color: #64748B; margin-bottom: 8px;">
                      📍 Delivery Address
                    </div>
                    <div style="font-size: 13px; font-weight: 700; color: #0F172A; margin-bottom: 4px;">
                      ${order?.shippingAddress?.name || userName}
                    </div>
                    <div style="font-size: 13px; color: #475569; line-height: 18px;">
                      ${order?.shippingAddress?.address ? `${order.shippingAddress.address}<br/>` : ""}
                      ${order?.shippingAddress?.city ? `${order.shippingAddress.city}, ` : ""}${order?.shippingAddress?.state || ""} ${order?.shippingAddress?.pincode ? `- ${order.shippingAddress.pincode}` : ""}<br/>
                      ${order?.shippingAddress?.phone ? `<span style="color: #64748B; font-size: 12px;">Phone: ${order.shippingAddress.phone}</span>` : ""}
                    </div>
                  </td>

                  <td width="4%"></td>

                  <!-- Payment Method Card -->
                  <td width="48%" style="vertical-align: top; background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px;">
                    <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; color: #64748B; margin-bottom: 8px;">
                      💳 Payment Method
                    </div>
                    <div style="font-size: 13px; font-weight: 700; color: #0F172A; margin-bottom: 4px;">
                      ${paymentMethodLabel}
                    </div>
                    <div style="margin-top: 6px;">
                      ${
                        isPaid
                          ? `<span style="display: inline-block; background-color: #DCFCE7; color: #15803D; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 4px;">Payment Received</span>`
                          : `<span style="display: inline-block; background-color: #FEF3C7; color: #B45309; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 4px;">Payment on Delivery</span>`
                      }
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Track Order CTA Button -->
          <tr>
            <td align="center" style="padding: 0 32px 36px 32px;">
              <table border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="border-radius: 8px; background-color: #FD7100;">
                    <a href="${orderDetailUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 14px; font-weight: 700; color: #FFFFFF; text-decoration: none; border-radius: 8px; letter-spacing: 0.2px;">
                      Track Your Order →
                    </a>
                  </td>
                </tr>
              </table>
              <div style="margin-top: 12px; font-size: 12px; color: #94A3B8;">
                You can also view order tracking anytime under <a href="${frontendUrl}/account/orders" target="_blank" style="color: #FD7100; text-decoration: none; font-weight: 600;">My Orders</a>.
              </div>
            </td>
          </tr>

          <!-- Value Props Banner -->
          <tr>
            <td style="background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 16px 32px; text-align: center;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="font-size: 11px; color: #64748B; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                    ✨ 100% Original Products &nbsp;•&nbsp; ⚡ Express Delivery &nbsp;•&nbsp; 🔄 Easy Returns
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0F172A; padding: 24px 32px; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #94A3B8;">
                Need help with your order? Reach out to our support team anytime.
              </p>
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
