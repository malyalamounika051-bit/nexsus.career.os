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
 * Returns rolling list of career-focused, curated news items grouped by category.
 * Refreshes from AI every 1 hour and automatically deletes items older than 24 hours.
 */
exports.getNewsPulse = async (req, res) => {
  try {
    // 1. Fetch current news from DB (which is pre-populated by the background scheduler)
    let currentNews = await CareerPulseNews.find().sort({ timestamp: -1 });

    // 2. Return fallback news immediately if DB is empty on first boot
    if (currentNews.length === 0) {
      const fallbacks = [
        {
          headline: "NVIDIA Launches Advanced AI Agent Bootcamp",
          summary: "NVIDIA announced a new developer initiative focused on training programmers to build autonomous agents using NIM microservices.",
          whyItMatters: "Students learning LangChain, Python, and agent frameworks will have direct pathway opportunities into GPU-accelerated software roles.",
          source: "NVIDIA Blog",
          url: "https://developer.nvidia.com",
          category: "AI",
          timestamp: new Date()
        },
        {
          headline: "Microsoft Expands Azure Cloud Internships for 2026",
          summary: "Applications have officially opened for Microsoft's global cloud infrastructure and engineering internship program.",
          whyItMatters: "Prerequisites focus on TypeScript, Docker, and Kubernetes. Getting certified in AZ-900 will boost applications significantly.",
          source: "Microsoft Careers",
          url: "https://careers.microsoft.com",
          category: "Big Tech",
          timestamp: new Date()
        },
        {
          headline: "TCS to Hire 40,000 Graduates in Massive Campus Drive",
          summary: "India's largest IT service exporter resumes wide-scale campus hiring focusing on digital systems and cloud-native solutions.",
          whyItMatters: "A great entry point for freshers. Focus on preparing data structures, algorithms, and SQL basics to clear the initial assessments.",
          source: "Economic Times",
          url: "https://economictimes.indiatimes.com",
          category: "Hiring",
          timestamp: new Date()
        },
        {
          headline: "Venture Accelerator Launches $50M Student Startup Fund",
          summary: "A new seed capital initiative is targeting tech ideas incubated inside engineering colleges and university labs.",
          whyItMatters: "Students with solid MVPs can apply for non-dilutive grants, mentorship channels, and startup support ecosystems.",
          source: "TechCrunch",
          url: "https://techcrunch.com",
          category: "Startups",
          timestamp: new Date()
        },
        {
          headline: "Cybersecurity Analyst Demand Surges 32% Globally",
          summary: "Industry reports show an acute shortage of certified DevSecOps and cloud security engineers across enterprise networks.",
          whyItMatters: "Learning basic penetration testing, network protocols, and OWASP standards is a highly resilient skill stack for 2026.",
          source: "Hacker News",
          url: "https://news.ycombinator.com",
          category: "Skills",
          timestamp: new Date()
        },
        {
          headline: "Google DevFest Student Challenges Go Live",
          summary: "Google developer groups announced local hackathons and sandbox challenges for college coders building web applications.",
          whyItMatters: "Winning teams gain direct resume referral channels to Google technical recruiters and cloud platform credits.",
          source: "Google Developers",
          url: "https://developers.google.com",
          category: "Students",
          timestamp: new Date()
        }
      ];
      return res.status(200).json({ success: true, source: 'fallback', data: fallbacks });
    }

    return res.status(200).json({
      success: true,
      source: 'database',
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
