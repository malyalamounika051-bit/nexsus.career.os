const express = require('express');
const router = express.Router();
const {
  getResumes,
  getResume,
  createResume,
  updateResume,
  deleteResume,
  optimizeResume,
  generateSummary,
  improveAchievement,
  getPublicResume,
  duplicateResume,
  rewriteContent,
  analyzeJobDescription,
  tailorResume,
  getATSAnalysis,
  syncNexusCareerData,
  generateProfileResume
} = require('../controllers/resumeController');
const { protect } = require('../middleware/authMiddleware');

// Public route
router.get('/public/:token', getPublicResume);

// Protected routes
router.use(protect);

router.get('/sync/nexus', syncNexusCareerData);

router.route('/')
  .get(getResumes)
  .post(createResume);

router.route('/:id')
  .get(getResume)
  .put(updateResume)
  .delete(deleteResume);

// AI Features
router.post('/:id/optimize', optimizeResume);
router.post('/ai/generate-summary', generateSummary);
router.post('/ai/improve-achievement', improveAchievement);

// Premium AI Features
router.post('/ai/rewrite', rewriteContent);
router.post('/ai/analyze-job', analyzeJobDescription);
router.post('/ai/tailor', tailorResume);
router.post('/:id/duplicate', duplicateResume);
router.post('/:id/ats-analyze', getATSAnalysis);

// Profile-driven AI generation
router.post('/ai/generate-from-profile', generateProfileResume);

module.exports = router;
