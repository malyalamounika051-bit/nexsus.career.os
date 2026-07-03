const { callGeminiDirectly } = require('../utils/geminiClient');
const { parseStructuredJson } = require('../utils/jsonParser');
const Interview = require('../models/Interview');
const { ASRService } = require('../services/asrService');

// Shared ASR service instance (uses env vars for provider config)
const asrService = new ASRService();

// @desc    Generate interview questions and start interview
// @route   POST /api/interview/start
// @access  Private
const startInterview = async (req, res) => {
  try {
    const { jobRole, difficulty } = req.body;
    const userId = req.user.id;

    if (!jobRole || !difficulty) {
      return res.status(400).json({ success: false, message: 'Job role and difficulty are required.' });
    }

    let progressionInstructions = '';
    if (difficulty.toLowerCase() === 'beginner' || difficulty.toLowerCase() === 'basic') {
      progressionInstructions = `
CRITICAL QUESTION STRUCTURE FOR BEGINNER/BASIC DIFFICULTY (Do NOT violate this):
- Question 1: Simple introduction ("Tell me about yourself and your background").
- Questions 2-3: Core programming and web basics (HTML structures, CSS styles, basic JavaScript variables/functions).
- Questions 4-6: UI Framework basics (simple React components, props vs state, handling events, simple loops).
- Questions 7-8: Simple student or hobby projects (e.g. weather app, counter, simple form layout).
- Questions 9-10: Basic behavioral and school/college teamwork communication questions.
- WARNING: Absolutely NO questions about system design, performance scaling, backend database optimization, caching, caching tiers, microservices, or complex architectural trade-offs.`;
    } else if (difficulty.toLowerCase() === 'intermediate' || difficulty.toLowerCase() === 'medium') {
      progressionInstructions = `
CRITICAL QUESTION STRUCTURE FOR INTERMEDIATE DIFFICULTY:
- Question 1: Introduction and overview of recent professional projects.
- Questions 2-3: Practical coding concepts, async programming, React hooks (useEffect, custom hooks).
- Questions 4-6: State management patterns, standard API integrations, styling tools.
- Questions 7-8: Performance profiling, client-side testing, troubleshooting.
- Questions 9-10: Team collaboration and conflict resolution.`;
    } else {
      progressionInstructions = `
CRITICAL QUESTION STRUCTURE FOR ADVANCED DIFFICULTY:
- Question 1: Deep dive into architectural leadership and complex project overview.
- Questions 2-3: Core architecture patterns, micro-frontends, global state stores.
- Questions 4-6: Web security measures, extreme performance tuning, scaling optimizations.
- Questions 7-8: System design, infrastructure setup, database partitioning trade-offs.
- Questions 9-10: Tech leadership, mentoring, and high-level decision-making scenarios.`;
    }

    const prompt = `You are an expert HR and Technical Interviewer. I am preparing for a ${jobRole} role.
The difficulty level is ${difficulty}.

Generate a list of EXACTLY 10 interview questions based on the difficulty and role.
${progressionInstructions}

Respond in this EXACT JSON format:
{
  "questions": [
    {
      "text": "The question to ask",
      "context": "Why are you asking this/what to look for in the answer"
    }
  ]
}
Return ONLY the JSON object. Do not include any markdown formatting or extra text.`;

    const response = await callGeminiDirectly({ prompt, temperature: 0.7 });
    const parsed = parseStructuredJson(response.text);

    if (!parsed.questions || parsed.questions.length === 0) {
      throw new Error("Failed to generate questions");
    }

    const interview = await Interview.create({
      userId,
      jobRole,
      difficulty,
      questions: parsed.questions,
      status: 'in-progress'
    });

    res.json({ success: true, data: interview });
  } catch (error) {
    console.error('Error starting interview:', error);
    res.status(500).json({ success: false, message: 'Failed to start interview.' });
  }
};

