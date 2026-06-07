const Opportunity = require('../models/Opportunity');
const UserOpportunity = require('../models/UserOpportunity');
const Resume = require('../models/Resume');
const CareerGPS = require('../models/CareerGPS');
const { awardXP } = require('../utils/gamification');

// Mock data list for seeding real-world opportunities
const MOCK_OPPORTUNITIES = [
  {
    title: 'Google Summer of Code 2026',
    organization: 'Google Open Source',
    type: 'open-source',
    description: 'A global, online program focused on bringing new contributors into open source software development. Contributors work with an open-source organization on a 12-week programming project.',
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days left
    applicationUrl: 'https://summerofcode.withgoogle.com',
    eligibility: 'Student or open-source newcomer, 18+ years old',
    requiredSkills: ['Git', 'Python', 'JavaScript', 'C++', 'Go', 'Open Source'],
    location: 'Remote',
    source: 'Official Google Blog',
    sourceScore: 100,
    tags: ['Open Source', 'Mentorship', 'Stipend']
  },
  {
    title: 'STEP Internship 2026',
    organization: 'Google',
    type: 'internship',
    description: 'Student Training in Engineering Program (STEP) is a 10-12 week internship for first and second-year undergraduate students with a passion for computer science.',
    deadline: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000), // 12 days left
    applicationUrl: 'https://careers.google.com/students',
    eligibility: '1st or 2nd year CS Undergraduate student',
    requiredSkills: ['Python', 'Java', 'Data Structures', 'Algorithms'],
    location: 'Bangalore, India',
    source: 'Google Careers Page',
    sourceScore: 100,
    tags: ['Internship', 'Diversity', 'CS Fundamentals']
  },
  {
    title: 'Smart India Hackathon 2026',
    organization: 'Ministry of Education, India',
    type: 'hackathon',
    description: 'SIH is a nationwide initiative to provide students with a platform to solve some of the pressing problems we face in our daily lives, thus inculcating a culture of product innovation.',
    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days left
    applicationUrl: 'https://sih.gov.in',
    eligibility: 'All Indian College Students (teams of 6)',
    requiredSkills: ['Problem Solving', 'Web Development', 'Mobile App', 'AI/ML', 'Prototyping'],
    location: 'On-site (Various Nodal Centers)',
    source: 'Ministry of Education Portal',
    sourceScore: 100,
    tags: ['Hackathon', 'National level', 'Government']
  },
  {
    title: 'Outreachy Internship Cohort',
    organization: 'Outreachy',
    type: 'open-source',
    description: 'Outreachy provides 3-month paid, remote internships for people underrepresented in tech to work on open-source projects.',
    deadline: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
    applicationUrl: 'https://www.outreachy.org',
    eligibility: 'People subject to systemic bias or underrepresented in tech',
    requiredSkills: ['Git', 'Python', 'JavaScript', 'HTML/CSS', 'Documentation'],
    location: 'Remote',
    source: 'Outreachy Website',
    sourceScore: 98,
    tags: ['Open Source', 'Diversity', 'Stipend']
  },
  {
    title: 'Devpost Global Generative AI Hackathon',
    organization: 'Devpost & Microsoft',
    type: 'hackathon',
    description: 'Build cutting-edge generative AI applications using Azure OpenAI Services and compete for $50,000 in cash prizes and cloud credits.',
    deadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days left
    applicationUrl: 'https://generativeai.devpost.com',
    eligibility: 'Open to developers worldwide, 18+',
    requiredSkills: ['Python', 'OpenAI API', 'React', 'Generative AI', 'API Integration'],
    location: 'Remote',
    source: 'Devpost Platform',
    sourceScore: 95,
    tags: ['Hackathon', 'AI', 'Prizes']
  },
  {
    title: 'Stanford Knight-Hennessy Scholars Program',
    organization: 'Stanford University',
    type: 'scholarship',
    description: 'Fully funded graduate scholarship for students of any nationality to pursue any graduate degree at Stanford University, with leadership development.',
    deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
    applicationUrl: 'https://knight-hennessy.stanford.edu',
    eligibility: 'Applicants to Stanford graduate programs',
    requiredSkills: ['Leadership', 'Academic Excellence', 'Research', 'Analytical Skills'],
    location: 'Stanford, California',
    source: 'Stanford Portal',
    sourceScore: 100,
    tags: ['Scholarship', 'Fully Funded', 'Study Abroad']
  },
  {
    title: 'Kaggle Grand Prix AI Challenge',
    organization: 'Kaggle',
    type: 'competition',
    description: 'Develop advanced machine learning models to predict climate impact patterns in satellite imagery. Top teams will win cash prizes and Kaggle Grandmaster points.',
    deadline: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000),
    applicationUrl: 'https://www.kaggle.com/competitions',
    eligibility: 'Open to all Kaggle accounts',
    requiredSkills: ['Machine Learning', 'Python', 'PyTorch', 'TensorFlow', 'Computer Vision'],
    location: 'Remote',
    source: 'Kaggle Competitions Hub',
    sourceScore: 100,
    tags: ['Competition', 'Data Science', 'AI']
  },
  {
    title: 'Reliance Foundation Undergraduate Scholarship',
    organization: 'Reliance Foundation',
    type: 'scholarship',
    description: 'Scholarship supporting meritorious undergraduate students in India to pursue education in any stream, prioritizing students from underprivileged backgrounds.',
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    applicationUrl: 'https://www.reliancefoundation.org',
    eligibility: 'Indian students enrolled in 1st year UG degree, household income < 15 LPA',
    requiredSkills: ['Academic Record', 'Need-based Evaluation'],
    location: 'India',
    source: 'Reliance Official Portal',
    sourceScore: 98,
    tags: ['Scholarship', 'Need-based', 'Merit']
  },
  {
    title: 'GitHub Externship Program 2026',
    organization: 'GitHub India',
    type: 'open-source',
    description: 'A 3-month fellowship for college students in India to work on open source projects under the mentorship of industry veterans.',
    deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    applicationUrl: 'https://github.com/github-externship',
    eligibility: 'Undergraduate students in India',
    requiredSkills: ['Git', 'GitHub Actions', 'JavaScript', 'Node.js', 'Collaboration'],
    location: 'Remote',
    source: 'GitHub Developer Blog',
    sourceScore: 100,
    tags: ['Fellowship', 'Open Source', 'Mentorship']
  },
  {
    title: 'Wellfound Hot Startups AI Internship',
    organization: 'CognitiveLabs AI',
    type: 'internship',
    description: 'Join a fast-growing startup to build production-grade agentic search tools. You will work directly with the founding engineering team.',
    deadline: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
    applicationUrl: 'https://wellfound.com/jobs',
    eligibility: 'Proficient in Python/React, comfortable with fast pacing',
    requiredSkills: ['Python', 'Node.js', 'React', 'FastAPI', 'MongoDB'],
    location: 'Remote / hybrid',
    source: 'Wellfound Platform',
    sourceScore: 90,
    tags: ['Internship', 'Startup', 'Generative AI']
  },
  {
    title: 'Microsoft Imagine Cup Global Competition',
    organization: 'Microsoft',
    type: 'competition',
    description: 'The premier global student technology competition. Showcase your innovative startup concept utilizing Azure Cloud services.',
    deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    applicationUrl: 'https://imaginecup.microsoft.com',
    eligibility: 'Students aged 16+ (teams of up to 4)',
    requiredSkills: ['Azure', 'Cloud Architecture', 'Problem Solving', 'Pitching', 'Business Model'],
    location: 'Remote / Global Finals',
    source: 'Microsoft Education',
    sourceScore: 100,
    tags: ['Competition', 'Startup', 'Prizes']
  },
  {
    title: 'Stripe Software Engineering Internship',
    organization: 'Stripe',
    type: 'internship',
    description: 'Work alongside Stripe engineers to build billing infrastructures, payment APIs, and fraud detection layers.',
    deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    applicationUrl: 'https://stripe.com/jobs',
    eligibility: 'Penultimate year BS/MS student in Computer Science',
    requiredSkills: ['Java', 'Ruby', 'SQL', 'Data Structures', 'Systems Design'],
    location: 'Remote (US/Europe) or hybrid',
    source: 'Stripe Careers',
    sourceScore: 100,
    tags: ['Internship', 'Fintech', 'High Compensation']
  },
  {
    title: 'Y Combinator Startup School Grants',
    organization: 'Y Combinator',
    type: 'research',
    description: 'Get equity-free grants of $10,000 to jumpstart your prototype, alongside mentorship and access to the YC Founder community.',
    deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    applicationUrl: 'https://www.startupschool.org',
    eligibility: 'Early-stage founders with a working software prototype',
    requiredSkills: ['Product Design', 'Coding', 'Marketing', 'Business Pitch'],
    location: 'Remote',
    source: 'Y Combinator Portal',
    sourceScore: 100,
    tags: ['Equity-free', 'Grants', 'Startup']
  },
  {
    title: 'Outreachy Google Season of Docs',
    organization: 'Google Open Source',
    type: 'open-source',
    description: 'Season of Docs provides support for open source projects to improve their documentation and gives professional technical writers experience.',
    deadline: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000),
    applicationUrl: 'https://developers.google.com/season-of-docs',
    eligibility: 'Technical writers or documentarians worldwide',
    requiredSkills: ['Markdown', 'Git', 'Technical Writing', 'Documentation'],
    location: 'Remote',
    source: 'Google Open Source Docs',
    sourceScore: 100,
    tags: ['Open Source', 'Writing', 'Mentorship']
  },
  {
    title: 'HDFC Badhte Kadam Scholarship Program',
    organization: 'HDFC Bank',
    type: 'scholarship',
    description: 'Financial assistance program for Indian students who are facing financial hardship, helping them complete higher secondary or UG education.',
    deadline: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
    applicationUrl: 'https://www.hdfcbank.com/scholarship',
    eligibility: 'Indian students, family income < 6 LPA, minimum 60% in previous grade',
    requiredSkills: ['Academic Consistency', 'Financial Need Document'],
    location: 'India',
    source: 'HDFC Foundation Portal',
    sourceScore: 98,
    tags: ['Scholarship', 'Need-based']
  }
];

