const { callGeminiREST } = require('../utils/geminiClient');
const { parseStructuredJson } = require('../utils/jsonParser');
const { protect } = require('../middleware/authMiddleware');
const { awardXP } = require('../utils/gamification');

// @desc   Analyze skill gap against a target career
// @route  POST /api/skill-gap/analyze
// @access Private
const analyzeSkillGap = async (req, res) => {
  try {
    const { targetRole, currentSkills } = req.body;
    
    if (!targetRole) {
      return res.status(400).json({ success: false, message: 'Target role is required' });
    }

    // Extract resume text if file uploaded
    let resumeText = '';
    if (req.file) {
      try {
        const pdfParse = require('pdf-parse');
        const dataBuffer = req.file.buffer;
        const pdfData = await pdfParse(dataBuffer);
        resumeText = pdfData.text || '';
      } catch (parseErr) {
        console.log('PDF parse failed, proceeding without resume:', parseErr.message);
      }
    }

    // Parse currentSkills if provided
    let skillsList = [];
    if (currentSkills) {
      try {
        skillsList = JSON.parse(currentSkills);
      } catch (e) {
        skillsList = [];
      }
    }

    // Check if AI keys are present
    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({ success: false, message: 'AI service is not configured.' });
    }

    const prompt = `You are an expert career counselor and technical recruiter. Analyze the skill gap for a candidate targeting the role of "${targetRole}".

${skillsList && skillsList.length > 0 ? `CANDIDATE'S EXPLICITLY PROVIDED SKILLS: ${skillsList.join(', ')}\n` : ''}
${resumeText ? `CANDIDATE'S RESUME CONTENT:\n---\n${resumeText.slice(0, 3000)}\n---\n` : 'No resume provided — provide a general skill gap analysis for someone starting to pursue this role.'}

Respond in this EXACT JSON format:
{
  "targetRole": "${targetRole}",
  "interviewReadiness": <number 0-100>,
  "matchingSkills": ["skill1", "skill2", ...],
  "missingSkills": ["skill1", "skill2", ...],
  "recommendedProjects": ["project1 description", "project2 description", "project3 description"],
  "improvementAreas": [
    {"area": "Area Name", "priority": "High|Medium|Low", "description": "Brief description"},
    ...
  ],
  "estimatedTimeToReady": "e.g. 4 months",
  "salaryImpact": {
    "currentRange": "e.g. ₹4-8 LPA",
    "potentialRange": "e.g. ₹12-20 LPA",
    "increase": "e.g. +150%"
  },
  "careerPathsUnlocked": ["Full Stack Developer", "Tech Lead", ...],
  "learningPlan": [
    {"week": "Week 1-2", "focus": "Topic or skill focus area", "resources": <number of recommended resources>},
    ...
  ],
  "skillCategoryBreakdown": {
    "frontend": <number 0-100>,
    "backend": <number 0-100>,
    "devops": <number 0-100>,
    "softSkills": <number 0-100>
  }
}

RULES:
- interviewReadiness: 0-100 score based on how ready the candidate is for interviews
- matchingSkills: skills the candidate already has (from resume or assume basic ones if no resume)
- missingSkills: critical skills missing for the target role
- recommendedProjects: 3-4 specific portfolio-worthy project ideas
- improvementAreas: 3-5 areas ranked by priority
- estimatedTimeToReady: realistic time estimate to become interview-ready for the target role
- salaryImpact: current vs potential salary ranges and percentage increase after closing the skill gap
- careerPathsUnlocked: 3-5 career roles that become accessible after closing the skill gap
- learningPlan: 4-6 week-based learning milestones with focus areas and number of recommended resources
- skillCategoryBreakdown: percentage proficiency scores (0-100) across key skill categories
- Return ONLY the JSON object. No conversational text.`;

    const responseData = await callGeminiREST({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.5,
        topP: 0.9,
        responseMimeType: 'application/json',
      },
    });

    const responseText = responseData?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!responseText) {
      return res.status(500).json({ success: false, message: 'AI returned empty response.' });
    }

    // Robust JSON parsing
    let analysis;
    try {
      analysis = parseStructuredJson(responseText);
    } catch (parseErr) {
      console.error('JSON Parse Error:', parseErr.message, 'Raw text:', responseText);
      return res.status(500).json({ success: false, message: 'Failed to parse AI response. Please try again.' });
    }

    // Award XP for skill gap analysis (async, non-blocking)
    awardXP(req.user.id, 'SKILL_GAP_ANALYSIS').catch(() => {});

    res.json({ success: true, data: analysis });

  } catch (error) {
    console.error('Skill Gap Analysis Error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to analyze skill gap: ' + error.message });
  }
};

module.exports = { analyzeSkillGap };
