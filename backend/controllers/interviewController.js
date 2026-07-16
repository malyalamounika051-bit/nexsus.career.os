const { callAI, callGeminiDirectly } = require('../utils/geminiClient');
const { parseStructuredJson } = require('../utils/jsonParser');
const Interview = require('../models/Interview');
const UserProfile = require('../models/UserProfile');
const UserCareerState = require('../models/UserCareerState');
const { ASRService, SpeechAnalytics } = require('../services/asrService');

const asrService = new ASRService();

// Compile grounding profile context
const compileProfileContext = async (userId) => {
  try {
    const profile = await UserProfile.findOne({ user: userId });
    if (!profile) return 'No detailed candidate profile found.';

    const education = (profile.education || []).map(e => `${e.degree} at ${e.college} (${e.startYear}-${e.endYear})`).join(', ');
    const skills = (profile.skills || []).map(s => `${s.name} (${s.proficiency})`).join(', ');
    const projects = (profile.projects || []).map(p => `${p.title}: ${p.shortDescription || ''}. Tech: ${(p.technologies || []).join(', ')}`).join('\n');
    const experience = (profile.experience || []).map(exp => `${exp.role} at ${exp.company} (${exp.startDate}-${exp.endDate})`).join('\n');

    return `
Candidate Target Roles: ${(profile.preferences?.preferredRoles || []).join(', ') || 'Software Engineer'}
Candidate Education: ${education || 'N/A'}
Candidate Skills: ${skills || 'N/A'}
Candidate Projects:
${projects || 'None'}
Candidate Work Experience:
${experience || 'None'}
`;
  } catch (err) {
    console.error('Error compiling profile context:', err);
    return 'Candidate profile fetch failed.';
  }
};

// @desc    Start adaptive interview simulation & generate first customized question
// @route   POST /api/interview/start
// @access  Private
const startInterview = async (req, res) => {
  try {
    const { jobRole, difficulty, track, company, experienceLevel, durationLimit, language } = req.body;
    const userId = req.user.id;

    if (!jobRole || !difficulty) {
      return res.status(400).json({ success: false, message: 'Job role and difficulty are required.' });
    }

    const profileContext = await compileProfileContext(userId);

    // Prompt to generate the initial greeting + first question
    const prompt = `You are a supportive, friendly, encouraging, and patient AI Interviewer at ${company || 'a premier technology firm'}.
You are conducting a "${track || 'Technical'}" interview for a candidate seeking a "${jobRole}" role.
Candidate experience level: ${experienceLevel || 'Entry'}. Selected difficulty: ${difficulty}.
Target candidate profile context:
${profileContext}

CRITICAL DIFFICULTY CONSTRAINTS:
- For Beginner/Intern or Entry Level: You MUST ask only basic fundamentals (e.g. tell me about yourself, walk me through a simple project, let vs var, basic OOP, array vs object, HTML/CSS/JS basics). Do NOT ask about system design, scalability, load balancing, microservices, Kubernetes, CAP theorem, or complex caching tiers.
- For Intermediate/Experienced: Mix concepts, projects, scenario problems, and practical API trade-offs.
- For Senior: Allow deep architectural questions, leadership, distributed scale, load testing, and trade-offs.
- Language style: Use simple, clear English. Avoid academic jargon (e.g. instead of "explain your approach to mitigating race conditions", ask "if two users edit the same data at the same time, what problem can happen?").

Generate the EXACT first question. Return a structured JSON response.

Response JSON format:
{
  "question": "The supportive welcome message and first question to ask (e.g. 'Welcome to the interview! Let's start with an overview of your background. Could you walk me through one of your projects?')",
  "context": "Context for asking this question"
}
Return ONLY the JSON. No markdown tags.`;

    const response = await callGeminiDirectly({ prompt, temperature: 0.6 });
    let parsed;
    try {
      parsed = parseStructuredJson(response.text);
    } catch (e) {
      parsed = {
        question: `Welcome to the interview! Let's start by introducing yourself and walking me through a major project you worked on.`,
        context: 'General background grounding'
      };
    }

    const interview = await Interview.create({
      userId,
      jobRole,
      difficulty,
      track: track || 'Technical',
      company: company || '',
      experienceLevel: experienceLevel || 'Entry',
      durationLimit: durationLimit || 15,
      language: language || 'en',
      questions: [{ text: parsed.question, context: parsed.context }],
      status: 'in-progress'
    });

    res.json({ success: true, data: interview });
  } catch (error) {
    console.error('Error starting interview:', error);
    res.status(500).json({ success: false, message: 'Failed to start interview.' });
  }
};

