process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
require('dotenv').config();
const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const Assessment = require('./models/Assessment');
const Career = require('./models/Career');

const computeScores = (answers) => {
  const scores = { technical: 0, creative: 0, analytical: 0, leadership: 0, communication: 0 };
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

const matchCareers = (scores, careers) => {
  const maxPossible = 15;
  return careers.map((career) => {
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
};

const updateLast = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const assessment = await Assessment.findOne().sort({ createdAt: -1 });
    if (!assessment) {
      console.log('No assessment found.');
      process.exit(0);
    }
    console.log('Updating assessment:', assessment._id);
    const careers = await Career.find({});
    const result = matchCareers(assessment.scores, careers);
    assessment.result = result;
    assessment.topCareer = result[0]?.career || 'Unknown';
    await assessment.save();
    console.log('✅ Updated successfully with', result.length, 'matches.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};
updateLast();
