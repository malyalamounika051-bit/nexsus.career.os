const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { generateSkillGraph, getSalaryIntelligence, getLearnNextRecommendations, getTrendingSkills } = require('../controllers/skillIntelligenceController');

router.post('/graph', protect, generateSkillGraph);
router.get('/salary/:skill', protect, getSalaryIntelligence);
router.post('/learn-next', protect, getLearnNextRecommendations);
router.get('/trending', protect, getTrendingSkills);

module.exports = router;
