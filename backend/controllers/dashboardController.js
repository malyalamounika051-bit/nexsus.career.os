const mongoose = require('mongoose');
const CareerPulseNews = require('../models/CareerPulseNews');
const SaraInsight = require('../models/SaraInsight');
const quotes = require('../utils/quotesPool');
const { callAI } = require('../utils/geminiClient');
const { parseStructuredJson } = require('../utils/jsonParser');
const { IngestionNormalizer, CURATED_FALLBACK_NEWS } = require('../services/rssFeedService');

/**
 * Helper to select deterministic daily quote based on current date
 */
function getDailyQuoteIndex() {
  const today = new Date().toDateString(); // e.g. "Sat Jun 20 2026"
  let hash = 0;
  for (let i = 0; i < today.length; i++) {
    hash = today.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % quotes.length;
}

// Global backup quote fallback
const DEFAULT_FALLBACK_QUOTE = {
  text: "consistency is what transforms average into excellence. keep building your skills daily.",
  author: "Nexus Leadership"
};

/**
 * GET /api/dashboard/quote
 * Returns daily motivation quote.
 * Fully in-memory, independent of DB connection states.
 */
exports.getDailyQuote = async (req, res) => {
  try {
    const idx = getDailyQuoteIndex();
    const selectedQuote = quotes[idx] || DEFAULT_FALLBACK_QUOTE;
    return res.status(200).json({
      success: true,
      data: selectedQuote
    });
  } catch (error) {
    console.error('Error fetching quote:', error);
    return res.status(200).json({ 
      success: true, 
      data: DEFAULT_FALLBACK_QUOTE 
    });
  }
};

/**
 * GET /api/dashboard/news
 * Returns rolling list of REAL career news articles.
 * Bypasses MongoDB queries if connection is not active to prevent execution timeouts on Vercel.
 */
exports.getNewsPulse = async (req, res) => {
  try {
    const { q, category } = req.query;

    const filter = {};
    if (category && category !== 'All') {
      filter.category = category;
    }
    if (q && q.trim()) {
      const searchRegex = new RegExp(q.trim(), 'i');
      filter.$or = [
        { headline: searchRegex },
        { summary: searchRegex },
        { source: searchRegex }
      ];
    }

    filter.articleUrl = { $exists: true, $ne: '' };

    let currentNews = [];
    const isDbConnected = mongoose.connection.readyState === 1;

    // Only query MongoDB if connection is active
    if (isDbConnected) {
      try {
        currentNews = await CareerPulseNews.find(filter)
          .sort({ publishedAt: -1 })
          .limit(20);
      } catch (dbFindErr) {
        console.warn('⚠️ MongoDB news query failed, falling back:', dbFindErr.message);
      }
    }

    const forceRefresh = req.query.refresh === 'true';
    if (forceRefresh && isDbConnected) {
      try {
        await CareerPulseNews.deleteMany({});
        currentNews = [];
      } catch(e){}
    }

    // Trigger on-the-fly RSS parsing if DB news is empty
    if (currentNews.length === 0 && !q && (!category || category === 'All')) {
      try {
        const { fetchAllFeeds } = require('../services/rssFeedService');
        const articles = await fetchAllFeeds();

        if (Array.isArray(articles) && articles.length > 0) {
          currentNews = articles;

          // Only attempt database cache update if connected
          if (isDbConnected) {
            // Push updates asynchronously in background, do NOT await sequentially to prevent timeouts
            Promise.resolve().then(async () => {
              for (const article of articles) {
                try {
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
                } catch (dbErr) {}
              }
            });
          }
        }
      } catch (fetchErr) {
        console.error('❌ [Dashboard] RSS fetch failed:', fetchErr.message);
      }
    }

    // Fallback if still empty
    if (currentNews.length === 0) {
      currentNews = CURATED_FALLBACK_NEWS;
    }

    return res.status(200).json({
      success: true,
      source: 'rss',
      count: currentNews.length,
      data: currentNews
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    return res.status(200).json({ 
      success: true, 
      data: CURATED_FALLBACK_NEWS 
    });
  }
};

/**
 * GET /api/dashboard/insight
 * Returns SARA AI Career Insight.
 */
exports.getSaraInsight = async (req, res) => {
  const todayStr = new Date().toISOString().slice(0, 10);
  const fallbackInsight = {
    content: "Sara Says: AI agents, distributed caching, and backend security skills are dominating technical hiring indexes. Dedicate 20 minutes to writing a system design diagram today.",
    date: todayStr
  };

  try {
    let dailyInsight = null;
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      try {
        dailyInsight = await SaraInsight.findOne({ date: todayStr });
      } catch (dbErr) {
        console.warn('⚠️ Mongoose insight query failed:', dbErr.message);
      }
    }

    if (!dailyInsight) {
      try {
        let recentNews = [];
        if (isDbConnected) {
          try {
            recentNews = await CareerPulseNews.find().limit(5);
          } catch(e){}
        }

        const newsHeadlineString = recentNews.map(n => n.headline).join(', ') || 'AI Agents, Tech Scaling';

        const aiPrompt = `You are Sara, the expert AI career coach. Tech updates: [${newsHeadlineString}].
        Based on these updates, write a 1-sentence action item starting with 'Sara Says:' to recommend skills to master. Keep it under 2 sentences.`;

        const aiResponse = await callAI({
          messages: [{ role: 'user', content: aiPrompt }],
          temperature: 0.7
        });

        const rawInsightText = aiResponse.text || fallbackInsight.content;
        const insightText = IngestionNormalizer.normalizeString(rawInsightText, fallbackInsight.content);

        dailyInsight = { content: insightText, date: todayStr };

        if (isDbConnected) {
          // Fire save asynchronously in background
          SaraInsight.create({
            content: insightText,
            date: todayStr
          }).catch(() => {});
        }
      } catch (aiErr) {
        console.error('⚠️ AI Daily Insight generation failed:', aiErr.message);
        dailyInsight = fallbackInsight;
      }
    }

    return res.status(200).json({
      success: true,
      data: dailyInsight
    });
  } catch (error) {
    console.error('Error in daily insight:', error);
    return res.status(200).json({ 
      success: true, 
      data: fallbackInsight 
    });
  }
};

const fallbackHiring = [
  { company: "Google", logoText: "G", color: "#4285F4", openRoles: 142, categories: ["AI Research", "Cloud Engine"], location: "Bangalore" },
  { company: "Microsoft", logoText: "MS", color: "#00A4EF", openRoles: 98, categories: [".NET Core", "Azure Infra"], location: "Hyderabad" },
  { company: "Amazon", logoText: "Az", color: "#FF9900", openRoles: 110, categories: ["AWS Architect", "Backend Systems"], location: "Remote" },
  { company: "NVIDIA", logoText: "NV", color: "#76B900", openRoles: 64, categories: ["CUDA Compiler", "Deep Learning"], location: "Pune" }
];

/**
 * GET /api/dashboard/hiring
 */
exports.getHiringPulse = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      data: fallbackHiring
    });
  } catch (error) {
    return res.status(200).json({ 
      success: true, 
      data: fallbackHiring 
    });
  }
};
