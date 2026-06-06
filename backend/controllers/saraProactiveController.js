const UserCareerState = require('../models/UserCareerState');
const Assessment = require('../models/Assessment');
const Career = require('../models/Career');
const Resume = require('../models/Resume');
const Interview = require('../models/Interview');
const SavedJob = require('../models/SavedJob');

/**
 * @desc    Get proactive suggestions based on user's career journey stage
 * @route   GET /api/mentor/suggestions
 * @access  Private
 */
const getSuggestions = async (req, res) => {
  try {
    const userUid = req.user.uid || req.user.id || req.user._id;
    const userId = String(userUid);

    // Find or create UserCareerState
    let state = await UserCareerState.findOne({ userId });
    if (!state) {
      state = await UserCareerState.create({ userId, currentStage: 'new' });
    }

    // Gather real-time stats
    const assessmentCount = await Assessment.countDocuments({ userId: userUid });
    const roadmapCount = await Career.countDocuments({ userId: userUid, isGeneratedRoadmap: true });
    const resumeCount = await Resume.countDocuments({ user: req.user._id || userUid });
    const interviewCount = await Interview.countDocuments({ userId: req.user.id || userUid, status: 'completed' });
    const savedJobCount = await SavedJob.countDocuments({ userUid: userId });

    // Get latest resume score
    let resumeScore = state.resumeState?.resumeScore || 0;
    if (resumeCount > 0) {
      const latestResume = await Resume.findOne({ user: req.user._id || userUid }).sort({ updatedAt: -1 });
      if (latestResume?.analysis?.score) {
        resumeScore = latestResume.analysis.score;
      }
    }

    // Auto-detect stage if state seems stale
    let currentStage = state.currentStage;
    if (currentStage === 'new' && assessmentCount > 0) currentStage = 'dna-complete';
    if (currentStage === 'dna-complete' && roadmapCount > 0) currentStage = 'roadmap-active';
    if (currentStage === 'roadmap-active' && resumeCount > 0) currentStage = 'resume-building';
    if (currentStage === 'resume-building' && interviewCount > 0) currentStage = 'interview-prep';
    if (currentStage === 'interview-prep' && savedJobCount > 0) currentStage = 'job-hunting';

    // Update stage if changed
    if (currentStage !== state.currentStage) {
      state.currentStage = currentStage;
      await state.save();
    }

    // Build suggestion based on stage
    const topCareer = state.careerDNA?.topMatches?.[0]?.career || 'your ideal career';
    const suggestion = buildSuggestion(currentStage, state, topCareer, resumeScore, savedJobCount);
    const quickActions = buildQuickActions(currentStage, topCareer);

    // Calculate lifecycle completion
    const stageOrder = ['new', 'dna-complete', 'roadmap-active', 'resume-building', 'interview-prep', 'job-hunting', 'employed'];
    const stageIndex = stageOrder.indexOf(currentStage);
    const lifecyclePercent = Math.round((stageIndex / (stageOrder.length - 1)) * 100);

    res.json({
      success: true,
      data: {
        suggestion,
        quickActions,
        currentStage,
        lifecyclePercent,
        stats: {
          assessments: assessmentCount,
          roadmaps: roadmapCount,
          resumeScore,
          interviews: interviewCount,
          savedJobs: savedJobCount
        },
        careerDNA: state.careerDNA || null
      }
    });

  } catch (error) {
    console.error('Sara Proactive Error:', error);
    res.status(500).json({ success: false, message: 'Failed to get suggestions' });
  }
};

