const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getDailyQuote, getNewsPulse, getHiringPulse } = require('../controllers/dashboardController');

router.get('/quote', protect, getDailyQuote);
router.get('/news', protect, getNewsPulse);
router.get('/hiring', protect, getHiringPulse);

module.exports = router;
