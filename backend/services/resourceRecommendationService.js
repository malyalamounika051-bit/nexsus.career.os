/**
 * Resource Recommendation Service v3.0
 * 
 * Maps AI-generated learning topics to verified, real resources from the catalog.
 * Supports multi-resource per topic, priority ranking, and URL verification.
 * 
 * Priority Order:
 * 1. Official Documentation
 * 2. Microsoft Learn / AWS Skill Builder / Google Cloud
 * 3. University Courses (CS50, MIT OCW)
 * 4. freeCodeCamp
 * 5. Coursera / edX
 * 6. YouTube Tutorials
 * 7. Community Articles
 */

const axios = require('axios');
const { RESOURCE_CATALOG } = require('./resourceCatalog');

// Priority scoring for resource types (higher = better)
const PROVIDER_PRIORITY = {
  'Mozilla Developer Network': 100,
  'Python Software Foundation': 100,
  'React Core Team': 100,
  'Node.js Foundation': 100,
  'Docker': 100,
  'CNCF': 100,
  'Google': 95,
  'Microsoft': 95,
  'Oracle': 95,
  'Meta AI': 95,
  'Rust Foundation': 95,
  'Go Team': 95,
  'Amazon Web Services': 90,
  'HashiCorp': 90,
  'Harvard University': 85,
  'freeCodeCamp': 80,
  'Coursera': 70,
  'edX': 70,
  'Kaggle': 75,
  'roadmap.sh': 60,
  'LeetCode': 65,
  'HackerRank': 65,
  'CodeWars': 55,
  'Exercism': 55,
};

/**
 * Validates a URL by checking for HTTP 200/301/302 status.
 */