// @desc    Evaluate response and generate next question dynamically adapting difficulty
// @route   POST /api/interview/evaluate
// @access  Private
const evaluateAnswer = async (req, res) => {
  try {
    const { interviewId, question, userAnswer, confidence, duration } = req.body;

    if (!interviewId || !question || !userAnswer) {
      return res.status(400).json({ success: false, message: 'Interview ID, question, and user answer are required.' });
    }

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found.' });
    }

    // Audio/Speech metrics compilation
    const durationSec = duration || 20;
    const computedAnalytics = SpeechAnalytics.analyse(userAnswer, durationSec);

    // Get previous dialogue history to preserve memory and avoid duplicates
    const transcriptText = interview.transcript.map(t => `Q: ${t.question}\nA: ${t.userAnswer}`).join('\n\n');

    const prompt = `You are a friendly, patient, and supportive AI Interviewer conducting a mock session.
Target role: ${interview.jobRole}. Track: ${interview.track}. Difficulty level: ${interview.difficulty}.
Candidate experience level: ${interview.experienceLevel}.
Dialogue History so far:
${transcriptText}

Previous Question: "${question}"
Candidate Answer: "${userAnswer}"

Evaluate their answer fairly:
- Do NOT expect perfect textbook answers. Accept different valid approaches.
- Do not penalize for minor grammar mistakes, accents, or hesitations.
- Assess understanding and logical thinking.
- If the answer is weak, vague, or incorrect, do NOT deduct marks. Instead, ask a supportive follow-up question (e.g. "Would you like to explain a little more?", "Can you give a simple example of how that works?").
- If their answer is strong and mentions a specific skill/project (e.g. Firebase, Python, React), generate a logical follow-up question digging into that specific detail (e.g. "Why did you choose Firebase over MongoDB?", "Which React hooks were most useful?").
- If they have answered this topic sufficiently, introduce the next question, keeping it connected to the topic.
- CRITICAL DIFFICULTY CONSTRAINTS: Keep questions strictly aligned with ${interview.difficulty}. Do NOT ask beginner candidates about load balancing, CAP theorem, or Kubernetes.
- Use simple English. Avoid complicated wording.

Respond in this EXACT JSON format:
{
  "feedback": "Friendly, constructive feedback (max 2 sentences, acknowledging their answer and giving small hints if they struggled. Do not reveal full solutions)",
  "isFollowUpNeeded": true,
  "followUpQuestion": "The next supportive, simple follow-up question or new topic question to ask."
}
Return ONLY the raw JSON.`;

    const response = await callGeminiDirectly({ prompt, temperature: 0.5 });
    const parsed = parseStructuredJson(response.text);

    // Save answer transcript
    const transcriptEntry = {
      question,
      userAnswer,
      aiFeedback: parsed.feedback,
      isFollowUp: parsed.isFollowUpNeeded || false,
      confidence: typeof confidence === 'number' ? confidence : 0.85,
      duration: durationSec,
      analytics: {
        wordsSpoken: computedAnalytics.wordsSpoken,
        speakingSpeed: computedAnalytics.speakingSpeed,
        fillerWords: computedAnalytics.fillerWords,
        fillerWordCount: computedAnalytics.fillerWordCount,
        pauseFrequency: computedAnalytics.pauseFrequency
      }
    };

    // Determine if we should end the interview (e.g., after 5-6 questions in total)
    const totalQuestionsAskedCount = interview.transcript.length + 1;
    const isCompleted = totalQuestionsAskedCount >= 6;

    // Append next question if not completed yet
    const updateData = {
      $push: { transcript: transcriptEntry }
    };

    if (!isCompleted && parsed.followUpQuestion) {
      updateData.$push.questions = { text: parsed.followUpQuestion, context: 'Conversational follow-up' };
    }

    const updatedInterview = await Interview.findByIdAndUpdate(interviewId, updateData, { new: true });

    res.json({
      success: true,
      data: {
        feedback: parsed.feedback,
        isFollowUpNeeded: parsed.isFollowUpNeeded,
        followUpQuestion: parsed.followUpQuestion,
        isCompleted,
        nextQuestionIndex: totalQuestionsAskedCount,
        nextQuestion: isCompleted ? null : parsed.followUpQuestion
      }
    });
  } catch (error) {
    console.error('Error evaluating answer:', error);
    res.status(500).json({ success: false, message: 'Failed to evaluate answer.' });
  }
};

