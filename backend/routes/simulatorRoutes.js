const express = require('express');
const router = express.Router();
const { simulateCareer } = require('../controllers/simulatorController');
const { protect } = require('../middleware/authMiddleware');

router.post('/simulate', protect, simulateCareer);

module.exports = router;
