export const vendorApprovalEmailTemplate = (vendor, loginUrl) => {
  const storeName = vendor.vendorProfile?.storeName || vendor.username || "Vendor";
  const fullName = vendor.vendorProfile?.fullName || vendor.username || "Vendor Partner";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; color: #1e293b; }
    .container { max-width: 560px; margin: 36px auto; background: #ffffff; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.06); overflow: hidden; border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #4648d4 0%, #312e81 100%); padding: 36px 32px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.02em; }
    .header p { color: #c7d2fe; margin: 8px 0 0 0; font-size: 14px; }
    .body { padding: 36px 32px; text-align: left; }
    .greeting { font-size: 18px; font-weight: 600; color: #0f172a; margin-bottom: 16px; }
    .body p { color: #475569; font-size: 15px; line-height: 1.65; margin: 0 0 18px 0; }
    .badge-card { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center; }
    .badge-status { display: inline-block; background: #16a34a; color: #ffffff; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 4px 12px; border-radius: 9999px; margin-bottom: 8px; }
    .badge-card h3 { margin: 0 0 4px 0; color: #166534; font-size: 16px; font-weight: 600; }
    .badge-card p { margin: 0; color: #15803d; font-size: 13px; }
    .btn-container { text-align: center; margin: 32px 0 24px 0; }
    .btn { display: inline-block; background: #4648d4; color: #ffffff !important; text-decoration: none; padding: 14px 36px; border-radius: 10px; font-size: 15px; font-weight: 600; box-shadow: 0 4px 14px rgba(70,72,212,0.35); transition: background 0.2s; }
    .btn:hover { background: #3730a3; }
    .link-box { background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 12px 16px; word-break: break-all; font-family: monospace; font-size: 12px; color: #475569; text-align: center; margin-top: 12px; }
    .security-note { border-left: 3px solid #f59e0b; background: #fffbeb; padding: 12px 16px; border-radius: 0 8px 8px 0; font-size: 13px; color: #92400e; margin: 24px 0 0 0; }
    .footer { padding: 24px 32px; background: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; }
    .footer p { color: #94a3b8; font-size: 12px; margin: 0 0 6px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>SwagSync Marketplace</h1>
      <p>Vendor Partner Program</p>
    </div>
    <div class="body">
      <div class="greeting">Hello ${fullName},</div>
      <p>Great news! Your vendor application for <strong>${storeName}</strong> has been officially approved by the SwagSync Administration team.</p>
      
      <div class="badge-card">
        <span class="badge-status">Approved</span>
        <h3>Your Vendor Account is Active</h3>
        <p>You can now sign in to your vendor account using your registered email.</p>
      </div>

      <p>You now have access to the SwagSync Vendor portal. Click the button below to log in:</p>

      <div class="btn-container">
        <a href="${loginUrl}" class="btn" target="_blank">Log In to Vendor Account</a>
      </div>

      <p style="font-size: 13px; text-align: center; color: #64748b; margin-bottom: 4px;">Or copy and paste this link into your browser:</p>
      <div class="link-box">${loginUrl}</div>

      <div class="security-note">
        <strong>Security Notice:</strong> SwagSync will never ask for your password via email. Please keep your login credentials confidential.
      </div>
    </div>
    <div class="footer">
      <p>Thank you for partnering with SwagSync.</p>
      <p>&copy; ${new Date().getFullYear()} SwagSync Technologies. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
};
