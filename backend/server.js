try {
  // Force Vercel rebuild to pick up new MONGO_URI environment variable configurations.
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  require('dotenv').config();
  const express = require('express');
  const cors = require('cors');
  const passport = require('passport');
  const connectDB = require('./config/db');
  require('./config/passport'); // Initialize OAuth strategies

  // Connect to MongoDB
  if (!process.env.VERCEL) {
    connectDB().catch(err => {
      console.error('⚠️ Initial database connection warning:', err.message);
    });
  }

  const app = express();

  // Middleware
  const corsOrigin =
    process.env.NODE_ENV === 'production'
      ? (process.env.FRONTEND_URL || 'http://localhost:5173')
      : (origin, callback) => {
          if (!origin) return callback(null, true);
          if (/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) return callback(null, true);
          // Allow Vercel preview deployments in development mode
          if (/\.vercel\.app$/.test(origin)) return callback(null, true);
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

  // Ensure Database Connection Middleware
  const mongoose = require('mongoose');
  app.use(async (req, res, next) => {
    if (req.path === '/api/health' || req.path === '/' || req.path === '/api/dashboard/quote') {
      return next();
    }
    if (mongoose.connection.readyState !== 1) {
      console.log('🔄 MongoDB not connected. Attempting connection...');
      try {
        await connectDB();
      } catch (err) {
        console.error('❌ Database connection middleware error:', err);
        return res.status(500).json({ 
          success: false, 
          message: 'Database connection failed', 
          error: err.message 
        });
      }
    }
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
  app.use('/api/gps', require('./routes/gpsRoutes'));
  app.use('/api/opportunities', require('./routes/opportunityRoutes'));
  app.use('/api/skill-intelligence', require('./routes/skillIntelligenceRoutes'));
  app.use('/api/dashboard', require('./routes/dashboardRoutes'));
  app.use('/api/profile', require('./routes/profileRoutes'));

  // Root welcome endpoint
  app.get('/', (req, res) => {
    res.json({ 
      success: true, 
      message: 'Welcome to the Nexus Career OS API! 🚀 Please use the frontend application to interact with the system.', 
      frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
      healthCheck: '/api/health'
    });
  });

  // Health check
  app.get('/api/health', async (req, res) => {
    const uri = process.env.MONGO_URI;
    let connectionError = null;
    try {
      if (mongoose.connection.readyState !== 1) {
        await connectDB();
      }
    } catch (err) {
      connectionError = err.message;
    }

    res.json({ 
      success: true, 
      message: 'Nexus Career OS API is running 🚀', 
      timestamp: new Date().toISOString(),
      dbReadyState: mongoose.connection.readyState,
      hasMongoUri: !!process.env.MONGO_URI,
      mongoUriLength: process.env.MONGO_URI ? process.env.MONGO_URI.length : 0,
      connectionError: connectionError
    });
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
  });

  // Global error handler
  app.use((err, req, res, next) => {
    console.error('Unhandled error:', err.stack);
    res.status(500).json({ success: false, message: err.message || 'Internal server error' });
  });

  if (!process.env.VERCEL) {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
      
      // Start the Background Caching Scheduler for News, Opportunities, and Jobs
      try {
        const { startScheduler } = require('./services/backgroundScheduler');
        startScheduler();
      } catch (schedErr) {
        console.error('⚠️ Failed to initialize background scheduler:', schedErr.message);
      }
    });
  }

  module.exports = app;
} catch (bootErr) {
  console.error("FATAL BOOT ERROR:", bootErr);
  const express = require('express');
  const fallbackApp = express();
  fallbackApp.all('*', (req, res) => {
    res.status(500).json({
      success: false,
      message: 'Vercel Serverless Function Boot Failed',
      error: bootErr.message,
      stack: bootErr.stack
    });
  });
  module.exports = fallbackApp;
}
