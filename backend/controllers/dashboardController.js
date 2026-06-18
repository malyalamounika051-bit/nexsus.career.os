const axios = require('axios');
const xml2js = require('xml2js');

// In-memory caches with 1-hour TTL
let newsCache = {
  data: null,
  timestamp: 0
};

let hiringCache = {
  data: null,
  timestamp: 0
};

// Pool of daily quotes (deterministic hash-based selection to avoid DB or AI calls on every request)
const quotes = [
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Your career is like a garden. It can hold an ecosystem of energy that yields information to guide your next move.", author: "Fred Kofman" },
  { text: "The best way to predict the future is to create it.", author: "Peter Drucker" },
  { text: "Opportunity does not knock, it presents itself when you beat down the door.", author: "Kyle Chandler" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "Don't find fault, find a remedy.", author: "Henry Ford" },
  { text: "The future depends on what you do today.", author: "Mahatma Gandhi" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "If you are working on something that you really care about, you don't have to be pushed. The vision pulls you.", author: "Steve Jobs" },
  { text: "You miss 100% of the shots you don't take.", author: "Wayne Gretzky" },
  { text: "Action is the foundational key to all success.", author: "Pablo Picasso" },
  { text: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },
  { text: "Your talent determines what you can do. Your motivation determines how much you are willing to do.", author: "Lou Holtz" },
  { text: "I have not failed. I've just found 10,000 ways that won't work.", author: "Thomas A. Edison" },
  { text: "The only limit to our realization of tomorrow will be our doubts of today.", author: "Franklin D. Roosevelt" }
];

// Fallback News Data
const fallbackNews = [
  {
    title: "OpenAI launches GPT-5 with multimodal agents",
    summary: "The new model supports long-horizon execution and complex task planning capabilities, transforming enterprise workflows.",
    whyItMatters: "Directly impacts demand for AI agent engineering and orchestration frameworks.",
    source: "TechCrunch",
    url: "https://techcrunch.com",
    category: "AI & ML",
    timestamp: "2 hours ago"
  },
  {
    title: "TypeScript 5.8 introduces advanced type narrowing and faster builds",
    summary: "The release optimizes compilation speeds and enhances conditional checks, boosting developer ergonomics.",
    whyItMatters: "Standard upgrade for modern frontend architectures, improving team efficiency.",
    source: "Hacker News",
    url: "https://news.ycombinator.com",
    category: "Web Dev",
    timestamp: "4 hours ago"
  },
  {
    title: "React 19 goes GA with Server Actions and Actions API",
    summary: "Eliminates boilerplate for async operations and updates transitions, making server-side React production-ready.",
    whyItMatters: "Sets the standard for modern frontend applications, reducing API boilerplate.",
    source: "Vercel Blog",
    url: "https://vercel.com/blog",
    category: "Frontend",
    timestamp: "6 hours ago"
  },
  {
    title: "Kubernetes 1.32 improves sidecar container support",
    summary: "Better lifecycle controls and init options for service meshes like Istio, reducing system resource usage.",
    whyItMatters: "Essential for cloud-native platform engineers optimizing service-mesh costs.",
    source: "K8s Blog",
    url: "https://kubernetes.io/blog",
    category: "DevOps",
    timestamp: "8 hours ago"
  },
  {
    title: "Docker Desktop announces fully-integrated local AI playground",
    summary: "Developers can now run localized LLMs with direct proxy setups inside standard workspace containers.",
    whyItMatters: "Simplifies building and testing offline-capable AI features.",
    source: "The Verge",
    url: "https://theverge.com",
    category: "Tooling",
    timestamp: "10 hours ago"
  }
];

// Fallback Hiring Data
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
 * GET /api/dashboard/quote
 */
exports.getDailyQuote = async (req, res) => {
  try {
    const today = new Date().toDateString();
    // Deterministic hash based on date string
    let hash = 0;
    for (let i = 0; i < today.length; i++) {
      hash = today.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % quotes.length;
    return res.status(200).json({
      success: true,
      data: quotes[index]
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/dashboard/news
 */
exports.getNewsPulse = async (req, res) => {
  try {
    const now = Date.now();
    // Check Cache
    if (newsCache.data && (now - newsCache.timestamp < 3600000)) {
      return res.status(200).json({ success: true, source: 'cache', data: newsCache.data });
    }

    // Attempt RSS fetch
    try {
      const response = await axios.get('https://news.ycombinator.com/rss', { timeout: 3000 });
      const parser = new xml2js.Parser({ explicitArray: false });
      const result = await parser.parseStringPromise(response.data);
      
      const items = result.rss.channel.item || [];
      const formattedItems = items.slice(0, 8).map((item, idx) => {
        // Map Hacker News stories to structure
        return {
          title: item.title,
          summary: `Discussion and latest feedback regarding "${item.title}". Check out community comments on Hacker News.`,
          whyItMatters: "Direct pulse on developer trends, technologies, and framework preferences.",
          source: "Hacker News",
          url: item.link || "https://news.ycombinator.com",
          category: idx % 2 === 0 ? "Tech Trends" : "Hiring & Startups",
          timestamp: "Recently published"
        };
      });

      newsCache.data = formattedItems;
      newsCache.timestamp = now;
      return res.status(200).json({ success: true, source: 'rss', data: formattedItems });
    } catch (err) {
      console.warn('RSS News Fetch Failed, using Fallbacks:', err.message);
      // fallback
      newsCache.data = fallbackNews;
      newsCache.timestamp = now;
      return res.status(200).json({ success: true, source: 'fallback', data: fallbackNews });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/dashboard/hiring
 */
exports.getHiringPulse = async (req, res) => {
  try {
    const now = Date.now();
    // Check Cache
    if (hiringCache.data && (now - hiringCache.timestamp < 3600000)) {
      return res.status(200).json({ success: true, source: 'cache', data: hiringCache.data });
    }

    // Default cache as fallback data
    hiringCache.data = fallbackHiring;
    hiringCache.timestamp = now;

    return res.status(200).json({
      success: true,
      source: 'fallback',
      data: fallbackHiring
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
