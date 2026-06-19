const Opportunity = require('../models/Opportunity');
const UserOpportunity = require('../models/UserOpportunity');
const Resume = require('../models/Resume');
const CareerGPS = require('../models/CareerGPS');
const Career = require('../models/Career');
const { awardXP } = require('../utils/gamification');
const { runIngestion } = require('../services/ingestionService');
const { verifyOpportunity, runVerificationSweep } = require('../services/verificationService');
const { calculateOpportunityMatch } = require('../services/matchingEngine');

// ═══════════════════════════════════════════════════════════════
// OPPORTUNITY RADAR v2 — CONTROLLER
// Never-empty guarantee, registration tracking, reminders
// ═══════════════════════════════════════════════════════════════

/**
 * Daily scheduler: expire outdated opportunities + verification sweep
 * Runs every 6 hours and once on startup
 */
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

    // 3. Check reminders for registered opportunities
    try {
      const { checkAndGenerateReminders } = require('../services/reminderService');
      await checkAndGenerateReminders();
    } catch (err) {
      // Non-fatal — reminder service may not exist yet
    }
  } catch (err) {
    console.error('Scheduler Sweep Error:', err.message);
  }
};

// Start background task (every 6 hours)
setInterval(runDailyScheduler, 6 * 60 * 60 * 1000);
// Trigger once shortly on server startup
setTimeout(runDailyScheduler, 10000);

/**
 * Common helper to construct aggregated opportunities with matches for the user.
 * NEVER-EMPTY GUARANTEE: Falls back to progressively relaxed queries.
 */
