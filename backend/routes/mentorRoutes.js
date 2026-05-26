const express = require('express');
const { chatWithMentor, getChatHistory, clearChatHistory } = require('../controllers/mentorController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/chat', protect, chatWithMentor);
router.get('/history', protect, getChatHistory);
router.delete('/history', protect, clearChatHistory);

module.exports = router;
