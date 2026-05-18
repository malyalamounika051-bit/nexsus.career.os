const { transporter } = require('../config/mail');

/**
 * Send a "Login Successful" security notification email.
 * Called asynchronously after OTP verification or demo login
 * so it never blocks the response to the user.
 */
const sendLoginMail = async (user, req) => {
  console.log('📧 sendLoginMail() called for user:', user.email);
  
  const loginDate = new Date().toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  const userAgent = req.headers['user-agent'] || 'Unknown Device';
  const ipAddress =
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    'Unknown';

  // If no SMTP configured, mock-log to console
  if (!transporter) {
    console.log('──────────────────────────────────────────────────');
    console.log(`📧 [MOCK EMAIL] Login Notification`);
    console.log(`   To:      ${user.email}`);
    console.log(`   Subject: Login Successful – Your Account Was Accessed`);
    console.log(`   Date:    ${loginDate}`);
    console.log(`   IP:      ${ipAddress}`);
    console.log(`   Device:  ${userAgent.substring(0, 80)}`);
    console.log('──────────────────────────────────────────────────');
    return;
  }

  const htmlMessage = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </head>
    <body style="margin: 0; padding: 0; background-color: #0f0f14; font-family: 'Inter', 'Segoe UI', Helvetica, Arial, sans-serif;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f0f14; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(180deg, #1a1a24 0%, #13131b 100%); border: 1px solid #2a2a3d; border-radius: 16px; overflow: hidden;">
              
              <!-- Header -->
              <tr>
                <td style="padding: 32px 40px 20px; text-align: center; border-bottom: 1px solid #2a2a3d;">
                  <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">
                    <span style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Nexus Career OS</span>
                  </h1>
                </td>
              </tr>

              <!-- Success Badge -->
              <tr>
                <td style="padding: 32px 40px 0; text-align: center;">
                  <div style="display: inline-block; background: linear-gradient(135deg, #10b98120, #10b98108); border: 1px solid #10b98140; border-radius: 50%; width: 72px; height: 72px; line-height: 72px; font-size: 36px;">
                    ✓
                  </div>
                </td>
              </tr>

              <!-- Title -->
              <tr>
                <td style="padding: 20px 40px 8px; text-align: center;">
                  <h2 style="margin: 0; font-size: 22px; font-weight: 700; color: #f0f0f5;">Login Successful</h2>
                </td>
              </tr>

              <!-- Greeting -->
              <tr>
                <td style="padding: 0 40px 24px; text-align: center;">
                  <p style="margin: 0; font-size: 15px; line-height: 1.7; color: #9ca3af;">
                    Hello <strong style="color: #e5e7eb;">${user.name}</strong>, we detected a successful sign-in to your account. If this was you, no action is needed.
                  </p>
                </td>
              </tr>

              <!-- Login Details Card -->
              <tr>
                <td style="padding: 0 40px 28px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #1e1e2e; border: 1px solid #2a2a3d; border-radius: 12px;">
                    <tr>
                      <td style="padding: 20px 24px 12px;">
                        <p style="margin: 0; font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 1.5px;">Login Details</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 0 24px 12px;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="padding: 8px 0; border-top: 1px solid #2a2a3d;">
                              <span style="font-size: 12px; color: #6b7280; font-weight: 600;">📅 Date & Time</span><br />
                              <span style="font-size: 14px; color: #e5e7eb;">${loginDate}</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; border-top: 1px solid #2a2a3d;">
                              <span style="font-size: 12px; color: #6b7280; font-weight: 600;">🌐 IP Address</span><br />
                              <span style="font-size: 14px; color: #e5e7eb;">${ipAddress}</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0 16px; border-top: 1px solid #2a2a3d;">
                              <span style="font-size: 12px; color: #6b7280; font-weight: 600;">💻 Device / Browser</span><br />
                              <span style="font-size: 13px; color: #e5e7eb; word-break: break-all;">${userAgent}</span>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Security Notice -->
              <tr>
                <td style="padding: 0 40px 28px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #ef444410; border: 1px solid #ef444430; border-radius: 12px;">
                    <tr>
                      <td style="padding: 16px 20px;">
                        <p style="margin: 0 0 6px; font-size: 14px; font-weight: 700; color: #fca5a5;">🛡️ Not you?</p>
                        <p style="margin: 0; font-size: 13px; color: #d1d5db; line-height: 1.6;">
                          If you didn't sign in, your account may be compromised. Please reset your password immediately and contact our support team.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 24px 40px 32px; text-align: center; border-top: 1px solid #2a2a3d;">
                  <p style="margin: 0 0 4px; font-size: 13px; color: #6b7280;">Stay secure,</p>
                  <p style="margin: 0 0 20px; font-size: 14px; font-weight: 700; color: #e5e7eb;">The Nexus Team</p>
                  <p style="margin: 0; font-size: 11px; color: #4b5563; line-height: 1.6;">
                    © ${new Date().getFullYear()} Nexus Career OS. Helping the world build great careers.<br />
                    This is an automated security notification.
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

  const message = {
    from: `${process.env.FROM_NAME || 'Nexus Career OS'} <${process.env.FROM_EMAIL || 'noreply@nexus.com'}>`,
    to: user.email,
    subject: '✅ Login Successful – Nexus Career OS',
    text: `Hello ${user.name}, a successful login to your Nexus Career OS account was detected on ${loginDate} from IP ${ipAddress}. If this wasn't you, please reset your password immediately.`,
    html: htmlMessage,
  };

  try {
    const info = await transporter.sendMail(message);
    console.log(`✅ Login notification sent to ${user.email} (ID: ${info.messageId})`);
  } catch (err) {
    console.error(`❌ Failed to send login notification to ${user.email}:`, err.message);
  }
};

module.exports = sendLoginMail;
