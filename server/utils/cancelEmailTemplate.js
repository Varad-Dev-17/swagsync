export const cancelEmailTemplate = (order, user) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; color: #333; background-color: #ffffff;">
      <!-- Top red border -->
      <div style="height: 4px; background-color: #ef4444; width: 100%;"></div>
      
      <div style="padding: 30px 40px;">
        <h1 style="font-size: 24px; font-weight: normal; margin-top: 0; margin-bottom: 25px; color: #111;">
          Your Order Has Been Cancelled
        </h1>
        
        <h2 style="font-size: 18px; margin-bottom: 15px; color: #111;">
          Hi ${user.username}
        </h2>
        
        <p style="font-size: 14px; line-height: 1.5; color: #333; margin-bottom: 35px;">
          As requested, we have successfully cancelled your order (<strong>${order.orderId}</strong>). 
          If you have already paid, a refund will be initiated to your original payment method.
        </p>

        <!-- Table Header -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr>
              <th style="text-align: left; padding-bottom: 15px; border-bottom: 1px solid #eaeaea; font-weight: normal; font-size: 14px; color: #555;">Cancelled Items</th>
              <th style="text-align: right; padding-bottom: 15px; border-bottom: 1px solid #eaeaea; font-weight: normal; font-size: 14px; color: #555;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map((item) => {
              // Extract Color and Size from variant attributes if they exist
              let color = '';
              let size = '';
              
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

              return `
              <tr>
                <td style="padding: 25px 0; border-bottom: 1px solid #f5f5f5; vertical-align: top;">
                  <div style="font-weight: 600; font-size: 14px; color: #111; margin-bottom: 8px;">${item.product.title}</div>
                  <div style="font-size: 13px; color: #555; margin-bottom: 4px;">Quantity : ${item.quantity}</div>
                  ${color ? `<div style="font-size: 13px; color: #555; margin-bottom: 4px;">Color : ${color}</div>` : ''}
                  ${size ? `<div style="font-size: 13px; color: #555;">Size : ${size}</div>` : ''}
                </td>
                <td style="padding: 25px 0; border-bottom: 1px solid #f5f5f5; text-align: right; vertical-align: middle; font-size: 14px; color: #111; font-weight: 600;">
                  ₹ ${Number(item.price * item.quantity).toFixed(2)}
                </td>
              </tr>
            `}).join('')}
          </tbody>
        </table>

        <!-- Totals Section -->
        <div style="padding-top: 10px; margin-bottom: 40px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="width: 60%;"></td>
              <td style="width: 40%;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="text-align: right; padding: 10px 15px 0 0; font-size: 15px; font-weight: 600; color: #111;">Total Refund :</td>
                    <td style="text-align: right; padding: 10px 0 0 0; font-size: 15px; font-weight: 600; color: #111;">₹ ${Number(order.totalAmount).toFixed(2)}</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </div>

        <p style="font-size: 14px; color: #777;">
          If this cancellation was a mistake or you need help with anything else, please contact our support team.
        </p>

        <!-- Footer -->
        <div style="font-size: 14px; color: #555; line-height: 1.6; margin-top: 30px;">
          Best regards,<br/>
          <strong style="color: #111;">SwagSync Team</strong>
        </div>

      </div>
    </div>
  `;
};
