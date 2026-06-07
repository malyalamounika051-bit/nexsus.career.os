const Opportunity = require('../models/Opportunity');
const UserOpportunity = require('../models/UserOpportunity');
const Resume = require('../models/Resume');
const CareerGPS = require('../models/CareerGPS');
const { awardXP } = require('../utils/gamification');
const axios = require('axios');

// Escape regex special characters
const escapeRegex = (str = '') => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Helper to verify URL status
const verifyUrl = async (url) => {
  try {
    const response = await axios.get(url, {
      timeout: 3000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      validateStatus: () => true // resolve for any status code
    });
    
    const status = response.status;
    if (status === 200) {
      return 'verified';
    }
    if ([404, 410, 500, 403].includes(status)) {
      return 'broken';
    }
    return 'verified';
  } catch (err) {
    return 'broken';
  }
};

// Deduplication and Merger Logic
const detectAndMergeDuplicate = async (oppData) => {
  // 1. Direct URL match check
  let existing = await Opportunity.findOne({ applicationUrl: oppData.applicationUrl });
  if (existing) {
    return existing;
  }

  // 2. Check title similarity + organization + type match
  const matches = await Opportunity.find({
    organization: { $regex: new RegExp('^' + escapeRegex(oppData.organization) + '$', 'i') },
    type: oppData.type,
    status: 'active'
  });

  for (const match of matches) {
    const words1 = new Set(match.title.toLowerCase().split(/\s+/));
    const words2 = new Set(oppData.title.toLowerCase().split(/\s+/));
    
    let intersection = 0;
    words1.forEach(w => {
      if (words2.has(w)) intersection++;
    });
    
    const maxWords = Math.max(words1.size, words2.size);
    const similarity = intersection / maxWords;

    if (similarity >= 0.8) {
      // Merge fields: prefer higher trust score source
      if (oppData.sourceScore > match.sourceScore) {
        match.source = oppData.source;
        match.sourceScore = oppData.sourceScore;
        match.applicationUrl = oppData.applicationUrl;
      }
      
      const mergedSkills = Array.from(new Set([...match.requiredSkills, ...oppData.requiredSkills]));
      match.requiredSkills = mergedSkills;
      match.lastVerified = new Date();
      await match.save();
      return match;
    }
  }

  return null;
};

