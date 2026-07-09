const mongoose = require('mongoose');
const CareerPulseNews = require('../models/CareerPulseNews');
const Opportunity = require('../models/Opportunity');
const JobCache = require('../models/JobCache');
const { aggregateJobs } = require('./jobAggregator');
const { callAI } = require('../utils/geminiClient');
const { parseStructuredJson } = require('../utils/jsonParser');

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
  console.log('🏁 [Background Worker] Starting hourly pre-fetching tasks...');

  // Task 1: Fetch and cache Career Pulse News
  try {
    const now = new Date();
    const archiveThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    // Clear news older than 24 hours
    await CareerPulseNews.deleteMany({ timestamp: { $lt: archiveThreshold } });

    console.log('🤖 [Background Worker] Curing Career Pulse News...');
    const aiPrompt = `You are a Career Intelligence Editor. Review tech updates for today (${now.toDateString()}).
Generate a structured JSON array of EXACTLY 6 fresh, highly relevant career news items.
Generate exactly 1 news item for EACH of these 6 categories:
- 'Big Tech' (NVIDIA, Google, Microsoft, Meta, Amazon, Apple, OpenAI, Anthropic)
- 'AI' (Generative AI, LLMs, AI agents, hardware)
- 'Hiring' (workforce trends, fresher recruitment, major technical hirings)
- 'Startups' (Incubators, startup launches, unicorns, venture funding)
- 'Skills' (DevOps, TypeScript, cloud computing, cybersecurity, AI engineering)
- 'Students' (challenges, learning programs, developer bootcamps, scholarships)

Format as a clean JSON array with EXACTLY this structure:
[
  {
    "headline": "Headline of the update",
    "title": "Short title of the update (same as headline)",
    "summary": "Concise 2-line summary explaining the update clearly.",
    "whyItMatters": "Actionable explanation of why this matters to students, freshers, or job seekers (e.g. what skills they should learn).",
    "source": "Source name (e.g., TechCrunch, Microsoft Blog, NVIDIA News)",
    "sourceLogo": "Logo URL matching the publisher (e.g., 'https://logo.clearbit.com/techcrunch.com' or 'https://logo.clearbit.com/nvidia.com')",
    "image": "A relevant illustrative tech image URL from Unsplash or direct from the source blog assets",
    "articleUrl": "The exact valid deep URL to the original article (CRITICAL: Do NOT use the generic homepage. Must be the exact link to the specific blog post or news page, e.g. 'https://blogs.nvidia.com/blog/2024/05/generative-ai-nim/', 'https://techcrunch.com/2024/06/venture-fund-announcement/'. This ensures users read the actual article.)",
    "url": "Same as articleUrl",
    "author": "Name of the writer or publisher editor",
    "readTime": "Estimated read duration (e.g., '4 min read')",
    "category": "One of: Big Tech, AI, Hiring, Startups, Skills, Students"
  }
]
Return ONLY the raw JSON array. Do not include markdown wraps or conversational preambles.`;

    const aiResponse = await callAI({
      messages: [{ role: 'user', content: aiPrompt }],
      temperature: 0.75
    });

    const newsItems = parseStructuredJson(aiResponse.text);
    if (Array.isArray(newsItems) && newsItems.length > 0) {
      for (const item of newsItems) {
        try {
          await CareerPulseNews.findOneAndUpdate(
            { headline: item.headline },
            { ...item, timestamp: new Date() },
            { upsert: true, new: true }
          );
        } catch (dbErr) {
          if (dbErr.code !== 11000) console.error('Pulse DB Insert Err:', dbErr.message);
        }
      }
      console.log('✅ [Background Worker] News updates populated successfully.');
    }
  } catch (error) {
    console.error('❌ [Background Worker] News curation task failed:', error.message);
  }

  // Task 2: Curate and Pre-seed active Student Opportunities (Radar)
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

  // Task 3: Pre-Cache popular Job Aggregator Results (avoids slow search wait)
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

  console.log('🏁 [Background Worker] Hourly pre-fetching tasks completed.');
};

/**
 * Initialize the hourly background worker
 */
const startScheduler = () => {
  console.log('⏳ [Background Scheduler] Initializing background task worker (Runs every 60 minutes)...');

  // Trigger an initial run on server startup (skipped in development to avoid hammering API on hot-reloads)
  if (process.env.NODE_ENV !== 'development') {
    setTimeout(() => {
      runAllTasks().catch(err => console.error('Scheduler Startup Task Error:', err));
    }, 5000); // 5-second delay to let MongoDB connect first
  }

  // Setup interval loop
  setInterval(() => {
    runAllTasks().catch(err => console.error('Scheduler Interval Task Error:', err));
  }, 3600000); // 1 hour
};

module.exports = {
  startScheduler,
  runAllTasks
};
