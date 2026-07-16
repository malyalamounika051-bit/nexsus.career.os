const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/authMiddleware');
const {
  startInterview,
  evaluateAnswer,
  finalizeInterview,
  getHistory,
  getInterview,
  transcribeAudio
} = require('../controllers/interviewController');

// Multer upload config for file transcription
const upload = multer({
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB file size limit
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'audio/webm', 'audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/m4a', 'video/webm'
    ];
    const extension = file.originalname.split('.').pop().toLowerCase();
    const allowedExtensions = ['webm', 'wav', 'mp3', 'm4a'];

    if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(extension)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported audio format. Supported formats: webm, wav, mp3, m4a.'));
    }
  }
});

router.post('/start', protect, startInterview);
router.post('/evaluate', protect, evaluateAnswer);
router.post('/finalize', protect, finalizeInterview);
router.post('/transcribe', protect, upload.single('audio'), transcribeAudio);
router.get('/history', protect, getHistory);
router.get('/:id', protect, getInterview);

module.exports = router;
