const { callGeminiREST } = require('../utils/geminiClient');
const { awardXP } = require('../utils/gamification');
const MentorChat = require('../models/MentorChat');

const SYSTEM_INSTRUCTION = `You are Sara, an expert AI Career Mentor embedded in a career development platform.

CORE RULE — ALWAYS CONNECT TO CAREERS:
No matter what topic the user mentions — whether it's a monument, a sport, a movie, a place, a hobby, a historical event, or anything else — you MUST creatively and intelligently connect it to a relevant career path, skill, or professional opportunity.

Examples of how to bridge ANY topic to careers:
- "Taj Mahal" → Architecture, Civil Engineering, Heritage Conservation, Tourism Management, Urban Planning, Archaeological Studies
- "Cricket" → Sports Management, Data Analytics in Sports, Physiotherapy, Sports Journalism, Coaching
- "Netflix" → Content Strategy, UX/UI Design, Data Science, Software Engineering, Digital Marketing
- "Cooking" → Culinary Arts, Food Technology, Restaurant Management, Nutritionist, Food Blogging
- Never refuse to engage. Always find the career angle and explore it enthusiastically.

YOUR PERSONALITY & STYLE:
- Warm, encouraging, and highly knowledgeable
- Keep your responses short and concise (MAXIMUM 60-80 words total). Do not write excessively long answers, to conserve API tokens.
- Give highly actionable, specific advice — not generic platitudes
- Use clean Markdown formatting (bold, bullet points, numbered lists)
- Be realistic about timelines and effort required
- Suggest specific resources, courses, or certifications when relevant
- Do not hallucinate external links unless you are certain they exist

WHAT YOU HELP WITH:
- Career path exploration and decision-making
- Skill gap analysis and learning roadmaps
- Interview preparation and mock Q&A
- Resume and portfolio advice
- Salary negotiation guidance
- Industry trends and job market insights
- Connecting ANY topic the user mentions to a meaningful career opportunity`;

// @desc    Chat with AI Mentor (saves history per user)
// @route   POST /api/mentor/chat
// @access  Private
const chatWithMentor = async (req, res) => {
  try {
    const { message, history } = req.body;
    const userUid = req.user?.uid || req.user?._id || req.user?.id;

    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    if (!process.env.GEMINI_API_KEY && !process.env.NVIDIA_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'AI service is not configured on the server.'
      });
    }

    // Build conversation contents for the AI
    const contents = [];
    if (history && history.length > 0) {
      history.forEach(msg => {
        // Skip the initial greeting message (model's first message without user input)
        if (msg.role === 'model' && !msg.isFromDB) return;
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        });
      });
    }

    // Add current user message
    contents.push({ role: 'user', parts: [{ text: message }] });

    // Call Gemini
    const responseData = await callGeminiREST({
      contents,
      systemInstruction: SYSTEM_INSTRUCTION,
      generationConfig: { temperature: 0.7, topK: 40, topP: 0.95 },
      preferredModel: 'gemini-2.0-flash',
    });

    const mentorResponse = responseData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!mentorResponse) {
      return res.status(500).json({ success: false, message: 'AI returned an empty response. Please try again.' });
    }

    // Save both the user message and AI response to DB (non-blocking)
    MentorChat.findOneAndUpdate(
      { userUid: String(userUid) },
      {
        $push: {
          messages: {
            $each: [
              { role: 'user', content: message },
              { role: 'model', content: mentorResponse }
            ]
          }
        }
      },
      { upsert: true, new: true }
    ).catch(err => console.error('Failed to save mentor chat:', err));

    // Award XP (non-blocking)
    awardXP(req.user.id, 'MENTOR_CHAT').catch(() => {});

    res.status(200).json({ success: true, data: { response: mentorResponse } });

  } catch (error) {
    console.error('Mentor Chat Error:', error.response?.data || error.message);
    const errorMessage = error.response?.data?.error?.message || error.message || 'Unknown error occurred';
    res.status(500).json({ success: false, message: 'Failed to communicate with AI Mentor: ' + errorMessage });
  }
};

// @desc    Get saved chat history for the logged-in user
// @route   GET /api/mentor/history
// @access  Private
const getChatHistory = async (req, res) => {
  try {
    const userUid = req.user?.uid || req.user?._id || req.user?.id;
    const chatDoc = await MentorChat.findOne({ userUid: String(userUid) });
    const messages = chatDoc?.messages || [];
    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    console.error('Get Chat History Error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to load chat history' });
  }
};

// @desc    Clear chat history for the logged-in user
// @route   DELETE /api/mentor/history
// @access  Private
const clearChatHistory = async (req, res) => {
  try {
    const userUid = req.user?.uid || req.user?._id || req.user?.id;
    await MentorChat.findOneAndUpdate(
      { userUid: String(userUid) },
      { $set: { messages: [] } }
    );
    res.status(200).json({ success: true, message: 'Chat history cleared' });
  } catch (error) {
    console.error('Clear Chat History Error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to clear chat history' });
  }
};

module.exports = { chatWithMentor, getChatHistory, clearChatHistory };