// Helper to calculate score and generate whyRecommended notes
const calculateOpportunityMatch = (opportunity, userSkills, gpsDestination) => {
  let skillMatchCount = 0;
  const matchedSkills = [];

  const oppSkillsNormalized = (opportunity.requiredSkills || []).map(s => s.toLowerCase().trim());
  const userSkillsNormalized = userSkills.map(s => s.toLowerCase().trim());

  oppSkillsNormalized.forEach(oppSkill => {
    // Exact or substring match
    const matched = userSkillsNormalized.some(userSkill => 
      userSkill.includes(oppSkill) || oppSkill.includes(userSkill)
    );
    if (matched) {
      skillMatchCount++;
      matchedSkills.push(oppSkill);
    }
  });

  // Calculate Skill Score
  const totalOppSkills = oppSkillsNormalized.length;
  const skillScore = totalOppSkills > 0 ? (skillMatchCount / totalOppSkills) * 100 : 75;

  // Calculate GPS Destination Match
  let careerScore = 50;
  const reasons = [];

  if (gpsDestination) {
    const dest = gpsDestination.toLowerCase();
    const title = opportunity.title.toLowerCase();
    const desc = opportunity.description.toLowerCase();
    const tags = (opportunity.tags || []).map(t => t.toLowerCase());

    // Check matches
    const isAiDev = dest.includes('ai') || dest.includes('machine learning') || dest.includes('data scientist');
    const isWebDev = dest.includes('web') || dest.includes('developer') || dest.includes('frontend') || dest.includes('backend') || dest.includes('stack');
    const isDesigner = dest.includes('design') || dest.includes('ui') || dest.includes('ux');

    const oppMatchesCareer = 
      title.includes(dest) || 
      desc.includes(dest) || 
      tags.some(t => dest.includes(t)) ||
      (isAiDev && (title.includes('ai') || title.includes('machine learning') || title.includes('kaggle'))) ||
      (isWebDev && (title.includes('developer') || title.includes('internship') || title.includes('sih'))) ||
      (isDesigner && (title.includes('design') || title.includes('ui') || title.includes('ux')));

    if (oppMatchesCareer) {
      careerScore = 95;
      reasons.push(`${gpsDestination} Career Path`);
    } else {
      reasons.push(`Exploratory Opportunity`);
    }
  } else {
    reasons.push('General Career Growth');
  }

  // Inject matched skills into reasons
  matchedSkills.slice(0, 2).forEach(sk => {
    // Capitalize first letter
    const formattedSkill = sk.charAt(0).toUpperCase() + sk.slice(1);
    reasons.push(`${formattedSkill} Skills`);
  });

  // Fallback reasons if empty
  if (reasons.length <= 1) {
    if (opportunity.type === 'open-source') reasons.push('Open Source interest');
    if (opportunity.type === 'hackathon') reasons.push('Hands-on Collaboration');
    if (opportunity.type === 'scholarship') reasons.push('Financial support program');
  }

  // Weightings: 45% Skill Match, 45% Career Path Alignment, 10% source score trust
  const finalScoreRaw = (skillScore * 0.45) + (careerScore * 0.45) + ((opportunity.sourceScore || 70) * 0.1);
  const matchScore = Math.max(50, Math.min(99, Math.round(finalScoreRaw)));

  return {
    matchScore,
    whyRecommended: reasons.slice(0, 3)
  };
};

