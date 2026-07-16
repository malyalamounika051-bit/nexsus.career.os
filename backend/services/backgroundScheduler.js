const mongoose = require('mongoose');
const CareerPulseNews = require('../models/CareerPulseNews');
const Opportunity = require('../models/Opportunity');
const JobCache = require('../models/JobCache');
const Career = require('../models/Career');
const { aggregateJobs } = require('./jobAggregator');
const { callAI } = require('../utils/geminiClient');
const { parseStructuredJson } = require('../utils/jsonParser');
const { fetchAllFeeds, IngestionNormalizer, CURATED_FALLBACK_NEWS } = require('./rssFeedService');
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
 * Main worker runner to execute all background caching tasks with item-level error isolation
 */
const runAllTasks = async () => {
  console.log('🏁 [Background Worker] Starting pre-fetching tasks...');

  // ── Task 1: Fetch articles from RSS feeds with isolated errors ──────────────────────────────
  try {
    const now = new Date();
    const archiveThreshold = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    // Clear news older than 48 hours
    await CareerPulseNews.deleteMany({ timestamp: { $lt: archiveThreshold } });

    console.log('📡 [Background Worker] Fetching articles from RSS feeds...');
    let realArticles = [];
    try {
      realArticles = await fetchAllFeeds();
    } catch (feedErr) {
      console.error('❌ [Background Worker] Failed to run RSS fetch. Using curated mock fallback list:', feedErr.message);
      realArticles = CURATED_FALLBACK_NEWS;
    }

    if (Array.isArray(realArticles) && realArticles.length > 0) {
      let inserted = 0;
      
      // ITEM-LEVEL ERROR ISOLATION: Process each article in its own try-catch block
      for (const article of realArticles) {
        try {
          // Final sanity check before Mongoose validation
          const normalizedTitle = IngestionNormalizer.normalizeString(article.headline || article.title, 'Tech Update');
          const normalizedSummary = IngestionNormalizer.normalizeSummary(article.summary, normalizedTitle, article.source);
          const normalizedAuthor = IngestionNormalizer.normalizeAuthor(article.author, article.source);

          await CareerPulseNews.findOneAndUpdate(
            { articleUrl: article.articleUrl },
            { 
              ...article, 
              headline: normalizedTitle,
              title: normalizedTitle,
              summary: normalizedSummary,
              author: normalizedAuthor,
              timestamp: new Date() 
            },
            { upsert: true, new: true, runValidators: true }
          );
          inserted++;
        } catch (dbErr) {
          if (dbErr.code !== 11000) {
            console.error(`⚠️ [Background Worker] Skipped article "${article.title?.substring(0,30)}..." due to insert validation failure:`, dbErr.message);
          }
        }
      }
      console.log(`✅ [Background Worker] ${inserted} articles processed successfully.`);

      // Generate "Why it matters" insights for articles that don't have one yet
      try {
        const needInsight = await CareerPulseNews.find({
          $or: [{ whyItMatters: '' }, { whyItMatters: { $exists: false } }]
        }).limit(6);

        if (needInsight.length > 0) {
          const titles = needInsight.map((a, i) => `${i + 1}. [${a.category}] "${a.headline}": ${a.summary}`).join('\n');
          const insightPrompt = `You are a career advisor. For each of these tech news articles, write a 1-sentence career insight explaining why it matters to students.
          
${titles}

Return a JSON array of strings, one insight per article.
Return ONLY the raw JSON array.`;

          const aiResponse = await callAI({
            messages: [{ role: 'user', content: insightPrompt }],
            temperature: 0.6
          });

          const insights = parseStructuredJson(aiResponse.text);
          if (Array.isArray(insights)) {
            for (let i = 0; i < Math.min(insights.length, needInsight.length); i++) {
              try {
                const cleanInsight = IngestionNormalizer.normalizeString(insights[i], 'Sara Says: Keep building tech skills.');
                needInsight[i].whyItMatters = cleanInsight;
                await needInsight[i].save();
              } catch(saveErr) {
                console.error('⚠️ [Background Worker] Failed to save individual AI insight:', saveErr.message);
              }
            }
          }
        }
      } catch (aiErr) {
        console.warn('⚠️ [Background Worker] AI insight generation skipped:', aiErr.message);
      }
    }
  } catch (error) {
    console.error('❌ [Background Worker] RSS news fetch task failed:', error.message);
  }

  // ── Task 2: Curate and Pre-seed active Student Opportunities ────────
  try {
    const activeOppsCount = await Opportunity.countDocuments({ opportunityStatus: 'active' });
    
    if (activeOppsCount < 5) {
      console.log('🤖 [Background Worker] Pre-populating Opportunity Radar...');
      const oppPrompt = `Generate a JSON array of 4 hackathons or scholarships. Return ONLY the raw JSON.`;
      const aiResponse = await callAI({
        messages: [{ role: 'user', content: oppPrompt }],
        temperature: 0.7
      });

      const opps = parseStructuredJson(aiResponse.text);
      if (Array.isArray(opps) && opps.length > 0) {
        for (const o of opps) {
          try {
            await Opportunity.create({
              ...o,
              opportunityStatus: 'active'
            });
          } catch(err){}
        }
      }
    }
  } catch(err){}

  // ── Task 3: Pre-aggregate and cache Jobs ─────────────────────────────
  try {
    console.log('💼 [Background Worker] Refreshing job category caches...');
    for (const role of POPULAR_JOB_ROLES) {
      try {
        console.log(`🤖 Aggregating jobs for: "${role}"`);
        const jobs = await aggregateJobs(role, 'India');
        if (jobs && jobs.length > 0) {
          await JobCache.findOneAndUpdate(
            { role: role.toLowerCase() },
            { role: role.toLowerCase(), jobs, lastUpdated: new Date() },
            { upsert: true }
          );
        }
      } catch (jobErr) {
        console.error(`⚠️ Job caching failed for role "${role}":`, jobErr.message);
      }
    }
  } catch (error) {
    console.error('❌ [Background Worker] Job pre-caching failed:', error.message);
  }
};

const runWeeklyResourceVerification = async () => {
  try {
    console.log('🧹 [Weekly Sweep] Starting resource validation checking...');
    const roadmaps = await Career.find({ isGeneratedRoadmap: true });
    
    for (const roadmap of roadmaps) {
      try {
        let brokenCount = 0;
        let totalResources = 0;

        for (const phase of roadmap.roadmap) {
          for (const res of phase.resources) {
            totalResources++;
            const isValid = await verifyResourceUrl(res.url || res.verifiedUrl);
            if (!isValid) brokenCount++;
          }
        }

        const brokenPct = totalResources > 0 ? (brokenCount / totalResources) * 100 : 0;
        if (brokenPct > 25) {
          for (const phase of roadmap.roadmap) {
            phase.resources = await getVerifiedResourcesForTopics(phase.topics || []);
          }
          await roadmap.save();
        }
      } catch(err){}
    }
  } catch(err){}
};

const startScheduler = () => {
  console.log('⏳ [Background Scheduler] Initializing background task worker (Runs every 30 minutes)...');

  setTimeout(() => {
    runAllTasks().catch(err => console.error('Scheduler Startup Task Error:', err));
  }, 8000); 

  setInterval(() => {
    runAllTasks().catch(err => console.error('Scheduler Interval Task Error:', err));
  }, 1800000); 

  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  setInterval(() => {
    runWeeklyResourceVerification().catch(err => console.error('Weekly Sweep Error:', err));
  }, SEVEN_DAYS_MS);
};

module.exports = {
  startScheduler,
  runAllTasks,
  runWeeklyResourceVerification
};
