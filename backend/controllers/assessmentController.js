const Assessment = require('../models/Assessment');
const Career = require('../models/Career');
const User = require('../models/User');
const UserCareerState = require('../models/UserCareerState');
const { awardXP } = require('../utils/gamification');

// Scoring engine: compute user category scores from answers
const computeScores = (answers) => {
  const scores = { technical: 0, creative: 0, analytical: 0, leadership: 0, communication: 0 };

  const scoreMap = {
    // Q1: What energizes you most?
    'building_creating': { technical: 3, creative: 2 },
    'analyzing_data': { analytical: 3, technical: 1 },
    'leading_teams': { leadership: 3, communication: 2 },
    'helping_people': { communication: 3, leadership: 1 },
    'designing_experiences': { creative: 3, analytical: 1 },

    // Q2: What's your work style?
    'highly_technical': { technical: 3, analytical: 2 },
    'creative_innovative': { creative: 3, technical: 1 },
    'strategic_planning': { analytical: 3, leadership: 2 },
    'people_focused': { communication: 3, leadership: 1 },

    // Q3: Comfort with coding/technology?
    'very_comfortable': { technical: 4 },
    'somewhat_comfortable': { technical: 2, analytical: 1 },
    'prefer_no_coding': { creative: 1, communication: 1 },
    'open_to_learning': { technical: 1, analytical: 1 },

    // Q4: Career priority?
    'fast_growth': { leadership: 2, technical: 1 },
    'high_income': { analytical: 1, technical: 1 },
    'creative_freedom': { creative: 3 },
    'social_impact': { communication: 2, leadership: 1 },
    'work_life_balance': { communication: 1 },

    // Q5: Preferred project type?
    'practical_projects': { technical: 2, analytical: 1 },
    'research_study': { analytical: 3, technical: 1 },
    'team_collaboration': { communication: 2, leadership: 1 },
    'solo_innovation': { creative: 3, technical: 1 },

    // Q6: Education level (minor influence)
    'high_school': {},
    'undergraduate': { analytical: 1 },
    'graduate': { analytical: 2, leadership: 1 },
    'self_taught': { technical: 2, creative: 1 },

    // Q7: Preferred learning style?
    'videos_courses': { technical: 1 },
    'books_articles': { analytical: 2 },
    'hands_on': { technical: 2, creative: 1 },
    'mentorship': { communication: 1, leadership: 1 },

    // Q8: Domain of interest?
    'tech_ai': { technical: 4, analytical: 2 },
    'design_ux': { creative: 4, technical: 1 },
    'business_management': { leadership: 3, analytical: 2 },
    'healthcare': { communication: 2, analytical: 2 },
    'education': { communication: 3, leadership: 1 },
    'finance': { analytical: 4, technical: 1 },
  };

  answers.forEach(({ value }) => {
    if (value && scoreMap[value]) {
      const contribution = scoreMap[value];
      Object.keys(contribution).forEach((cat) => {
        scores[cat] = (scores[cat] || 0) + contribution[cat];
      });
    }
  });

  return scores;
};

// Match careers using cosine-similarity-like dot product
const matchCareers = (scores, careers) => {
  const maxPossible = 15; // rough max score per category
  return careers.map((career) => {
    let dot = 0;
    let total = 0;
    const cats = ['technical', 'creative', 'analytical', 'leadership', 'communication'];
    cats.forEach((cat) => {
      const weights = career.weights || { technical: 1, creative: 1, analytical: 1, leadership: 1, communication: 1 };
      const weight = weights[cat] || 0;
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
};

// Career DNA archetype engine
const computeCareerDNA = (scores) => {
  const { technical = 0, creative = 0, analytical = 0, leadership = 0, communication = 0 } = scores;
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
  const dna = archetypes[key1] || archetypes[key2] || archetypes['technical-analytical'];

  return dna;
};

// @desc   Submit assessment
// @route  POST /api/assessments
// @access Private
const submitAssessment = async (req, res) => {
  try {
    const { answers } = req.body;
    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ success: false, message: 'Answers array required' });
    }

    const scores = computeScores(answers);
    const careers = await Career.find({});
    const result = matchCareers(scores, careers);

    // Determine Career DNA archetype from scores
    const careerDNA = computeCareerDNA(scores);

    const assessment = await Assessment.create({
      userId: req.user.id,
      answers,
      scores,
      result,
      topCareer: result[0]?.career || 'Unknown',
      careerDNA,
    });

    // Update User stats (increment assessment count and award XP)
    try {
      // Increment user assessment count
      await User.findByIdAndUpdate(req.user.id, { $inc: { assessmentCount: 1 } });

      // Award XP for assessment completion (async, non-blocking)
      awardXP(req.user.id, 'ASSESSMENT_COMPLETED').catch(() => {});

      // Upsert UserCareerState
      await UserCareerState.findOneAndUpdate(
        { userId: String(req.user.id) },
        {
          $set: {
            currentStage: 'dna-complete',
            careerDNA: {
              archetype: careerDNA.archetype,
              traitScores: {
                technical: scores.technical || 0,
                creative: scores.creative || 0,
                analytical: scores.analytical || 0,
                leadership: scores.leadership || 0,
                communication: scores.communication || 0
              },
              topMatches: result.map(r => ({ career: r.career, matchPercent: r.match })),
              assessmentCount: 1,
              lastAssessedAt: new Date()
            }
          }
        },
        { upsert: true, new: true }
      );
    } catch (userUpdateErr) {
      console.warn('Could not update user stats or career state:', userUpdateErr.message);
    }

    res.status(201).json({ success: true, data: assessment });
  } catch (error) {
    console.error('Assessment error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during assessment' });
  }
};

// @desc   Get all assessments for logged-in user
// @route  GET /api/assessments
// @access Private
const getUserAssessments = async (req, res) => {
  try {
    const assessments = await Assessment.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, count: assessments.length, data: assessments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc   Get single assessment by ID
// @route  GET /api/assessments/:id
// @access Private
const getAssessmentById = async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id);
    if (!assessment) {
      return res.status(404).json({ success: false, message: 'Assessment not found' });
    }
    if (assessment.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    res.json({ success: true, data: assessment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { submitAssessment, getUserAssessments, getAssessmentById };
