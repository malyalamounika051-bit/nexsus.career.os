const express = require('express');
const { chatWithMentor } = require('../controllers/mentorController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/chat', protect, chatWithMentor);

module.exports = router;
