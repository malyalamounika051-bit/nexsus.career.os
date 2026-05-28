// Force Nodemon Reload: Fix for OpenSSL TLS alert 80 on Windows with MongoDB Atlas
// Triggering backend Vercel deployment after connecting repository
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const passport = require('passport');
const connectDB = require('./config/db');
require('./config/passport'); // Initialize OAuth strategies

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
const corsOrigin =
  process.env.NODE_ENV === 'production'
    ? (process.env.FRONTEND_URL || 'http://localhost:5173')
    : (origin, callback) => {
        if (!origin) return callback(null, true);
        if (/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) return callback(null, true);
        if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) return callback(null, true);
        return callback(new Error('Not allowed by CORS'));
      };
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

// Global request logger
app.use((req, res, next) => {
  console.log(`📨 [${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/assessments', require('./routes/assessmentRoutes'));
app.use('/api/careers', require('./routes/careerRoutes'));
app.use('/api/advice', require('./routes/adviceRoutes'));
app.use('/api/mentor', require('./routes/mentorRoutes'));
app.use('/api/critique', require('./routes/critiqueRoutes'));
app.use('/api/skill-gap', require('./routes/skillGapRoutes'));
app.use('/api/simulator', require('./routes/simulatorRoutes'));
app.use('/api/resources', require('./routes/resourceRoutes'));
app.use('/api/jobs', require('./routes/jobRoutes'));
app.use('/api/resumes', require('./routes/resumeRoutes'));
app.use('/api/interview', require('./routes/interviewRoutes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Nexus Career OS API is running 🚀', timestamp: new Date().toISOString() });
});

// 404 handler
app.use('/{*path}', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({ success: false, message: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
});
