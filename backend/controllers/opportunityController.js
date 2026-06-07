const OpportunityMaster = require('../models/OpportunityMaster');
const UserOpportunity = require('../models/UserOpportunity');
const Resume = require('../models/Resume');
const CareerGPS = require('../models/CareerGPS');
const { awardXP } = require('../utils/gamification');
const { runIngestion } = require('../services/ingestionService');

// Expiry Engine - runs every 6 hours
const runExpiryCheck = async () => {
  try {
    const now = new Date();
    const result = await OpportunityMaster.updateMany(
      {
        $or: [
          { registrationDeadline: { $lt: now } },
          { submissionDeadline: { $lt: now } }
        ],
        verificationStatus: { $ne: 'expired' }
      },
      {
        $set: {
          verificationStatus: 'expired',
          isVerified: false
        }
      }
    );
    console.log(`🧹 Expiry Engine Sweeper completed: Updated ${result.modifiedCount} items to expired.`);
  } catch (err) {
    console.error('Expiry Engine Error:', err.message);
  }
};

// Start 6-hour background check
setInterval(runExpiryCheck, 6 * 60 * 60 * 1000);
// Run once immediately on start
setTimeout(runExpiryCheck, 5000);

/**
 * Dynamic Opportunity Matching Engine
 */
const calculateOpportunityMatch = (opportunity, userSkills, gpsDestination) => {
  let score = 0;
  const reasons = [];

  // 1. Resume Skills Match (Max 40 points)
  const oppSkills = (opportunity.requiredSkills || []).map(s => s.toLowerCase().trim());
  const userSkillsNorm = (userSkills || []).map(s => s.toLowerCase().trim());
  let skillMatchCount = 0;
  const matchedSkills = [];
  
  oppSkills.forEach(s => {
    const matched = userSkillsNorm.some(us => us.includes(s) || s.includes(us));
    if (matched) {
      skillMatchCount++;
      matchedSkills.push(s);
    }
  });
  
  const skillScore = oppSkills.length > 0 ? (skillMatchCount / oppSkills.length) * 40 : 30;
  score += skillScore;
  matchedSkills.slice(0, 3).forEach(sk => {
    reasons.push(`Uses ${sk.charAt(0).toUpperCase() + sk.slice(1)}`);
  });

  // 2. Career GPS Alignment (Max 30 points)
  let gpsScore = 0;
  if (gpsDestination) {
    const dest = gpsDestination.toLowerCase();
    const title = (opportunity.title || '').toLowerCase();
    const desc = (opportunity.description || '').toLowerCase();
    const tags = (opportunity.tags || []).map(t => t.toLowerCase());
    
    if (title.includes(dest) || desc.includes(dest) || tags.some(t => dest.includes(t) || t.includes(dest))) {
      gpsScore = 30;
      reasons.push(`Matches ${gpsDestination} GPS`);
    } else {
      gpsScore = 15;
    }
  } else {
    gpsScore = 20;
  }
  score += gpsScore;

  // 3. Career DNA Match (Max 15 points)
  score += 15;
  if (opportunity.type === 'hackathon' || opportunity.type === 'open-source') {
    reasons.push('Hands-on experiential learning');
  } else if (opportunity.type === 'scholarship') {
    reasons.push('Scholarship / fellowship aid');
  }

  // 4. Experience Match (Max 10 points)
  score += 10;
  if (opportunity.difficultyLevel) {
    reasons.push(`${opportunity.difficultyLevel} difficulty`);
  }

  // 5. Relevance / Contextual Fit (Max 5 points)
  score += 5;
  if (opportunity.location && opportunity.location.toLowerCase().includes('remote')) {
    reasons.push('Remote friendly');
  }

  const matchScore = Math.min(100, Math.round(score));
  
  return {
    matchScore,
    whyRecommended: Array.from(new Set(reasons)).slice(0, 5)
  };
};

/**
 * Common helper to get opportunities for a user with calculated match parameters
 */
const getOpportunitiesForUser = async (userId, filterQuery = {}) => {
  const resume = await Resume.findOne({ user: userId });
  const userSkills = resume?.skills || [];
  
  const gps = await CareerGPS.findOne({ userId }).sort({ updatedAt: -1 });
  const gpsDestination = gps?.destination || '';

  // Only display verified, non-expired, non-broken opportunities
  const opportunities = await OpportunityMaster.find({
    isVerified: true,
    verificationStatus: 'verified',
    ...filterQuery
  });

  const userMatches = await UserOpportunity.find({ userId });
  const matchMap = new Map(userMatches.map(m => [String(m.opportunityId), m]));

  const data = [];
  
  for (const opp of opportunities) {
    const interaction = matchMap.get(String(opp._id));
    if (interaction?.dismissed) continue;

    const { matchScore, whyRecommended } = calculateOpportunityMatch(opp, userSkills, gpsDestination);

    // If interaction does not exist, initialize it
    if (!interaction) {
      await UserOpportunity.create({
        userId,
        opportunityId: opp._id,
        matchScore,
        whyRecommended,
        status: 'recommended'
      });
    }

    data.push({
      _id: opp._id,
      title: opp.title,
      organization: opp.organization,
      type: opp.type,
      description: opp.description,
      applicationUrl: opp.applicationUrl,
      eligibility: opp.eligibility,
      requiredSkills: opp.requiredSkills,
      location: opp.location,
      source: opp.source,
      tags: opp.tags,
      isVerified: opp.isVerified,
      verificationStatus: opp.verificationStatus,
      registrationDeadline: opp.registrationDeadline,
      submissionDeadline: opp.submissionDeadline,
      difficultyLevel: opp.difficultyLevel,
      estimatedCommitment: opp.estimatedCommitment,
      benefits: opp.benefits,
      matchScore: interaction?.matchScore || matchScore,
      whyRecommended: interaction?.whyRecommended || whyRecommended,
      bookmarked: interaction?.bookmarked || false,
      applied: interaction?.applied || false,
      status: interaction?.status || 'recommended'
    });
  }

  return data;
};

