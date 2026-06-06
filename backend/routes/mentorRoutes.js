const express = require('express');
const { chatWithMentor, getChatHistory, clearChatHistory } = require('../controllers/mentorController');
const { getSuggestions } = require('../controllers/saraProactiveController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/chat', protect, chatWithMentor);
router.get('/suggestions', protect, getSuggestions);
router.get('/history', protect, getChatHistory);
router.delete('/history', protect, clearChatHistory);

module.exports = router;
