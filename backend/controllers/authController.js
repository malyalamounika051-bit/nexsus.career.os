const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const sendLoginMail = require('../utils/sendLoginMail');
const { updateStreak } = require('../utils/gamification');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });
};

// @desc   Register a new user
// @route  POST /api/auth/register
// @access Public
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email already in use' });
    }

    const user = await User.create({ name, email, password });
    const token = generateToken(user._id);

    // Send Welcome Email
    const welcomeHtml = `
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

                <!-- Celebration Icon -->
                <tr>
                  <td style="padding: 32px 40px 0; text-align: center;">
                    <div style="display: inline-block; background: linear-gradient(135deg, #fbbf2420, #f59e0b10); border: 1px solid #fbbf2440; border-radius: 50%; width: 72px; height: 72px; line-height: 72px; font-size: 36px;">
                      🎉
                    </div>
                  </td>
                </tr>

                <!-- Title -->
                <tr>
                  <td style="padding: 20px 40px 8px; text-align: center;">
                    <h2 style="margin: 0; font-size: 22px; font-weight: 700; color: #f0f0f5;">Welcome to Nexus, ${name}!</h2>
                  </td>
                </tr>

                <!-- Message -->
                <tr>
                  <td style="padding: 0 40px 28px; text-align: center;">
                    <p style="margin: 0; font-size: 15px; line-height: 1.7; color: #9ca3af;">
                      We're thrilled to have you on board. Your career acceleration journey starts now!
                    </p>
                  </td>
                </tr>

                <!-- Getting Started -->
                <tr>
                  <td style="padding: 0 40px 28px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #1e1e2e; border: 1px solid #2a2a3d; border-radius: 12px;">
                      <tr>
                        <td style="padding: 20px 24px 12px;">
                          <p style="margin: 0; font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 1.5px;">🚀 Getting Started</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 0 24px 20px;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="padding: 10px 0; border-top: 1px solid #2a2a3d;">
                                <span style="font-size: 14px; color: #e5e7eb;">📊 Take a <strong>Career Assessment</strong> to find your top matches</span>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 10px 0; border-top: 1px solid #2a2a3d;">
                                <span style="font-size: 14px; color: #e5e7eb;">🤖 Chat with the <strong>AI Mentor</strong> for personalized advice</span>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 10px 0; border-top: 1px solid #2a2a3d;">
                                <span style="font-size: 14px; color: #e5e7eb;">📈 Browse <strong>Market Insights</strong> for salary data & trends</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 24px 40px 32px; text-align: center; border-top: 1px solid #2a2a3d;">
                    <p style="margin: 0 0 4px; font-size: 13px; color: #6b7280;">Cheers,</p>
                    <p style="margin: 0 0 20px; font-size: 14px; font-weight: 700; color: #e5e7eb;">The Nexus Team</p>
                    <p style="margin: 0; font-size: 11px; color: #4b5563; line-height: 1.6;">
                      © ${new Date().getFullYear()} Nexus Career OS. Helping the world build great careers.
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

    try {
      await sendEmail({
        email: user.email,
        subject: '🎉 Welcome to Nexus Career OS!',
        message: `Welcome to Nexus, ${name}! We're so glad you're here.`,
        html: welcomeHtml,
      });
    } catch (err) {
      console.error('Welcome email error:', err);
      // We don't fail the registration if the email fails
    }

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        assessmentCount: user.assessmentCount,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Register error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
};

// @desc   Login user
// @route  POST /api/auth/login
// @access Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('🔐 Login attempt for:', email);

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('❌ Password mismatch for:', email);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Bypass OTP for demo account
    const demoEmail = process.env.DEMO_EMAIL || 'demo@nexus.com';
    if (user.email === demoEmail) {
      console.log('✅ Demo login for:', email);
      const token = generateToken(user._id);
      return res.json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          assessmentCount: user.assessmentCount,
          bio: user.bio,
          createdAt: user.createdAt,
        },
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`📧 Generated OTP for ${email}: ${otp}`);
    
    // Set expiration to 10 minutes from now
    user.loginOtp = otp;
    user.loginOtpExpire = Date.now() + 10 * 60 * 1000;
    await user.save();

    // Send OTP email
    const messageText = `Your Nexus Career OS login verification code is: ${otp}\n\nThis code is valid for 10 minutes.`;
    
    const htmlMessage = `
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

                <!-- Lock Icon -->
                <tr>
                  <td style="padding: 32px 40px 0; text-align: center;">
                    <div style="display: inline-block; background: linear-gradient(135deg, #3b82f620, #8b5cf610); border: 1px solid #3b82f640; border-radius: 50%; width: 72px; height: 72px; line-height: 72px; font-size: 36px;">
                      🔐
                    </div>
                  </td>
                </tr>

                <!-- Title -->
                <tr>
                  <td style="padding: 20px 40px 8px; text-align: center;">
                    <h2 style="margin: 0; font-size: 22px; font-weight: 700; color: #f0f0f5;">Verification Code</h2>
                  </td>
                </tr>

                <!-- Greeting -->
                <tr>
                  <td style="padding: 0 40px 24px; text-align: center;">
                    <p style="margin: 0; font-size: 15px; line-height: 1.7; color: #9ca3af;">
                      Welcome back, <strong style="color: #e5e7eb;">${user.name}</strong>! Use the code below to complete your sign-in.
                    </p>
                  </td>
                </tr>

                <!-- OTP Code -->
                <tr>
                  <td style="padding: 0 40px 8px; text-align: center;">
                    <div style="background: #1e1e2e; border: 2px dashed #3b82f650; border-radius: 12px; padding: 24px;">
                      <span style="font-size: 40px; font-weight: 800; letter-spacing: 10px; color: #f0f0f5; font-family: 'Courier New', monospace;">${otp}</span>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 8px 40px 28px; text-align: center;">
                    <p style="margin: 0; font-size: 13px; color: #6b7280;">
                      ⏱️ This code expires in <strong style="color: #fbbf24;">10 minutes</strong>
                    </p>
                  </td>
                </tr>

                <!-- Security Notice -->
                <tr>
                  <td style="padding: 0 40px 28px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #3b82f610; border: 1px solid #3b82f630; border-radius: 12px;">
                      <tr>
                        <td style="padding: 16px 20px;">
                          <p style="margin: 0 0 6px; font-size: 14px; font-weight: 700; color: #93c5fd;">🔍 Didn't request this?</p>
                          <p style="margin: 0; font-size: 13px; color: #d1d5db; line-height: 1.6;">
                            If you didn't attempt to sign in, you can safely ignore this email. Someone may have typed your email by mistake.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 24px 40px 32px; text-align: center; border-top: 1px solid #2a2a3d;">
                    <p style="margin: 0 0 4px; font-size: 13px; color: #6b7280;">Cheers,</p>
                    <p style="margin: 0 0 20px; font-size: 14px; font-weight: 700; color: #e5e7eb;">The Nexus Team</p>
                    <p style="margin: 0; font-size: 11px; color: #4b5563; line-height: 1.6;">
                      © ${new Date().getFullYear()} Nexus Career OS. Helping the world build great careers.<br />
                      You received this because a sign-in was attempted with this email.
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
    
    try {
      console.log('🚀 Attempting to send OTP email to:', user.email);
      await sendEmail({
        email: user.email,
        subject: '🔐 Your Nexus Career OS Verification Code',
        message: messageText,
        html: htmlMessage,
      });
      console.log('✅ OTP email sent successfully to:', user.email);

      res.status(200).json({
        success: true,
        message: 'Verification code sent to email',
        requiresOtp: true,
        email: user.email // Send back email to use in next step
      });
    } catch (err) {
      console.error('❌ Email sending error:', err);
      user.loginOtp = undefined;
      user.loginOtpExpire = undefined;
      await user.save();
      return res.status(500).json({ success: false, message: 'Email could not be sent' });
    }

  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

