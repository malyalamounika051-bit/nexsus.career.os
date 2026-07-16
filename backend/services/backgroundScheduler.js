const mongoose = require('mongoose');
const CareerPulseNews = require('../models/CareerPulseNews');
const Opportunity = require('../models/Opportunity');
const JobCache = require('../models/JobCache');
const Career = require('../models/Career');
const { aggregateJobs } = require('./jobAggregator');
const { callAI } = require('../utils/geminiClient');
const { parseStructuredJson } = require('../utils/jsonParser');
const { fetchAllFeeds } = require('./rssFeedService');
const { getVerifiedResourcesForTopics, verifyResourceUrl } = require('./resourceRecommendationService');

// Popular developer query categories to pre-cache jobs for
const POPULAR_JOB_ROLES = [
  'Software Engineer',
  'AI Engineer',
  'Data Scientist',
  'Cybersecurity Analyst',
  'Cloud Engineer'
];

/**
 * Main worker runner to execute all background caching tasks
 */
const runAllTasks = async () => {
  console.log('🏁 [Background Worker] Starting pre-fetching tasks...');

  // ── Task 1: Fetch REAL articles from RSS feeds ──────────────────────────────
  try {
    const now = new Date();
    const archiveThreshold = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    // Clear news older than 48 hours
    await CareerPulseNews.deleteMany({ timestamp: { $lt: archiveThreshold } });

    console.log('📡 [Background Worker] Fetching real articles from RSS feeds...');
    const realArticles = await fetchAllFeeds();

    if (Array.isArray(realArticles) && realArticles.length > 0) {
      let inserted = 0;
      for (const article of realArticles) {
        try {
          await CareerPulseNews.findOneAndUpdate(
            { articleUrl: article.articleUrl },
            { ...article, timestamp: new Date() },
            { upsert: true, new: true }
          );
          inserted++;
        } catch (dbErr) {
          // 11000 = duplicate key (article already exists), skip silently
          if (dbErr.code !== 11000) console.error('Pulse DB Insert Err:', dbErr.message);
        }
      }
      console.log(`✅ [Background Worker] ${inserted} real articles stored from RSS feeds.`);

      // Generate "Why it matters" insights for articles that don't have one yet
      try {
        const needInsight = await CareerPulseNews.find({
          $or: [{ whyItMatters: '' }, { whyItMatters: { $exists: false } }]
        }).limit(8);

        if (needInsight.length > 0) {
          const titles = needInsight.map((a, i) => `${i + 1}. [${a.category}] "${a.headline}": ${a.summary}`).join('\n');
          const insightPrompt = `You are a career advisor. For each of these real tech news articles, write a 1-sentence career insight explaining why it matters to students, freshers, or job seekers. Focus on actionable skills, hiring impact, or learning opportunities.

${titles}

Return a JSON array of strings, one insight per article, in the same order. Example: ["insight1", "insight2", ...]
Return ONLY the raw JSON array.`;

          const aiResponse = await callAI({
            messages: [{ role: 'user', content: insightPrompt }],
            temperature: 0.6
          });

          const insights = parseStructuredJson(aiResponse.text);
          if (Array.isArray(insights)) {
            for (let i = 0; i < Math.min(insights.length, needInsight.length); i++) {
              let insightText = insights[i];
              if (insightText && typeof insightText === 'object') {
                insightText = insightText.insight || insightText.text || insightText.insight1 || Object.values(insightText)[0] || '';
              }
              needInsight[i].whyItMatters = String(insightText || '').trim();
              await needInsight[i].save();
            }
            console.log(`✅ [Background Worker] Generated career insights for ${Math.min(insights.length, needInsight.length)} articles.`);
          }
        }
      } catch (aiErr) {
        console.warn('⚠️ [Background Worker] AI insight generation skipped:', aiErr.message);
      }
    }
  } catch (error) {
    console.error('❌ [Background Worker] RSS news fetch task failed:', error.message);
  }

  // ── Task 2: Curate and Pre-seed active Student Opportunities (Radar) ────────
  try {
    const activeOppsCount = await Opportunity.countDocuments({ opportunityStatus: 'active' });
    
    // Only fetch new ones if the active pool is low or for rotation
    if (activeOppsCount < 10) {
      console.log('🤖 [Background Worker] Pre-populating active Opportunity Radar items...');
      const oppPrompt = `Generate a JSON array containing EXACTLY 5 high-quality, realistic, upcoming developer challenges, hackathons, open-source programs, or student scholarships.
Tracked categories must be: 'hackathon', 'scholarship', 'open-source', 'coding-challenge'.
Format as a clean JSON array with this structure:
[
  {
    "title": "Title of opportunity (e.g., Google Summer of Code, Microsoft Learn Challenge, NVIDIA NIM Hackathon)",
    "organization": "Sponsoring org (e.g. Google, Microsoft, NVIDIA, Major League Hacking)",
    "type": "hackathon or scholarship or open-source or coding-challenge",
    "description": "Brief description of the challenge and benefits.",
    "deadlineDays": 14,
    "applicationUrl": "https://example.com/apply"
  }
]
Return ONLY the raw JSON array.`;

      const aiResponse = await callAI({
        messages: [{ role: 'user', content: oppPrompt }],
        temperature: 0.7
      });

      const opps = parseStructuredJson(aiResponse.text);
      if (Array.isArray(opps) && opps.length > 0) {
        for (const op of opps) {
          try {
            const deadlineDate = new Date();
            deadlineDate.setDate(deadlineDate.getDate() + (op.deadlineDays || 15));

            await Opportunity.findOneAndUpdate(
              { title: op.title, organization: op.organization },
              {
                title: op.title,
                organization: op.organization,
                type: op.type,
                description: op.description,
                deadline: deadlineDate,
                applicationUrl: op.applicationUrl,
                opportunityStatus: 'active',
                isVerified: true
              },
              { upsert: true, new: true }
            );
          } catch (dbErr) {
            console.error('Opportunity DB Insert Err:', dbErr.message);
          }
        }
        console.log('✅ [Background Worker] Opportunity Radar pre-seeded.');
      }
    }
  } catch (error) {
    console.error('❌ [Background Worker] Opportunity Radar task failed:', error.message);
  }

  // ── Task 3: Pre-Cache popular Job Aggregator Results ────────────────────────
  for (const role of POPULAR_JOB_ROLES) {
    try {
      const cacheKey = `${role.toLowerCase().trim()}_any_remote_fulltime`;
      const exists = await JobCache.findOne({ queryKey: cacheKey });
      
      if (!exists) {
        console.log(`🤖 [Background Worker] Aggregating & Caching jobs for "${role}"...`);
        const jobs = await aggregateJobs({
          role,
          location: '',
          isRemote: true,
          isInternship: false
        });
        
        if (jobs && jobs.length > 0) {
          await JobCache.findOneAndUpdate(
            { queryKey: cacheKey },
            { queryKey: cacheKey, jobs, createdAt: new Date() },
            { upsert: true, new: true }
          );
          console.log(`✅ [Background Worker] Cached ${jobs.length} jobs for "${role}".`);
        }
      }
    } catch (error) {
      console.error(`❌ [Background Worker] Job Cache task for "${role}" failed:`, error.message);
    }
  }

  console.log('🏁 [Background Worker] Pre-fetching tasks completed.');
};