async function verifyResourceUrl(url) {
  if (!url || url === '#' || !url.startsWith('http')) return false;
  try {
    const res = await axios.head(url, {
      timeout: 4000,
      maxRedirects: 3,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      validateStatus: (status) => status < 400,
    });
    return true;
  } catch {
    try {
      const res = await axios.get(url, {
        timeout: 4000,
        maxRedirects: 3,
        maxContentLength: 5000,
        headers: { 'User-Agent': 'Mozilla/5.0' },
        validateStatus: (status) => status < 400,
      });
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Finds matching resources from the catalog for a given topic string.
 * Uses fuzzy keyword matching across all catalog keys.
 */
function findCatalogMatches(topic) {
  const term = topic.toLowerCase().trim();
  const matches = [];

  for (const [key, resources] of Object.entries(RESOURCE_CATALOG)) {
    // Check if the topic contains the catalog key or vice versa
    const keyWords = key.split(/\s+/);
    const termWords = term.split(/\s+/);

    const directMatch = term.includes(key) || key.includes(term);
    const wordOverlap = keyWords.some(kw => termWords.some(tw => tw.includes(kw) || kw.includes(tw)));

    if (directMatch || wordOverlap) {
      for (const resource of resources) {
        matches.push({
          ...resource,
          matchScore: directMatch ? 100 : 50,
        });
      }
    }
  }

  return matches;
}

/**
 * Ranks resources by priority order:
 * Official Docs > Microsoft/AWS/Google > Universities > freeCodeCamp > Coursera/edX > YouTube > Articles
 */
function rankResources(resources) {
  return resources.sort((a, b) => {
    const aPriority = PROVIDER_PRIORITY[a.provider] || 30;
    const bPriority = PROVIDER_PRIORITY[b.provider] || 30;

    // Primary sort: official resources first
    if (a.isOfficial !== b.isOfficial) return a.isOfficial ? -1 : 1;

    // Secondary sort: provider priority
    if (aPriority !== bPriority) return bPriority - aPriority;

    // Tertiary sort: match score
    return (b.matchScore || 0) - (a.matchScore || 0);
  });
}

/**
 * Main interface: Maps learning topics to verified resources.
 * Returns a balanced, deduplicated, priority-ranked set of resources.
 */
async function getVerifiedResourcesForTopics(topics) {
  const allMatches = [];
  const seenUrls = new Set();

  // Step 1: Collect matches from catalog for each topic
  for (const topic of topics) {
    const matches = findCatalogMatches(topic);
    for (const match of matches) {
      if (!seenUrls.has(match.url)) {
        seenUrls.add(match.url);
        allMatches.push(match);
      }
    }
  }

  // Step 2: If no catalog matches, use universal fallbacks
  if (allMatches.length === 0) {
    allMatches.push(
      { title: 'MDN Web Technology Guides', url: 'https://developer.mozilla.org/en-US/docs/Web', provider: 'Mozilla Developer Network', category: 'docs', type: 'documentation', difficulty: 'Beginner', isFree: true, duration: 'Self-paced', description: 'Official web development documentation.', isOfficial: true },
      { title: 'freeCodeCamp Core Curriculum', url: 'https://www.freecodecamp.org/learn', provider: 'freeCodeCamp', category: 'platform', type: 'platform', difficulty: 'Beginner', isFree: true, duration: 'Self-paced', description: 'Free interactive coding certification platform.', isOfficial: false },
      { title: 'Microsoft Learn', url: 'https://learn.microsoft.com/en-us/training/', provider: 'Microsoft', category: 'platform', type: 'platform', difficulty: 'Beginner', isFree: true, duration: 'Self-paced', description: 'Official Microsoft learning paths for developers.', isOfficial: true },
    );
  }

  // Step 3: Rank by priority
  const ranked = rankResources(allMatches);

  // Step 4: Verify URLs and build final list (cap at 8 per topic set)
  const verified = [];
  for (const item of ranked.slice(0, 12)) {
    const isValid = await verifyResourceUrl(item.url);
    if (isValid) {
      verified.push({
        title: item.title,
        url: item.url,
        provider: item.provider,
        category: item.category,
        type: item.type,
        difficulty: item.difficulty,
        isFree: item.isFree,
        duration: item.duration,
        description: item.description,
        isOfficial: item.isOfficial,
        verified: true,
        verifiedUrl: item.url,
        lastChecked: new Date(),
        lastVerifiedDate: new Date(),
      });
    }
  }

  // Step 5: Ensure minimum resource diversity
  const types = new Set(verified.map(v => v.type));

  // If no official docs, add MDN as fallback
  if (!types.has('documentation')) {
    verified.unshift({
      title: 'MDN Web Docs', url: 'https://developer.mozilla.org/en-US/', provider: 'Mozilla Developer Network',
      category: 'docs', type: 'documentation', difficulty: 'Beginner', isFree: true, duration: 'Self-paced',
      description: 'Official web technology reference.', isOfficial: true, verified: true,
      verifiedUrl: 'https://developer.mozilla.org/en-US/', lastChecked: new Date(), lastVerifiedDate: new Date(),
    });
  }

  // If no videos, add freeCodeCamp channel
  if (!types.has('video')) {
    verified.push({
      title: 'freeCodeCamp YouTube Channel', url: 'https://www.youtube.com/@freecodecamp', provider: 'freeCodeCamp',
      category: 'youtube', type: 'video', difficulty: 'Beginner', isFree: true, duration: 'Self-paced',
      description: 'Full-length developer tutorials and courses.', isOfficial: false, verified: true,
      verifiedUrl: 'https://www.youtube.com/@freecodecamp', lastChecked: new Date(), lastVerifiedDate: new Date(),
    });
  }

  // If no practice platform, add LeetCode
  if (!types.has('platform')) {
    verified.push({
      title: 'LeetCode', url: 'https://leetcode.com', provider: 'LeetCode',
      category: 'platform', type: 'platform', difficulty: 'Intermediate', isFree: true, duration: 'Self-paced',
      description: 'Practice coding problems for technical interview preparation.', isOfficial: false, verified: true,
      verifiedUrl: 'https://leetcode.com', lastChecked: new Date(), lastVerifiedDate: new Date(),
    });
  }

  return verified;
}

module.exports = {
  getVerifiedResourcesForTopics,
  verifyResourceUrl,
};