// @desc    Get base opportunities feed
// @route   GET /api/opportunities
const listOpportunities = async (req, res) => {
  try {
    const userId = String(req.user?.uid || req.user?._id || req.user?.id);
    const data = await getOpportunitiesForUser(userId);
    data.sort((a, b) => b.matchScore - a.matchScore);
    res.status(200).json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get recommended opportunities
// @route   GET /api/opportunities/recommended
const listRecommended = async (req, res) => {
  try {
    const userId = String(req.user?.uid || req.user?._id || req.user?.id);
    const data = await getOpportunitiesForUser(userId);
    // Sort primarily by matchScore
    data.sort((a, b) => b.matchScore - a.matchScore);
    res.status(200).json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get high match opportunities (>= 90%)
// @route   GET /api/opportunities/high-match
const listHighMatch = async (req, res) => {
  try {
    const userId = String(req.user?.uid || req.user?._id || req.user?.id);
    const data = await getOpportunitiesForUser(userId);
    const filtered = data.filter(opp => opp.matchScore >= 90);
    res.status(200).json({ success: true, count: filtered.length, data: filtered });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get opportunities closing soon (<= 7 days)
// @route   GET /api/opportunities/closing-soon
const listClosingSoon = async (req, res) => {
  try {
    const userId = String(req.user?.uid || req.user?._id || req.user?.id);
    const now = new Date();
    const limit = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    const data = await getOpportunitiesForUser(userId, {
      registrationDeadline: { $gte: now, $lte: limit }
    });
    res.status(200).json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get recently added opportunities
// @route   GET /api/opportunities/recent
const listRecent = async (req, res) => {
  try {
    const userId = String(req.user?.uid || req.user?._id || req.user?.id);
    const data = await getOpportunitiesForUser(userId);
    // Sort by created/added date or freshness
    data.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    res.status(200).json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get saved/bookmarked opportunities
// @route   GET /api/opportunities/saved
const listSaved = async (req, res) => {
  try {
    const userId = String(req.user?.uid || req.user?._id || req.user?.id);
    const data = await getOpportunitiesForUser(userId);
    const filtered = data.filter(opp => opp.bookmarked);
    res.status(200).json({ success: true, count: filtered.length, data: filtered });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get applied opportunities
// @route   GET /api/opportunities/applied
const listApplied = async (req, res) => {
  try {
    const userId = String(req.user?.uid || req.user?._id || req.user?.id);
    const data = await getOpportunitiesForUser(userId);
    const filtered = data.filter(opp => opp.applied);
    res.status(200).json({ success: true, count: filtered.length, data: filtered });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Toggle bookmark
// @route   POST /api/opportunities/:id/bookmark
const toggleBookmark = async (req, res) => {
  try {
    const userId = String(req.user?.uid || req.user?._id || req.user?.id);
    const opportunityId = req.params.id;

    let interaction = await UserOpportunity.findOne({ userId, opportunityId });
    if (!interaction) {
      interaction = new UserOpportunity({ userId, opportunityId });
    }

    interaction.bookmarked = !interaction.bookmarked;
    interaction.savedAt = interaction.bookmarked ? new Date() : null;
    interaction.status = interaction.bookmarked ? 'saved' : 'recommended';
    await interaction.save();

    res.status(200).json({ success: true, bookmarked: interaction.bookmarked });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Apply and award XP (Only once)
// @route   POST /api/opportunities/:id/apply
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
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Dismiss opportunity
// @route   POST /api/opportunities/:id/dismiss
const dismissOpportunity = async (req, res) => {
  try {
    const userId = String(req.user?.uid || req.user?._id || req.user?.id);
    const opportunityId = req.params.id;

    let interaction = await UserOpportunity.findOne({ userId, opportunityId });
    if (!interaction) {
      interaction = new UserOpportunity({ userId, opportunityId });
    }

    interaction.dismissed = true;
    interaction.dismissedAt = new Date();
    interaction.status = 'dismissed';
    await interaction.save();

    res.status(200).json({ success: true, message: 'Opportunity dismissed.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Seed and live crawl opportunities (DEV ONLY)
// @route   GET /api/opportunities/seed
const seedOpportunities = async (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ success: false, message: 'Seeder only available in development environment.' });
  }
  
  try {
    const result = await runIngestion();
    res.status(201).json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  listOpportunities,
  listRecommended,
  listHighMatch,
  listClosingSoon,
  listRecent,
  listSaved,
  listApplied,
  toggleBookmark,
  applyOpportunity,
  dismissOpportunity,
  seedOpportunities
};
