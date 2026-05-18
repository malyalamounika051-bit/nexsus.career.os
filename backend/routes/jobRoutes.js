const express = require('express');
const router = express.Router();
const { 
  searchJobs, 
  analyzeJobFit, 
  saveJob, 
  getSavedJobs, 
  removeSavedJob,
  matchJobsToResume
} = require('../controllers/jobController');
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer');

// Configure multer for PDF uploads (in memory)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Public or semi-protected route for searching jobs (we protect it so AI abuse is limited)
router.post('/search', protect, searchJobs);

// Analyze job fit for a specific user
router.post('/analyze-fit', protect, analyzeJobFit);

// Advanced AI Resume-to-Job Matching
router.post('/ai-match', protect, upload.single('resumeFile'), matchJobsToResume);

// Saved Jobs CRUD
router.get('/saved', protect, getSavedJobs);
router.post('/saved', protect, saveJob);
router.delete('/saved/:jobId', protect, removeSavedJob);

module.exports = router;