/**
 * Weekly Roadmap Resource Verification Sweep
 * Scans all generated roadmaps, checks every resource URL,
 * and replaces broken ones with fresh verified resources.
 * Preserves user progress and XP.
 */
const runWeeklyResourceVerification = async () => {
  console.log('🔍 [Weekly Sweep] Starting roadmap resource verification...');
  try {
    const roadmaps = await Career.find({ isGeneratedRoadmap: true });
    console.log(`📊 [Weekly Sweep] Found ${roadmaps.length} roadmaps to verify.`);

    let totalFixed = 0;
    let totalRegenerated = 0;

    for (const roadmap of roadmaps) {
      let brokenCount = 0;
      let totalResources = 0;

      // Count broken resources across all phases
      for (const phase of roadmap.roadmap) {
        for (const res of phase.resources) {
          totalResources++;
          const isValid = await verifyResourceUrl(res.url || res.verifiedUrl);
          if (!isValid) brokenCount++;
        }
      }

      const brokenPct = totalResources > 0 ? (brokenCount / totalResources) * 100 : 0;

      if (brokenPct > 20) {
        // More than 20% broken → regenerate all resources but preserve progress
        console.log(`♻️ [Weekly Sweep] "${roadmap.domain}" has ${brokenPct.toFixed(0)}% broken resources. Regenerating all resources...`);
        for (const phase of roadmap.roadmap) {
          phase.resources = await getVerifiedResourcesForTopics(phase.topics || []);
        }
        await roadmap.save();
        totalRegenerated++;
      } else if (brokenCount > 0) {
        // Replace only the broken individual resources
        console.log(`🔧 [Weekly Sweep] "${roadmap.domain}" has ${brokenCount} broken resource(s). Replacing individually...`);
        for (const phase of roadmap.roadmap) {
          const freshResources = await getVerifiedResourcesForTopics(phase.topics || []);
          const repairedResources = [];

          for (const res of phase.resources) {
            const isValid = await verifyResourceUrl(res.url || res.verifiedUrl);
            if (isValid) {
              res.lastChecked = new Date();
              res.lastVerifiedDate = new Date();
              repairedResources.push(res);
            } else {
              // Find a replacement from fresh resources that isn't already in the list
              const replacement = freshResources.find(fr => !repairedResources.some(rr => rr.url === fr.url));
              if (replacement) {
                repairedResources.push({ ...replacement, verified: true, lastChecked: new Date(), lastVerifiedDate: new Date() });
              }
            }
          }
          phase.resources = repairedResources;
        }
        await roadmap.save();
        totalFixed++;
      }
    }

    console.log(`✅ [Weekly Sweep] Verification complete. Fixed: ${totalFixed}, Regenerated: ${totalRegenerated}.`);
  } catch (err) {
    console.error('❌ [Weekly Sweep] Resource verification failed:', err.message);
  }
};

/**
 * Initialize the background worker (runs every 30 minutes)
 */
const startScheduler = () => {
  console.log('⏳ [Background Scheduler] Initializing background task worker (Runs every 30 minutes)...');

  // Trigger an initial RSS fetch on server startup after a short delay
  setTimeout(() => {
    runAllTasks().catch(err => console.error('Scheduler Startup Task Error:', err));
  }, 8000); // 8-second delay to let MongoDB connect first

  // Setup interval loop — every 30 minutes
  setInterval(() => {
    runAllTasks().catch(err => console.error('Scheduler Interval Task Error:', err));
  }, 1800000); // 30 minutes

  // Weekly roadmap resource verification — every 7 days
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  console.log('📅 [Background Scheduler] Weekly roadmap resource verification scheduled (every 7 days).');
  setInterval(() => {
    runWeeklyResourceVerification().catch(err => console.error('Weekly Sweep Error:', err));
  }, SEVEN_DAYS_MS);
};

module.exports = {
  startScheduler,
  runAllTasks,
  runWeeklyResourceVerification
};
