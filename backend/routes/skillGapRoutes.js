const express = require('express');
const router = express.Router();
const multer = require('multer');
const { analyzeSkillGap } = require('../controllers/skillGapController');
const { protect } = require('../middleware/authMiddleware');

// Configure multer for in-memory PDF uploads (max 5MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
});

router.post('/analyze', protect, upload.single('resume'), analyzeSkillGap);

module.exports = router;
