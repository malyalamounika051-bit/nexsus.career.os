/**
 * Account Lockout Middleware
 *
 * Implements account-level brute-force protection:
 *   - 5 consecutive failed login attempts → 15-minute lockout
 *   - Progressive delay: each failure adds increasing wait time
 *   - After lockout triggers, sends an email alert to the account owner
 *   - Never reveals whether lockout vs wrong password is the reason
 *   - Uses in-memory Map for zero-dependency tracking
 *
 * Security rationale:
 *   - Credential stuffing attacks use leaked password lists — and they work
 *     against accounts with no lockout
 *   - Without lockout, your entire user database is brute-forceable
 *   - Verizon 2025 DBIR: stolen credentials were the #1 breach entry point
 */

const sendEmail = require('../utils/sendEmail');

// ── Configuration ──
const MAX_FAILED_ATTEMPTS = 5;            // Lock after 5 consecutive failures
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const PROGRESSIVE_DELAYS = [0, 1000, 2000, 4000, 8000]; // ms delay per attempt (0-indexed)

// ── In-memory store: Map<email, { failedAttempts, lockedUntil, lastFailedAt }> ──
const accountStore = new Map();

// Cleanup expired lockouts every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [email, record] of accountStore) {
    // Remove records that have been unlocked and idle for 30 mins
    if (now > (record.lockedUntil || 0) && now - (record.lastFailedAt || 0) > 30 * 60 * 1000) {
      accountStore.delete(email);
    }
  }
}, 10 * 60 * 1000);

/**
 * Get the current lockout status for an email
 */
const getAccountStatus = (email) => {
  const key = email.toLowerCase().trim();
  const record = accountStore.get(key);

  if (!record) {
    return { locked: false, failedAttempts: 0, remainingSeconds: 0 };
  }

  const now = Date.now();

  // Check if currently locked
  if (record.lockedUntil && now < record.lockedUntil) {
    const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return { locked: true, failedAttempts: record.failedAttempts, remainingSeconds };
  }

  // If lock has expired, reset the counter
  if (record.lockedUntil && now >= record.lockedUntil) {
    accountStore.delete(key);
    return { locked: false, failedAttempts: 0, remainingSeconds: 0 };
  }

  return { locked: false, failedAttempts: record.failedAttempts, remainingSeconds: 0 };
};

/**
 * Record a failed login attempt. Returns lockout status.
 */
const recordFailedAttempt = async (email, userName) => {
  const key = email.toLowerCase().trim();
  const now = Date.now();

  let record = accountStore.get(key);
  if (!record) {
    record = { failedAttempts: 0, lockedUntil: null, lastFailedAt: null };
  }

  // If was previously locked but lock expired, reset
  if (record.lockedUntil && now >= record.lockedUntil) {
    record = { failedAttempts: 0, lockedUntil: null, lastFailedAt: null };
  }

  record.failedAttempts += 1;
  record.lastFailedAt = now;

  // Check if we should lock
  if (record.failedAttempts >= MAX_FAILED_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_DURATION_MS;
    accountStore.set(key, record);

    console.warn(`🔒 Account locked: ${email} — ${record.failedAttempts} failed attempts. Locked until ${new Date(record.lockedUntil).toISOString()}`);

    // Send lockout alert email (fire-and-forget)
    sendLockoutEmail(email, userName).catch(err => {
      console.error('Failed to send lockout email:', err.message);
    });

    return {
      locked: true,
      failedAttempts: record.failedAttempts,
      remainingSeconds: Math.ceil(LOCKOUT_DURATION_MS / 1000),
    };
  }

  accountStore.set(key, record);

  // Calculate progressive delay
  const delayIndex = Math.min(record.failedAttempts - 1, PROGRESSIVE_DELAYS.length - 1);
  const delayMs = PROGRESSIVE_DELAYS[delayIndex];

  console.warn(`⚠️ Failed login attempt ${record.failedAttempts}/${MAX_FAILED_ATTEMPTS} for ${email}${delayMs ? ` (${delayMs}ms delay)` : ''}`);

  return {
    locked: false,
    failedAttempts: record.failedAttempts,
    remainingSeconds: 0,
    delayMs,
  };
};

/**
 * Record a successful login — resets the failed attempt counter.
 */
const recordSuccessfulLogin = (email) => {
  const key = email.toLowerCase().trim();
  accountStore.delete(key);
};

/**
 * Send a lockout notification email to the user.
 */
