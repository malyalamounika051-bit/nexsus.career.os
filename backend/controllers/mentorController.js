const { callGeminiREST, callAI } = require('../utils/geminiClient');
const { awardXP } = require('../utils/gamification');
const MentorChat = require('../models/MentorChat');
const ConversationMemory = require('../models/ConversationMemory');

// ── STEP 1: Enhanced System Prompt ──────────────────────────────────────
const SYSTEM_INSTRUCTION = `You are Sara, an AI Career Advisor and all-in-one assistant at Nexus Career OS.

PERSONALITY:
- You are warm, encouraging, knowledgeable, and genuinely invested in the user's success
- You remember everything from previous conversations and reference it naturally
- You adapt your communication style to match the user's tone
- You celebrate user achievements and progress
- You are proactive — suggest next steps without being asked

IMPORTANT RULES:
- Always analyze the current user message together with previous conversation history
- If a conversation summary is provided, use it as context for what was discussed before
- Reference things the user told you earlier naturally ("As you mentioned before...")
- Never repeat information the user already knows unless they ask

REFERENCE RESOLUTION:
If the user says:
- first option / second option / third option
- first career / second career
- tell me more about it / explain that role
- compare them / what about the previous one
You MUST identify what was mentioned in previous messages and respond accordingly.

FORMATTING RULES:
- When listing options, careers, routes, recommendations, or items, ALWAYS use numbered lists (1., 2., 3.)
- Use **bold** for emphasis on key terms
- Keep responses concise but complete (80-200 words)
- Use emojis sparingly but effectively for warmth

CORE ROLE & CAREER BRIDGING:
No matter what topic the user mentions — whether it's a monument, a sport, a movie, a place, a hobby, a historical event, or anything else — you MUST creatively and intelligently connect it to a relevant career path, skill, or professional opportunity.

ALL-IN-ONE CAPABILITIES:
- Career guidance and exploration
- Resume and portfolio advice
- Interview preparation tips
- Skill development roadmaps
- Industry insights and trends
- Work-life balance advice
- Networking strategies
- Salary negotiation tips
- General knowledge (always bridge back to career relevance)`;

// Max messages to include as direct AI context
const CONTEXT_WINDOW = 30;
// When to trigger conversation summarization
const SUMMARIZE_THRESHOLD = 40;

// ── Helper: detect if user message contains a reference to a previous option ──
const REFERENCE_PATTERNS = [
  /first\s*(option|career|one|role|choice|recommendation)/i,
  /second\s*(option|career|one|role|choice|recommendation)/i,
  /third\s*(option|career|one|role|choice|recommendation)/i,
  /fourth\s*(option|career|one|role|choice|recommendation)/i,
  /option\s*(1|2|3|4|5|one|two|three|four|five)/i,
  /tell\s*(me\s*)?(more\s*)?about\s*(it|that|the\s*(first|second|third|fourth))/i,
  /explain\s*(that|it|the\s*(first|second|third|fourth))/i,
  /compare\s*them/i,
  /which\s*(one\s*)?is\s*better/i,
  /the\s*previous\s*one/i,
  /that\s*(role|career|recommendation)/i,
  /this\s*(role|career)/i,
  /what\s*about\s*(the\s*)?(first|second|third|fourth|1st|2nd|3rd|4th)/i,
  /the\s*role\s*you\s*mentioned/i,
];

const containsReference = (message) => {
  return REFERENCE_PATTERNS.some(pattern => pattern.test(message));
};

// ── Helper: extract numbered list items from an AI response ──
const extractNumberedOptions = (text) => {
  const options = [];
  const lines = text.split('\n');
  for (const line of lines) {
    const match = line.match(/^\s*(\d+\.|[-*\u2022])\s*\*{0,2}(.+?)\*{0,2}\s*$/);
    if (match) {
      const cleaned = match[2].replace(/\*\*/g, '').trim();
      if (cleaned && cleaned.length > 0 && cleaned.length < 60) {
        options.push(cleaned);
      }
    }
  }
  return options;
};

// ── Helper: extract which ordinal the user is referring to ──
const getReferencedIndex = (message) => {
  const lower = message.toLowerCase();
  if (/first|option\s*1|1st/.test(lower)) return 0;
  if (/second|option\s*2|2nd/.test(lower)) return 1;
  if (/third|option\s*3|3rd/.test(lower)) return 2;
  if (/fourth|option\s*4|4th/.test(lower)) return 3;
  if (/fifth|option\s*5|5th/.test(lower)) return 4;
  return -1;
};

// ── Helper: Extract key topics from a message ──
const extractTopics = (message) => {
  const topics = [];
  const careerWords = /\b(career|job|role|position|developer|engineer|designer|manager|analyst|scientist|consultant|teacher|doctor|nurse|lawyer|architect|writer|artist|musician|chef|pilot|entrepreneur)\b/gi;
  const matches = message.match(careerWords);
  if (matches) topics.push(...matches.map(m => m.toLowerCase()));
  return [...new Set(topics)];
};