function buildSuggestion(stage, state, topCareer, resumeScore, savedJobCount) {
  const suggestions = {
    'new': {
      title: 'Discover Your Career DNA',
      description: 'Take an 8-question AI assessment to uncover your unique career identity, strengths, and ideal career matches.',
      actionRoute: '/career-dna',
      actionLabel: 'Start Assessment'
    },
    'dna-complete': {
      title: `Generate Your ${topCareer} Roadmap`,
      description: `Your Career DNA is ready! Build a personalized learning roadmap for ${topCareer} with projects, resources, and milestones.`,
      actionRoute: '/roadmaps',
      actionLabel: 'Generate Roadmap'
    },
    'roadmap-active': {
      title: 'Build Your Professional Resume',
      description: `Your roadmap is in progress! Start building an AI-optimized resume to showcase your growing skills.`,
      actionRoute: '/resume-builder',
      actionLabel: 'Build Resume'
    },
    'resume-building': {
      title: 'Practice with Mock Interviews',
      description: `Your resume scores ${resumeScore}/100. Sharpen your interview skills with AI-powered mock interviews.`,
      actionRoute: '/mock-interview/setup',
      actionLabel: 'Start Interview'
    },
    'interview-prep': {
      title: 'Find Your Dream Job',
      description: `Interview readiness: ${state.interviewState?.readinessLevel || 'building'}. Browse AI-matched job opportunities.`,
      actionRoute: '/jobs',
      actionLabel: 'Search Jobs'
    },
    'job-hunting': {
      title: 'Keep Applying!',
      description: `You have ${savedJobCount} saved jobs. Keep refining your applications and practicing interviews.`,
      actionRoute: '/jobs',
      actionLabel: 'View Jobs'
    },
    'employed': {
      title: 'Congratulations! Keep Growing',
      description: 'Continue developing your skills and explore new career opportunities as you grow.',
      actionRoute: '/roadmaps',
      actionLabel: 'Explore Paths'
    }
  };

  return suggestions[stage] || suggestions['new'];
}

function buildQuickActions(stage, topCareer) {
  const allActions = {
    'new': [
      { label: 'Career DNA', route: '/career-dna', icon: 'Dna', description: 'Discover your career identity' },
      { label: 'Sara AI', route: '/mentor', icon: 'MessageSquare', description: 'Chat with your AI career mentor' },
      { label: 'Explore Careers', route: '/career-simulator', icon: 'Play', description: 'Simulate a day in the life' }
    ],
    'dna-complete': [
      { label: 'Generate Roadmap', route: '/roadmaps', icon: 'Map', description: `Build your ${topCareer} path` },
      { label: 'View DNA Results', route: '/results', icon: 'Dna', description: 'Review your career profile' },
      { label: 'Ask Sara', route: '/mentor', icon: 'MessageSquare', description: 'Get personalized career advice' }
    ],
    'roadmap-active': [
      { label: 'My Roadmap', route: '/roadmaps', icon: 'Map', description: 'Continue your learning path' },
      { label: 'Build Resume', route: '/resume-builder', icon: 'FileText', description: 'Create your professional resume' },
      { label: 'Skill Analysis', route: '/skill-gap', icon: 'BarChart3', description: 'Analyze your skill gaps' }
    ],
    'resume-building': [
      { label: 'My Resume', route: '/resume-builder', icon: 'FileText', description: 'Polish your resume' },
      { label: 'Mock Interview', route: '/mock-interview/setup', icon: 'Mic', description: 'Practice interview skills' },
      { label: 'My Roadmap', route: '/roadmaps', icon: 'Map', description: 'Track learning progress' }
    ],
    'interview-prep': [
      { label: 'Mock Interview', route: '/mock-interview/setup', icon: 'Mic', description: 'Keep practicing' },
      { label: 'Job Search', route: '/jobs', icon: 'Briefcase', description: 'Find matching opportunities' },
      { label: 'Resume', route: '/resume-builder', icon: 'FileText', description: 'Optimize for applications' }
    ],
    'job-hunting': [
      { label: 'Job Search', route: '/jobs', icon: 'Briefcase', description: 'Browse opportunities' },
      { label: 'Mock Interview', route: '/mock-interview/setup', icon: 'Mic', description: 'Stay sharp' },
      { label: 'Ask Sara', route: '/mentor', icon: 'MessageSquare', description: 'Get application tips' }
    ],
    'employed': [
      { label: 'New Roadmap', route: '/roadmaps', icon: 'Map', description: 'Explore growth paths' },
      { label: 'Skill Trends', route: '/skill-gap', icon: 'BarChart3', description: 'Stay market-relevant' },
      { label: 'Ask Sara', route: '/mentor', icon: 'MessageSquare', description: 'Plan your next move' }
    ]
  };

  return allActions[stage] || allActions['new'];
}

module.exports = { getSuggestions };
