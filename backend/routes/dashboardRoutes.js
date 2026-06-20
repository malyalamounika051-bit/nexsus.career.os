const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getDailyQuote, getNewsPulse, getHiringPulse, getSaraInsight } = require('../controllers/dashboardController');

router.get('/quote', protect, getDailyQuote);
router.get('/news', protect, getNewsPulse);
router.get('/hiring', protect, getHiringPulse);
router.get('/insight', protect, getSaraInsight);

module.exports = router;
