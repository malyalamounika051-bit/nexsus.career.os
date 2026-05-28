const express = require('express');
const router = express.Router();
const {
  getAllCareers,
  getCareerById,
  getMarketInsights,
  generateRoadmap,
  getGeneratedRoadmaps,
  deleteRoadmap,
  updateProgress,
} = require('../controllers/careerController');
const { getSkillCorrelation } = require('../controllers/skillCorrelationController');
const { protect } = require('../middleware/authMiddleware');

// Public
router.get('/', getAllCareers);
router.get('/market-insights', getMarketInsights);
router.get('/skill-correlation', protect, getSkillCorrelation);

// Protected — Roadmap CRUD
router.post('/generate-roadmap', protect, generateRoadmap);
router.get('/my-roadmaps', protect, getGeneratedRoadmaps);
router.delete('/roadmap/:id', protect, deleteRoadmap);
router.patch('/roadmap/:id/progress', protect, updateProgress);

// Public — must be last (catches :id)
router.get('/:id', getCareerById);

module.exports = router;
