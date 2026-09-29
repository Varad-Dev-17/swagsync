export const vendorRejectionEmailTemplate = (vendor, reason) => {
  const storeName = vendor.vendorProfile?.storeName || vendor.username || "Vendor";
  const fullName = vendor.vendorProfile?.fullName || vendor.username || "Vendor Partner";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; color: #1e293b; }
    .container { max-width: 560px; margin: 36px auto; background: #ffffff; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.06); overflow: hidden; border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #475569 0%, #1e293b 100%); padding: 36px 32px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.02em; }
    .header p { color: #cbd5e1; margin: 8px 0 0 0; font-size: 14px; }
    .body { padding: 36px 32px; text-align: left; }
    .greeting { font-size: 18px; font-weight: 600; color: #0f172a; margin-bottom: 16px; }
    .body p { color: #475569; font-size: 15px; line-height: 1.65; margin: 0 0 18px 0; }
    .badge-card { background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center; }
    .badge-status { display: inline-block; background: #dc2626; color: #ffffff; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 4px 12px; border-radius: 9999px; margin-bottom: 8px; }
    .badge-card h3 { margin: 0 0 4px 0; color: #991b1b; font-size: 16px; font-weight: 600; }
    .badge-card p { margin: 0; color: #b91c1c; font-size: 13px; }
    .reason-box { background: #f8fafc; border-left: 4px solid #94a3b8; border-radius: 0 8px 8px 0; padding: 14px 18px; margin: 20px 0; font-size: 14px; color: #334155; line-height: 1.6; }
    .footer { padding: 24px 32px; background: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; }
    .footer p { color: #94a3b8; font-size: 12px; margin: 0 0 6px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>SwagSync Marketplace</h1>
      <p>Vendor Application Status</p>
    </div>
    <div class="body">
      <div class="greeting">Hello ${fullName},</div>
      <p>Thank you for your interest in selling on SwagSync and for submitting your vendor application for <strong>${storeName}</strong>.</p>
      
      <div class="badge-card">
        <span class="badge-status">Application Not Approved</span>
        <h3>Update on Your Registration</h3>
        <p>After careful review of your application and documentation, we regret to inform you that we are unable to approve your vendor account at this time.</p>
      </div>

      ${reason ? `
      <p><strong>Note from Administration:</strong></p>
      <div class="reason-box">${reason}</div>
      ` : ''}

      <p>If you believe this decision was made in error or if you have questions regarding your submission, you may reach out to our partner support team for assistance.</p>
    </div>
    <div class="footer">
      <p>Thank you for your time and understanding.</p>
      <p>&copy; ${new Date().getFullYear()} SwagSync Technologies. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
};
