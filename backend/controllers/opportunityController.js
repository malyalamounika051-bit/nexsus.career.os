const Opportunity = require('../models/Opportunity');
const UserOpportunity = require('../models/UserOpportunity');
const Resume = require('../models/Resume');
const CareerGPS = require('../models/CareerGPS');
const Career = require('../models/Career');
const { awardXP } = require('../utils/gamification');
const { runIngestion } = require('../services/ingestionService');
const { verifyOpportunity, runVerificationSweep } = require('../services/verificationService');
const { calculateOpportunityMatch } = require('../services/matchingEngine');

// Scheduler runs verification sweep and daily auto-expiration sweeps
const runDailyScheduler = async () => {
  console.log('🗓️ Opportunity Radar Scheduler Running...');
  try {
    const now = new Date();
    
    // 1. Expire outdated opportunities
    const expiredCount = await Opportunity.updateMany(
      {
        deadline: { $lt: now },
        opportunityStatus: { $ne: 'expired' }
      },
      {
        $set: {
          opportunityStatus: 'expired',
          verificationStatus: 'expired',
          isVerified: false
        }
      }
    );
    console.log(`🧹 Daily sweep: Expired ${expiredCount.modifiedCount} opportunities.`);
    
    // 2. Refresh verification states
    await runVerificationSweep();
  } catch (err) {
    console.error('Scheduler Sweep Error:', err.message);
  }
};

// Start background task (every 6 hours)
setInterval(runDailyScheduler, 6 * 60 * 60 * 1000);
// Trigger once shortly on server startup
setTimeout(runDailyScheduler, 10000);

/**
 * Common helper to construct aggregated opportunities with matches for the user
 */
const getUserOpportunitiesFeed = async (userId, filterQuery = {}) => {
  const resume = await Resume.findOne({ user: userId });
  const userSkills = resume?.skills || [];

  const gps = await CareerGPS.findOne({ userId }).sort({ updatedAt: -1 });
  const gpsDestination = gps?.destination || '';

  // Get completed roadmaps count to factor in projects
  const completedRoadmapsCount = await Career.countDocuments({ userId, isGeneratedRoadmap: true, status: 'completed' });

  // Only show active, verified opportunities (unless specifically querying dismissed/applied/saved tabs)
  const query = {
    opportunityStatus: 'active',
    isVerified: true,
    verificationStatus: 'verified',
    type: { $nin: ['job', 'internship', 'hiring-drive'] },
    ...filterQuery
  };

  const opportunities = await Opportunity.find(query);
  const userMatches = await UserOpportunity.find({ userId });
  const matchMap = new Map(userMatches.map(m => [String(m.opportunityId), m]));

  const result = [];

  for (const opp of opportunities) {
    const interaction = matchMap.get(String(opp._id));
    if (interaction?.dismissed) continue;

    const { matchScore, matchLabel, whyRecommended, missingSkills } = calculateOpportunityMatch(
      opp,
      userSkills,
      gpsDestination,
      completedRoadmapsCount
    );

    // Auto-create recommendation interaction if absent
    if (!interaction) {
      await UserOpportunity.create({
        userId,
        opportunityId: opp._id,
        matchScore,
        whyRecommended,
        status: 'recommended'
      });
    }

    result.push({
      _id: opp._id,
      title: opp.title,
      organization: opp.organization,
      type: opp.type,
      description: opp.description,
      deadline: opp.deadline,
      applicationUrl: opp.applicationUrl,
      eligibility: opp.eligibility,
      requiredSkills: opp.requiredSkills,
      preferredSkills: opp.preferredSkills,
      location: opp.location,
      remote: opp.remote,
      tags: opp.tags,
      source: opp.source,
      sourceType: opp.sourceType,
      sourceScore: opp.sourceScore,
      verificationStatus: opp.verificationStatus,
      isVerified: opp.isVerified,
      opportunityStatus: opp.opportunityStatus,
      daysRemaining: opp.daysRemaining,
      matchScore: interaction?.matchScore || matchScore,
      matchLabel,
      whyRecommended: interaction?.whyRecommended || whyRecommended,
      missingSkills,
      bookmarked: interaction?.bookmarked || false,
      applied: interaction?.applied || false,
      status: interaction?.status || 'recommended',
      appliedAt: interaction?.appliedAt || null
    });
  }

  return result;
};