// @desc    Seed opportunities list (trigger check & populate)
// @route   GET /api/opportunities/seed
// @access  Public (mock crawler trigger)
const seedOpportunities = async (req, res) => {
  try {
    const count = await Opportunity.countDocuments({});
    if (count >= 10) {
      return res.status(200).json({ success: true, message: 'Opportunities already populated.', count });
    }

    // Insert mock lists
    const created = await Opportunity.insertMany(MOCK_OPPORTUNITIES);
    res.status(201).json({ success: true, message: 'Opportunities seeded successfully!', count: created.length });
  } catch (err) {
    console.error('Seeder Error:', err);
    res.status(500).json({ success: false, message: 'Seeder failed: ' + err.message });
  }
};

// @desc    Get recommended opportunities for logged-in user
// @route   GET /api/opportunities
// @access  Private
const listOpportunities = async (req, res) => {
  try {
    const userId = String(req.user?.uid || req.user?._id || req.user?.id);

    // Fetch user resume skills
    const resume = await Resume.findOne({ user: userId });
    const userSkills = resume?.skills || [];

    // Fetch user active GPS destination
    const gps = await CareerGPS.findOne({ userId }).sort({ updatedAt: -1 });
    const gpsDestination = gps?.destination || '';

    // Fetch all active opportunities
    const opportunities = await Opportunity.find({ status: 'active', deadline: { $gt: new Date() } });

    // Fetch user interactions (to filter out dismissed or see bookmark/applied status)
    const userMatches = await UserOpportunity.find({ userId });
    const userMatchMap = new Map(userMatches.map(m => [String(m.opportunityId), m]));

    const recommendations = [];

    for (const opp of opportunities) {
      const interaction = userMatchMap.get(String(opp._id));

      // Skip dismissed
      if (interaction?.dismissed) continue;

      // Calculate matching score dynamically
      const { matchScore, whyRecommended } = calculateOpportunityMatch(opp, userSkills, gpsDestination);

      // Save/cache interaction record in db dynamically
      if (!interaction) {
        await UserOpportunity.create({
          userId,
          opportunityId: opp._id,
          matchScore,
          whyRecommended,
          status: 'recommended'
        });
      }

      recommendations.push({
        _id: opp._id,
        title: opp.title,
        organization: opp.organization,
        type: opp.type,
        description: opp.description,
        deadline: opp.deadline,
        applicationUrl: opp.applicationUrl,
        eligibility: opp.eligibility,
        requiredSkills: opp.requiredSkills,
        location: opp.location,
        source: opp.source,
        tags: opp.tags,
        matchScore: interaction?.matchScore || matchScore,
        whyRecommended: interaction?.whyRecommended || whyRecommended,
        bookmarked: interaction?.bookmarked || false,
        applied: interaction?.applied || false
      });
    }

    // Sort by Match Score descending, and secondarily by deadline ascending (urgency)
    recommendations.sort((a, b) => b.matchScore - a.matchScore || new Date(a.deadline) - new Date(b.deadline));

    res.status(200).json({ success: true, count: recommendations.length, data: recommendations });
  } catch (err) {
    console.error('List Opportunities Error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve recommendations: ' + err.message });
  }
};

