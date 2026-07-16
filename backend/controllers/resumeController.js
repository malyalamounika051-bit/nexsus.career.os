const Resume = require('../models/Resume');
const { callGeminiDirectly } = require('../utils/geminiClient');
const { parseStructuredJson } = require('../utils/jsonParser');

const updateUserCareerStateResume = async (userId, resume) => {
  try {
    const UserCareerState = require('../models/UserCareerState');
    const userUid = String(userId);
    await UserCareerState.findOneAndUpdate(
      { userId: userUid },
      {
        $set: {
          currentStage: 'resume-building',
          resumeState: {
            hasResume: true,
            resumeScore: resume?.analysis?.score || 0,
            atsScore: resume?.analysis?.atsScore || 0,
            lastUpdatedAt: new Date()
          }
        }
      },
      { upsert: true }
    );
  } catch (stateErr) {
    console.warn('Could not update UserCareerState on resume activity:', stateErr.message);
  }
};

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
    await updateUserCareerStateResume(req.user.id || req.user._id, resume);
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
    await updateUserCareerStateResume(req.user.id || req.user._id, resume);
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
      analysis = parseStructuredJson(aiResponse.text);
    } catch (parseErr) {
      console.error('Resume Analysis Parse Error:', parseErr.message, 'Raw text:', aiResponse.text);
      return res.status(500).json({ success: false, message: 'AI failed to generate a valid analysis. Please try again.' });
    }

    resume.analysis = analysis;
    await resume.save();
    await updateUserCareerStateResume(req.user.id || req.user._id, resume);

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

// ─── PREMIUM AI FEATURES ─────────────────────────────────────────────────────

// @desc    Duplicate an existing resume
exports.duplicateResume = async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });

    const resumeData = resume.toObject();
    delete resumeData._id;
    delete resumeData.createdAt;
    delete resumeData.updatedAt;
    delete resumeData.shareableToken;

    resumeData.resumeTitle = (resume.resumeTitle || 'My Resume') + ' (Copy)';
    resumeData.shareableToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    const newResume = await Resume.create(resumeData);
    res.status(201).json({ success: true, data: newResume });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    AI-powered content rewriting with multiple action modes
exports.rewriteContent = async (req, res) => {
  try {
    const { text, action, context } = req.body;

    const actionPrompts = {
      'improve': `Enhance the following resume text for greater impact and clarity. Make it compelling and results-oriented.\nContext: ${context || 'Resume content'}\nText: "${text}"\nFormat: Return only the improved text, no explanation.`,
      'shorten': `Make the following resume text more concise, reducing it by approximately 40% while preserving key achievements and impact.\nContext: ${context || 'Resume content'}\nText: "${text}"\nFormat: Return only the shortened text, no explanation.`,
      'expand': `Add more detail and depth to the following resume text, increasing it by approximately 50%. Include specific metrics, technologies, or outcomes where appropriate.\nContext: ${context || 'Resume content'}\nText: "${text}"\nFormat: Return only the expanded text, no explanation.`,
      'professional': `Rewrite the following resume text in a formal professional tone.\nContext: ${context || 'Resume content'}\nText: "${text}"\nFormat: Return only the rewritten text, no explanation.`,
      'ats-optimize': `Rewrite the following resume text with strong ATS-friendly keywords and powerful action verbs. Ensure it passes Applicant Tracking Systems while remaining human-readable.\nContext: ${context || 'Resume content'}\nText: "${text}"\nFormat: Return only the ATS-optimized text, no explanation.`,
      'star-method': `Rewrite the following resume text using the STAR method (Situation-Task-Action-Result). Structure it to clearly show the context, your responsibility, what you did, and the measurable outcome.\nContext: ${context || 'Resume content'}\nText: "${text}"\nFormat: Return only the STAR-method rewritten text, no explanation.`,
      'beginner': `Rewrite the following resume text to emphasize learning potential, foundational training, academic projects, and enthusiasm suitable for an entry-level or junior role.\nContext: ${context || 'Resume content'}\nText: "${text}"\nFormat: Return only the rewritten text, no explanation.`,
      'executive': `Rewrite the following resume text in a high-level executive tone emphasizing leadership, scale of operations, strategic planning, cross-functional impact, and business value.\nContext: ${context || 'Resume content'}\nText: "${text}"\nFormat: Return only the rewritten text, no explanation.`,
      'technical': `Rewrite the following resume text focusing on engineering accuracy, tools, architecture, protocols, and technical vocabulary.\nContext: ${context || 'Resume content'}\nText: "${text}"\nFormat: Return only the rewritten text, no explanation.`,
      'concise': `Rewrite the following resume text to be extremely punchy, short, and to the point.\nContext: ${context || 'Resume content'}\nText: "${text}"\nFormat: Return only the rewritten text, no explanation.`,
      'detailed': `Provide a descriptive version of the following resume text, explaining the 'how' and 'why' behind the actions taken.\nContext: ${context || 'Resume content'}\nText: "${text}"\nFormat: Return only the rewritten text, no explanation.`
    };

    const prompt = actionPrompts[action];
    if (!prompt) return res.status(400).json({ success: false, message: 'Invalid action. Use: improve, shorten, expand, professional, ats-optimize, star-method, beginner, executive, technical, concise, detailed' });

    const aiResponse = await callGeminiDirectly({ prompt });
    res.json({ success: true, data: aiResponse.text.trim() });
  } catch (err) {
    res.status(500).json({ success: false, message: 'AI rewrite failed: ' + err.message });
  }
};

