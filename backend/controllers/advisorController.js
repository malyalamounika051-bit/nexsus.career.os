const { callGeminiDirectly } = require('../utils/geminiClient');
const { parseStructuredJson } = require('../utils/jsonParser');
const Assessment = require('../models/Assessment');
const Career = require('../models/Career');
const User = require('../models/User');
const { awardXP } = require('../utils/gamification');
const { generateRoadmap } = require('./careerController');

// Helper scoring map, cloned from assessmentController.js to reuse matching logic
const scoreMap = {
  'building_creating': { technical: 3, creative: 2 },
  'analyzing_data': { analytical: 3, technical: 1 },
  'leading_teams': { leadership: 3, communication: 2 },
  'helping_people': { communication: 3, leadership: 1 },
  'designing_experiences': { creative: 3, analytical: 1 },
  'highly_technical': { technical: 3, analytical: 2 },
  'creative_innovative': { creative: 3, technical: 1 },
  'strategic_planning': { analytical: 3, leadership: 2 },
  'people_focused': { communication: 3, leadership: 1 },
  'very_comfortable': { technical: 4 },
  'somewhat_comfortable': { technical: 2, analytical: 1 },
  'prefer_no_coding': { creative: 1, communication: 1 },
  'open_to_learning': { technical: 1, analytical: 1 },
  'fast_growth': { leadership: 2, technical: 1 },
  'high_income': { analytical: 1, technical: 1 },
  'creative_freedom': { creative: 3 },
  'social_impact': { communication: 2, leadership: 1 },
  'work_life_balance': { communication: 1 },
  'practical_projects': { technical: 2, analytical: 1 },
  'research_study': { analytical: 3, technical: 1 },
  'team_collaboration': { communication: 2, leadership: 1 },
  'solo_innovation': { creative: 3, technical: 1 },
  'high_school': {},
  'undergraduate': { analytical: 1 },
  'graduate': { analytical: 2, leadership: 1 },
  'self_taught': { technical: 2, creative: 1 },
  'videos_courses': { technical: 1 },
  'books_articles': { analytical: 2 },
  'hands_on': { technical: 2, creative: 1 },
  'mentorship': { communication: 1, leadership: 1 },
  'tech_ai': { technical: 4, analytical: 2 },
  'design_ux': { creative: 4, technical: 1 },
  'business_management': { leadership: 3, analytical: 2 },
  'healthcare': { communication: 2, analytical: 2 },
  'education': { communication: 3, leadership: 1 },
  'finance': { analytical: 4, technical: 1 },
};

const ADVISOR_SYSTEM_INSTRUCTION = `You are Sara, the Expert AI Career Advisor at Nexus.
Your role is to interview the user in a friendly, conversational manner to gather insight into their aptitude, interests, and background.
Be extremely professional, encouraging, and clear.
Ask only ONE question at a time to avoid overwhelming the user.
Try to probe the following areas organically:
1. What energizes them (building, data, leadership, helping people, or design)?
2. Work style (hands-on technical, creative, strategic, people-oriented).
3. Technical comfort (comfort with coding, tech domain interests).
4. Career priority (growth, money, creative freedom, balance).
5. Preferred learning style (courses, reading, building projects).
CRITICAL: Keep your response short and concise (MAXIMUM 40-60 words total). Do not write long paragraphs or give verbose answers, to conserve tokens.
Once you have gathered enough information (after 4-6 conversational turns), politely let the user know you have enough information to build their career profile and prompt them to click the "Get My Pathway" button!`;

const chatWithAdvisor = async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ success: false, message: 'Messages array is required.' });
    }

    // Format chat history for prompt
    const chatHistoryText = messages
      .map(m => `${m.sender === 'user' ? 'User' : 'Sara'}: ${m.text}`)
      .join('\n');

    const prompt = `${ADVISOR_SYSTEM_INSTRUCTION}

Conversation History:
${chatHistoryText}

Sara:`;

    const aiResponse = await callGeminiDirectly({ prompt, temperature: 0.7, maxTokens: 120 });
    res.json({ success: true, text: aiResponse.text.trim() });
  } catch (error) {
    console.error('Advisor Chat Error:', error);
    res.status(500).json({ success: false, message: 'Advisor service encountered an error.' });
  }
};

