const express = require('express');
const multer = require('multer');
const { analyzePortfolio } = require('../controllers/critiqueController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || 
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and Docx files are allowed'), false);
    }
  }
});

router.post('/', protect, upload.single('file'), analyzePortfolio);

module.exports = router;