// Seeder MOCK DATA with live official URLs
const MOCK_OPPORTUNITIES = [
  {
    title: 'Google Summer of Code 2026',
    organization: 'Google Open Source',
    type: 'open-source',
    description: 'A global, online program focused on bringing new contributors into open source software development. Contributors work with an open-source organization on a 12-week programming project.',
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    applicationUrl: 'https://summerofcode.withgoogle.com',
    eligibility: 'Student or open-source newcomer, 18+ years old',
    requiredSkills: ['Git', 'Python', 'JavaScript', 'C++', 'Go', 'Open Source'],
    location: 'Remote',
    source: 'Official Google Portal',
    sourceScore: 100,
    tags: ['Open Source', 'Mentorship', 'Stipend']
  },
  {
    title: 'Google STEP Internship 2026',
    organization: 'Google',
    type: 'internship',
    description: 'Student Training in Engineering Program (STEP) is a 10-12 week internship for undergraduate students with a passion for computer science.',
    deadline: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
    applicationUrl: 'https://careers.google.com/students',
    eligibility: 'CS Undergraduate student',
    requiredSkills: ['Python', 'Java', 'Data Structures', 'Algorithms'],
    location: 'Bangalore, India',
    source: 'Google Careers Page',
    sourceScore: 100,
    tags: ['Internship', 'CS Fundamentals']
  },
  {
    title: 'Smart India Hackathon 2026',
    organization: 'Ministry of Education, India',
    type: 'hackathon',
    description: 'SIH is a nationwide initiative to provide students with a platform to solve pressing problems, thus inculcating a culture of product innovation.',
    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    applicationUrl: 'https://sih.gov.in',
    eligibility: 'All Indian College Students',
    requiredSkills: ['Problem Solving', 'Web Development', 'Mobile App', 'AI/ML'],
    location: 'India',
    source: 'SIH Ministry Portal',
    sourceScore: 100,
    tags: ['Hackathon', 'National level']
  },
  {
    title: 'Outreachy Internship Cohort',
    organization: 'Outreachy',
    type: 'open-source',
    description: 'Outreachy provides 3-month paid, remote internships for people underrepresented in tech to work on open-source projects.',
    deadline: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
    applicationUrl: 'https://www.outreachy.org',
    eligibility: 'Underrepresented people in tech',
    requiredSkills: ['Git', 'Python', 'JavaScript', 'HTML/CSS'],
    location: 'Remote',
    source: 'Outreachy Website',
    sourceScore: 98,
    tags: ['Open Source', 'Diversity']
  },
  {
    title: 'Devpost Generative AI Hackathon',
    organization: 'Devpost & Microsoft',
    type: 'hackathon',
    description: 'Build cutting-edge generative AI applications using Azure OpenAI Services and compete for global prizes.',
    deadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    applicationUrl: 'https://devpost.com',
    eligibility: 'Open to developers worldwide, 18+',
    requiredSkills: ['Python', 'OpenAI API', 'React', 'Generative AI'],
    location: 'Remote',
    source: 'Devpost Platform',
    sourceScore: 95,
    tags: ['Hackathon', 'AI']
  },
  {
    title: 'Kaggle Grand Prix AI Challenge',
    organization: 'Kaggle',
    type: 'competition',
    description: 'Develop advanced machine learning models to predict climate impact patterns. Top teams win prizes.',
    deadline: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000),
    applicationUrl: 'https://www.kaggle.com',
    eligibility: 'Open to all Kaggle accounts',
    requiredSkills: ['Machine Learning', 'Python', 'PyTorch', 'TensorFlow'],
    location: 'Remote',
    source: 'Kaggle Competitions Hub',
    sourceScore: 100,
    tags: ['Competition', 'Data Science']
  },
  {
    title: 'Reliance Foundation Scholarship',
    organization: 'Reliance Foundation',
    type: 'scholarship',
    description: 'Scholarship supporting meritorious undergraduate students in India to pursue higher education.',
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    applicationUrl: 'https://www.reliancefoundation.org',
    eligibility: 'Indian students, household income < 15 LPA',
    requiredSkills: ['Academic Record'],
    location: 'India',
    source: 'Reliance Official Portal',
    sourceScore: 98,
    tags: ['Scholarship', 'Merit']
  },
  {
    title: 'Stripe Software Engineering Internship',
    organization: 'Stripe',
    type: 'internship',
    description: 'Work alongside Stripe engineers to build billing infrastructures and payment APIs.',
    deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    applicationUrl: 'https://stripe.com',
    eligibility: 'Computer Science student',
    requiredSkills: ['Java', 'Ruby', 'SQL', 'Algorithms'],
    location: 'Remote',
    source: 'Stripe Careers',
    sourceScore: 100,
    tags: ['Internship', 'Fintech']
  }
];