// @desc   Verify OTP for login
// @route  POST /api/auth/verify-otp
// @access Public
const verifyLoginOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const user = await User.findOne({ email }).select('+loginOtp +loginOtpExpire');
    
    if (!user || !user.loginOtp) {
      return res.status(401).json({ success: false, message: 'Invalid request' });
    }

    // Check if OTP matches and is not expired
    if (user.loginOtp !== otp) {
      return res.status(401).json({ success: false, message: 'Invalid verification code' });
    }

    if (user.loginOtpExpire < Date.now()) {
      return res.status(401).json({ success: false, message: 'Verification code has expired. Please log in again.' });
    }

    // OTP is valid - clear it, set last login and login user
    user.loginOtp = undefined;
    user.loginOtpExpire = undefined;
    user.lastLogin = Date.now();
    await user.save();

    const token = generateToken(user._id);

    // Send login success email asynchronously (fire-and-forget with error logging)
    sendLoginMail(user, req).catch(err => {
      console.error('🚨 Unhandled error in sendLoginMail:', err);
    });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        assessmentCount: user.assessmentCount,
        bio: user.bio,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Verify OTP error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during OTP verification' });
  }
};

// @desc   Get current user profile
// @route  GET /api/auth/me
// @access Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.json({ success: true, user: req.user });
    }
    
    // Update streak (async)
    updateStreak(user._id).catch((err) => console.error('Streak update failed:', err.message));
    
    const updatedUser = await User.findById(user._id);
    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('getMe error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc   Update user profile
// @route  PUT /api/auth/profile
// @access Private
const updateProfile = async (req, res) => {
  try {
    const { name, bio } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, bio },
      { new: true, runValidators: true }
    );
    res.json({ success: true, user });
  } catch (error) {
    console.error('updateProfile error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc   Demo login — one-click login with pre-seeded demo account
// @route  POST /api/auth/demo
// @access Public
const demoLogin = async (req, res) => {
  try {
    const demoEmail = process.env.DEMO_EMAIL || 'demo@nexus.com';
    const demoPassword = process.env.DEMO_PASSWORD || 'demo1234';

    // Find or create demo user
    let user = await User.findOne({ email: demoEmail }).select('+password');
    if (!user) {
      user = await User.create({
        name: 'Demo User',
        email: demoEmail,
        password: demoPassword,
        bio: 'This is a demo account to explore Nexus Career OS.',
      });
      // Re-fetch without password
      user = await User.findOne({ email: demoEmail });
    }

    user.lastLogin = Date.now();
    await user.save();

    // Update streak (async, non-blocking)
    updateStreak(user._id).catch(() => {});

    const token = generateToken(user._id);

    // Send login success email asynchronously (fire-and-forget with error logging)
    sendLoginMail(user, req).catch(err => {
      console.error('🚨 Unhandled error in sendLoginMail:', err);
    });

    // Refetch to get updated gamification fields
    const updatedUser = await User.findById(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        assessmentCount: updatedUser.assessmentCount,
        bio: updatedUser.bio,
        createdAt: updatedUser.createdAt,
        xp: updatedUser.xp || 0,
        level: updatedUser.level || 1,
        streak: updatedUser.streak || 0,
        badges: updatedUser.badges || [],
      },
    });
  } catch (error) {
    console.error('Demo login error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to create demo session' });
  }
};

// @desc   OAuth success handler — called after Google/LinkedIn OAuth
// @route  GET /api/auth/oauth/success  (used internally by passport callbacks)
// @access Public
const oauthSuccess = (req, res) => {
  try {
    const user = req.user;
    const token = generateToken(user._id);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    // Redirect to frontend with token in query (frontend reads & stores it)
    res.redirect(`${frontendUrl}/oauth-callback?token=${token}&name=${encodeURIComponent(user.name)}&email=${encodeURIComponent(user.email)}&id=${user._id}&role=${user.role}`);
  } catch (err) {
    res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
  }
};

// @desc   Logout user / clear cookie if added in future
// @route  POST /api/auth/logout
// @access Private
const logout = async (req, res) => {
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

module.exports = { register, login, verifyLoginOtp, getMe, updateProfile, demoLogin, oauthSuccess, generateToken, logout };
