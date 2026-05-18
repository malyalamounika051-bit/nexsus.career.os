const express = require('express');
const router = express.Router();
const { submitAssessment, getUserAssessments, getAssessmentById } = require('../controllers/assessmentController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, submitAssessment);
router.get('/', protect, getUserAssessments);
router.get('/:id', protect, getAssessmentById);

module.exports = router;
