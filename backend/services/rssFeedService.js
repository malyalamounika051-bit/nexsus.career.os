const Parser = require('rss-parser');

const parser = new Parser({
  timeout: 8000,
  headers: {
    'User-Agent': 'NexusCareerOS/1.0 (Career Intelligence Feed)',
    'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml'
  },
  customFields: {
    item: [
      ['media:content', 'mediaContent', { keepArray: false }],
      ['media:thumbnail', 'mediaThumbnail', { keepArray: false }],
      ['dc:creator', 'dcCreator']
    ]
  }
});

const RSS_FEEDS = [
  { url: 'https://blog.google/technology/ai/rss/', source: 'Google AI Blog', category: 'AI', logo: 'https://logo.clearbit.com/google.com' },
  { url: 'https://blogs.nvidia.com/feed/', source: 'NVIDIA Blog', category: 'AI', logo: 'https://logo.clearbit.com/nvidia.com' },
  { url: 'https://huggingface.co/blog/feed.xml', source: 'Hugging Face', category: 'AI', logo: 'https://logo.clearbit.com/huggingface.co' },
  { url: 'https://devblogs.microsoft.com/dotnet/feed/', source: 'Microsoft Dev Blog', category: 'Big Tech', logo: 'https://logo.clearbit.com/microsoft.com' },
  { url: 'https://engineering.fb.com/feed/', source: 'Meta Engineering', category: 'Big Tech', logo: 'https://logo.clearbit.com/meta.com' },
  { url: 'https://www.theverge.com/rss/index.xml', source: 'The Verge', category: 'Big Tech', logo: 'https://logo.clearbit.com/theverge.com' },
  { url: 'https://techcrunch.com/feed/', source: 'TechCrunch', category: 'Startups', logo: 'https://logo.clearbit.com/techcrunch.com' },
  { url: 'https://aws.amazon.com/blogs/aws/feed/', source: 'AWS Blog', category: 'Cloud', logo: 'https://logo.clearbit.com/aws.amazon.com' },
  { url: 'https://blog.cloudflare.com/rss/', source: 'Cloudflare Blog', category: 'Cloud', logo: 'https://logo.clearbit.com/cloudflare.com' },
  { url: 'https://github.blog/feed/', source: 'GitHub Blog', category: 'Open Source', logo: 'https://logo.clearbit.com/github.com' },
  { url: 'https://stackoverflow.blog/feed/', source: 'Stack Overflow Blog', category: 'Career Tips', logo: 'https://logo.clearbit.com/stackoverflow.com' },
  { url: 'https://dev.to/feed', source: 'Dev.to', category: 'Skills', logo: 'https://logo.clearbit.com/dev.to' },
  { url: 'https://krebsonsecurity.com/feed/', source: 'Krebs on Security', category: 'Cybersecurity', logo: 'https://logo.clearbit.com/krebsonsecurity.com' },
  { url: 'https://www.wired.com/feed/category/security/latest/rss', source: 'Wired Security', category: 'Cybersecurity', logo: 'https://logo.clearbit.com/wired.com' },
  { url: 'https://machinelearningmastery.com/feed/', source: 'ML Mastery', category: 'Data Science', logo: 'https://logo.clearbit.com/machinelearningmastery.com' },
  { url: 'https://hbr.org/resources/pdfs/comm/hbr/rss/rss.xml', source: 'Harvard Business Review', category: 'Career Tips', logo: 'https://logo.clearbit.com/hbr.org' },
  { url: 'https://netflixtechblog.com/feed', source: 'Netflix Tech Blog', category: 'Big Tech', logo: 'https://logo.clearbit.com/netflix.com' },
  { url: 'https://engineering.atspotify.com/feed/', source: 'Spotify Engineering', category: 'Big Tech', logo: 'https://logo.clearbit.com/spotify.com' }
];