// Helper to calculate score and reasons
const calculateOpportunityMatch = (opportunity, userSkills, gpsDestination) => {
  let skillMatchCount = 0;
  const matchedSkills = [];

  const oppSkillsNormalized = (opportunity.requiredSkills || []).map(s => s.toLowerCase().trim());
  const userSkillsNormalized = userSkills.map(s => s.toLowerCase().trim());

  oppSkillsNormalized.forEach(oppSkill => {
    const matched = userSkillsNormalized.some(userSkill => 
      userSkill.includes(oppSkill) || oppSkill.includes(userSkill)
    );
    if (matched) {
      skillMatchCount++;
      matchedSkills.push(oppSkill);
    }
  });

  const totalOppSkills = oppSkillsNormalized.length;
  const skillScore = totalOppSkills > 0 ? (skillMatchCount / totalOppSkills) * 100 : 75;

  let careerScore = 50;
  const reasons = [];

  if (gpsDestination) {
    const dest = gpsDestination.toLowerCase();
    const title = opportunity.title.toLowerCase();
    const desc = opportunity.description.toLowerCase();
    const tags = (opportunity.tags || []).map(t => t.toLowerCase());

    const isAiDev = dest.includes('ai') || dest.includes('machine learning') || dest.includes('data');
    const isWebDev = dest.includes('web') || dest.includes('developer') || dest.includes('frontend') || dest.includes('backend') || dest.includes('stack');

    const oppMatchesCareer = 
      title.includes(dest) || 
      desc.includes(dest) || 
      tags.some(t => dest.includes(t)) ||
      (isAiDev && (title.includes('ai') || title.includes('machine learning') || title.includes('kaggle'))) ||
      (isWebDev && (title.includes('developer') || title.includes('internship') || title.includes('sih')));

    if (oppMatchesCareer) {
      careerScore = 95;
      reasons.push(`${gpsDestination} Path`);
    } else {
      reasons.push(`Exploratory Option`);
    }
  } else {
    reasons.push('General Growth');
  }

  matchedSkills.slice(0, 2).forEach(sk => {
    const formattedSkill = sk.charAt(0).toUpperCase() + sk.slice(1);
    reasons.push(`${formattedSkill} Skills`);
  });

  if (reasons.length <= 1) {
    if (opportunity.type === 'open-source') reasons.push('Open Source interest');
    if (opportunity.type === 'hackathon') reasons.push('Hands-on Projects');
  }

  const finalScoreRaw = (skillScore * 0.45) + (careerScore * 0.45) + ((opportunity.sourceScore || 70) * 0.1);
  const matchScore = Math.max(50, Math.min(99, Math.round(finalScoreRaw)));

  return {
    matchScore,
    whyRecommended: reasons.slice(0, 3)
  };
};

// Re-verification engine job
const reVerifyActiveOpportunities = async () => {
  try {
    const activeOpps = await Opportunity.find({ status: 'active' });
    for (const opp of activeOpps) {
      const isPast = new Date(opp.deadline) < new Date();
      if (isPast) {
        opp.status = 'expired';
        opp.verificationStatus = 'expired';
        opp.isVerified = false;
      } else {
        const urlStatus = await verifyUrl(opp.applicationUrl);
        opp.verificationStatus = urlStatus;
        opp.isVerified = urlStatus === 'verified';
        if (urlStatus === 'broken') {
          opp.status = 'expired';
        }
      }
      opp.lastChecked = new Date();
      await opp.save();
    }
    console.log('🔄 Opportunity re-verification process complete.');
  } catch (err) {
    console.error('Error re-verifying opportunities:', err.message);
  }
};

// Track last re-verification run
let lastVerificationRun = 0;

// @desc    Seed opportunities list
// @route   GET /api/opportunities/seed
// @access  Public
const seedOpportunities = async (req, res) => {
  try {
    const count = await Opportunity.countDocuments({});
    if (count >= MOCK_OPPORTUNITIES.length) {
      return res.status(200).json({ success: true, message: 'Opportunities seeded.', count });
    }

    const created = [];
    for (const oppData of MOCK_OPPORTUNITIES) {
      const duplicate = await detectAndMergeDuplicate(oppData);
      if (duplicate) {
        created.push(duplicate);
        continue;
      }

      const isPast = new Date(oppData.deadline) < new Date();
      let verificationStatus = 'verified';
      if (isPast) {
        verificationStatus = 'expired';
      } else {
        verificationStatus = await verifyUrl(oppData.applicationUrl);
      }

      const opp = new Opportunity({
        ...oppData,
        verificationStatus,
        isVerified: verificationStatus === 'verified',
        status: (isPast || verificationStatus === 'expired' || verificationStatus === 'broken') ? 'expired' : 'active'
      });

      await opp.save();
      created.push(opp);
    }

    res.status(201).json({ success: true, message: 'Opportunities seeded & verified!', count: created.length });
  } catch (err) {
    console.error('Seeder Error:', err);
    res.status(500).json({ success: false, message: 'Seeder failed: ' + err.message });
  }
};