// @desc    AI-powered job description analysis and gap detection
exports.analyzeJobDescription = async (req, res) => {
  try {
    const { jobDescription, resumeSkills, resumeExperiences, resumeTitle } = req.body;

    const prompt = `Compare this resume against the job description and return a JSON analysis.

Resume Title: ${resumeTitle || 'Not specified'}
Resume Skills: ${Array.isArray(resumeSkills) ? resumeSkills.join(', ') : resumeSkills || 'None'}
Resume Experiences: ${JSON.stringify(resumeExperiences || [])}

Job Description:
${jobDescription}

Return JSON only:
{"matchPercentage": 75, "matchedKeywords": ["React", "Node.js"], "missingKeywords": ["AWS", "Docker"], "strengthAreas": ["Strong frontend skills"], "improvementAreas": ["Add cloud experience"], "suggestions": ["Add AWS certification", "Include DevOps project"]}`;

    const aiResponse = await callGeminiDirectly({ prompt });

    let analysisResult;
    try {
      analysisResult = parseStructuredJson(aiResponse.text);
    } catch (parseErr) {
      console.error('Job Analysis Parse Error:', parseErr.message, 'Raw text:', aiResponse.text);
      return res.status(500).json({ success: false, message: 'AI failed to generate a valid analysis. Please try again.' });
    }

    res.json({ success: true, data: analysisResult });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Job analysis failed: ' + err.message });
  }
};

// @desc    AI-powered resume tailoring for a specific job description
exports.tailorResume = async (req, res) => {
  try {
    const { jobDescription, personalInfo, experiences, skills, summary } = req.body;

    const prompt = `Tailor this resume content for the specific job description below. Optimize the summary and experience descriptions to align with the role requirements.

Current Summary: ${summary || personalInfo?.summary || 'Not provided'}
Current Skills: ${Array.isArray(skills) ? skills.join(', ') : skills || 'None'}
Current Experiences: ${JSON.stringify(experiences || [])}

Job Description:
${jobDescription}

Return JSON only:
{"tailoredSummary": "...", "tailoredExperiences": [{"title": "...", "company": "...", "period": "...", "desc": "..."}]}`;

    const aiResponse = await callGeminiDirectly({ prompt });

    let tailoredContent;
    try {
      tailoredContent = parseStructuredJson(aiResponse.text);
    } catch (parseErr) {
      console.error('Tailor Resume Parse Error:', parseErr.message, 'Raw text:', aiResponse.text);
      return res.status(500).json({ success: false, message: 'AI failed to generate tailored content. Please try again.' });
    }

    res.json({ success: true, data: tailoredContent });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Resume tailoring failed: ' + err.message });
  }
};