// Curated fallbacks if feed fails or is empty
const CURATED_FALLBACK_NEWS = [
  {
    headline: "The Rise of Specialized AI Agents in Software Development",
    title: "The Rise of Specialized AI Agents in Software Development",
    summary: "As agentic architectures expand, companies are seeking software engineers who understand prompt orchestration, workflows, and tool integration.",
    whyItMatters: "Sara Says: AI agents are shifting engineering roles from manual coding to workspace orchestration. Master LangChain and tool integration today.",
    articleUrl: "https://nexus-career-os.vercel.app/pulse/ai-agents",
    url: "https://nexus-career-os.vercel.app/pulse/ai-agents",
    source: "Nexus Intelligence",
    sourceLogo: "https://logo.clearbit.com/vercel.com",
    category: "AI",
    image: "",
    author: "Sara AI Recruiter",
    readTime: "3 min read",
    publishedAt: new Date(),
    timestamp: new Date(),
    tags: ["AI", "Agentic", "LangChain"]
  },
  {
    headline: "System Design Essentials: Scalable Caching Layers",
    title: "System Design Essentials: Scalable Caching Layers",
    summary: "A deep look into setting up distributed caching with Redis to reduce backend load and minimize serverless function invocation latencies.",
    whyItMatters: "Sara Says: Caching optimization is a highly sought skill in senior systems roles. Build a simple Redis queue to practice handling concurrent loads.",
    articleUrl: "https://nexus-career-os.vercel.app/pulse/caching-systems",
    url: "https://nexus-career-os.vercel.app/pulse/caching-systems",
    source: "Nexus Intelligence",
    sourceLogo: "https://logo.clearbit.com/vercel.com",
    category: "Cloud",
    image: "",
    author: "Sara AI Recruiter",
    readTime: "4 min read",
    publishedAt: new Date(),
    timestamp: new Date(),
    tags: ["Cloud", "System Design", "Redis"]
  }
];

function extractImage(item) {
  if (item.enclosure && item.enclosure.url) return item.enclosure.url;
  if (item.mediaContent && item.mediaContent.$ && item.mediaContent.$.url) return item.mediaContent.$.url;
  if (item.mediaThumbnail && item.mediaThumbnail.$ && item.mediaThumbnail.$.url) return item.mediaThumbnail.$.url;
  if (item['content:encoded'] || item.content) {
    const html = item['content:encoded'] || item.content;
    const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (match) return match[1];
  }
  return '';
}

function estimateReadTime(text) {
  if (!text) return '2 min read';
  const wordCount = text.replace(/<[^>]*>/g, '').split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(wordCount / 200));
  return `${minutes} min read`;
}

// Production-grade text normalizer & sanitizer
function cleanSummary(html, maxLen = 220) {
  if (!html) return '';
  const text = String(html)
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= maxLen) return text;
  return text.substring(0, maxLen).replace(/\s\S*$/, '') + '…';
}

// ---------------------------------------------------------------------------
// Normalization Pipeline
// ---------------------------------------------------------------------------
class IngestionNormalizer {
  static normalizeAuthor(authorVal, source) {
    if (!authorVal) return String(source || 'Staff Editor');
    
    // If author is an object
    if (typeof authorVal === 'object') {
      if (Array.isArray(authorVal)) {
        const joined = authorVal.map(a => IngestionNormalizer.normalizeAuthor(a, source)).filter(Boolean).join(', ');
        return joined || String(source || 'Staff Editor');
      }
      const potentialName = authorVal.name || authorVal.displayName || authorVal.creator || authorVal.company;
      return typeof potentialName === 'string' ? potentialName.trim() : String(source || 'Staff Editor');
    }

    return String(authorVal).trim() || String(source || 'Staff Editor');
  }

  static normalizeSummary(summaryVal, title, source) {
    const cleaned = cleanSummary(summaryVal || '');
    if (cleaned && cleaned.trim()) return cleaned.trim();
    
    // Fallback based on title
    return `${title || 'Tech Update'}. Read the full story on the official blog of ${source || 'Official Source'}.`;
  }

  static normalizeString(val, fallback = '') {
    if (val === null || val === undefined) return fallback;
    if (typeof val === 'object') {
      const flattened = val.text || val.content || val.message || Object.values(val)[0] || '';
      return String(flattened).trim() || fallback;
    }
    return String(val).trim() || fallback;
  }
}