const synthesizeAdvisorOnboarding = async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ success: false, message: 'Messages array is required.' });
    }

    const userUid = req.user?.uid || req.user?._id || req.user?.id;
    if (!userUid) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const chatHistoryText = messages
      .map(m => `${m.sender === 'user' ? 'User' : 'Sara'}: ${m.text}`)
      .join('\n');

    // Prompt the AI to map the conversation to assessment categories
    const synthesisPrompt = `You are a Career Data Analyst. Analyze the conversation history between the user and Sara.
Map the user's responses to the most fitting categories out of the allowed values:
1. What energizes user: building_creating | analyzing_data | leading_teams | helping_people | designing_experiences
2. Work style: highly_technical | creative_innovative | strategic_planning | people_focused
3. Comfort with coding: very_comfortable | somewhat_comfortable | prefer_no_coding | open_to_learning
4. Priority: fast_growth | high_income | creative_freedom | social_impact | work_life_balance
5. Project type: practical_projects | research_study | team_collaboration | solo_innovation
6. Education level: high_school | undergraduate | graduate | self_taught
7. Learning style: videos_courses | books_articles | hands_on | mentorship
8. Domain: tech_ai | design_ux | business_management | healthcare | education | finance

Format your response in this EXACT JSON structure:
{
  "answers": [
    { "questionId": 1, "value": "building_creating" },
    { "questionId": 2, "value": "highly_technical" },
    { "questionId": 3, "value": "very_comfortable" },
    { "questionId": 4, "value": "fast_growth" },
    { "questionId": 5, "value": "practical_projects" },
    { "questionId": 6, "value": "undergraduate" },
    { "questionId": 7, "value": "hands_on" },
    { "questionId": 8, "value": "tech_ai" }
  ]
}

Conversation:
${chatHistoryText}

Return ONLY valid JSON.`;

    const synthesisResponse = await callGeminiDirectly({ prompt: synthesisPrompt, temperature: 0.2 });
    let parsed;
    try {
      parsed = parseStructuredJson(synthesisResponse.text);
    } catch (e) {
      console.error('Synthesis JSON parse error, generating defaults:', e);
      // fallback mock answers if parsing fails
      parsed = {
        answers: [
          { questionId: 1, value: 'building_creating' },
          { questionId: 2, value: 'highly_technical' },
          { questionId: 3, value: 'very_comfortable' },
          { questionId: 4, value: 'fast_growth' },
          { questionId: 5, value: 'practical_projects' },
          { questionId: 6, value: 'undergraduate' },
          { questionId: 7, value: 'hands_on' },
          { questionId: 8, value: 'tech_ai' }
        ]
      };
    }

    // Reuse existing score computing logic
    const scores = { technical: 0, creative: 0, analytical: 0, leadership: 0, communication: 0 };
    parsed.answers.forEach(({ value }) => {
      if (value && scoreMap[value]) {
        const contribution = scoreMap[value];
        Object.keys(contribution).forEach((cat) => {
          scores[cat] = (scores[cat] || 0) + contribution[cat];
        });
      }
    });

    // Reuse career matching logic
    const careers = await Career.find({ isGeneratedRoadmap: false });
    const maxPossible = 15;
    const matches = careers.map((career) => {
      let dot = 0;
      let total = 0;
      const cats = ['technical', 'creative', 'analytical', 'leadership', 'communication'];
      cats.forEach((cat) => {
        const weight = career.weights[cat] || 0;
        const userScore = Math.min(scores[cat] || 0, maxPossible);
        dot += weight * userScore;
        total += weight * maxPossible;
      });
      const match = total > 0 ? Math.round((dot / total) * 100) : 0;
      return {
        career: career.domain,
        match: Math.min(match, 99),
        domain: career.domain,
        salary: career.avgSalary,
        demand: career.demand,
        skills: career.skills.slice(0, 5),
      };
    }).sort((a, b) => b.match - a.match).slice(0, 5);

    // Compute Career DNA Archetype
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const top1 = sorted[0]?.[0];
    const top2 = sorted[1]?.[0];

    const archetypes = {
      'technical-analytical': { archetype: 'Analytical Builder', strengths: ['Logic & problem-solving', 'System design', 'Data-driven thinking'], weaknesses: ['Creative design', 'Team management'], workEnvironment: 'Structured, technical, deep-focus', learningStyle: 'Hands-on projects & documentation' },
      'technical-creative': { archetype: 'Creative Engineer', strengths: ['Innovation', 'Technical skill + aesthetics', 'Prototyping'], weaknesses: ['Long-term planning', 'Routine tasks'], workEnvironment: 'Innovative labs, startups', learningStyle: 'Experimental, project-based' },
      'creative-communication': { archetype: 'Product Innovator', strengths: ['User empathy', 'Visual storytelling', 'Cross-functional collaboration'], weaknesses: ['Deep technical implementation', 'Data analysis'], workEnvironment: 'Design studios, product teams', learningStyle: 'Visual, collaborative' },
      'leadership-analytical': { archetype: 'Strategic Thinker', strengths: ['Strategic planning', 'Decision-making', 'Team leadership'], weaknesses: ['Hands-on coding', 'Creative design'], workEnvironment: 'Management, consulting', learningStyle: 'Case studies, mentorship' },
      'communication-leadership': { archetype: 'People Connector', strengths: ['Networking', 'Team building', 'Communication'], weaknesses: ['Solo technical work', 'Deep analysis'], workEnvironment: 'Collaborative, client-facing', learningStyle: 'Group discussions, mentorship' },
      'analytical-technical': { archetype: 'Data Scientist', strengths: ['Pattern recognition', 'Statistical analysis', 'ML/AI'], weaknesses: ['Creative design', 'People management'], workEnvironment: 'Research labs, data teams', learningStyle: 'Research papers, experiments' },
      'creative-technical': { archetype: 'Visual Creator', strengths: ['UI/UX design', 'Aesthetic sense', 'Frontend expertise'], weaknesses: ['Backend architecture', 'Data analysis'], workEnvironment: 'Design-forward companies', learningStyle: 'Visual tutorials, hands-on' },
      'leadership-communication': { archetype: 'Tech Leader', strengths: ['Vision setting', 'Team motivation', 'Stakeholder communication'], weaknesses: ['Individual contribution', 'Deep specialization'], workEnvironment: 'C-suite, management', learningStyle: 'Books, leadership programs' },
    };

    const key1 = `${top1}-${top2}`;
    const key2 = `${top2}-${top1}`;
    const careerDNA = archetypes[key1] || archetypes[key2] || archetypes['technical-analytical'];

    // Create Assessment record
    const assessment = await Assessment.create({
      userId: userUid,
      answers: parsed.answers,
      scores,
      result: matches,
      topCareer: matches[0]?.career || 'Unknown',
      careerDNA,
    });

    // Update user stats
    await User.findByIdAndUpdate(userUid, { $inc: { assessmentCount: 1 } });
    awardXP(userUid, 'ASSESSMENT_COMPLETED').catch(() => {});

    // Automatically trigger roadmap generation for the top matched career!
    const targetCareer = matches[0]?.career;
    
    // Call generateRoadmap logic directly by mocking req/res parameters
    let generatedRoadmapData = null;
    const mockReq = {
      body: { query: targetCareer },
      user: { uid: userUid, id: userUid, email: req.user?.email }
    };
    const mockRes = {
      status: (code) => {
        return {
          json: (data) => {
            console.log(`Mock generate roadmap returned status ${code}:`, data);
          }
        };
      },
      json: (data) => {
        generatedRoadmapData = data.data;
      }
    };

    try {
      await generateRoadmap(mockReq, mockRes);
    } catch (roadmapErr) {
      console.error('Auto roadmap generation failed, user will generate manually:', roadmapErr);
    }

    res.status(201).json({
      success: true,
      data: {
        assessment,
        roadmap: generatedRoadmapData
      }
    });

  } catch (error) {
    console.error('Advisor Onboarding Synthesis Error:', error);
    res.status(500).json({ success: false, message: 'Failed to synthesize conversation results.' });
  }
};

module.exports = {
  chatWithAdvisor,
  synthesizeAdvisorOnboarding
};
