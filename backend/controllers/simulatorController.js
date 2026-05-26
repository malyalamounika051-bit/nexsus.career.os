const { callGeminiREST } = require('../utils/geminiClient');
const { parseStructuredJson } = require('../utils/jsonParser');
const { awardXP } = require('../utils/gamification');

// In-memory cache for simulation results
const simulationCache = new Map();

// @desc   Simulate a day in the life of a career
// @route  POST /api/simulator/simulate
// @access Private
const simulateCareer = async (req, res) => {
  try {
    const { career } = req.body;
    
    if (!career) {
      return res.status(400).json({ success: false, message: 'Career name is required' });
    }

    const cacheKey = career.toLowerCase().trim();
    
    // Check cache first
    if (simulationCache.has(cacheKey)) {
      return res.json({ success: true, data: simulationCache.get(cacheKey), cached: true });
    }

    // Check if AI keys are present (either one is fine as client handles fallback)
    if (!process.env.GEMINI_API_KEY && !process.env.NVIDIA_API_KEY) {
      return res.status(500).json({ success: false, message: 'AI service is not configured.' });
    }

    const prompt = `You are a career simulation expert. Create an immersive "A Day in the Life" simulation for a "${career}" professional.

Respond in this EXACT JSON format:
{
  "career": "${career}",
  "dailySchedule": [
    {"time": "9:00 AM", "activity": "Description of activity", "type": "meeting|coding|break|writing|learning|design|analysis"},
    ...
  ],
  "stressLevel": <number 0-100>,
  "workLifeBalance": <number 0-100>,
  "remoteWorkChance": <number 0-100>,
  "growthPath": ["Junior", "Mid-Level", "Senior", "Lead", "Staff/Manager"],
  "salaryProgression": ["₹4-8 LPA", "₹8-15 LPA", ...],
  "requiredTraits": ["trait1", "trait2", "trait3", "trait4"],
  "futureOpportunities": ["opportunity1", "opportunity2", "opportunity3", "opportunity4", "opportunity5"]
}

RULES:
- dailySchedule: 6-8 time slots covering a typical workday (9 AM to 6 PM)
- type must be one of: meeting, coding, break, writing, learning, design, analysis
- stressLevel: realistic for this career (0=no stress, 100=extreme)
- workLifeBalance: realistic for this career
- remoteWorkChance: percentage of jobs offering remote work
- growthPath: 5-6 progression levels with realistic titles for this career
- salaryProgression: corresponding salary ranges in Indian LPA for each level
- requiredTraits: 4-5 personality traits needed
- futureOpportunities: 4-5 career transitions possible from this role
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

    // Robust JSON parsing
    let simulation;
    try {
      simulation = parseStructuredJson(responseText);
    } catch (parseErr) {
      console.error('JSON Parse Error:', parseErr.message, 'Raw text:', responseText);
      return res.status(500).json({ success: false, message: 'Failed to parse AI response. Please try again.' });
    }
    
    // Cache the result
    simulationCache.set(cacheKey, simulation);
    
    // Clean old cache entries (keep max 50)
    if (simulationCache.size > 50) {
      const firstKey = simulationCache.keys().next().value;
      simulationCache.delete(firstKey);
    }

    // Award XP for simulator (async, non-blocking)
    awardXP(req.user.id, 'CAREER_SIMULATION').catch(() => {});

    res.json({ success: true, data: simulation, cached: false });

  } catch (error) {
    console.error('Career Simulation Error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to generate simulation: ' + error.message });
  }
};

module.exports = { simulateCareer };
