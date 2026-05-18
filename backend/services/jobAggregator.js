const axios = require('axios');
const crypto = require('crypto');
const { callGeminiDirectly } = require('../utils/geminiClient');

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
      const responseText = response.text || '';
      const cleanJson = responseText.replace(/```json|```/g, '').trim();
      parsed = JSON.parse(cleanJson);
    } catch (parseErr) {
      console.error(`${platformName} Simulated Scrape JSON Parse Error:`, parseErr.message, 'Raw text:', response.text);
      return [];
    }

    if (!Array.isArray(parsed)) return [];

    return parsed.map(job => {
      const p = platformName.toLowerCase();
      const qDash = role.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const jobQuery = encodeURIComponent(`"${job.title}" jobs ${job.company}`);
      
      let realUrl = `https://www.google.com/search?q=${jobQuery}`;
      if (p.includes('linkedin')) realUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(job.title + ' ' + job.company)}`;
      else if (p.includes('indeed')) realUrl = `https://www.indeed.com/jobs?q=${encodeURIComponent(job.title.replace(/ /g, '+'))}`;
      else if (p.includes('wellfound')) realUrl = `https://wellfound.com/role/l/${qDash}`;
      else if (p.includes('glassdoor')) realUrl = `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${encodeURIComponent(job.title + ' ' + job.company)}`;

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
  
  // Basic Sorting: Put remote/flexible jobs higher if requested
  if (isRemote) {
    uniqueJobs.sort((a, b) => {
      const aRem = a.location.toLowerCase().includes('remote');
      const bRem = b.location.toLowerCase().includes('remote');
      return (aRem === bRem) ? 0 : aRem ? -1 : 1;
    });
  }

  console.log(`✅ Aggregation complete. Found ${allJobs.length} raw jobs, deduplicated to ${uniqueJobs.length}.`);
  return uniqueJobs;
};
