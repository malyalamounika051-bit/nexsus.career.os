const UserProfile = require('../models/UserProfile');
const User = require('../models/User');
const { callGeminiDirectly } = require('../utils/geminiClient');

/**
 * Helper: Extract JSON from AI response text.
 * Handles responses wrapped in markdown code fences or plain JSON.
 */
const extractJSON = (text) => {
  // Try to find JSON in code fences first
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    return JSON.parse(fenceMatch[1].trim());
  }
  // Try to find a JSON object or array directly
  const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[1].trim());
  }
  throw new Error('No valid JSON found in AI response');
};

/**
 * Helper: Validate URL format (must start with http:// or https://)
 */
const isValidUrl = (url) => {
  if (!url || url.trim() === '') return true; // empty is ok
  return /^https?:\/\//i.test(url.trim());
};

// ─── 1. GET PROFILE ──────────────────────────────────────────────
// GET /api/profile
const getProfile = async (req, res) => {
  try {
    let profile = await UserProfile.findOne({ user: req.user._id });
    
    if (!profile) {
      // Fetch user info to seed the profile
      const user = await User.findById(req.user._id);
      profile = await UserProfile.create({
        user: req.user._id,
        fullName: user ? user.name : '',
        email: user ? user.email : ''
      });
    }
    
    profile.calculateCompletion();
    await profile.save();
    
    res.json({ success: true, data: profile });
  } catch (error) {
    console.error('getProfile error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─── 2. SAVE PROFILE ─────────────────────────────────────────────
// POST /api/profile/save
const saveProfile = async (req, res) => {
  try {
    const data = { ...req.body };
    
    // Validate URLs if provided
    const urlFields = ['linkedIn', 'github', 'portfolio'];
    for (const field of urlFields) {
      if (data[field] && !isValidUrl(data[field])) {
        return res.status(400).json({ 
          success: false, 
          error: `Invalid URL for ${field}. Must start with http:// or https://` 
        });
      }
    }
    
    // Remove fields that shouldn't be overwritten directly
    delete data._id;
    delete data.user;
    delete data.__v;
    
    const updatedProfile = await UserProfile.findOneAndUpdate(
      { user: req.user._id },
      { $set: data },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    
    // Recalculate completion
    updatedProfile.calculateCompletion();
    
    // Add activity
    updatedProfile.activities.push({
      type: 'Profile Updated',
      title: 'Profile information updated'
    });
    
    // Keep only the last 50 activities
    if (updatedProfile.activities.length > 50) {
      updatedProfile.activities = updatedProfile.activities.slice(-50);
    }
    
    await updatedProfile.save();
    
    res.json({ success: true, data: updatedProfile });
  } catch (error) {
    console.error('saveProfile error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─── 3. GET COMPLETION ───────────────────────────────────────────
// GET /api/profile/completion
const getCompletion = async (req, res) => {
  try {
    let profile = await UserProfile.findOne({ user: req.user._id });
    if (!profile) {
      return res.json({ 
        success: true, 
        data: { percentage: 0, completedSections: [], missingSections: ['All sections'], lastUpdated: new Date() } 
      });
    }
    
    profile.calculateCompletion();
    await profile.save();
    
    res.json({ success: true, data: profile.profileCompletion });
  } catch (error) {
    console.error('getCompletion error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─── 4. GET SKILLS ───────────────────────────────────────────────
// GET /api/profile/skills
const getSkills = async (req, res) => {
  try {
    const profile = await UserProfile.findOne({ user: req.user._id });
    res.json({ success: true, data: profile ? profile.skills : [] });
  } catch (error) {
    console.error('getSkills error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─── 5. GET PROJECTS ────────────────────────────────────────────
// GET /api/profile/projects
const getProjects = async (req, res) => {
  try {
    const profile = await UserProfile.findOne({ user: req.user._id });
    res.json({ success: true, data: profile ? profile.projects : [] });
  } catch (error) {
    console.error('getProjects error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─── 6. AI ENHANCE PROJECT ──────────────────────────────────────
// POST /api/profile/ai-enhance-project
const aiEnhanceProject = async (req, res) => {
  try {
    const { title, shortDescription, technologies, githubRepo } = req.body;
    
    if (!title) {
      return res.status(400).json({ success: false, error: 'Project title is required' });
    }
    
    const prompt = `You are an expert career coach and technical interviewer. Analyze this project and generate comprehensive career-ready content.

PROJECT DETAILS:
- Title: ${title}
- Description: ${shortDescription || 'Not provided'}
- Technologies: ${(technologies || []).join(', ') || 'Not specified'}
- GitHub Repo: ${githubRepo || 'Not provided'}

Generate the following in JSON format:
{
  "resumeBullets": ["3-5 ATS-optimized bullet points using action verbs, quantified where possible"],
  "starAnswers": ["2-3 STAR format behavioral interview answers (Situation, Task, Action, Result) for this project"],
  "hrQuestions": ["5 HR interview questions specific to this project that a recruiter might ask"],
  "technicalQuestions": ["5 deep technical interview questions about the implementation, architecture, and design decisions"],
  "skillsGained": ["comprehensive list of technical and soft skills demonstrated by this project"],
  "atsKeywords": ["relevant ATS keywords and phrases for this project type"],
  "projectSummary": "A concise, professional 2-3 sentence summary suitable for a resume or LinkedIn"
}

Return ONLY valid JSON. No extra text before or after the JSON.`;

    const aiResponse = await callGeminiDirectly({ prompt, temperature: 0.7 });
    const parsedResult = extractJSON(aiResponse);
    
    res.json({ success: true, data: parsedResult });
  } catch (error) {
    console.error('aiEnhanceProject error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─── 7. UPLOAD RESUME ───────────────────────────────────────────
// POST /api/profile/upload-resume
const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded. Please upload a PDF or DOCX file.' });
    }
    
    const fileBuffer = req.file.buffer;
    const fileName = req.file.originalname;
    const base64Content = fileBuffer.toString('base64');
    
    // Store the resume file info on the profile
    const profile = await UserProfile.findOne({ user: req.user._id });
    if (profile) {
      profile.resumeFileName = fileName;
      profile.resumeUploadedAt = new Date();
      profile.resumeUrl = `data:${req.file.mimetype};base64,${base64Content.substring(0, 100)}...`; // Store a reference marker
      profile.resumeText = fileBuffer.toString('utf-8').replace(/[^\x20-\x7E\n\r\t]/g, ' ').substring(0, 5000); // Best-effort text extraction
      await profile.save();
    }
    
    // Ask AI to parse the resume content
    const prompt = `You are an expert resume parser. Parse the following resume content and extract structured information.

RESUME FILE NAME: ${fileName}
RESUME CONTENT (best-effort text extraction, may contain artifacts from PDF encoding):
${fileBuffer.toString('utf-8').replace(/[^\x20-\x7E\n\r\t]/g, ' ').substring(0, 4000)}

Extract the following and return as JSON:
{
  "skills": [{"name": "skill name", "category": "one of: Programming Languages, Frameworks, Databases, Cloud, AI & ML, Cybersecurity, DevOps, Mobile, Soft Skills, Tools, Other", "proficiency": "Beginner/Intermediate/Advanced"}],
  "education": [{"degree": "degree name", "college": "college name", "branch": "branch/major", "startYear": 2020, "endYear": 2024, "cgpa": "8.5"}],
  "experience": [{"type": "Internship/Full-time/Part-time", "company": "company name", "role": "role title", "startDate": "Jan 2024", "endDate": "Jun 2024", "technologies": ["tech1"], "responsibilities": ["responsibility1"], "achievements": ["achievement1"]}],
  "projects": [{"title": "project name", "shortDescription": "brief description", "technologies": ["tech1"], "role": "Developer"}],
  "certifications": [{"name": "cert name", "organization": "issuing org", "issueDate": "2024"}],
  "achievements": [{"type": "Hackathon/Coding Contest/Award/Other", "title": "achievement title", "description": "brief description"}]
}

Return ONLY valid JSON. Extract as much as you can from the content. If a field cannot be determined, use reasonable defaults or omit it.`;

    const aiResponse = await callGeminiDirectly({ prompt, temperature: 0.3 });
    const parsedData = extractJSON(aiResponse);
    
    res.json({ 
      success: true, 
      data: { 
        parsedData, 
        fileName,
        message: 'Resume parsed successfully. Review and choose: merge, replace, or ignore.' 
      } 
    });
  } catch (error) {
    console.error('uploadResume error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─── 8. MERGE RESUME ────────────────────────────────────────────
// POST /api/profile/merge-resume
const mergeResume = async (req, res) => {
  try {
    const { action, parsedData } = req.body;
    
    if (!action || !['merge', 'replace', 'ignore'].includes(action)) {
      return res.status(400).json({ success: false, error: 'Action must be one of: merge, replace, ignore' });
    }
    
    if (action === 'ignore') {
      const profile = await UserProfile.findOne({ user: req.user._id });
      return res.json({ success: true, data: profile, message: 'Resume data ignored.' });
    }
    
    if (!parsedData) {
      return res.status(400).json({ success: false, error: 'parsedData is required for merge/replace actions' });
    }
    
    let profile = await UserProfile.findOne({ user: req.user._id });
    if (!profile) {
      profile = await UserProfile.create({ user: req.user._id });
    }
    
    const arrayFields = ['skills', 'education', 'experience', 'projects', 'certifications', 'achievements'];
    
    if (action === 'replace') {
      // Overwrite arrays with parsed data
      for (const field of arrayFields) {
        if (parsedData[field] && Array.isArray(parsedData[field])) {
          profile[field] = parsedData[field];
        }
      }
    } else if (action === 'merge') {
      // Append parsed items, deduplicate skills by name
      for (const field of arrayFields) {
        if (parsedData[field] && Array.isArray(parsedData[field])) {
          if (field === 'skills') {
            const existingNames = new Set(profile.skills.map(s => s.name.toLowerCase()));
            for (const newSkill of parsedData[field]) {
              if (newSkill.name && !existingNames.has(newSkill.name.toLowerCase())) {
                profile.skills.push(newSkill);
                existingNames.add(newSkill.name.toLowerCase());
              }
            }
          } else {
            profile[field].push(...parsedData[field]);
          }
        }
      }
    }
    
    // Add activity
    profile.activities.push({
      type: 'Updated Resume',
      title: `Resume data ${action === 'merge' ? 'merged' : 'replaced'} from upload`
    });
    
    profile.calculateCompletion();
    await profile.save();
    
    res.json({ success: true, data: profile, message: `Resume data ${action}d successfully.` });
  } catch (error) {
    console.error('mergeResume error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─── 9. ANALYZE PROFILE ─────────────────────────────────────────
// POST /api/profile/analyze
const analyzeProfile = async (req, res) => {
  try {
    const profile = await UserProfile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(404).json({ success: false, error: 'Profile not found. Please create your profile first.' });
    }
    
    // Check cache: if analyzed within the last hour, return cached
    if (profile.aiAnalysis && profile.aiAnalysis.lastAnalyzed) {
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
      if (profile.aiAnalysis.lastAnalyzed > hourAgo && profile.aiAnalysis.atsScore > 0) {
        return res.json({ success: true, data: profile.aiAnalysis, cached: true });
      }
    }
    
    const analysisResult = await runProfileAnalysis(profile);
    
    profile.aiAnalysis = { ...analysisResult, lastAnalyzed: new Date() };
    await profile.save();
    
    res.json({ success: true, data: profile.aiAnalysis });
  } catch (error) {
    console.error('analyzeProfile error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─── 10. REFRESH AI ─────────────────────────────────────────────
// POST /api/profile/refresh-ai
const refreshAI = async (req, res) => {
  try {
    const profile = await UserProfile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(404).json({ success: false, error: 'Profile not found. Please create your profile first.' });
    }
    
    // Force refresh — ignore cache
    const analysisResult = await runProfileAnalysis(profile);
    
    profile.aiAnalysis = { ...analysisResult, lastAnalyzed: new Date() };
    await profile.save();
    
    res.json({ success: true, data: profile.aiAnalysis, refreshed: true });
  } catch (error) {
    console.error('refreshAI error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Shared helper: run AI profile analysis and return parsed result
 */
const runProfileAnalysis = async (profile) => {
  const prompt = `You are SARA (Smart AI Resume Analyst), an expert career analyst for the Indian tech job market. Analyze this candidate's complete profile and generate a comprehensive Career Health Dashboard.

CANDIDATE PROFILE:
- Name: ${profile.fullName || 'Not provided'}
- Headline: ${profile.headline || 'Not provided'}
- Location: ${profile.location || 'Not provided'}

EDUCATION:
${profile.education && profile.education.length > 0 
  ? profile.education.map(e => `  - ${e.degree}${e.branch ? ' in ' + e.branch : ''} from ${e.college}${e.cgpa ? ' (CGPA: ' + e.cgpa + ')' : ''}`).join('\n') 
  : '  No education listed'}

SKILLS (${profile.skills ? profile.skills.length : 0} total):
${profile.skills && profile.skills.length > 0 
  ? profile.skills.map(s => `  - ${s.name} (${s.category}, ${s.proficiency})`).join('\n') 
  : '  No skills listed'}

PROJECTS (${profile.projects ? profile.projects.length : 0} total):
${profile.projects && profile.projects.length > 0 
  ? profile.projects.map(p => `  - ${p.title}: ${p.shortDescription || 'No description'} [${(p.technologies || []).join(', ')}]`).join('\n') 
  : '  No projects listed'}

EXPERIENCE (${profile.experience ? profile.experience.length : 0} total):
${profile.experience && profile.experience.length > 0 
  ? profile.experience.map(e => `  - ${e.role} at ${e.company} (${e.type})`).join('\n') 
  : '  No experience listed'}

CERTIFICATIONS: ${profile.certifications && profile.certifications.length > 0 ? profile.certifications.map(c => c.name).join(', ') : 'None'}
ACHIEVEMENTS: ${profile.achievements && profile.achievements.length > 0 ? profile.achievements.map(a => a.title).join(', ') : 'None'}
RESUME UPLOADED: ${profile.resumeUrl ? 'Yes' : 'No'}
LINKEDIN: ${profile.linkedIn ? 'Connected' : 'Not connected'}
GITHUB: ${profile.github ? 'Connected' : 'Not connected'}
PORTFOLIO: ${profile.portfolio ? 'Connected' : 'Not connected'}
PREFERRED ROLES: ${profile.preferences && profile.preferences.preferredRoles ? profile.preferences.preferredRoles.join(', ') : 'Not specified'}
WORK MODE: ${profile.preferences ? profile.preferences.workMode : 'Any'}

Analyze this profile comprehensively and return a JSON Career Health Dashboard:
{
  "atsScore": <0-100, how well this profile would perform with ATS systems>,
  "jobReadinessScore": <0-100, overall job readiness>,
  "interviewReadiness": <0-100, how prepared for interviews>,
  "resumeQuality": <0-100, resume content quality>,
  "projectStrength": <0-100, quality and relevance of projects>,
  "skillMarketFit": <0-100, how well skills match market demand>,
  "hiringProbability": "<Low/Medium/High/Very High>",
  "strengths": ["3-5 specific strengths of this profile"],
  "weaknesses": ["3-5 specific areas for improvement"],
  "recommendedSkills": [{"skill": "skill name", "estimatedSalaryIncrease": "+X LPA", "confidence": <0-100>}],
  "recommendedProjects": ["2-3 specific project ideas to strengthen the profile"],
  "recommendedCertifications": ["2-3 relevant certifications"],
  "salaryEstimate": "<salary range in LPA for Indian market>",
  "saraSuggestions": [{"message": "personalized actionable advice", "impact": "+X LPA or descriptive impact", "confidence": <0-100>}]
}

Be realistic and specific. Base scores on actual profile content. Return ONLY valid JSON.`;

  const aiResponse = await callGeminiDirectly({ prompt, temperature: 0.6 });
  return extractJSON(aiResponse);
};

// ─── 11. DELETE PROJECT ──────────────────────────────────────────
// DELETE /api/profile/project/:id
const deleteProject = async (req, res) => {
  try {
    const profile = await UserProfile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(404).json({ success: false, error: 'Profile not found' });
    }
    
    profile.projects.pull({ _id: req.params.id });
    profile.calculateCompletion();
    await profile.save();
    
    res.json({ success: true, data: profile });
  } catch (error) {
    console.error('deleteProject error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─── 12. DELETE CERTIFICATE ──────────────────────────────────────
// DELETE /api/profile/certificate/:id
const deleteCertificate = async (req, res) => {
  try {
    const profile = await UserProfile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(404).json({ success: false, error: 'Profile not found' });
    }
    
    profile.certifications.pull({ _id: req.params.id });
    profile.calculateCompletion();
    await profile.save();
    
    res.json({ success: true, data: profile });
  } catch (error) {
    console.error('deleteCertificate error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─── 13. DELETE EXPERIENCE ───────────────────────────────────────
// DELETE /api/profile/experience/:id
const deleteExperience = async (req, res) => {
  try {
    const profile = await UserProfile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(404).json({ success: false, error: 'Profile not found' });
    }
    
    profile.experience.pull({ _id: req.params.id });
    profile.calculateCompletion();
    await profile.save();
    
    res.json({ success: true, data: profile });
  } catch (error) {
    console.error('deleteExperience error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─── 14. DELETE ACHIEVEMENT ──────────────────────────────────────
// DELETE /api/profile/achievement/:id
const deleteAchievement = async (req, res) => {
  try {
    const profile = await UserProfile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(404).json({ success: false, error: 'Profile not found' });
    }
    
    profile.achievements.pull({ _id: req.params.id });
    profile.calculateCompletion();
    await profile.save();
    
    res.json({ success: true, data: profile });
  } catch (error) {
    console.error('deleteAchievement error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─── 15. DELETE EDUCATION ────────────────────────────────────────
// DELETE /api/profile/education/:id
const deleteEducation = async (req, res) => {
  try {
    const profile = await UserProfile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(404).json({ success: false, error: 'Profile not found' });
    }
    
    profile.education.pull({ _id: req.params.id });
    profile.calculateCompletion();
    await profile.save();
    
    res.json({ success: true, data: profile });
  } catch (error) {
    console.error('deleteEducation error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getProfile,
  saveProfile,
  getCompletion,
  getSkills,
  getProjects,
  aiEnhanceProject,
  uploadResume,
  mergeResume,
  analyzeProfile,
  refreshAI,
  deleteProject,
  deleteCertificate,
  deleteExperience,
  deleteAchievement,
  deleteEducation
};
