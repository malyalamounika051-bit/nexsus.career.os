const express = require('express');
const { generateRoute, getCurrentGPS, updateTaskProgress, submitProject, getTemplateBySlug, listGPS, deleteGPS } = require('../controllers/gpsController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/generate', protect, generateRoute);
router.get('/current', protect, getCurrentGPS);
router.get('/list', protect, listGPS);
router.patch('/task', protect, updateTaskProgress);
router.post('/project', protect, submitProject);
router.delete('/:id', protect, deleteGPS);
router.get('/template/:careerSlug', getTemplateBySlug);

module.exports = router;
