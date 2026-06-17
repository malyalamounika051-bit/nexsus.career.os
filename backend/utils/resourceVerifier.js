const axios = require('axios');
const cheerio = require('cheerio');
const { callGeminiDirectly } = require('./geminiClient');

// Standard user agent to prevent blocks during status checks
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * Extract YouTube video ID
 */
function getYouTubeId(url) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

/**
 * Validate standard URL HTTP Reachability
 */
async function validateUrl(url) {
  if (!url || url === '#' || url.startsWith('javascript:')) {
    return { valid: false, reason: 'Empty or placeholder URL' };
  }

  const urlLower = url.toLowerCase();
  // Bypass validation for known domains that block bots aggressively or fail frequently on standard get
  const bypassDomains = ['udemy.com', 'coursera.org', 'packtpub.com', 'linkedin.com', 'oracle.com', 'developer.android.com', 'developer.apple.com', 'microsoft.com'];
  if (bypassDomains.some(domain => urlLower.includes(domain))) {
    return { valid: true, note: 'Bypassed bot-protected domain' };
  }

  try {
    const response = await axios.get(url, {
      headers: { 'User-Agent': USER_AGENT },
      timeout: 8000,
      validateStatus: () => true, // Don't throw error on non-200 status
    });

    if (response.status >= 200 && response.status < 400) {
      // Check if redirect leads to an error page or generic domain
      const finalUrl = response.request?.res?.responseUrl || url;
      if (finalUrl.includes('error') || finalUrl.includes('404') || finalUrl.includes('expired')) {
        return { valid: false, reason: `Redirected to potential error page: ${finalUrl}` };
      }
      return { valid: true, status: response.status };
    }

    // Accept 403 or 429 from reputable platforms as probably valid for users
    if ([403, 429].includes(response.status) && (urlLower.includes('medium') || urlLower.includes('dev.to') || urlLower.includes('github.com'))) {
      return { valid: true, status: response.status, note: 'Accepting 403/429 for developer platform' };
    }

    return { valid: false, reason: `HTTP status ${response.status}` };
  } catch (err) {
    // If it is a timeout on a reputable developer site, treat as valid
    if (err.message.includes('timeout') && (urlLower.includes('github') || urlLower.includes('git') || urlLower.includes('docs'))) {
      return { valid: true, note: 'Accepting timeout on developer docs' };
    }
    return { valid: false, reason: err.message };
  }
}

/**
 * Validate YouTube Video is active and public
 */
async function validateYouTube(url) {
  const videoId = getYouTubeId(url);
  if (!videoId) {
    return { valid: false, reason: 'Invalid YouTube URL format' };
  }

  try {
    const response = await axios.get(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: { 'User-Agent': USER_AGENT },
      timeout: 8000,
      validateStatus: () => true,
    });

    if (response.status === 429) {
      return { valid: true, note: 'Bypassed YouTube check due to rate limit' };
    }

    const html = response.data;
    
    // Check for common error indicators in YouTube HTML response
    if (
      html.includes('Video unavailable') ||
      html.includes('This video is unavailable') ||
      html.includes('This video is private') ||
      html.includes('This video has been removed') ||
      html.includes('private video') ||
      html.includes('deleted video') ||
      html.includes('is age-restricted') ||
      html.includes('Sign in to confirm your age') ||
      html.includes('"reason":"Video unavailable"') ||
      html.includes('"reason":"This video is private"')
    ) {
      return { valid: false, reason: 'YouTube video is private, removed, age-restricted, or unavailable' };
    }

    return { valid: true };
  } catch (err) {
    if (err.response && err.response.status === 429) {
      return { valid: true, note: 'Bypassed YouTube check due to rate limit' };
    }
    return { valid: false, reason: `YouTube request failed: ${err.message}` };
  }
}

/**
 * Validate GitHub Repo exists and is public
 */
async function validateGitHub(url) {
  if (!url.includes('github.com')) {
    return { valid: false, reason: 'Not a GitHub URL' };
  }

  try {
    const response = await axios.get(url, {
      headers: { 'User-Agent': USER_AGENT },
      timeout: 8000,
      validateStatus: () => true,
    });

    if (response.status === 404) {
      return { valid: false, reason: 'GitHub repository not found (possibly deleted or private)' };
    }

    const html = response.data;
    if (html.includes('This repository has been archived') || html.includes('is archived')) {
      return { valid: true, isArchived: true, note: 'Archived repository' };
    }

    return { valid: response.status === 200 };
  } catch (err) {
    return { valid: false, reason: `GitHub check failed: ${err.message}` };
  }
}

