const express = require('express');
const { searchResources, getTopics } = require('../controllers/resourceController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Search for resources by topic
router.post('/search', protect, searchResources);

// Get all available topics
router.get('/topics', protect, getTopics);

module.exports = router;