// @desc    Comprehensive ATS analysis for a resume
exports.getATSAnalysis = async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });

    const prompt = `Perform a comprehensive ATS (Applicant Tracking System) analysis on this resume and return a detailed JSON report.

Resume Data:
Name: ${resume.personalInfo?.name || 'Not provided'}
Title: ${resume.personalInfo?.title || 'Not provided'}
Summary: ${resume.personalInfo?.summary || 'Not provided'}
Skills: ${resume.skills?.join(', ') || 'None'}
Experiences: ${JSON.stringify(resume.experiences || [])}
Education: ${JSON.stringify(resume.education || [])}
Projects: ${JSON.stringify(resume.projects || [])}
Certifications: ${resume.certifications?.join(', ') || 'None'}

Return JSON only:
{"overallScore": 82, "categories": {"formatting": {"score": 90, "feedback": "Clean layout"}, "keywords": {"score": 70, "feedback": "Missing cloud keywords"}, "readability": {"score": 85, "feedback": "Good sentence structure"}, "completeness": {"score": 80, "feedback": "Add certifications"}, "impact": {"score": 75, "feedback": "Use more metrics"}}, "missingKeywords": ["Docker", "Kubernetes"], "suggestions": ["Add quantified achievements", "Include industry keywords"], "grammarIssues": []}`;

    const aiResponse = await callGeminiDirectly({ prompt });

    let atsAnalysis;
    try {
      atsAnalysis = parseStructuredJson(aiResponse.text);
    } catch (parseErr) {
      console.error('ATS Analysis Parse Error:', parseErr.message, 'Raw text:', aiResponse.text);
      return res.status(500).json({ success: false, message: 'AI failed to generate ATS analysis. Please try again.' });
    }

    resume.analysis = {
      ...resume.analysis,
      score: atsAnalysis.overallScore || resume.analysis?.score || 0,
      atsScore: atsAnalysis.overallScore || resume.analysis?.atsScore || 0,
      tips: atsAnalysis.suggestions || resume.analysis?.tips || [],
      keywords: atsAnalysis.missingKeywords || resume.analysis?.keywords || []
    };
    await resume.save();
    await updateUserCareerStateResume(req.user.id || req.user._id, resume);

    res.json({ success: true, data: atsAnalysis });
  } catch (err) {
    res.status(500).json({ success: false, message: 'ATS analysis failed: ' + err.message });
  }
};

