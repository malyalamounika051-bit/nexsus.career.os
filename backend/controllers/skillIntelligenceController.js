const { callGeminiREST } = require('../utils/geminiClient');
const { parseStructuredJson } = require('../utils/jsonParser');
const { awardXP } = require('../utils/gamification');

// Cache maps
const salaryCache = new Map();
const trendingCache = { data: null, timestamp: 0 };

// @desc   Generate a force-directed skill relationship graph
// @route  POST /api/skill-intelligence/graph
// @access Private
const generateSkillGraph = async (req, res) => {
  try {
    const { skills } = req.body;

    if (!skills || !Array.isArray(skills) || skills.length === 0) {
      return res.status(400).json({ success: false, message: 'Skills array is required' });
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({ success: false, message: 'AI service is not configured.' });
    }

    const prompt = `You are an expert skill relationship analyst and career technologist. Analyze the relationships between the following skills and any closely related skills: ${JSON.stringify(skills)}.

Respond in this EXACT JSON format:
{
  "nodes": [
    {"id": "skill_name_lowercase", "label": "Skill Name", "category": "frontend|backend|devops|data|ai|soft-skills", "size": <number 10-50 based on importance>, "color": "<hex color based on category>"},
    ...
  ],
  "edges": [
    {"source": "skill1_id", "target": "skill2_id", "strength": <number 0.0-1.0>},
    ...
  ]
}

RULES:
- Include all provided skills as nodes
- Add 5-10 additional closely related skills as nodes
- Category colors: frontend=#61DAFB, backend=#68A063, devops=#FF6F00, data=#4CAF50, ai=#9C27B0, soft-skills=#FF9800
- Node size: 40-50 for core/important skills, 20-35 for secondary skills, 10-20 for peripheral skills
- Edge strength: 0.8-1.0 for tightly coupled skills, 0.4-0.7 for moderately related, 0.1-0.3 for loosely related
- Create edges between all meaningfully related skill pairs
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

    let graphData;
    try {
      graphData = parseStructuredJson(responseText);
    } catch (parseErr) {
      console.error('JSON Parse Error:', parseErr.message, 'Raw text:', responseText);
      return res.status(500).json({ success: false, message: 'Failed to parse AI response. Please try again.' });
    }

    // Award XP for skill graph exploration (async, non-blocking)
    awardXP(req.user.id, 'SKILL_GRAPH_EXPLORE').catch(() => {});

    res.json({ success: true, data: graphData });

  } catch (error) {
    console.error('Skill Graph Generation Error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to generate skill graph: ' + error.message });
  }
};

// @desc   Get salary intelligence for a specific skill
// @route  GET /api/skill-intelligence/salary/:skill
// @access Private
const getSalaryIntelligence = async (req, res) => {
  try {
    const { skill } = req.params;

    if (!skill) {
      return res.status(400).json({ success: false, message: 'Skill parameter is required' });
    }

    const cacheKey = skill.toLowerCase().trim();

    // Check cache first
    if (salaryCache.has(cacheKey)) {
      return res.json({ success: true, data: salaryCache.get(cacheKey), cached: true });
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({ success: false, message: 'AI service is not configured.' });
    }

    const prompt = `You are an expert salary analyst and tech recruiter with deep knowledge of the Indian job market. Provide detailed salary intelligence for the skill: "${skill}".

Respond in this EXACT JSON format:
{
  "skill": "${skill}",
  "entrySalary": "<entry-level salary range e.g. ₹3-6 LPA>",
  "midSalary": "<mid-level salary range e.g. ₹8-15 LPA>",
  "seniorSalary": "<senior-level salary range e.g. ₹18-35 LPA>",
  "avgSalary": "<average salary e.g. ₹12 LPA>",
  "topCompanies": ["Company1", "Company2", "Company3", "Company4", "Company5"],
  "demandLevel": "Very High|High|Medium|Low",
  "growthRate": "<percentage growth e.g. +25%>",
  "currency": "INR"
}

RULES:
- All salary figures should be realistic for the Indian market in 2024-2025
- topCompanies: 5 companies that actively hire for this skill in India
- demandLevel: based on current job market demand
- growthRate: year-over-year demand growth percentage
- Return ONLY the JSON object. No conversational text.`;

    const responseData = await callGeminiREST({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.4,
        topP: 0.9,
        responseMimeType: 'application/json',
      },
    });

    const responseText = responseData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      return res.status(500).json({ success: false, message: 'AI returned empty response.' });
    }

    let salaryData;
    try {
      salaryData = parseStructuredJson(responseText);
    } catch (parseErr) {
      console.error('JSON Parse Error:', parseErr.message, 'Raw text:', responseText);
      return res.status(500).json({ success: false, message: 'Failed to parse AI response. Please try again.' });
    }

    // Cache the result
    salaryCache.set(cacheKey, salaryData);

    // Clean old cache entries (keep max 100)
    if (salaryCache.size > 100) {
      const firstKey = salaryCache.keys().next().value;
      salaryCache.delete(firstKey);
    }

    // Award XP for salary lookup (async, non-blocking)
    awardXP(req.user.id, 'SALARY_LOOKUP').catch(() => {});

    res.json({ success: true, data: salaryData, cached: false });

  } catch (error) {
    console.error('Salary Intelligence Error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to get salary intelligence: ' + error.message });
  }
};

// @desc   Get AI-powered recommendations for next skills to learn
// @route  POST /api/skill-intelligence/learn-next
// @access Private
const getLearnNextRecommendations = async (req, res) => {
  try {
    const { currentSkills } = req.body;

    if (!currentSkills || !Array.isArray(currentSkills) || currentSkills.length === 0) {
      return res.status(400).json({ success: false, message: 'currentSkills array is required' });
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({ success: false, message: 'AI service is not configured.' });
    }

    const prompt = `You are an expert career advisor and skill strategist. Given that a developer currently knows these skills: ${JSON.stringify(currentSkills)}, recommend the best next skills to learn for maximum career growth.

Respond in this EXACT JSON format:
{
  "recommendations": [
    {
      "skill": "Skill Name",
      "reason": "Why this skill is the logical next step given current skills",
      "difficulty": "Beginner|Intermediate|Advanced",
      "timeToLearn": "estimated time e.g. 2-3 weeks",
      "salaryBoost": "estimated salary increase e.g. +15-20%",
      "demandScore": <number 1-100>,
      "category": "frontend|backend|devops|data|ai|soft-skills"
    },
    ...
  ]
}

RULES:
- Provide 6-8 skill recommendations
- Order by strategic importance (most impactful first)
- reason: explain how this skill complements existing skills
- difficulty: relative to someone with the given skill set
- timeToLearn: realistic estimate for someone with related experience
- salaryBoost: realistic percentage increase in Indian market
- demandScore: current market demand (100 = extremely high demand)
- category: the domain this skill belongs to
- Return ONLY the JSON object. No conversational text.`;

    const responseData = await callGeminiREST({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.6,
        topP: 0.9,
        responseMimeType: 'application/json',
      },
    });

    const responseText = responseData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      return res.status(500).json({ success: false, message: 'AI returned empty response.' });
    }

    let recommendations;
    try {
      recommendations = parseStructuredJson(responseText);
    } catch (parseErr) {
      console.error('JSON Parse Error:', parseErr.message, 'Raw text:', responseText);
      return res.status(500).json({ success: false, message: 'Failed to parse AI response. Please try again.' });
    }

    // Award XP for learn-next exploration (async, non-blocking)
    awardXP(req.user.id, 'LEARN_NEXT').catch(() => {});

    res.json({ success: true, data: recommendations });

  } catch (error) {
    console.error('Learn Next Recommendations Error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to get recommendations: ' + error.message });
  }
};

// @desc   Get trending skills with market data
// @route  GET /api/skill-intelligence/trending
// @access Private
const getTrendingSkills = async (req, res) => {
  try {
    const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

    // Check cache first
    if (trendingCache.data && (Date.now() - trendingCache.timestamp) < CACHE_DURATION) {
      return res.json({ success: true, data: trendingCache.data, cached: true });
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({ success: false, message: 'AI service is not configured.' });
    }

    const prompt = `You are a tech industry analyst and job market expert. Provide a list of 15-20 currently trending skills in the tech industry with detailed market data.

Respond in this EXACT JSON format:
{
  "skills": [
    {
      "rank": 1,
      "name": "Skill Name",
      "trendScore": <number 1-100>,
      "futureRelevance": "<High|Very High|Critical>",
      "marketGrowth": "<percentage e.g. +35%>",
      "avgSalaryLpa": "<average salary in LPA e.g. 15>",
      "category": "frontend|backend|devops|data|ai|soft-skills",
      "description": "Brief 1-line description of why this skill is trending"
    },
    ...
  ]
}

RULES:
- Provide 15-20 trending skills ranked by current demand and growth
- trendScore: overall trending score (100 = hottest skill right now)
- futureRelevance: how important this skill will be in 2-3 years
- marketGrowth: year-over-year growth in job postings
- avgSalaryLpa: average salary in Indian LPA (lakhs per annum) as a number
- Include a mix of categories (AI/ML, cloud, frontend, backend, devops, data)
- description: concise explanation of the trend driver
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

    let trendingData;
    try {
      trendingData = parseStructuredJson(responseText);
    } catch (parseErr) {
      console.error('JSON Parse Error:', parseErr.message, 'Raw text:', responseText);
      return res.status(500).json({ success: false, message: 'Failed to parse AI response. Please try again.' });
    }

    // Cache the result for 1 hour
    trendingCache.data = trendingData;
    trendingCache.timestamp = Date.now();

    res.json({ success: true, data: trendingData, cached: false });

  } catch (error) {
    console.error('Trending Skills Error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to get trending skills: ' + error.message });
  }
};

module.exports = { generateSkillGraph, getSalaryIntelligence, getLearnNextRecommendations, getTrendingSkills };
