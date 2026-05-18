const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

// ─── Google OAuth Strategy ────────────────────────────────────────────────────
// Only register if credentials are provided (not placeholders)
const googleConfigured =
  process.env.GOOGLE_CLIENT_ID &&
  process.env.GOOGLE_CLIENT_ID !== 'your_google_client_id_here';

if (googleConfigured) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user already exists with this Google ID or email
          let user = await User.findOne({
            $or: [
              { googleId: profile.id },
              { email: profile.emails?.[0]?.value },
            ],
          });

          if (user) {
            // Update Google ID if missing
            if (!user.googleId) {
              user.googleId = profile.id;
              user.avatar = profile.photos?.[0]?.value || '';
              await user.save();
            }
            return done(null, user);
          }

          // Create new user from Google profile
          user = await User.create({
            name: profile.displayName,
            email: profile.emails?.[0]?.value,
            googleId: profile.id,
            avatar: profile.photos?.[0]?.value || '',
            password: Math.random().toString(36).slice(-12) + 'Aa1!', // Random password for OAuth users
          });

          done(null, user);
        } catch (err) {
          done(err, null);
        }
      }
    )
  );
}

module.exports = { passport, googleConfigured };