// @desc    Evaluate a user's answer
// @route   POST /api/interview/evaluate
// @access  Private
const evaluateAnswer = async (req, res) => {
  try {
    const { interviewId, question, userAnswer, confidence, duration, analytics } = req.body;

    if (!interviewId || !question || !userAnswer) {
      return res.status(400).json({ success: false, message: 'Interview ID, question, and user answer are required.' });
    }

    const prompt = `You are an expert Interviewer. The candidate was asked: "${question}".
The candidate answered: "${userAnswer}".

Evaluate this exact answer. Consider technical correctness, communication skills, and confidence (look for filler words or hesitation).
CRITICAL: You MUST explicitly refer to what the candidate actually said. If they gave a specific example, mention it. If they made a specific mistake, correct it. Do not give generic feedback.
Provide brief, constructive feedback as if you are talking to the candidate. Keep it under 3 sentences.

Respond in this EXACT JSON format:
{
  "feedback": "Your conversational feedback to the user",
  "isFollowUpNeeded": false,
  "followUpQuestion": ""
}
Return ONLY the JSON object. No markdown.`;

    const response = await callGeminiDirectly({ prompt, temperature: 0.5 });
    const parsed = parseStructuredJson(response.text);

    // Build transcript entry with optional ASR analytics fields
    const transcriptEntry = {
      question,
      userAnswer,
      aiFeedback: parsed.feedback,
      isFollowUp: false
    };

    if (typeof confidence === 'number') transcriptEntry.confidence = confidence;
    if (typeof duration === 'number') transcriptEntry.duration = duration;
    if (analytics && typeof analytics === 'object') {
      transcriptEntry.analytics = {
        wordsSpoken: analytics.wordsSpoken || 0,
        speakingSpeed: analytics.speakingSpeed || 0,
        fillerWords: analytics.fillerWords || [],
        fillerWordCount: analytics.fillerWordCount || 0,
        pauseFrequency: analytics.pauseFrequency || 0
      };
    }

    // Save to transcript
    await Interview.findByIdAndUpdate(interviewId, {
      $push: { transcript: transcriptEntry }
    });

    res.json({ success: true, data: parsed });
  } catch (error) {
    console.error('Error evaluating answer:', error);
    res.status(500).json({ success: false, message: 'Failed to evaluate answer.' });
  }
};