const getUserOpportunitiesFeed = async (userId, filterQuery = {}) => {
  const resume = await Resume.findOne({ user: userId });
  const userSkills = resume?.skills || [];

  const gps = await CareerGPS.findOne({ userId }).sort({ updatedAt: -1 });
  const gpsDestination = gps?.destination || '';

  const completedRoadmapsCount = await Career.countDocuments({ userId, isGeneratedRoadmap: true, status: 'completed' });

  // ═══ NEVER-EMPTY STRATEGY ═══
  // Try strict query first, then relax filters if empty
  const queryStrategies = [
    // Strategy 1: Active + Verified (ideal)
    {
      opportunityStatus: 'active',
      isVerified: true,
      verificationStatus: 'verified',
      type: { $nin: ['job', 'internship', 'hiring-drive'] },
      ...filterQuery
    },
    // Strategy 2: Active only (relaxed verification)
    {
      opportunityStatus: 'active',
      type: { $nin: ['job', 'internship', 'hiring-drive'] },
      ...filterQuery
    },
    // Strategy 3: All non-expired (most relaxed)
    {
      opportunityStatus: { $ne: 'expired' },
      type: { $nin: ['job', 'internship', 'hiring-drive'] },
      ...filterQuery
    }
  ];

  let opportunities = [];
  for (const query of queryStrategies) {
    opportunities = await Opportunity.find(query).sort({ createdAt: -1 }).limit(200);
    if (opportunities.length > 0) break;
  }

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
      }).catch(() => {}); // ignore duplicate key errors
    }

    result.push({
      _id: opp._id,
      title: opp.title,
      organization: opp.organization,
      type: opp.type,
      description: opp.description,
      deadline: opp.deadline,
      submissionDeadline: opp.submissionDeadline,
      resultDate: opp.resultDate,
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
      benefits: opp.benefits || [],
      difficulty: opp.difficulty,
      estimatedCommitment: opp.estimatedCommitment,
      isFeatured: opp.isFeatured,
      prizePool: opp.prizePool,
      matchScore: interaction?.matchScore || matchScore,
      matchLabel,
      whyRecommended: interaction?.whyRecommended || whyRecommended,
      missingSkills,
      bookmarked: interaction?.bookmarked || false,
      applied: interaction?.applied || false,
      registered: interaction?.registered || false,
      registeredAt: interaction?.registeredAt || null,
      submissionStatus: interaction?.submissionStatus || 'not-started',
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
  // Use relaxed query (active only, no verification needed) for stats
  const queryBase = { opportunityStatus: 'active' };
  
  const [hackathonsCount, scholarshipsCount, coursesCount, competitionsCount, codingCount, innovationCount] = await Promise.all([
    Opportunity.countDocuments({ ...queryBase, type: 'hackathon' }),
    Opportunity.countDocuments({ ...queryBase, type: 'scholarship' }),
    Opportunity.countDocuments({ ...queryBase, type: { $in: ['course', 'certification'] } }),
    Opportunity.countDocuments({ ...queryBase, type: 'competition' }),
    Opportunity.countDocuments({ ...queryBase, type: 'coding-challenge' }),
    Opportunity.countDocuments({ ...queryBase, type: 'innovation' })
  ]);

  const closingSoonCount = await Opportunity.countDocuments({
    ...queryBase,
    deadline: { $gte: new Date(), $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
  });

  const userOpps = await UserOpportunity.find({ userId });
  const appliedCount = userOpps.filter(o => o.applied).length;
  const registeredCount = userOpps.filter(o => o.registered).length;

  let totalMatch = 0;
  let countWithMatch = 0;
  userOpps.forEach(o => {
    if (o.matchScore > 0) {
      totalMatch += o.matchScore;
      countWithMatch++;
    }
  });
  
  const avgMatchScore = countWithMatch > 0 ? Math.round(totalMatch / countWithMatch) : 75;

  // Total active opportunities
  const totalActive = await Opportunity.countDocuments(queryBase);

  return {
    totalActive,
    hackathonsOpen: hackathonsCount,
    scholarshipsOpen: scholarshipsCount,
    coursesAvailable: coursesCount,
    competitionsOpen: competitionsCount,
    codingChallenges: codingCount,
    innovationChallenges: innovationCount,
    deadlinesThisWeek: closingSoonCount,
    applicationsSubmitted: appliedCount,
    registeredCount,
    avgMatchScore
  };
};

// ═══ ENDPOINTS ═══

/**
 * @desc    Get opportunity list with never-empty guarantee
 * @route   GET /api/opportunities
 */
const listOpportunities = async (req, res) => {
  try {
    const userId = String(req.user?.uid || req.user?._id || req.user?.id);

    // Check if database is empty → trigger ingestion
    const count = await Opportunity.countDocuments({ opportunityStatus: 'active' });
    if (count === 0) {
      console.log('📦 Opportunity database empty. Running full ingestion...');
      await runIngestion().catch(err => console.error('Ingestion error:', err.message));
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

/**
 * @desc    Force Refresh and Ingest opportunities
 * @route   GET /api/opportunities/refresh
 */
const refreshOpportunities = async (req, res) => {
  try {
    const userId = String(req.user?.uid || req.user?._id || req.user?.id);
    
    // Run full ingestion pipeline
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

/**
 * @desc    Get opportunities filtering by category type
 * @route   GET /api/opportunities/category/:type
 */
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

/**
 * @desc    Get closing soon opportunities
 * @route   GET /api/opportunities/closing-soon
 */
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

/**
 * @desc    Get saved bookmarked opportunities
 * @route   GET /api/opportunities/saved
 */
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

/**
 * @desc    Get applied opportunities
 * @route   GET /api/opportunities/applied
 */
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

/**
 * @desc    Get registered opportunities
 * @route   GET /api/opportunities/registered
 */
const listRegistered = async (req, res) => {
  try {
    const userId = String(req.user?.uid || req.user?._id || req.user?.id);
    
    const userOpps = await UserOpportunity.find({ userId, registered: true });
    const oppIds = userOpps.map(o => o.opportunityId);
    
    const data = await getUserOpportunitiesFeed(userId, { _id: { $in: oppIds } });
    data.sort((a, b) => b.matchScore - a.matchScore);
    res.status(200).json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Get high match opportunities (score >= 90%)
 * @route   GET /api/opportunities/high-match
 */
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

/**
 * @desc    Toggle Bookmark
 * @route   POST /api/opportunities/:id/bookmark
 */
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

/**
 * @desc    Mark Applied and Lock XP
 * @route   POST /api/opportunities/:id/apply
 */
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

/**
 * @desc    Register for an opportunity (track registration)
 * @route   POST /api/opportunities/:id/register
 */
const registerOpportunity = async (req, res) => {
  try {
    const userId = String(req.user?.uid || req.user?._id || req.user?.id);
    const opportunityId = req.params.id;

    let interaction = await UserOpportunity.findOne({ userId, opportunityId });
    if (!interaction) {
      interaction = new UserOpportunity({ userId, opportunityId });
    }

    interaction.registered = true;
    interaction.registeredAt = new Date();
    interaction.status = 'applied'; // Registration counts as applied
    interaction.applied = true;
    interaction.appliedAt = interaction.appliedAt || new Date();

    // Award XP if not already awarded
    let xpEarned = false;
    if (!interaction.xpAwarded) {
      interaction.xpAwarded = true;
      xpEarned = true;
      await awardXP(userId, 'OPPORTUNITY_APPLIED').catch(() => {});
    }

    await interaction.save();
    await Opportunity.findByIdAndUpdate(opportunityId, { $inc: { applicationCount: 1 } }).catch(() => {});

    res.status(200).json({
      success: true,
      registered: true,
      xpAwarded: xpEarned,
      message: xpEarned ? 'Registration tracked! +50 XP earned. 🚀' : 'Registration tracked!'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Get upcoming deadline reminders for user
 * @route   GET /api/opportunities/reminders
 */
const getReminders = async (req, res) => {
  try {
    const userId = String(req.user?.uid || req.user?._id || req.user?.id);

    const registrations = await UserOpportunity.find({
      userId,
      $or: [{ registered: true }, { applied: true }]
    });

    const reminders = [];

    for (const reg of registrations) {
      const opp = await Opportunity.findById(reg.opportunityId);
      if (!opp || opp.opportunityStatus === 'expired') continue;

      const deadline = opp.submissionDeadline || opp.deadline;
      if (!deadline) continue;

      const daysLeft = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
      if (daysLeft < 0) continue; // Already passed

      reminders.push({
        opportunityId: opp._id,
        title: opp.title,
        organization: opp.organization,
        type: opp.type,
        deadline,
        daysLeft,
        registeredAt: reg.registeredAt,
        submissionStatus: reg.submissionStatus || 'not-started',
        urgency: daysLeft <= 1 ? 'critical' : daysLeft <= 3 ? 'high' : daysLeft <= 7 ? 'medium' : 'low'
      });
    }

    // Sort by urgency (closest deadline first)
    reminders.sort((a, b) => a.daysLeft - b.daysLeft);

    res.status(200).json({ success: true, count: reminders.length, data: reminders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Dismiss opportunity
 * @route   POST /api/opportunities/:id/dismiss
 */
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

/**
 * @desc    Verify manually
 * @route   POST /api/opportunities/:id/verify
 */
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

/**
 * @desc    Seed crawler (DEV ONLY)
 * @route   GET /api/opportunities/seed
 */
const seedOpportunities = async (req, res) => {
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
  listRegistered,
  listHighMatch,
  toggleBookmark,
  applyOpportunity,
  registerOpportunity,
  getReminders,
  dismissOpportunity,
  verifyOpportunityEndpoint,
  seedOpportunities
};