// @desc    Finalize interview session & generate comprehensive 8-metric radar report with week-by-week roadmap
// @route   POST /api/interview/finalize
// @access  Private
const finalizeInterview = async (req, res) => {
  try {
    const { interviewId } = req.body;
    const interview = await Interview.findById(interviewId);

    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found.' });
    }

    const transcriptText = interview.transcript.map(t => `Q: ${t.question}\nA: ${t.userAnswer}\nFeedback: ${t.aiFeedback}`).join('\n\n');

    const prompt = `You are a supportive Hiring Manager. Review the transcript of this candidate's mock interview.
Target role: ${interview.jobRole}. Track: ${interview.track}. Difficulty level: ${interview.difficulty}.

Transcript:
${transcriptText}

Generate a comprehensive final report.
Assess these 8 score categories out of 100 fairly (do not give extremely low scores unless candidate performed poorly throughout):
1. Technical Knowledge (framework basics, syntax, tools)
2. Communication Skills (clarity, structuring)
3. Confidence (pacing, filler word usage)
4. Fluency (cohesion, articulation)
5. Problem Solving (handling trade-offs, logic)
6. Project Knowledge (explaining project architecture/code)
7. Role Readiness (job fit)
8. Overall Score (average weighted score)

Provide detailed lists for:
- Strengths (e.g. Good React knowledge, explained projects well, clear examples, good confidence)
- Weak Areas (e.g. Needs better JavaScript fundamentals, should explain projects with more detail)
- Mistakes Made (specifically quoting the incorrect statements candidate said)
- Topics to Revise
- Recommended Learning Resources
- Difficulty Level Achieved
- Hiring Recommendation: Must be one of "Ready", "Almost Ready", or "Needs Improvement"
- Personalized week-by-week improvement plan roadmap (four weeks, structured based on their weaknesses).

Respond in this EXACT JSON format:
{
  "scores": {
    "technical": <number>,
    "communication": <number>,
    "confidence": <number>,
    "fluency": <number>,
    "problemSolving": <number>,
    "behavioral": <number>,
    "leadership": <number>,
    "readiness": <number>,
    "overall": <number>
  },
  "feedback": {
    "strengths": ["string", "string"],
    "weaknesses": ["string", "string"],
    "mistakes": ["string", "string"],
    "improvements": ["string", "string"],
    "learningRoadmap": ["Week 1: Topic action", "Week 2: Topic action", "Week 3: Topic action", "Week 4: Topic action"],
    "recommendedResources": ["Resource name with description"],
    "difficultyLevelAchieved": "string",
    "hiringRecommendation": "Ready" | "Almost Ready" | "Needs Improvement"
  }
}
Return ONLY the raw JSON.`;

    const response = await callGeminiDirectly({ prompt, temperature: 0.5 });
    let parsed;
    try {
      parsed = parseStructuredJson(response.text);
    } catch (e) {
      console.error("Failed to parse finalize JSON report:", e);
      parsed = {
        scores: { technical: 75, communication: 75, confidence: 75, fluency: 75, problemSolving: 75, behavioral: 75, leadership: 70, readiness: 75, overall: 74 },
        feedback: {
          strengths: ["Good React knowledge", "Walked through projects well"],
          weaknesses: ["Needs better JavaScript fundamentals"],
          mistakes: [],
          improvements: ["Practice React Hooks and JavaScript array algorithms"],
          learningRoadmap: ["Week 1: Revise JavaScript", "Week 2: React Hooks", "Week 3: Practice mock interviews", "Week 4: Resume polish"],
          recommendedResources: ["MDN JavaScript Documentation"],
          difficultyLevelAchieved: interview.difficulty,
          hiringRecommendation: "Almost Ready"
        }
      };
    }

    interview.scores = parsed.scores;
    interview.feedback = parsed.feedback;
    interview.status = 'completed';
    interview.completedAt = new Date();
    await interview.save();

    // Sync metrics with UserCareerState
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
      console.warn('Failed to update UserCareerState on completion:', stateErr.message);
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
    let result;
    const durationParam = req.body.duration ? parseFloat(req.body.duration) : 0;

    if (req.file) {
      console.log(`[ASR] Transcribing audio buffer of size: ${req.file.size} bytes (${req.file.mimetype})`);
      result = await asrService.transcribe(req.file.buffer, {
        duration: durationParam
      });
    } else {
      const { browserTranscript } = req.body;
      if (!browserTranscript && browserTranscript !== '') {
        return res.status(400).json({ success: false, message: 'No audio file uploaded and browserTranscript is missing.' });
      }
      result = await asrService.transcribe(null, {
        browserTranscript,
        duration: durationParam
      });
    }

    const wordCount = result.wordCount || 0;
    const duration = result.duration || durationParam || 1;
    const wordsPerMinute = duration > 0 ? Math.round((wordCount / (duration / 60))) : 0;
    
    const rawConfidence = result.confidence || 0.90;
    const estimatedFluency = Math.round(rawConfidence * 100);
    const estimatedSpeakingSpeed = wordsPerMinute;
    const averageConfidence = rawConfidence;

    res.json({
      success: true,
      data: {
        transcript: result.transcript,
        confidence: estimatedFluency,
        duration: Math.round(duration),
        wordCount,
        wordsPerMinute,
        estimatedFluency,
        estimatedSpeakingSpeed,
        averageConfidence,
        words: result.words || [],
        analytics: result.analytics || {}
      }
    });
  } catch (error) {
    console.error('Error transcribing audio:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to transcribe audio.' });
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