// @desc    Finalize interview and generate report
// @route   POST /api/interview/finalize
// @access  Private
const finalizeInterview = async (req, res) => {
  try {
    const { interviewId } = req.body;
    const interview = await Interview.findById(interviewId);

    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found.' });
    }

    const transcriptText = interview.transcript.map(t => `Q: ${t.question}\nA: ${t.userAnswer}\n`).join('\n');

    const prompt = `You are an expert HR and Technical Evaluator. Review the following interview transcript for a ${interview.jobRole} role at ${interview.difficulty} difficulty.

Transcript:
${transcriptText}

Analyze the candidate's performance and provide a comprehensive final report. 
Scores should be out of 100.

CRITICAL INSTRUCTION: Your feedback MUST be strictly based on the provided transcript.
For "strengths", "weaknesses", and "mistakes", you MUST quote or specifically reference the exact phrases, concepts, or mistakes the candidate actually said in their answers. 
DO NOT provide generic feedback (e.g., "Good communication"). Instead, provide specific feedback (e.g., "You clearly explained the Virtual DOM", "You incorrectly stated that React uses two-way data binding").
Ensure your report correctly and exactly reflects the user replies.

Respond in this EXACT JSON format:
{
  "scores": {
    "technical": <number>,
    "communication": <number>,
    "confidence": <number>,
    "overall": <number>
  },
  "feedback": {
    "strengths": ["string", "string"],
    "weaknesses": ["string", "string"],
    "mistakes": ["string", "string"],
    "improvements": ["string", "string"],
    "learningRoadmap": ["string", "string"],
    "recommendedResources": ["string", "string"]
  }
}
Return ONLY the JSON object. No markdown.`;

    const response = await callGeminiDirectly({ prompt, temperature: 0.6 });
    let parsed;
    try {
      parsed = parseStructuredJson(response.text);
    } catch (e) {
      console.error("JSON parse error on finalize:", e);
      // Fallback dummy data if parse fails
      parsed = {
        scores: { technical: 70, communication: 75, confidence: 70, overall: 72 },
        feedback: { strengths: ["Good attempt"], weaknesses: ["Needs polish"], mistakes: [], improvements: ["Practice more"], learningRoadmap: ["Review fundamentals"], recommendedResources: [] }
      };
    }

    interview.scores = parsed.scores;
    interview.feedback = parsed.feedback;
    interview.status = 'completed';
    interview.completedAt = new Date();
    await interview.save();

    // Update UserCareerState
    try {
      const completedInterviews = await Interview.find({ userId: req.user.id, status: 'completed' });
      const totalCount = completedInterviews.length;
      let avgOverall = 0;
      let bestRole = interview.jobRole;
      let bestScore = 0;

      if (totalCount > 0) {
        const totalScoreSum = completedInterviews.reduce((sum, inv) => sum + (inv.scores?.overall || 0), 0);
        avgOverall = Math.round(totalScoreSum / totalCount);

        completedInterviews.forEach(inv => {
          if ((inv.scores?.overall || 0) > bestScore) {
            bestScore = inv.scores.overall;
            bestRole = inv.jobRole;
          }
        });
      }

      let readinessLevel = 'beginner';
      if (avgOverall >= 85) readinessLevel = 'confident';
      else if (avgOverall >= 70) readinessLevel = 'ready';

      const UserCareerState = require('../models/UserCareerState');
      await UserCareerState.findOneAndUpdate(
        { userId: String(req.user.id) },
        {
          $set: {
            currentStage: 'interview-prep',
            'interviewState.totalInterviews': totalCount,
            'interviewState.avgScore': avgOverall,
            'interviewState.bestRole': bestRole,
            'interviewState.readinessLevel': readinessLevel,
            'interviewState.lastInterviewAt': new Date()
          }
        },
        { upsert: true }
      );
    } catch (stateErr) {
      console.warn('Could not update UserCareerState on interview completion:', stateErr.message);
    }

    res.json({ success: true, data: interview });
  } catch (error) {
    console.error('Error finalizing interview:', error);
    res.status(500).json({ success: false, message: 'Failed to finalize interview.' });
  }
};

// @desc    Get user's interview history
// @route   GET /api/interview/history
// @access  Private
const getHistory = async (req, res) => {
  try {
    const interviews = await Interview.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, data: interviews });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch history.' });
  }
};

// @desc    Get specific interview
// @route   GET /api/interview/:id
// @access  Private
const getInterview = async (req, res) => {
  try {
    const interview = await Interview.findOne({ _id: req.params.id, userId: req.user.id });
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found.' });
    }
    res.json({ success: true, data: interview });
  } catch (error) {
    console.error('Error fetching interview:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch interview.' });
  }
};

// @desc    Transcribe / enhance browser-captured speech
// @route   POST /api/interview/transcribe
// @access  Private
const transcribeAudio = async (req, res) => {
  try {
    const { browserTranscript, duration, interviewId } = req.body;

    if (!browserTranscript && browserTranscript !== '') {
      return res.status(400).json({
        success: false,
        message: 'browserTranscript is required.'
      });
    }

    // Use the ASR service (BrowserTranscriptProvider by default) to enhance
    const result = await asrService.transcribe(null, {
      browserTranscript,
      duration: duration || 0
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error transcribing audio:', error);
    res.status(500).json({ success: false, message: 'Failed to transcribe audio.' });
  }
};

module.exports = {
  startInterview,
  evaluateAnswer,
  finalizeInterview,
  getHistory,
  getInterview,
  transcribeAudio
};