/**
 * Calculates top dynamic stats summary row metrics
 */
const calculateRadarStats = async (userId) => {
  const queryBase = { opportunityStatus: 'active', isVerified: true };
  const hackathonsCount = await Opportunity.countDocuments({ ...queryBase, type: 'hackathon' });
  const scholarshipsCount = await Opportunity.countDocuments({ ...queryBase, type: 'scholarship' });
  const coursesCount = await Opportunity.countDocuments({ ...queryBase, type: 'course' });
  const closingSoonCount = await Opportunity.countDocuments({
    ...queryBase,
    deadline: { $gte: new Date(), $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
  });

  const userOpps = await UserOpportunity.find({ userId });
  const appliedCount = userOpps.filter(o => o.applied).length;

  let totalMatch = 0;
  let countWithMatch = 0;
  userOpps.forEach(o => {
    if (o.matchScore > 0) {
      totalMatch += o.matchScore;
      countWithMatch++;
    }
  });
  
  const avgMatchScore = countWithMatch > 0 ? Math.round(totalMatch / countWithMatch) : 75;

  return {
    hackathonsOpen: hackathonsCount,
    scholarshipsOpen: scholarshipsCount,
    coursesAvailable: coursesCount,
    deadlinesThisWeek: closingSoonCount,
    applicationsSubmitted: appliedCount,
    avgMatchScore
  };
};

// @desc    Get base opportunity list
// @route   GET /api/opportunities
const listOpportunities = async (req, res) => {
  try {
    const userId = String(req.user?.uid || req.user?._id || req.user?.id);

    // Fallback crawler if completely empty database
    const count = await Opportunity.countDocuments({ opportunityStatus: 'active', isVerified: true });
    if (count === 0) {
      console.log('Opportunity Cache is empty. Fetching fallback listings...');
      await runIngestion().catch(() => {});
    }

    const data = await getUserOpportunitiesFeed(userId);
    data.sort((a, b) => b.matchScore - a.matchScore);

    const stats = await calculateRadarStats(userId);

    res.status(200).json({
      success: true,
      count: data.length,
      stats,
      data
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Force Refresh and Ingest opportunities
// @route   GET /api/opportunities/refresh
const refreshOpportunities = async (req, res) => {
  try {
    const userId = String(req.user?.uid || req.user?._id || req.user?.id);
    
    // Ingest fresh listings
    await runIngestion();
    
    // Verify existing list
    await runVerificationSweep();
    
    // Fetch refreshed feed
    const data = await getUserOpportunitiesFeed(userId);
    data.sort((a, b) => b.matchScore - a.matchScore);
    const stats = await calculateRadarStats(userId);

    res.status(200).json({
      success: true,
      message: 'Radar refreshed successfully!',
      stats,
      data
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get opportunities filtering by category type
// @route   GET /api/opportunities/category/:type
const listByCategory = async (req, res) => {
  try {
    const userId = String(req.user?.uid || req.user?._id || req.user?.id);
    const category = req.params.type;
    
    const data = await getUserOpportunitiesFeed(userId, { type: category });
    data.sort((a, b) => b.matchScore - a.matchScore);
    res.status(200).json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get closing soon opportunities
// @route   GET /api/opportunities/closing-soon
const listClosingSoon = async (req, res) => {
  try {
    const userId = String(req.user?.uid || req.user?._id || req.user?.id);
    const limitDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    const data = await getUserOpportunitiesFeed(userId, {
      deadline: { $gte: new Date(), $lte: limitDate }
    });
    data.sort((a, b) => b.matchScore - a.matchScore);
    res.status(200).json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get saved bookmarked opportunities
// @route   GET /api/opportunities/saved
const listSaved = async (req, res) => {
  try {
    const userId = String(req.user?.uid || req.user?._id || req.user?.id);
    
    const userOpps = await UserOpportunity.find({ userId, bookmarked: true });
    const oppIds = userOpps.map(o => o.opportunityId);
    
    const data = await getUserOpportunitiesFeed(userId, { _id: { $in: oppIds } });
    data.sort((a, b) => b.matchScore - a.matchScore);
    res.status(200).json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get applied opportunities
// @route   GET /api/opportunities/applied
const listApplied = async (req, res) => {
  try {
    const userId = String(req.user?.uid || req.user?._id || req.user?.id);
    
    const userOpps = await UserOpportunity.find({ userId, applied: true });
    const oppIds = userOpps.map(o => o.opportunityId);
    
    const data = await getUserOpportunitiesFeed(userId, { _id: { $in: oppIds } });
    data.sort((a, b) => b.matchScore - a.matchScore);
    res.status(200).json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get high match opportunities (score >= 90%)
// @route   GET /api/opportunities/high-match
const listHighMatch = async (req, res) => {
  try {
    const userId = String(req.user?.uid || req.user?._id || req.user?.id);
    const data = await getUserOpportunitiesFeed(userId);
    const filtered = data.filter(opp => opp.matchScore >= 90);
    res.status(200).json({ success: true, count: filtered.length, data: filtered });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Toggle Bookmark
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
    interaction.bookmarkedAt = interaction.bookmarked ? new Date() : null;
    interaction.status = interaction.bookmarked ? 'saved' : 'recommended';
    await interaction.save();

    res.status(200).json({ success: true, bookmarked: interaction.bookmarked });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Mark Applied and Lock XP (Strict anti-farming verification)
// @route   POST /api/opportunities/:id/apply
const applyOpportunity = async (req, res) => {
  try {
    const userId = String(req.user?.uid || req.user?._id || req.user?.id);
    const opportunityId = req.params.id;
    const { applicationProof } = req.body;

    let interaction = await UserOpportunity.findOne({ userId, opportunityId });
    if (!interaction) {
      interaction = new UserOpportunity({ userId, opportunityId });
    }

    const wasXpAwarded = interaction.xpAwarded;

    interaction.applied = true;
    interaction.appliedAt = new Date();
    interaction.applicationProof = applicationProof || 'User marked applied';
    interaction.status = 'applied';

    let xpEarned = false;
    if (!wasXpAwarded) {
      interaction.xpAwarded = true;
      xpEarned = true;
      await awardXP(userId, 'OPPORTUNITY_APPLIED').catch(() => {});
    }

    await interaction.save();

    // Increment applicationCount in main Opportunity record
    await Opportunity.findByIdAndUpdate(opportunityId, { $inc: { applicationCount: 1 } }).catch(() => {});

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
    interaction.status = 'dismissed';
    await interaction.save();

    res.status(200).json({ success: true, message: 'Opportunity dismissed.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Verify manually
// @route   POST /api/opportunities/:id/verify
const verifyOpportunityEndpoint = async (req, res) => {
  try {
    const opp = await Opportunity.findById(req.params.id);
    if (!opp) {
      return res.status(404).json({ success: false, message: 'Opportunity not found' });
    }
    
    const updatedOpp = await verifyOpportunity(opp);
    res.status(200).json({ success: true, isVerified: updatedOpp.isVerified, status: updatedOpp.verificationStatus });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Seed crawler (DEV ONLY)
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
  refreshOpportunities,
  listByCategory,
  listClosingSoon,
  listSaved,
  listApplied,
  listHighMatch,
  toggleBookmark,
  applyOpportunity,
  dismissOpportunity,
  verifyOpportunityEndpoint,
  seedOpportunities
};
