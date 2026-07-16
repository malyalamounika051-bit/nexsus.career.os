const CareerPulseNews = require('../models/CareerPulseNews');
const SaraInsight = require('../models/SaraInsight');
const quotes = require('../utils/quotesPool');
const { callAI } = require('../utils/geminiClient');
const { parseStructuredJson } = require('../utils/jsonParser');

// In-memory timestamps to rate limit refreshes
let lastNewsRefresh = 0;
const REFRESH_INTERVAL = 3600000; // 1 hour in ms

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

/**
 * GET /api/dashboard/quote
 * Returns daily motivation quote (same for all users on a given day)
 */
exports.getDailyQuote = async (req, res) => {
  try {
    const idx = getDailyQuoteIndex();
    const selectedQuote = quotes[idx];
    return res.status(200).json({
      success: true,
      data: selectedQuote
    });
  } catch (error) {
    console.error('Error fetching quote:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/dashboard/news
 * Returns rolling list of REAL career news articles fetched from RSS feeds.
 * Supports ?q=search&category=AI query params.
 * If DB is empty, triggers an immediate RSS fetch.
 */
exports.getNewsPulse = async (req, res) => {
  try {
    const { q, category } = req.query;

    // Build query filter
    const filter = {};
    if (category && category !== 'All') {
      filter.category = category;
    }
    if (q && q.trim()) {
      const searchRegex = new RegExp(q.trim(), 'i');
      filter.$or = [
        { headline: searchRegex },
        { summary: searchRegex },
        { source: searchRegex },
        { tags: searchRegex }
      ];
    }

    // Only return articles that have a valid articleUrl
    filter.articleUrl = { $exists: true, $ne: '' };

    let currentNews = await CareerPulseNews.find(filter)
      .sort({ publishedAt: -1 })
      .limit(30);

    const forceRefresh = req.query.refresh === 'true';
    if (forceRefresh) {
      console.log('📡 [Dashboard] Force refresh requested — clearing old news cache...');
      await CareerPulseNews.deleteMany({});
      currentNews = [];
    }

    // If DB is empty or force refresh was triggered, execute RSS sync
    if (currentNews.length === 0 && !q && (!category || category === 'All')) {
      try {
        const { fetchAllFeeds } = require('../services/rssFeedService');
        console.log('📡 [Dashboard] Triggering immediate RSS fetch...');
        const articles = await fetchAllFeeds();

        if (Array.isArray(articles) && articles.length > 0) {
          for (const article of articles) {
            try {
              await CareerPulseNews.findOneAndUpdate(
                { articleUrl: article.articleUrl },
                { ...article, timestamp: new Date() },
                { upsert: true, new: true }
              );
            } catch (dbErr) {
              if (dbErr.code !== 11000) console.error('Pulse Insert Err:', dbErr.message);
            }
          }
          // Re-query after insertion
          currentNews = await CareerPulseNews.find(filter)
            .sort({ publishedAt: -1 })
            .limit(30);
        }
      } catch (fetchErr) {
        console.error('❌ [Dashboard] RSS fetch failed:', fetchErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      source: 'rss',
      count: currentNews.length,
      data: currentNews
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/dashboard/insight
 * Returns "Sara Says" daily AI career recommendation based on active news categories.
 */
exports.getSaraInsight = async (req, res) => {
  try {
    const todayStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    // Check DB for today's existing insight
    let dailyInsight = await SaraInsight.findOne({ date: todayStr });

    if (!dailyInsight) {
      console.log(`🤖 Generating fresh Sara Career Insight for ${todayStr}...`);
      try {
        // Fetch current active news to base the insight on
        const recentNews = await CareerPulseNews.find().limit(5);
        const newsHeadlineString = recentNews.map(n => n.headline).join(', ');

        const aiPrompt = `You are Sara, the expert AI career coach. Today's major tech news includes: [${newsHeadlineString}].
Based on these updates, write a highly actionable, encouraging career recommendation for students and job seekers.
Requirements:
- Start directly with 'Sara Says:'
- Keep it under 2 sentences.
- Reference a trend (e.g., cloud security, AI agents, fresher campus drives) and tell students what specific action they should take today.
Return only the insight text.`;

        const aiResponse = await callAI({
          messages: [{ role: 'user', content: aiPrompt }],
          temperature: 0.7
        });

        const insightText = aiResponse.text || "Sara Says: Cloud and AI engineering skills dominate current technology hiring. Focus on mastering system design and containerization tools today.";

        dailyInsight = await SaraInsight.create({
          content: insightText,
          date: todayStr
        });
      } catch (aiErr) {
        console.error('⚠️ AI Daily Insight generation failed:', aiErr.message);
        dailyInsight = {
          content: "Sara Says: The demand for full-stack developers skilled in TypeScript and cloud-native services is growing. Dedicate 30 minutes to building a hands-on project today.",
          date: todayStr
        };
      }
    }

    return res.status(200).json({
      success: true,
      data: dailyInsight
    });
  } catch (error) {
    console.error('Error in daily insight:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Keep old fallback for company hiring list
const fallbackHiring = [
  {
    company: "Google",
    logoText: "G",
    color: "#4285F4",
    openRoles: 142,
    categories: ["AI/ML Research", "Cloud Engineering", "Android Dev"],
    location: "Bangalore & Remote"
  },
  {
    company: "Microsoft",
    logoText: "MS",
    color: "#00A4EF",
    openRoles: 98,
    categories: ["C#/.NET Core", "Azure Infra", "Data Science"],
    location: "Hyderabad & Bangalore"
  },
  {
    company: "Amazon",
    logoText: "Az",
    color: "#FF9900",
    openRoles: 110,
    categories: ["AWS Architect", "Backend Systems", "Operations"],
    location: "Pune, Chennai & Remote"
  },
  {
    company: "NVIDIA",
    logoText: "NV",
    color: "#76B900",
    openRoles: 64,
    categories: ["CUDA Optimization", "Deep Learning", "C++ System"],
    location: "Bangalore & Pune"
  },
  {
    company: "Stripe",
    logoText: "S",
    color: "#635BFF",
    openRoles: 35,
    categories: ["API Platform", "Product Design", "Security Engine"],
    location: "Remote (India)"
  },
  {
    company: "Vercel",
    logoText: "▲",
    color: "#000000",
    openRoles: 18,
    categories: ["Next.js Core", "DevRel & Support", "Rust Tooling"],
    location: "Remote"
  }
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
    return res.status(500).json({ success: false, message: error.message });
  }
};