async function fetchSingleFeed(feedConfig) {
  try {
    const feed = await parser.parseURL(feedConfig.url);
    const now = Date.now();
    const sixtyDaysAgo = now - 60 * 24 * 60 * 60 * 1000;

    const articles = [];

    for (const item of (feed.items || []).slice(0, 5)) {
      try {
        const pubDate = item.pubDate || item.isoDate;
        const publishedAt = pubDate ? new Date(pubDate) : new Date();

        if (publishedAt.getTime() < sixtyDaysAgo) continue;

        const articleUrl = item.link || item.guid;
        if (!articleUrl || !articleUrl.startsWith('http')) continue;

        const rawTitle = item.title || '';
        const title = IngestionNormalizer.normalizeString(rawTitle);
        if (!title) continue;

        // Normalize author
        const rawAuthor = item.creator || item.dcCreator || item.author || feedConfig.source;
        const author = IngestionNormalizer.normalizeAuthor(rawAuthor, feedConfig.source);

        // Normalize summary
        const rawSummary = item.contentSnippet || item.content || item.summary || item.description || '';
        const summary = IngestionNormalizer.normalizeSummary(rawSummary, title, feedConfig.source);

        const image = extractImage(item);
        const readTime = estimateReadTime(item.contentSnippet || item.content || '');

        articles.push({
          headline: title,
          title,
          summary,
          articleUrl,
          url: articleUrl,
          source: feedConfig.source,
          sourceLogo: feedConfig.logo,
          category: feedConfig.category,
          image,
          author,
          readTime,
          publishedAt,
          tags: extractTags(title + ' ' + summary),
          timestamp: publishedAt
        });
      } catch (itemErr) {
        console.warn(`⚠️ [RSS Item Skip] Error parsing item in ${feedConfig.source}: ${itemErr.message}`);
      }
    }

    return articles;
  } catch (err) {
    console.warn(`⚠️ [RSS Feed Skip] Failed to fetch ${feedConfig.source}: ${err.message}`);
    return [];
  }
}

function extractTags(text) {
  const keywords = [
    'AI', 'Machine Learning', 'React', 'Node.js', 'Python', 'Docker', 'Kubernetes',
    'AWS', 'Azure', 'GCP', 'TypeScript', 'JavaScript', 'Rust', 'Go', 'DevOps',
    'Cloud', 'Security', 'Cybersecurity', 'Data Science', 'LLM', 'GPT', 'Open Source',
    'Startup', 'Hiring', 'Remote', 'Internship', 'Scholarship', 'Full Stack',
    'Frontend', 'Backend', 'API', 'Database', 'MongoDB', 'PostgreSQL'
  ];
  const lower = text.toLowerCase();
  return keywords.filter(k => lower.includes(k.toLowerCase())).slice(0, 5);
}

async function fetchAllFeeds() {
  console.log(`📡 [RSS] Fetching from ${RSS_FEEDS.length} sources...`);

  const results = await Promise.allSettled(
    RSS_FEEDS.map(feed => fetchSingleFeed(feed))
  );

  const allArticles = [];
  const seenUrls = new Set();

  for (const result of results) {
    if (result.status === 'fulfilled') {
      for (const article of result.value) {
        if (!seenUrls.has(article.articleUrl)) {
          seenUrls.add(article.articleUrl);
          allArticles.push(article);
        }
      }
    }
  }

  // Fallback to curated mock stories if total articles is empty
  if (allArticles.length === 0) {
    console.log('⚠️ [RSS] All feed queries failed or empty. Loading curated fallback news data.');
    return CURATED_FALLBACK_NEWS;
  }

  allArticles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  console.log(`✅ [RSS] Fetched ${allArticles.length} normalized articles.`);
  return allArticles;
}

module.exports = { 
  fetchAllFeeds, 
  RSS_FEEDS, 
  IngestionNormalizer,
  CURATED_FALLBACK_NEWS
};
