const Resume = require('../models/Resume');
const { callGeminiDirectly } = require('../utils/geminiClient');

// @desc    Get all resumes for logged in user
exports.getResumes = async (req, res) => {
  try {
    const resumes = await Resume.find({ user: req.user._id }).sort({ updatedAt: -1 });
    res.json({ success: true, count: resumes.length, data: resumes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get single resume
exports.getResume = async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });
    res.json({ success: true, data: resume });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get public resume by token
exports.getPublicResume = async (req, res) => {
  try {
    const resume = await Resume.findOne({ shareableToken: req.params.token, isPublic: true });
    if (!resume) return res.status(404).json({ success: false, message: 'Public resume not found or access denied' });
    res.json({ success: true, data: resume });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Create new resume
exports.createResume = async (req, res) => {
  try {
    req.body.user = req.user._id;
    const resume = await Resume.create(req.body);
    res.status(201).json({ success: true, data: resume });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Update resume
exports.updateResume = async (req, res) => {
  try {
    let resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });

    resume = await Resume.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, data: resume });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Delete resume
exports.deleteResume = async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });
    await resume.deleteOne();
    res.json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── AI FEATURES ─────────────────────────────────────────────────────────────

// @desc    AI-powered resume optimization and scoring
exports.optimizeResume = async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });

    const prompt = `Analyze this resume data and provide a JSON response with:
    1. score (0-100) based on completeness and professional impact.
    2. atsScore (0-100) based on formatting and keyword density for ATS.
    3. tips (array of strings) for improvement.
    4. keywords (array of strings) that should be added based on the job title.

    Resume Data:
    Title: ${resume.personalInfo.title}
    Summary: ${resume.personalInfo.summary}
    Experience: ${JSON.stringify(resume.experiences)}
    Skills: ${resume.skills.join(', ')}

    Response format: JSON only. Example: {"score": 85, "atsScore": 70, "tips": ["Add more metrics", "Use action verbs"], "keywords": ["React", "Agile"]}
    `;

    const aiResponse = await callGeminiDirectly({ prompt });
    
    // Robust JSON parsing
    let analysis;
    try {
      const responseText = aiResponse.text || '';
      const cleanJson = responseText.replace(/```json|```/g, '').trim();
      analysis = JSON.parse(cleanJson);
    } catch (parseErr) {
      console.error('Resume Analysis Parse Error:', parseErr.message, 'Raw text:', aiResponse.text);
      return res.status(500).json({ success: false, message: 'AI failed to generate a valid analysis. Please try again.' });
    }

    resume.analysis = analysis;
    await resume.save();

    res.json({ success: true, data: analysis });
  } catch (err) {
    res.status(500).json({ success: false, message: 'AI Optimization failed: ' + err.message });
  }
};

// @desc    AI-generated professional summary
exports.generateSummary = async (req, res) => {
  try {
    const { title, skills, experiences } = req.body;
    const prompt = `Generate a compelling 3-sentence professional summary for a ${title}. 
    Skills: ${skills?.join(', ')}. 
    Recent Experience: ${experiences?.[0]?.title} at ${experiences?.[0]?.company}.
    Format: Plain text only. No intro/outro.`;

    const aiResponse = await callGeminiDirectly({ prompt });
    res.json({ success: true, data: aiResponse.text.trim() });
  } catch (err) {
    res.status(500).json({ success: false, message: 'AI generation failed' });
  }
};

// @desc    AI-improved achievement bullet points
exports.improveAchievement = async (req, res) => {
  try {
    const { achievement } = req.body;
    const prompt = `Improve this resume achievement to be more impactful using the STAR method (Situation, Task, Action, Result). 
    Original: "${achievement}"
    Format: A single high-impact bullet point starting with a strong action verb.`;

    const aiResponse = await callGeminiDirectly({ prompt });
    res.json({ success: true, data: aiResponse.text.trim() });
  } catch (err) {
    res.status(500).json({ success: false, message: 'AI improvement failed' });
  }
};