// @desc    Get recommended opportunities
// @route   GET /api/opportunities
// @access  Private
const listOpportunities = async (req, res) => {
  try {
    const userId = String(req.user?.uid || req.user?._id || req.user?.id);

    // Asynchronously run re-verification job in the background with a 1 hour cooldown
    if (Date.now() - lastVerificationRun > 1000 * 60 * 60) {
      lastVerificationRun = Date.now();
      reVerifyActiveOpportunities().catch(() => {});
    }

    const resume = await Resume.findOne({ user: userId });
    const userSkills = resume?.skills || [];

    const gps = await CareerGPS.findOne({ userId }).sort({ updatedAt: -1 });
    const gpsDestination = gps?.destination || '';

    // Only display verified, non-expired opportunities
    const opportunities = await Opportunity.find({
      status: 'active',
      verificationStatus: 'verified',
      deadline: { $gt: new Date() }
    });

    const userMatches = await UserOpportunity.find({ userId });
    const userMatchMap = new Map(userMatches.map(m => [String(m.opportunityId), m]));

    const recommendations = [];

    for (const opp of opportunities) {
      const interaction = userMatchMap.get(String(opp._id));

      if (interaction?.dismissed) continue;

      const { matchScore, whyRecommended } = calculateOpportunityMatch(opp, userSkills, gpsDestination);

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
        isVerified: opp.isVerified,
        verificationStatus: opp.verificationStatus,
        lastVerified: opp.lastVerified,
        matchScore: interaction?.matchScore || matchScore,
        whyRecommended: interaction?.whyRecommended || whyRecommended,
        bookmarked: interaction?.bookmarked || false,
        applied: interaction?.applied || false
      });
    }

    recommendations.sort((a, b) => b.matchScore - a.matchScore || new Date(a.deadline) - new Date(b.deadline));

    res.status(200).json({ success: true, count: recommendations.length, data: recommendations });
  } catch (err) {
    console.error('List Opportunities Error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve recommendations: ' + err.message });
  }
};

// @desc    Toggle bookmark/save opportunity (No XP awarded)
// @route   POST /api/opportunities/:id/bookmark
// @access  Private
const toggleBookmark = async (req, res) => {
  try {
    const userId = String(req.user?.uid || req.user?._id || req.user?.id);
    const opportunityId = req.params.id;

    let interaction = await UserOpportunity.findOne({ userId, opportunityId });
    if (!interaction) {
      const opp = await Opportunity.findById(opportunityId);
      if (!opp) {
        return res.status(404).json({ success: false, message: 'Opportunity not found' });
      }
      interaction = new UserOpportunity({ userId, opportunityId });
    }

    interaction.bookmarked = !interaction.bookmarked;
    interaction.status = interaction.bookmarked ? 'saved' : 'recommended';
    await interaction.save();

    res.status(200).json({ success: true, bookmarked: interaction.bookmarked });
  } catch (err) {
    console.error('Bookmark Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Mark opportunity as applied (Strict one-time XP verification)
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

    const wasXpAwarded = interaction.xpAwarded;

    interaction.applied = true;
    interaction.appliedAt = new Date();
    interaction.status = 'applied';

    let xpEarned = false;

    // Grant +50 XP exactly once per opportunity
    if (!wasXpAwarded) {
      interaction.xpAwarded = true;
      xpEarned = true;
      await awardXP(userId, 'OPPORTUNITY_APPLIED').catch(() => {});
    }

    await interaction.save();

    res.status(200).json({ 
      success: true, 
      xpAwarded: xpEarned, 
      message: xpEarned ? 'Opportunity marked as applied! +50 XP earned.' : 'Opportunity marked as applied!'
    });
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
