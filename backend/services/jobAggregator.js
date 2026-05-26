const axios = require('axios');
const crypto = require('crypto');
const { callGeminiDirectly } = require('../utils/geminiClient');
const { parseStructuredJson } = require('../utils/jsonParser');

/**
 * Normalizes strings to help with duplicate detection
 */
const normalizeStr = (str) => {
  return (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
};

/**
 * Intelligent Duplicate Removal
 * Merges jobs if the normalized company name and job title match closely.
 */
const removeDuplicates = (jobs) => {
  const uniqueJobs = [];
  const seenHashes = new Set();

  for (const job of jobs) {
    // We hash the normalized company + first few words of the title to catch duplicates
    const titleHash = job.title.split(' ').slice(0, 3).join(' ').toLowerCase().replace(/[^a-z0-9]/g, '');
    const companyHash = normalizeStr(job.company);
    const hash = `${companyHash}_${titleHash}`;

    if (!seenHashes.has(hash)) {
      seenHashes.add(hash);
      uniqueJobs.push(job);
    } else {
      // If duplicate found, we might want to merge platforms if we want to be fancy
      const existing = uniqueJobs.find(u => {
        const t = u.title.split(' ').slice(0, 3).join(' ').toLowerCase().replace(/[^a-z0-9]/g, '');
        const c = normalizeStr(u.company);
        return `${c}_${t}` === hash;
      });
      if (existing && !existing.platform.includes(job.platform)) {
        existing.platform += `, ${job.platform}`;
      }
    }
  }
  return uniqueJobs;
};

/**
 * Real API Fetcher: Remotive (Free Public API for Remote Tech Jobs)
 */
const fetchRemotiveJobs = async (role) => {
  try {
    const res = await axios.get(`https://remotive.com/api/remote-jobs?search=${encodeURIComponent(role)}&limit=10`, { timeout: 10000 });
    const jobs = res.data.jobs || [];
    
    return jobs.slice(0, 5).map(job => ({
      id: `remotive-${job.id}`,
      title: job.title,
      company: job.company_name,
      location: job.candidate_required_location || 'Remote',
      salary: job.salary || 'Competitive',
      type: job.job_type === 'full_time' ? 'Full-time' : 'Contract',
      experience: 'Mid-level', // Remotive doesn't provide strict experience levels easily
      platform: 'Remotive',
      url: job.url,
      skills: job.tags || [],
      description: job.description ? job.description.replace(/<[^>]*>?/gm, '').substring(0, 150) + '...' : '',
      postedDate: job.publication_date
    }));
  } catch (error) {
    console.error('Remotive Fetch Error:', error.message);
    return []; // Fail silently for individual scrapers to keep aggregation alive
  }
};

/**
 * Simulated Scraper (Placeholder for LinkedIn/Indeed/Glassdoor without Proxy/API Key)
 * In a real production environment with proxies, you would use Cheerio here.
 */
const fetchSimulatedJobs = async (role, location, isRemote, platformName) => {
  try {
    const prompt = `
      You are a backend job scraping API.
      Generate exactly 4 realistic, current job postings for "${role}" in "${isRemote ? 'Remote' : location}" on the "${platformName}" platform.
      Return ONLY a raw JSON array of objects (no markdown, no quotes):
      [
        {
          "title": "Exact Title",
          "company": "Company",
          "location": "City or Remote",
          "salary": "$100k-$130k",
          "type": "Full-time",
          "experience": "Entry-level",
          "skills": ["Skill1", "Skill2"],
          "description": "Short 1 sentence description."
        }
      ]
    `;

    const response = await callGeminiDirectly({ prompt, temperature: 0.6 });
    
    // Robust JSON parsing
    let parsed;
    try {
      parsed = parseStructuredJson(response.text);
    } catch (parseErr) {
      console.error(`${platformName} Simulated Scrape JSON Parse Error:`, parseErr.message, 'Raw text:', response.text);
      return [];
    }

    if (!Array.isArray(parsed)) return [];

    return parsed.map(job => {
      const p = platformName.toLowerCase();
      const qDash = role.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      
      let realUrl = `https://www.google.com/search?q=${encodeURIComponent(job.title + ' ' + job.company + ' ' + platformName + ' job')}`;
      if (p.includes('linkedin')) {
        realUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(job.title + ' ' + job.company)}`;
      } else if (p.includes('indeed')) {
        realUrl = `https://www.indeed.com/jobs?q=${encodeURIComponent(job.title + ' ' + job.company)}`;
      } else if (p.includes('wellfound')) {
        realUrl = `https://www.google.com/search?q=${encodeURIComponent(job.title + ' ' + job.company + ' site:wellfound.com')}`;
      } else if (p.includes('glassdoor')) {
        realUrl = `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${encodeURIComponent(job.title + ' ' + job.company)}`;
      } else if (p.includes('internshala')) {
        realUrl = `https://www.google.com/search?q=${encodeURIComponent(job.title + ' ' + job.company + ' site:internshala.com')}`;
      }

      return {
        id: crypto.randomUUID(),
        title: job.title,
        company: job.company,
        location: job.location,
        salary: job.salary,
        type: job.type,
        experience: job.experience,
        platform: platformName,
        url: realUrl,
        skills: job.skills || [],
        description: job.description,
        postedDate: new Date().toISOString()
      };
    });
  } catch (error) {
    console.error(`${platformName} Simulated Scrape Error:`, error.message);
    return [];
  }
};