// ── Helper: Summarize old messages using AI ──
const summarizeConversation = async (messages) => {
  try {
    const conversationText = messages.map(m => 
      `${m.role === 'user' ? 'User' : 'Sara'}: ${m.content}`
    ).join('\n');
    
    const result = await callAI({
      messages: [{
        role: 'user',
        content: `Summarize this conversation between a user and Sara (AI Career Mentor) in 150-200 words. Focus on: key topics discussed, user's career interests, advice given, any decisions made, and user preferences learned. Be concise but capture all important context.\n\nConversation:\n${conversationText}`
      }],
      systemInstruction: 'You are a conversation summarizer. Output only the summary, no preamble.',
      temperature: 0.3,
      maxTokens: 300,
    });
    
    return result.text;
  } catch (err) {
    console.error('Failed to summarize conversation:', err.message);
    return '';
  }
};

// @desc    Chat with AI Mentor (saves history per user)
// @route   POST /api/mentor/chat
// @access  Private
const chatWithMentor = async (req, res) => {
  try {
    const { message } = req.body;
    const userUid = req.user?.uid || req.user?._id || req.user?.id;
    const userName = req.user?.name || req.user?.displayName || '';

    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'AI service is not configured on the server.'
      });
    }

    // ── STEP 2: Fetch previous messages from DB ──────────────────────────
    const chatDoc = await MentorChat.findOne({ userUid: String(userUid) });
    const dbMessages = chatDoc?.messages || [];

    // ── Fetch conversation memory ────────────────────────────────────────
    let memory = null;
    try {
      memory = await ConversationMemory.findOne({ userId: String(userUid) });
    } catch (memErr) {
      console.error('ConversationMemory fetch error:', memErr);
    }

    // ── STEP 4: Save user message BEFORE calling AI ─────────────────────
    await MentorChat.findOneAndUpdate(
      { userUid: String(userUid) },
      { $push: { messages: { role: 'user', content: message } } },
      { upsert: true, new: true }
    );

    // ── Auto-summarize if conversation is getting long ───────────────────
    if (dbMessages.length > SUMMARIZE_THRESHOLD && dbMessages.length % 10 === 0) {
      const oldMessages = dbMessages.slice(0, -CONTEXT_WINDOW);
      if (oldMessages.length > 0) {
        const summary = await summarizeConversation(oldMessages);
        if (summary) {
          try {
            await ConversationMemory.findOneAndUpdate(
              { userId: String(userUid) },
              { $set: { conversationSummary: summary } },
              { upsert: true }
            );
          } catch (e) {
            console.error('Failed to save conversation summary:', e);
          }
        }
      }
    }

    // Sliding window: only use the last N messages to keep token usage reasonable
    const recentMessages = dbMessages.slice(-CONTEXT_WINDOW);

    // ── STEP 3: Build conversation history for the AI ───────────────────
    const contents = recentMessages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    // ── Build enhanced system instruction with memory context ────────────
    let enhancedSystemPrompt = SYSTEM_INSTRUCTION;
    
    // Add user profile context
    if (userName) {
      enhancedSystemPrompt += `\n\nUSER PROFILE: The user's name is ${userName}.`;
    }

    // Load UserCareerState for cross-feature awareness
    try {
      const UserCareerState = require('../models/UserCareerState');
      const userCareerState = await UserCareerState.findOne({ userId: String(userUid) });
      if (userCareerState) {
        enhancedSystemPrompt += `\n\nUSER CAREER OS STATE:
- Current Journey Stage: ${userCareerState.currentStage}
- Career DNA Archetype: ${userCareerState.careerDNA?.archetype || 'None'}
- Top Career Matches: ${(userCareerState.careerDNA?.topMatches || []).map(m => `${m.career} (${m.matchPercent}%)`).join(', ') || 'None'}
- Resume Stats: ${userCareerState.resumeState?.hasResume ? `Score ${userCareerState.resumeState.resumeScore}/100, ATS Score ${userCareerState.resumeState.atsScore}/100` : 'No resume created yet'}
- Mock Interview Stats: ${userCareerState.interviewState?.totalInterviews || 0} completed, Average Score ${userCareerState.interviewState?.avgScore || 0}/100, Readiness: ${userCareerState.interviewState?.readinessLevel || 'not-started'}
- Saved Jobs: ${userCareerState.jobState?.savedJobsCount || 0} saved`;
      }
    } catch (stateErr) {
      console.error('Failed to load UserCareerState for mentor context:', stateErr);
    }

    // Add page context
    const pageContext = req.body.pageContext;
    if (pageContext) {
      enhancedSystemPrompt += `\n\nCURRENT CONTEXT: the user is active on the following screen: "${pageContext}". Reference the context naturally if relevant to help them navigate or use that screen, but keep focus on their question.`;
    }
    if (memory) {
      if (memory.conversationSummary) {
        enhancedSystemPrompt += `\n\nPREVIOUS CONVERSATION SUMMARY (use this for long-term context):\n${memory.conversationSummary}`;
      }
      if (memory.recommendedCareers?.length > 0) {
        enhancedSystemPrompt += `\nPreviously recommended careers: ${memory.recommendedCareers.join(', ')}`;
      }
      if (memory.goals?.length > 0) {
        enhancedSystemPrompt += `\nUser's career goals: ${memory.goals.join(', ')}`;
      }
      if (memory.userPreferences?.interests?.length > 0) {
        enhancedSystemPrompt += `\nUser's interests: ${memory.userPreferences.interests.join(', ')}`;
      }
      if (memory.userPreferences?.careerStage) {
        enhancedSystemPrompt += `\nCareer stage: ${memory.userPreferences.careerStage}`;
      }
    }

    // ── STEP 7: Explicit Context Retrieval ──────────────────────────────
    let latestAssistantContent = '';
    for (let i = recentMessages.length - 1; i >= 0; i--) {
      if (recentMessages[i].role === 'model') {
        latestAssistantContent = recentMessages[i].content;
        break;
      }
    }

    // Build the enhanced user message with explicit context
    let enhancedMessage = message;

    if (latestAssistantContent && containsReference(message)) {
      let resolvedHint = '';
      try {
        const refIndex = getReferencedIndex(message);
        if (memory?.lastDiscussedTopic?.options?.length > 0 && refIndex >= 0) {
          const resolvedOption = memory.lastDiscussedTopic.options[refIndex];
          if (resolvedOption) {
            resolvedHint = `\n\n[SYSTEM HINT: The user is referring to "${resolvedOption}" which was item #${refIndex + 1} in the previous list.]`;
          }
        }
      } catch (memErr) {
        console.error('ConversationMemory lookup error:', memErr);
      }

      enhancedMessage = `Latest AI Response:\n\n${latestAssistantContent}\n\nCurrent User Question:\n\n${message}\n\nIf the user references:\n- first option\n- second option\n- third option\n- previous recommendation\n\nResolve it using the Latest AI Response above.${resolvedHint}`;
    }

    // Add the (possibly enhanced) current user message
    contents.push({ role: 'user', parts: [{ text: enhancedMessage }] });

    // ── STEP 5: Get AI Response ─────────────────────────────────────────
    const responseData = await callGeminiREST({
      contents,
      systemInstruction: enhancedSystemPrompt,
      generationConfig: { temperature: 0.7, topK: 40, topP: 0.95, maxOutputTokens: 1024 },
    });

    const mentorResponse = responseData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!mentorResponse) {
      return res.status(500).json({ success: false, message: 'AI returned an empty response. Please try again.' });
    }

    // ── STEP 6: Save AI response to DB ──────────────────────────────────
    try {
      await MentorChat.findOneAndUpdate(
        { userUid: String(userUid) },
        { $push: { messages: { role: 'model', content: mentorResponse } } },
        { upsert: true, new: true }
      );
    } catch (saveErr) {
      console.error('Failed to save AI response:', saveErr);
    }

    // ── BONUS: Update ConversationMemory with structured data ───────────
    try {
      const extractedOptions = extractNumberedOptions(mentorResponse);
      const topics = extractTopics(message);
      
      const updateOps = {
        $inc: { totalMessageCount: 2 }, // user + bot
      };
      
      if (extractedOptions.length >= 2) {
        updateOps.$set = {
          ...(updateOps.$set || {}),
          lastDiscussedTopic: {
            label: message,
            options: extractedOptions
          }
        };
        updateOps.$addToSet = {
          ...(updateOps.$addToSet || {}),
          recommendedCareers: { $each: extractedOptions }
        };
        console.log(`\u{1F4CB} Saved ${extractedOptions.length} options to ConversationMemory:`, extractedOptions);
      }
      
      if (topics.length > 0) {
        updateOps.$push = {
          ...(updateOps.$push || {}),
          topicsDiscussed: { 
            $each: topics.map(t => ({ topic: t, timestamp: new Date() })),
            $slice: -50 // Keep last 50 topics
          }
        };
      }
      
      await ConversationMemory.findOneAndUpdate(
        { userId: String(userUid) },
        updateOps,
        { upsert: true, new: true }
      );
    } catch (memErr) {
      console.error('ConversationMemory save error:', memErr);
    }

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
    // Also clear conversation memory
    await ConversationMemory.findOneAndUpdate(
      { userId: String(userUid) },
      { $set: { 
        lastDiscussedTopic: { label: '', options: [] }, 
        recommendedCareers: [], 
        goals: [],
        conversationSummary: '',
        topicsDiscussed: [],
        totalMessageCount: 0,
      }}
    );
    res.status(200).json({ success: true, message: 'Chat history cleared' });
  } catch (error) {
    console.error('Clear Chat History Error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to clear chat history' });
  }
};

module.exports = { chatWithMentor, getChatHistory, clearChatHistory };
