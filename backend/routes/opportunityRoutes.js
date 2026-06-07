const express = require('express');
const {
  seedOpportunities,
  listOpportunities,
  refreshOpportunities,
  listByCategory,
  listClosingSoon,
  listSaved,
  listApplied,
  listHighMatch,
  toggleBookmark,
  applyOpportunity,
  dismissOpportunity,
  verifyOpportunityEndpoint
} = require('../controllers/opportunityController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/seed', seedOpportunities);
router.get('/', protect, listOpportunities);
router.get('/refresh', protect, refreshOpportunities);
router.get('/category/:type', protect, listByCategory);
router.get('/closing-soon', protect, listClosingSoon);
router.get('/high-match', protect, listHighMatch);
router.get('/saved', protect, listSaved);
router.get('/applied', protect, listApplied);

router.post('/:id/bookmark', protect, toggleBookmark);
router.post('/:id/apply', protect, applyOpportunity);
router.post('/:id/dismiss', protect, dismissOpportunity);
router.post('/:id/verify', protect, verifyOpportunityEndpoint);

module.exports = router;