/**
 * Main Aggregation Orchestrator
 */
exports.aggregateJobs = async ({ role, location, isRemote, isInternship }) => {
  console.log(`🚀 Starting parallel job aggregation for: ${role}`);
  
  // We launch multiple scrapers/fetchers in parallel for maximum speed
  const fetchPromises = [
    fetchRemotiveJobs(role),
    fetchSimulatedJobs(role, location, isRemote, 'LinkedIn'),
    fetchSimulatedJobs(role, location, isRemote, 'Indeed'),
    fetchSimulatedJobs(role, location, isRemote, 'Glassdoor')
  ];

  if (isInternship) {
    fetchPromises.push(fetchSimulatedJobs(role, location, isRemote, 'Internshala'));
  } else {
    fetchPromises.push(fetchSimulatedJobs(role, location, isRemote, 'Wellfound'));
  }

  // Wait for all fetchers to finish (settled so one failure doesn't crash everything)
  const results = await Promise.allSettled(fetchPromises);
  
  let allJobs = [];
  results.forEach(result => {
    if (result.status === 'fulfilled' && Array.isArray(result.value)) {
      allJobs = allJobs.concat(result.value);
    }
  });

  // Intelligent Deduplication
  const uniqueJobs = removeDuplicates(allJobs);
  
  // Relevance keyword-based filtering
  const stopWords = new Set([
    'senior', 'junior', 'lead', 'independent', 'associate', 'chief', 'principal', 
    'staff', 'entry', 'level', 'mid', 'contract', 'full', 'time', 'part', 'remote', 
    'onsite', 'and', 'or', 'in', 'the', 'a', 'of', 'for', 'with', 'at', 'to', 
    'from', 'by', 'as', 'on', 'about', 'into', 'through', 'over', 'after', 
    'between', 'under', 'during', 'without', 'before', 'against', 'hiring', 
    'opportunity', 'opportunities', 'job', 'jobs', 'position', 'positions'
  ]);

  const queryWords = role.toLowerCase().split(/[\s,.\-\/&]+/).filter(w => w.length > 1 && !stopWords.has(w));
  
  let filteredJobs = uniqueJobs;
  if (queryWords.length > 0) {
    filteredJobs = uniqueJobs.map(job => {
      const titleLower = job.title.toLowerCase();
      const descLower = (job.description || '').toLowerCase();
      const skillsLower = (job.skills || []).map(s => s.toLowerCase());

      let score = 0;
      let matchedCount = 0;

      queryWords.forEach(word => {
        let matchedThisWord = false;
        
        // Match word boundaries for higher precision
        const titleRegex = new RegExp(`\\b${word}\\b`, 'i');
        const descRegex = new RegExp(`\\b${word}\\b`, 'i');

        if (titleRegex.test(titleLower)) {
          score += 15;
          matchedThisWord = true;
        } else if (titleLower.includes(word)) {
          score += 8;
          matchedThisWord = true;
        }

        if (skillsLower.some(s => s === word || s.includes(word))) {
          score += 10;
          matchedThisWord = true;
        }

        if (descRegex.test(descLower)) {
          score += 4;
          matchedThisWord = true;
        } else if (descLower.includes(word)) {
          score += 2;
          matchedThisWord = true;
        }

        if (matchedThisWord) {
          matchedCount++;
        }
      });

      // Big relevance boost if multiple query terms matched
      if (matchedCount === queryWords.length) {
        score += 25;
      }

      return { ...job, relevanceScore: score };
    });

    // Filter out jobs with low relevance scores
    const threshold = queryWords.length > 1 ? 15 : 8;
    filteredJobs = filteredJobs.filter(job => (job.relevanceScore || 0) >= threshold);

    // Sort by relevance score descending
    filteredJobs.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

    // Safety check: if filtering is too aggressive and yields fewer than 3 jobs, fallback to original uniqueJobs
    if (filteredJobs.length < 3) {
      filteredJobs = uniqueJobs;
    }
  }

  // Basic Sorting: Put remote/flexible jobs higher if requested
  if (isRemote) {
    filteredJobs.sort((a, b) => {
      const aRem = a.location.toLowerCase().includes('remote');
      const bRem = b.location.toLowerCase().includes('remote');
      if (aRem !== bRem) {
        return aRem ? -1 : 1;
      }
      return (b.relevanceScore || 0) - (a.relevanceScore || 0);
    });
  }

  console.log(`... Aggregation complete. Found ${allJobs.length} raw jobs, filtered to ${filteredJobs.length} relevant jobs.`);
  return filteredJobs;
};