// @desc    Toggle bookmark/save opportunity
// @route   POST /api/opportunities/:id/bookmark
// @access  Private
const toggleBookmark = async (req, res) => {
  try {
    const userId = String(req.user?.uid || req.user?._id || req.user?.id);
    const opportunityId = req.params.id;

    let interaction = await UserOpportunity.findOne({ userId, opportunityId });
    if (!interaction) {
      // Find opportunity to calculate defaults
      const opp = await Opportunity.findById(opportunityId);
      if (!opp) {
        return res.status(404).json({ success: false, message: 'Opportunity not found' });
      }
      interaction = new UserOpportunity({ userId, opportunityId });
    }

    interaction.bookmarked = !interaction.bookmarked;
    interaction.status = interaction.bookmarked ? 'saved' : 'recommended';
    await interaction.save();

    // Award minor XP on bookmarking
    if (interaction.bookmarked) {
      awardXP(userId, 'OPPORTUNITY_BOOKMARKED').catch(() => {});
    }

    res.status(200).json({ success: true, bookmarked: interaction.bookmarked });
  } catch (err) {
    console.error('Bookmark Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Mark opportunity as applied
// @route   POST /api/opportunities/:id/apply
// @access  Private
const applyOpportunity = async (req, res) => {
  try {
    const userId = String(req.user?.uid || req.user?._id || req.user?.id);
    const opportunityId = req.params.id;

    let interaction = await UserOpportunity.findOne({ userId, opportunityId });
    if (!interaction) {
      interaction = new UserOpportunity({ userId, opportunityId });
    }

    const alreadyApplied = interaction.applied;
    interaction.applied = true;
    interaction.status = 'applied';
    await interaction.save();

    // Award +200 XP for applying & log audit
    if (!alreadyApplied) {
      // Gamification call
      await awardXP(userId, 'OPPORTUNITY_APPLIED').catch(() => {});
    }

    res.status(200).json({ success: true, message: 'Opportunity marked as applied! +200 XP awarded.' });
  } catch (err) {
    console.error('Apply Opportunity Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Dismiss opportunity recommendation
// @route   POST /api/opportunities/:id/dismiss
// @access  Private
const dismissOpportunity = async (req, res) => {
  try {
    const userId = String(req.user?.uid || req.user?._id || req.user?.id);
    const opportunityId = req.params.id;

    let interaction = await UserOpportunity.findOne({ userId, opportunityId });
    if (!interaction) {
      interaction = new UserOpportunity({ userId, opportunityId });
    }

    interaction.dismissed = true;
    interaction.status = 'dismissed';
    await interaction.save();

    res.status(200).json({ success: true, message: 'Opportunity dismissed.' });
  } catch (err) {
    console.error('Dismiss Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  seedOpportunities,
  listOpportunities,
  toggleBookmark,
  applyOpportunity,
  dismissOpportunity
};
