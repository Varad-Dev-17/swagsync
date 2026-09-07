export const orderEmailTemplate = (order, user) => {
  // Generate a mock delivery date (e.g. 5 days from now)
  const deliveryDateObj = new Date(new Date().setDate(new Date().getDate() + 5));
  const deliveryDay = deliveryDateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; background-color: #ffffff; border: 1px solid #eaeaea;">
      
      <!-- Top banner -->
      <div style="background-color: #4F46E5; padding: 15px 20px; text-align: center; color: #ffffff;">
        <span style="font-size: 15px; font-weight: bold; margin: 0 10px;">Your Orders</span>
        <span style="font-size: 15px; font-weight: bold; margin: 0 10px;">Deals</span>
        <span style="font-size: 15px; font-weight: bold; margin: 0 10px;">Buy Again</span>
      </div>

      <div style="padding: 20px 30px;">
        <h1 style="font-size: 22px; font-weight: bold; margin-top: 10px; margin-bottom: 20px; color: #111; text-align: center;">
          Thanks for your order!
        </h1>

        <!-- Progress Tracker -->
        <table width="100%" cellspacing="0" cellpadding="0" style="margin: 25px 0;">
          <tr>
            <td width="25%" align="center">
              <table width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td width="50%"></td>
                  <td width="24"><div style="width: 24px; height: 24px; background-color: #4F46E5; border-radius: 50%; color: white; line-height: 24px; font-size: 14px; text-align: center;">✓</div></td>
                  <td width="50%" style="background-color: #4F46E5; height: 3px;"></td>
                </tr>
              </table>
            </td>
            <td width="25%" align="center">
              <table width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td width="50%" style="background-color: #4F46E5; height: 3px;"></td>
                  <td width="24"><div style="width: 24px; height: 24px; background-color: #eaeaea; border-radius: 50%;"></div></td>
                  <td width="50%" style="background-color: #eaeaea; height: 3px;"></td>
                </tr>
              </table>
            </td>
            <td width="25%" align="center">
              <table width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td width="50%" style="background-color: #eaeaea; height: 3px;"></td>
                  <td width="24"><div style="width: 24px; height: 24px; background-color: #eaeaea; border-radius: 50%;"></div></td>
                  <td width="50%" style="background-color: #eaeaea; height: 3px;"></td>
                </tr>
              </table>
            </td>
            <td width="25%" align="center">
              <table width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td width="50%" style="background-color: #eaeaea; height: 3px;"></td>
                  <td width="24"><div style="width: 24px; height: 24px; background-color: #eaeaea; border-radius: 50%;"></div></td>
                  <td width="50%"></td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="font-size: 12px; font-weight: bold; color: #111; padding-top: 8px;">Ordered</td>
            <td align="center" style="font-size: 12px; color: #555; padding-top: 8px;">Shipped</td>
            <td align="center" style="font-size: 12px; color: #555; padding-top: 8px;">Out for<br/>delivery</td>
            <td align="center" style="font-size: 12px; color: #555; padding-top: 8px;">Delivered</td>
          </tr>
        </table>
        
        <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 25px 0;" />

        <h2 style="font-size: 18px; font-weight: bold; margin: 0 0 5px 0; color: #111;">
          Arriving ${deliveryDay}
        </h2>
        <div style="font-size: 14px; font-weight: bold; color: #333; margin-bottom: 5px;">
          ${order.shippingAddress.name} – ${order.shippingAddress.city}, ${order.shippingAddress.address}
        </div>
        <div style="font-size: 14px; color: #555; margin-bottom: 20px;">
          Order # ${order.orderId}
        </div>

        <!-- Order Items -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tbody>
            ${order.items.map((item) => {
              let color = '';
              let size = '';
              let imageUrl = '';
              
              if (item.variant && item.variant.attributes) {
                item.variant.attributes.forEach(attr => {
                  if (attr.attribute?.name?.toLowerCase() === 'color') {
                    color = attr.option?.displayName || color;
                  }
                  if (attr.attribute?.name?.toLowerCase() === 'size') {
                    size = attr.option?.displayName || size;
                  }
                });
              }
              if (item.variant && item.variant.mainImage && item.variant.mainImage.url) {
                imageUrl = item.variant.mainImage.url;
              } else if (item.product && item.product.images && item.product.images.length > 0) {
                imageUrl = item.product.images[0].url;
              }

              return `
              <tr>
                <td style="padding: 15px 0; width: 80px; vertical-align: top;">
                  ${imageUrl ? `<img src="${imageUrl}" alt="${item.product.title}" style="width: 70px; height: auto; border-radius: 4px; border: 1px solid #eaeaea;" />` : `<div style="width: 70px; height: 70px; background-color: #f5f5f5; border-radius: 4px;"></div>`}
                </td>
                <td style="padding: 15px 15px; vertical-align: top;">
                  <div style="font-weight: 600; font-size: 14px; color: #111; margin-bottom: 8px;">${item.product.title}</div>
                  <div style="font-size: 13px; color: #555; margin-bottom: 4px;">Quantity: ${item.quantity}</div>
                  ${color ? `<div style="font-size: 13px; color: #555; margin-bottom: 4px;">Color: ${color}</div>` : ''}
                  ${size ? `<div style="font-size: 13px; color: #555;">Size: ${size}</div>` : ''}
                  <div style="font-size: 14px; font-weight: bold; color: #111; margin-top: 8px;">
                    ₹${Number(item.price).toFixed(2)}
                  </div>
                </td>
              </tr>
            `}).join('')}
          </tbody>
        </table>

        <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 15px 0;" />
        
        <!-- Totals Section -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <tr>
            <td style="text-align: left; padding: 5px 0; font-size: 15px; font-weight: bold; color: #111;">Total</td>
            <td style="text-align: right; padding: 5px 0; font-size: 15px; font-weight: bold; color: #111;">₹${Number(order.totalAmount).toFixed(2)}</td>
          </tr>
        </table>
        
      </div>
      
      <!-- Footer -->
      <div style="background-color: #f9f9fb; padding: 20px 30px; font-size: 12px; color: #777; text-align: center; border-top: 1px solid #eaeaea;">
        © ${new Date().getFullYear()} SwagSync. All rights reserved.
      </div>

    </div>
  `;
};