const sendLockoutEmail = async (email, name) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const resetLink = `${frontendUrl}/login`;
  const lockoutMinutes = Math.ceil(LOCKOUT_DURATION_MS / 60000);

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
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

              <!-- Alert Icon -->
              <tr>
                <td style="padding: 32px 40px 0; text-align: center;">
                  <div style="display: inline-block; background: linear-gradient(135deg, #ef444420, #dc262610); border: 1px solid #ef444440; border-radius: 50%; width: 72px; height: 72px; line-height: 72px; font-size: 36px;">
                    🔒
                  </div>
                </td>
              </tr>

              <!-- Title -->
              <tr>
                <td style="padding: 20px 40px 8px; text-align: center;">
                  <h2 style="margin: 0; font-size: 22px; font-weight: 700; color: #f0f0f5;">Security Alert: Account Temporarily Locked</h2>
                </td>
              </tr>

              <!-- Message -->
              <tr>
                <td style="padding: 0 40px 28px; text-align: center;">
                  <p style="margin: 0; font-size: 15px; line-height: 1.7; color: #9ca3af;">
                    Hi <strong style="color: #e5e7eb;">${name || 'there'}</strong>,<br />
                    We detected <strong style="color: #ef4444;">${MAX_FAILED_ATTEMPTS} consecutive failed login attempts</strong> on your Nexus Career OS account. 
                    To protect your account, it has been temporarily locked for <strong style="color: #fbbf24;">${lockoutMinutes} minutes</strong>.
                  </p>
                </td>
              </tr>

              <!-- Security Notice -->
              <tr>
                <td style="padding: 0 40px 28px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #ef444410; border: 1px solid #ef444430; border-radius: 12px;">
                    <tr>
                      <td style="padding: 16px 20px;">
                        <p style="margin: 0 0 8px; font-size: 14px; font-weight: 700; color: #fca5a5;">⚠️ What should I do?</p>
                        <p style="margin: 0; font-size: 13px; color: #d1d5db; line-height: 1.6;">
                          • If this was you: Wait ${lockoutMinutes} minutes, then try again<br />
                          • If this wasn't you: Your password may be compromised — please change it immediately after the lockout expires<br />
                          • Consider using a stronger, unique password
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- CTA Button -->
              <tr>
                <td style="padding: 0 40px 28px; text-align: center;">
                  <a href="${resetLink}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: #ffffff; font-weight: 700; font-size: 14px; text-decoration: none; border-radius: 10px;">
                    Go to Login Page
                  </a>
                </td>
              </tr>

              <!-- Details -->
              <tr>
                <td style="padding: 0 40px 28px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #1e1e2e; border: 1px solid #2a2a3d; border-radius: 12px;">
                    <tr>
                      <td style="padding: 16px 20px;">
                        <p style="margin: 0 0 6px; font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 1.5px;">Event Details</p>
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                          <tr><td style="padding: 6px 0; font-size: 13px; color: #9ca3af;">Time</td><td style="padding: 6px 0; font-size: 13px; color: #e5e7eb; text-align: right;">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td></tr>
                          <tr><td style="padding: 6px 0; font-size: 13px; color: #9ca3af; border-top: 1px solid #2a2a3d;">Failed Attempts</td><td style="padding: 6px 0; font-size: 13px; color: #ef4444; text-align: right; border-top: 1px solid #2a2a3d; font-weight: 700;">${MAX_FAILED_ATTEMPTS}</td></tr>
                          <tr><td style="padding: 6px 0; font-size: 13px; color: #9ca3af; border-top: 1px solid #2a2a3d;">Lockout Duration</td><td style="padding: 6px 0; font-size: 13px; color: #fbbf24; text-align: right; border-top: 1px solid #2a2a3d; font-weight: 700;">${lockoutMinutes} minutes</td></tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 24px 40px 32px; text-align: center; border-top: 1px solid #2a2a3d;">
                  <p style="margin: 0 0 4px; font-size: 13px; color: #6b7280;">Stay safe,</p>
                  <p style="margin: 0 0 20px; font-size: 14px; font-weight: 700; color: #e5e7eb;">The Nexus Security Team</p>
                  <p style="margin: 0; font-size: 11px; color: #4b5563; line-height: 1.6;">
                    © ${new Date().getFullYear()} Nexus Career OS. This is an automated security alert.
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

  await sendEmail({
    email,
    subject: '🔒 Security Alert: Your Nexus Account Has Been Temporarily Locked',
    message: `Security Alert: ${MAX_FAILED_ATTEMPTS} failed login attempts detected on your Nexus Career OS account. Your account has been locked for ${lockoutMinutes} minutes. If this wasn't you, please change your password immediately.`,
    html,
  });
};

/**
 * Express middleware that checks lockout BEFORE allowing login.
 * Must be placed before the login controller.
 */
const checkAccountLockout = (req, res, next) => {
  const { email } = req.body;
  if (!email) return next(); // Let the controller handle missing email

  const status = getAccountStatus(email);

  if (status.locked) {
    console.warn(`🔒 Blocked login attempt for locked account: ${email} (${status.remainingSeconds}s remaining)`);
    // NEVER reveal whether it's lockout vs wrong password
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials',
      // Include retry hint for the frontend to show a countdown
      retryAfter: status.remainingSeconds,
    });
  }

  // Calculate progressive delay
  if (status.failedAttempts > 0) {
    const delayIndex = Math.min(status.failedAttempts, PROGRESSIVE_DELAYS.length - 1);
    const delayMs = PROGRESSIVE_DELAYS[delayIndex];
    if (delayMs > 0) {
      // Apply progressive delay before proceeding
      return setTimeout(() => next(), delayMs);
    }
  }

  next();
};

module.exports = {
  getAccountStatus,
  recordFailedAttempt,
  recordSuccessfulLogin,
  checkAccountLockout,
  MAX_FAILED_ATTEMPTS,
  LOCKOUT_DURATION_MS,
};
