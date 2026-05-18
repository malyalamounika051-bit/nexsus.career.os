const express = require('express');
const router = express.Router();
const { getAllAdvice, createAdvice, toggleLike, deleteAdvice } = require('../controllers/adviceController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', getAllAdvice);
router.post('/', protect, createAdvice);
router.put('/:id/like', protect, toggleLike);
router.delete('/:id', protect, deleteAdvice);

module.exports = router;
