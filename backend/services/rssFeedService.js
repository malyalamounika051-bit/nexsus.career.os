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

/**
 * Curated list of trusted RSS feeds grouped by career category.
 * Each entry: { url, source, category, logo }
 */
const RSS_FEEDS = [
  // AI & Machine Learning
  { url: 'https://blog.google/technology/ai/rss/', source: 'Google AI Blog', category: 'AI', logo: 'https://logo.clearbit.com/google.com' },
  { url: 'https://blogs.nvidia.com/feed/', source: 'NVIDIA Blog', category: 'AI', logo: 'https://logo.clearbit.com/nvidia.com' },
  { url: 'https://huggingface.co/blog/feed.xml', source: 'Hugging Face', category: 'AI', logo: 'https://logo.clearbit.com/huggingface.co' },

  // Big Tech
  { url: 'https://devblogs.microsoft.com/dotnet/feed/', source: 'Microsoft Dev Blog', category: 'Big Tech', logo: 'https://logo.clearbit.com/microsoft.com' },
  { url: 'https://engineering.fb.com/feed/', source: 'Meta Engineering', category: 'Big Tech', logo: 'https://logo.clearbit.com/meta.com' },
  { url: 'https://www.theverge.com/rss/index.xml', source: 'The Verge', category: 'Big Tech', logo: 'https://logo.clearbit.com/theverge.com' },

  // Startups & VC
  { url: 'https://techcrunch.com/feed/', source: 'TechCrunch', category: 'Startups', logo: 'https://logo.clearbit.com/techcrunch.com' },

  // Cloud & DevOps
  { url: 'https://aws.amazon.com/blogs/aws/feed/', source: 'AWS Blog', category: 'Cloud', logo: 'https://logo.clearbit.com/aws.amazon.com' },
  { url: 'https://blog.cloudflare.com/rss/', source: 'Cloudflare Blog', category: 'Cloud', logo: 'https://logo.clearbit.com/cloudflare.com' },

  // Open Source & Developer
  { url: 'https://github.blog/feed/', source: 'GitHub Blog', category: 'Open Source', logo: 'https://logo.clearbit.com/github.com' },
  { url: 'https://stackoverflow.blog/feed/', source: 'Stack Overflow Blog', category: 'Career Tips', logo: 'https://logo.clearbit.com/stackoverflow.com' },
  { url: 'https://dev.to/feed', source: 'Dev.to', category: 'Skills', logo: 'https://logo.clearbit.com/dev.to' },

  // Cybersecurity
  { url: 'https://krebsonsecurity.com/feed/', source: 'Krebs on Security', category: 'Cybersecurity', logo: 'https://logo.clearbit.com/krebsonsecurity.com' },
  { url: 'https://www.wired.com/feed/category/security/latest/rss', source: 'Wired Security', category: 'Cybersecurity', logo: 'https://logo.clearbit.com/wired.com' },

  // Data Science
  { url: 'https://machinelearningmastery.com/feed/', source: 'ML Mastery', category: 'Data Science', logo: 'https://logo.clearbit.com/machinelearningmastery.com' },

  // Career & Hiring
  { url: 'https://hbr.org/resources/pdfs/comm/hbr/rss/rss.xml', source: 'Harvard Business Review', category: 'Career Tips', logo: 'https://logo.clearbit.com/hbr.org' },

  // Engineering Blogs
  { url: 'https://netflixtechblog.com/feed', source: 'Netflix Tech Blog', category: 'Big Tech', logo: 'https://logo.clearbit.com/netflix.com' },
  { url: 'https://engineering.atspotify.com/feed/', source: 'Spotify Engineering', category: 'Big Tech', logo: 'https://logo.clearbit.com/spotify.com' },
];

/**
 * Extract the best available image URL from an RSS item.
 */
function extractImage(item) {
  // Try standard enclosure
  if (item.enclosure && item.enclosure.url) return item.enclosure.url;
  // Try media:content
  if (item.mediaContent && item.mediaContent.$ && item.mediaContent.$.url) return item.mediaContent.$.url;
  // Try media:thumbnail
  if (item.mediaThumbnail && item.mediaThumbnail.$ && item.mediaThumbnail.$.url) return item.mediaThumbnail.$.url;
  // Try to find first image in content
  if (item['content:encoded'] || item.content) {
    const html = item['content:encoded'] || item.content;
    const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (match) return match[1];
  }
  return '';
}

/**
 * Estimate reading time from text content.
 */
function estimateReadTime(text) {
  if (!text) return '2 min read';
  const wordCount = text.replace(/<[^>]*>/g, '').split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(wordCount / 200));
  return `${minutes} min read`;
}

/**
 * Strip HTML tags and truncate to a clean summary.
 */
function cleanSummary(html, maxLen = 220) {
  if (!html) return '';
  const text = html
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

/**
 * Fetch and parse a single RSS feed. Returns array of normalized article objects.
 * Gracefully returns empty array on any error.
 */
async function fetchSingleFeed(feedConfig) {
  try {
    const feed = await parser.parseURL(feedConfig.url);
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    const articles = [];

    for (const item of (feed.items || []).slice(0, 5)) {
      const pubDate = item.pubDate || item.isoDate;
      const publishedAt = pubDate ? new Date(pubDate) : new Date();

      // Skip articles older than 7 days
      if (publishedAt.getTime() < sevenDaysAgo) continue;

      const articleUrl = item.link || item.guid;
      // CRITICAL: Skip articles without a valid URL
      if (!articleUrl || !articleUrl.startsWith('http')) continue;

      const title = (item.title || '').trim();
      if (!title) continue;

      const summary = cleanSummary(item.contentSnippet || item.content || item.summary || item.description || '');
      const author = item.creator || item.dcCreator || item.author || feedConfig.source;
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
    }

    return articles;
  } catch (err) {
    console.warn(`⚠️ [RSS] Failed to fetch ${feedConfig.source}: ${err.message}`);
    return [];
  }
}

/**
 * Extract simple keyword tags from text content.
 */
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

/**
 * Fetch ALL feeds concurrently and return a flat, deduplicated, sorted list of articles.
 */
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
        // Deduplicate by URL
        if (!seenUrls.has(article.articleUrl)) {
          seenUrls.add(article.articleUrl);
          allArticles.push(article);
        }
      }
    }
  }

  // Sort by publish date, newest first
  allArticles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

  console.log(`✅ [RSS] Fetched ${allArticles.length} real articles from ${RSS_FEEDS.length} sources`);
  return allArticles;
}

module.exports = { fetchAllFeeds, RSS_FEEDS };
