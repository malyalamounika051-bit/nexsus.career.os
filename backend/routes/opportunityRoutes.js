const express = require('express');
const {
  seedOpportunities,
  listOpportunities,
  listRecommended,
  listHighMatch,
  listClosingSoon,
  listRecent,
  listSaved,
  listApplied,
  toggleBookmark,
  applyOpportunity,
  dismissOpportunity
} = require('../controllers/opportunityController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/seed', seedOpportunities);
router.get('/', protect, listOpportunities);
router.get('/recommended', protect, listRecommended);
router.get('/high-match', protect, listHighMatch);
router.get('/closing-soon', protect, listClosingSoon);
router.get('/recent', protect, listRecent);
router.get('/saved', protect, listSaved);
router.get('/applied', protect, listApplied);

router.post('/:id/bookmark', protect, toggleBookmark);
router.post('/:id/apply', protect, applyOpportunity);
router.post('/:id/dismiss', protect, dismissOpportunity);

module.exports = router;
