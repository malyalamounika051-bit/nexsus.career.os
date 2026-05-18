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
  getPublicResume
} = require('../controllers/resumeController');
const { protect } = require('../middleware/authMiddleware');

// Public route
router.get('/public/:token', getPublicResume);

// Protected routes
router.use(protect);

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

module.exports = router;
