const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer');
const upload = multer({ 
  storage: multer.memoryStorage(), 
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and DOCX files are allowed'), false);
    }
  }
});

const {
  getProfile, saveProfile, getCompletion, getSkills, getProjects,
  aiEnhanceProject, uploadResume, mergeResume, analyzeProfile,
  refreshAI, deleteProject, deleteCertificate, deleteExperience,
  deleteAchievement, deleteEducation
} = require('../controllers/profileController');

// All routes require authentication
router.use(protect);

// Profile CRUD
router.get('/', getProfile);
router.post('/save', saveProfile);
router.get('/completion', getCompletion);
router.get('/skills', getSkills);
router.get('/projects', getProjects);

// AI-powered endpoints
router.post('/ai-enhance-project', aiEnhanceProject);
router.post('/upload-resume', upload.single('resume'), uploadResume);
router.post('/merge-resume', mergeResume);
router.post('/analyze', analyzeProfile);
router.post('/refresh-ai', refreshAI);

// Delete sub-document endpoints
router.delete('/project/:id', deleteProject);
router.delete('/certificate/:id', deleteCertificate);
router.delete('/experience/:id', deleteExperience);
router.delete('/achievement/:id', deleteAchievement);
router.delete('/education/:id', deleteEducation);

module.exports = router;
