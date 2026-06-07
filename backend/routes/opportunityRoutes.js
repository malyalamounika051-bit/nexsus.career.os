const express = require('express');
const { seedOpportunities, listOpportunities, toggleBookmark, applyOpportunity, dismissOpportunity } = require('../controllers/opportunityController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/seed', seedOpportunities);
router.get('/', protect, listOpportunities);
router.post('/:id/bookmark', protect, toggleBookmark);
router.post('/:id/apply', protect, applyOpportunity);
router.post('/:id/dismiss', protect, dismissOpportunity);

module.exports = router;