/**
 * Calculate Quality Score for a resource
 */
function calculateQualityScore(resource) {
  const url = String(resource.url || '').toLowerCase();
  const title = String(resource.title || '').toLowerCase();
  const provider = String(resource.provider || '').toLowerCase();
  let score = 70; // Base score

  // 1. Official Docs / High-Quality Providers
  const officialDomains = [
    'react.dev', 'nodejs.org', 'python.org', 'developer.mozilla.org',
    'microsoft.com', 'aws.amazon.com', 'google.com', 'kubernetes.io',
    'docker.com', 'github.com', 'typescriptlang.org', 'mongodb.com', 'postgresql.org'
  ];
  const highQualityPlatforms = [
    'coursera.org', 'edx.org', 'udemy.com', 'freecodecamp.org',
    'scrimba.com', 'pluralsight.com', 'khanacademy.org', 'reforge.com'
  ];
  const reputableChannels = [
    'traversy media', 'programming with mosh', 'academind', 'net ninja', 'fireship', 'freecodecamp'
  ];

  const hasOfficialDomain = officialDomains.some(domain => url.includes(domain));
  const hasHighQualityPlatform = highQualityPlatforms.some(platform => url.includes(platform) || provider.includes(platform));
  const hasReputableChannel = reputableChannels.some(channel => title.includes(channel) || url.includes(channel));

  if (hasOfficialDomain) {
    score = 95;
  } else if (hasHighQualityPlatform) {
    score = 90;
  } else if (hasReputableChannel) {
    score = 85;
  } else if (url.includes('youtube.com') || url.includes('youtu.be')) {
    score = 80;
  } else if (url.includes('medium.com') || url.includes('dev.to') || url.includes('w3schools.com') || url.includes('geeksforgeeks.org')) {
    score = 75;
  }

  // Deductions for potential negative indicators
  if (title.includes('outdated') || url.includes('outdated') || title.includes('angularjs') || title.includes('python 2')) {
    score -= 20;
  }

  return Math.max(10, Math.min(100, score));
}

/**
 * Auto-repair: request new URL from Gemini
 */
async function repairResource(resource, domain, phaseName) {
  console.log(`🔧 Requesting repair for: "${resource.title}" (${resource.url}) in "${domain}" -> "${phaseName}"`);
  
  const prompt = `You are an expert curriculum designer. A resource link in our "${domain}" roadmap under "${phaseName}" is broken or deleted.
Original Resource Title: "${resource.title}"
Original Broken URL: "${resource.url}"
Resource Type: "${resource.type}"

Please suggest a high-quality, up-to-date, and fully functional replacement resource link (e.g. from official documentation, freeCodeCamp, Coursera, Udemy, or a reputable YouTube video).

Return ONLY valid JSON in this format:
{
  "title": "Title of the resource",
  "url": "https://url-to-resource.com",
  "type": "video|article|course|book|certification|platform|tool|tutorial|documentation",
  "category": "youtube|course|blog|docs|platform|community|book|other",
  "provider": "Provider Name"
}`;

  try {
    const response = await callGeminiDirectly({ prompt, temperature: 0.3 });
    const cleanText = response.text.trim().replace(/^```json/, '').replace(/```$/, '').trim();
    const parsed = JSON.parse(cleanText);

    if (parsed && parsed.url && parsed.url.startsWith('http')) {
      // Validate suggested URL before returning it
      console.log(`🔍 Verifying AI suggested replacement: ${parsed.url}`);
      let validationRes = null;
      if (parsed.url.includes('youtube.com') || parsed.url.includes('youtu.be')) {
        validationRes = await validateYouTube(parsed.url);
      } else {
        validationRes = await validateUrl(parsed.url);
      }

      if (validationRes && validationRes.valid) {
        console.log(`✅ AI suggestion validated successfully!`);
        return parsed;
      } else {
        console.warn(`⚠️ AI suggested link failed verification: ${parsed.url} - ${validationRes?.reason || 'unreachable'}`);
      }
    }
  } catch (err) {
    console.error(`Error requesting repair from Gemini: ${err.message}`);
  }

  // Fallback to Google Search Query URL instead of completely failing
  const query = `${domain} ${phaseName} ${resource.title}`.replace(/[^a-zA-Z0-9\s]/g, '');
  return {
    title: `Google Search for ${resource.title}`,
    url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
    type: 'article',
    category: 'other',
    provider: 'Google'
  };
}

module.exports = {
  validateUrl,
  validateYouTube,
  validateGitHub,
  calculateQualityScore,
  repairResource,
  getYouTubeId
};