// @desc    Sync user's Nexus Career OS data (Career DNA, active roadmaps/projects/certifications)
exports.syncNexusCareerData = async (req, res) => {
  try {
    const UserCareerState = require('../models/UserCareerState');
    const userUid = String(req.user.uid || req.user._id || req.user.id);
    
    const careerState = await UserCareerState.findOne({ userId: userUid });
    if (!careerState) {
      return res.json({
        success: true,
        data: {
          careerDNA: null,
          skills: [],
          projects: [],
          certifications: []
        }
      });
    }

    // Attempt to gather completed certifications and projects from roadmaps
    // In our system, roadmaps are stored under userCareerState.activeRoadmaps
    const roadmaps = careerState.activeRoadmaps || [];
    
    // We can also suggest certifications or projects based on the target career path
    const targetCareer = careerState.careerDNA?.topMatches?.[0]?.career || 'Software Engineer';
    
    res.json({
      success: true,
      data: {
        careerDNA: careerState.careerDNA || null,
        targetCareer,
        // Send back context details
        skills: targetCareer.toLowerCase().includes('design') ? ['UI UX', 'Figma', 'Wireframing', 'Prototyping'] : ['JavaScript', 'React', 'Node.js', 'System Design'],
        projects: [
          { name: `${targetCareer} Portfolio Project`, tech: 'React, Node.js, MongoDB', desc: 'A complete end-to-end full stack project built to showcase industry readiness.' }
        ],
        certifications: [
          `${targetCareer} Certification Course`,
          'AWS Certified Cloud Practitioner'
        ]
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Sync failed: ' + err.message });
  }
};

// ─── PROFILE-DRIVEN AI RESUME GENERATION ─────────────────────────────────────

// @desc    Generate a complete ATS resume from user Profile + Job Description/Role
// @route   POST /api/resumes/ai/generate-from-profile
// @access  Private
exports.generateProfileResume = async (req, res) => {
  try {
    const UserProfile = require('../models/UserProfile');
    const profile = await UserProfile.findOne({ user: req.user._id });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found. Please complete your Profile first.'
      });
    }

    const { jobDescription, jobRole } = req.body;
    if (!jobDescription && !jobRole) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a Job Description or Job Role.'
      });
    }

    // ── Build profile context string ──
    const skillNames = (profile.skills || []).map(s => `${s.name} (${s.proficiency})`).join(', ') || 'None listed';
    const educationStr = (profile.education || []).map(e =>
      `${e.degree}${e.branch ? ' in ' + e.branch : ''} from ${e.college}${e.cgpa ? ' (CGPA: ' + e.cgpa + ')' : ''}${e.endYear ? ' (' + e.endYear + ')' : ''}`
    ).join('; ') || 'None listed';
    const experienceStr = (profile.experience || []).map(e =>
      `${e.role} at ${e.company} (${e.type || 'Full-time'})${e.startDate ? ' | ' + e.startDate + ' - ' + (e.currentlyWorking ? 'Present' : e.endDate || 'N/A') : ''} | Responsibilities: ${(e.responsibilities || []).join(', ')} | Achievements: ${(e.achievements || []).join(', ')}`
    ).join('\n') || 'None listed';
    const projectsStr = (profile.projects || []).map(p =>
      `${p.title}: ${p.shortDescription || 'No description'} | Tech: ${(p.technologies || []).join(', ')} | Role: ${p.role || 'Developer'}${p.githubRepo ? ' | GitHub: ' + p.githubRepo : ''}${p.liveDemo ? ' | Demo: ' + p.liveDemo : ''}`
    ).join('\n') || 'None listed';
    const certsStr = (profile.certifications || []).map(c =>
      `${c.name}${c.organization ? ' by ' + c.organization : ''}${c.issueDate ? ' (' + c.issueDate + ')' : ''}`
    ).join(', ') || 'None listed';
    const achievementsStr = (profile.achievements || []).map(a =>
      `${a.title}${a.description ? ': ' + a.description : ''} (${a.type || 'Other'})`
    ).join(', ') || 'None listed';

    // ── Determine job description ──
    let finalJobDescription = jobDescription || '';
    let finalJobRole = jobRole || '';

    // If only a role is provided, generate a JD using AI
    if (!finalJobDescription && finalJobRole) {
      const jdPrompt = `Generate a realistic, detailed job description for the role: "${finalJobRole}". Include: Required Skills, Preferred Qualifications, Responsibilities, and Nice-to-haves. Return plain text only, no JSON.`;
      const jdResponse = await callGeminiDirectly({ prompt: jdPrompt, temperature: 0.5 });
      finalJobDescription = jdResponse.text || '';
    }

    // ── Main AI prompt ──
    const prompt = `You are an expert ATS Resume Builder and Career Analyst. Generate a complete, personalized, ATS-optimized resume and skill gap analysis.

CRITICAL RULES:
- ONLY use the candidate's ACTUAL data provided below. NEVER invent, fabricate, or assume skills, experience, projects, or achievements.
- Rewrite descriptions to be more impactful and aligned with the target role, but keep them truthful.
- Use strong action verbs and quantify achievements where data supports it.

═══ CANDIDATE PROFILE ═══

Name: ${profile.fullName || 'Not provided'}
Headline: ${profile.headline || 'Not provided'}
Email: ${profile.email || 'Not provided'}
Phone: ${profile.phone || 'Not provided'}
Location: ${profile.location || 'Not provided'}
LinkedIn: ${profile.linkedIn || ''}
GitHub: ${profile.github || ''}
Portfolio: ${profile.portfolio || ''}

EDUCATION:
${educationStr}

SKILLS:
${skillNames}

EXPERIENCE:
${experienceStr}

PROJECTS:
${projectsStr}

CERTIFICATIONS:
${certsStr}

ACHIEVEMENTS:
${achievementsStr}

═══ TARGET JOB ═══
Role: ${finalJobRole || 'Not specified'}
Job Description:
${finalJobDescription}

═══ GENERATE ═══

Return a single JSON object with this exact structure:
{
  "resume": {
    "personalInfo": {
      "name": "candidate name",
      "title": "tailored professional title for target role",
      "email": "candidate email",
      "phone": "candidate phone",
      "location": "candidate location",
      "linkedin": "linkedin url",
      "github": "github url",
      "portfolio": "portfolio url",
      "summary": "3-4 sentence ATS-optimized professional summary tailored to the target role, using ONLY verified skills and experience"
    },
    "skills": ["skill1", "skill2", "...all candidate skills relevant to the role, ordered by relevance"],
    "experiences": [
      {
        "title": "role title",
        "company": "company name",
        "location": "",
        "period": "start - end",
        "desc": "2-3 impactful bullet points using STAR method, quantified where possible. ONLY use real responsibilities/achievements from the profile."
      }
    ],
    "education": [
      {
        "degree": "degree name",
        "institution": "college name",
        "year": "graduation year",
        "desc": "CGPA or relevant coursework if available"
      }
    ],
    "projects": [
      {
        "name": "project title",
        "tech": "technologies used",
        "link": "github or demo link",
        "desc": "2-3 sentences describing the project, its impact, and technologies. Rewrite for ATS optimization but keep truthful."
      }
    ],
    "certifications": ["cert1", "cert2"],
    "achievements": ["achievement1", "achievement2"]
  },
  "skillGap": {
    "matchingSkills": [
      { "name": "skill name", "relevance": "High/Medium/Low" }
    ],
    "missingSkills": [
      {
        "name": "skill name",
        "importance": "Critical/Important/Nice-to-have",
        "difficulty": "Easy/Medium/Hard",
        "estimatedLearningTime": "2 weeks",
        "whyItMatters": "brief explanation",
        "careerImpact": "High/Medium/Low",
        "salaryImpact": "+X LPA approximate"
      }
    ]
  },
  "scores": {
    "atsScore": 85,
    "jobMatch": 78,
    "technicalMatch": 82,
    "projectRelevance": 75,
    "overall": 80
  },
  "recommendations": [
    {
      "suggestion": "actionable recommendation text",
      "impact": "High/Medium/Low",
      "category": "Skills/Projects/Experience/Certifications/Profile"
    }
  ]
}

Return ONLY valid JSON. No markdown, no explanation.`;

    const aiResponse = await callGeminiDirectly({ prompt, temperature: 0.5, maxTokens: 8192 });
    let result;
    try {
      result = parseStructuredJson(aiResponse.text);
    } catch (parseErr) {
      console.error('Profile Resume Generation Parse Error:', parseErr.message, 'Raw:', aiResponse.text?.substring(0, 500));
      return res.status(500).json({
        success: false,
        message: 'AI failed to generate a valid resume. Please try again.'
      });
    }

    // Sanitize fields to match database string schema expectations
    const sanitizedExperiences = (result.resume?.experiences || []).map(exp => ({
      title: exp.title || '',
      company: exp.company || '',
      location: exp.location || '',
      period: exp.period || '',
      desc: Array.isArray(exp.desc) ? exp.desc.join('\n') : String(exp.desc || '')
    }));

    const sanitizedProjects = (result.resume?.projects || []).map(proj => ({
      name: proj.name || '',
      tech: proj.tech || '',
      link: proj.link || '',
      desc: Array.isArray(proj.desc) ? proj.desc.join('\n') : String(proj.desc || '')
    }));

    const sanitizedEducation = (result.resume?.education || []).map(edu => ({
      degree: edu.degree || '',
      institution: edu.institution || '',
      year: edu.year || '',
      desc: Array.isArray(edu.desc) ? edu.desc.join('\n') : String(edu.desc || '')
    }));

    // Save the generated resume to database
    const resumeData = {
      user: req.user._id,
      resumeTitle: `${finalJobRole || 'AI Generated'} Resume`,
      templateId: 'modern',
      personalInfo: result.resume?.personalInfo || {},
      skills: result.resume?.skills || [],
      experiences: sanitizedExperiences,
      education: sanitizedEducation,
      projects: sanitizedProjects,
      certifications: result.resume?.certifications || [],
      achievements: result.resume?.achievements || [],
      analysis: {
        score: result.scores?.overall || 0,
        atsScore: result.scores?.atsScore || 0,
        tips: (result.recommendations || []).map(r => r.suggestion),
        keywords: (result.skillGap?.missingSkills || []).map(s => s.name)
      }
    };

    const savedResume = await Resume.create(resumeData);
    await updateUserCareerStateResume(req.user.id || req.user._id, savedResume);

    res.json({
      success: true,
      data: {
        resumeId: savedResume._id,
        resume: result.resume,
        skillGap: result.skillGap,
        scores: result.scores,
        recommendations: result.recommendations
      }
    });
  } catch (err) {
    console.error('generateProfileResume error:', err.message);
    res.status(500).json({ success: false, message: 'Resume generation failed: ' + err.message });
  }
};
