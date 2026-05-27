const express = require('express');
const router = express.Router();
const { chatWithAdvisor, synthesizeAdvisorOnboarding } = require('../controllers/advisorController');
const { protect } = require('../middleware/authMiddleware');

router.post('/chat', protect, chatWithAdvisor);
router.post('/finalize', protect, synthesizeAdvisorOnboarding);

module.exports = router;
