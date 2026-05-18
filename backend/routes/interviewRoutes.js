const express = require('express');
const router = express.Router();
const {
  startInterview,
  evaluateAnswer,
  finalizeInterview,
  getHistory,
  getInterview
} = require('../controllers/interviewController');
const { protect } = require('../middleware/authMiddleware');

router.post('/start', protect, startInterview);
router.post('/evaluate', protect, evaluateAnswer);
router.post('/finalize', protect, finalizeInterview);
router.get('/history', protect, getHistory);
router.get('/:id', protect, getInterview);

module.exports = router;
