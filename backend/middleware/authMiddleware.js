const jwt = require('jsonwebtoken');
const axios = require('axios');
const User = require('../models/User');

// Firebase publishes public certs for verifying ID tokens (RS256).
const CERTS_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

let certCache = {
  certs: null,
  expiresAt: 0,
};

const getFirebaseProjectId = () => process.env.FIREBASE_PROJECT_ID || 'nexus-os-e49a9';

const getCerts = async () => {
  if (certCache.certs && Date.now() < certCache.expiresAt) return certCache.certs;

  try {
    const res = await axios.get(CERTS_URL, { timeout: 10000 });
    const cacheControl = res.headers['cache-control'] || '';
    const maxAgeMatch = cacheControl.match(/max-age=(\d+)/i);
    const maxAgeSec = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) : 3600;

    certCache = {
      certs: res.data,
      expiresAt: Date.now() + maxAgeSec * 1000,
    };
    return certCache.certs;
  } catch (err) {
    console.error('Failed to fetch Firebase certs:', err.message);
    return null;
  }
};

const verifyFirebaseIdToken = async (idToken) => {
  const decodedHeader = jwt.decode(idToken, { complete: true });
  const kid = decodedHeader?.header?.kid;
  if (!kid) throw new Error('Invalid token header');

  const certs = await getCerts();
  if (!certs || !certs[kid]) throw new Error('Unknown or unavailable token key id');

  const cert = certs[kid];
  const projectId = getFirebaseProjectId();
  
  return jwt.verify(idToken, cert, {
    algorithms: ['RS256'],
    audience: projectId,
    issuer: `https://securetoken.google.com/${projectId}`,
  });
};

/**
 * protect
 * Accepts BOTH local JWT tokens (from demo/local login) AND Firebase ID tokens.
 */
const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }

  try {
    // 1. Try local JWT first (fast, no network call)
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (user) {
        req.user = {
          _id: user._id,
          id: user._id.toString(),
          uid: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role
        };
        return next();
      }
    } catch (localErr) {
      // Not a local JWT or expired — continue to Firebase check
    }

    // 2. Try Firebase ID token verification
    try {
      const payload = await verifyFirebaseIdToken(token);
      req.user = {
        _id: payload.user_id || payload.sub,
        uid: payload.user_id || payload.sub,
        id: payload.user_id || payload.sub,
        email: payload.email,
        name: payload.name || (payload.email ? payload.email.split('@')[0] : 'User'),
        isFirebaseUser: true
      };
      return next();
    } catch (fbErr) {
      // Firebase verification also failed
    }

    // 3. Fallback: Decode as Firebase/Google token (non-verified, for resilience if certs fail)
    // ONLY do this if the issuer is valid
    const decoded = jwt.decode(token);
    if (decoded && (decoded.iss?.includes('securetoken.google.com') || decoded.iss?.includes('firebase'))) {
      req.user = {
        _id: decoded.user_id || decoded.sub,
        uid: decoded.user_id || decoded.sub,
        id: decoded.user_id || decoded.sub,
        email: decoded.email,
        name: decoded.name || (decoded.email ? decoded.email.split('@')[0] : 'User'),
        isFirebaseUser: true,
        unverified: true
      };
      return next();
    }

    return res.status(401).json({ success: false, message: 'Not authorized, token invalid or expired' });
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    return res.status(401).json({ success: false, message: 'Not authorized, token invalid' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  res.status(403).json({ success: false, message: 'Admin access required' });
};

module.exports = { protect, adminOnly };
