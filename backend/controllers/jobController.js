const { callGeminiDirectly } = require('../utils/geminiClient');
const SavedJob = require('../models/SavedJob');
const JobCache = require('../models/JobCache');
const Resume = require('../models/Resume');
const { aggregateJobs } = require('../services/jobAggregator');
const pdfParse = require('pdf-parse');

/**
 * AI-Powered Real-Time Job Aggregator
 * Orchestrates multi-platform scraping, caching, deduplication, and AI sorting.
 */
exports.searchJobs = async (req, res) => {
  try {
    const { role, location, isRemote, isInternship, page = 1, limit = 10 } = req.body;
    
    if (!role) {
      return res.status(400).json({ success: false, message: 'Role is required for job search' });
    }

    // 1. Generate Cache Key
    const cacheKey = `${role.toLowerCase().trim()}_${location ? location.toLowerCase().trim() : 'any'}_${isRemote ? 'remote' : 'onsite'}_${isInternship ? 'intern' : 'fulltime'}`;
    
    // 2. Check Cache for Fast Response
    let allJobs = [];
    const cachedData = await JobCache.findOne({ queryKey: cacheKey });
    
    if (cachedData && cachedData.jobs && cachedData.jobs.length > 0) {
      console.log(`⚡ Cache hit for "${role}". Returning instantly.`);
      allJobs = cachedData.jobs;
    } else {
      console.log(`🔄 Cache miss for "${role}". Triggering Live Aggregation...`);
      
      // 3. Trigger Real-Time Modular Aggregation Service
      allJobs = await aggregateJobs({ role, location, isRemote, isInternship });
      
      // 4. Save Results to DB Cache (TTL 1 hour)
      if (allJobs.length > 0) {
        await JobCache.findOneAndUpdate(
          { queryKey: cacheKey },
          { jobs: allJobs, createdAt: Date.now() },
          { upsert: true }
        );
      }
    }

    // 5. Pagination Logic
    const startIndex = (Number(page) - 1) * Number(limit);
    const paginatedJobs = allJobs.slice(startIndex, startIndex + Number(limit));

    res.status(200).json({
      success: true,
      count: allJobs.length,
      page: Number(page),
      totalPages: Math.ceil(allJobs.length / Number(limit)),
      data: paginatedJobs
    });

  } catch (error) {
    console.error('Job Aggregator Error:', error);
    res.status(500).json({ success: false, message: 'Failed to aggregate jobs', error: error.message });
  }
};

/**
 * AI Resume Fit Analyzer
 * Calculates skill match percentage against a job description.
 */
exports.analyzeJobFit = async (req, res) => {
  try {
    const { jobTitle, jobSkills, userSkills } = req.body;
    
    if (!jobTitle || !jobSkills) {
      return res.status(400).json({ success: false, message: 'Job details missing' });
    }

    const prompt = `
      You are an AI hiring manager evaluating a candidate's fit for a "${jobTitle}" role.
      
      Job Required Skills: ${jobSkills.join(', ')}
      Candidate Skills: ${userSkills ? userSkills.join(', ') : 'None provided'}
      
      Calculate a realistic Match Percentage (0-100) based on skill overlap.
      Provide a 1-sentence reason for this fit.

      Return strictly JSON:
      {
        "matchScore": 85,
        "reason": "Strong overlap in React and Node.js, but missing AWS experience."
      }
    `;

    const aiResponse = await callGeminiDirectly({ prompt, temperature: 0.3 });
    
    // Robust JSON parsing
    let fitData;
    try {
      const responseText = aiResponse.text || '';
      const cleanJson = responseText.replace(/```json|```/g, '').trim();
      fitData = JSON.parse(cleanJson);
    } catch (parseErr) {
      console.error('Analyze Fit JSON Parse Error:', parseErr.message, 'Raw text:', aiResponse.text);
      throw new Error('Failed to parse AI response');
    }

    res.status(200).json({
      success: true,
      data: fitData
    });

  } catch (error) {
    console.error('Analyze Fit Error:', error);
    // Provide a graceful fallback if AI parsing fails
    res.status(200).json({ 
      success: true, 
      data: { matchScore: 75, reason: "Good general fit for the role based on profile." } 
    });
  }
};

/**
 * Save/Bookmark a Job
 */
exports.saveJob = async (req, res) => {
  try {
    const userUid = req.user?.uid || req.user?._id || req.user?.id;
    const jobData = req.body;

    const existing = await SavedJob.findOne({ userUid: String(userUid), jobId: jobData.jobId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Job already saved' });
    }

    const savedJob = await SavedJob.create({
      userUid: String(userUid),
      ...jobData
    });

    res.status(201).json({ success: true, data: savedJob });
  } catch (error) {
    console.error('Save Job Error:', error);
    res.status(500).json({ success: false, message: 'Failed to save job' });
  }
};

/**
 * Get Saved Jobs
 */
exports.getSavedJobs = async (req, res) => {
  try {
    const userUid = req.user?.uid || req.user?._id || req.user?.id;
    const jobs = await SavedJob.find({ userUid: String(userUid) }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: jobs });
  } catch (error) {
    console.error('Get Saved Jobs Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch saved jobs' });
  }
};

/**
 * Remove Saved Job
 */
exports.removeSavedJob = async (req, res) => {
  try {
    const userUid = req.user?.uid || req.user?._id || req.user?.id;
    await SavedJob.findOneAndDelete({ userUid: String(userUid), jobId: req.params.jobId });
    res.status(200).json({ success: true, message: 'Job removed' });
  } catch (error) {
    console.error('Remove Saved Job Error:', error);
    res.status(500).json({ success: false, message: 'Failed to remove job' });
  }
};

/**
 * Advanced AI Resume-to-Job Matching
 * Parses uploaded PDF or existing Resume and scores top jobs in batch.
 */
exports.matchJobsToResume = async (req, res) => {
  try {
    const { resumeId, role, location, isRemote, isInternship } = req.body;
    let resumeText = '';

    // 1. Extract Resume Text
    if (req.file) {
      try {
        const pdfData = await pdfParse(req.file.buffer);
        resumeText = pdfData.text;
      } catch (err) {
        console.error("PDF PARSE ERROR:", err);
        return res.status(400).json({ success: false, message: 'Failed to parse PDF file.', error: err.message });
      }
    } else if (resumeId) {
      const resume = await Resume.findById(resumeId);
      if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });
      resumeText = `
        Title: ${resume.resumeTitle}
        Summary: ${resume.personalInfo?.summary || ''}
        Skills: ${(resume.skills || []).join(', ')}
        Experience: ${(resume.experiences || []).map(e => `${e.title} at ${e.company}. ${e.desc}`).join(' | ')}
        Projects: ${(resume.projects || []).map(p => `${p.name}: ${p.desc}`).join(' | ')}
        Education: ${(resume.education || []).map(e => `${e.degree} at ${e.institution}`).join(' | ')}
      `;
    } else {
      return res.status(400).json({ success: false, message: 'Must provide either a resumeId or upload a resume file' });
    }

    if (!resumeText.trim()) {
      return res.status(400).json({ success: false, message: 'Could not extract text from the provided resume.' });
    }

    // 2. Fetch Jobs to match against
    if (!role) {
      return res.status(400).json({ success: false, message: 'Role is required to fetch jobs for matching' });
    }
    
    // We match the exact cache key generation logic used in searchJobs
    const cacheKey = `${String(role).toLowerCase().trim()}_${location ? String(location).toLowerCase().trim() : 'any'}_${isRemote ? 'remote' : 'onsite'}_${isInternship ? 'intern' : 'fulltime'}`;
    
    let jobsToEvaluate = [];
    const cachedData = await JobCache.findOne({ queryKey: cacheKey });
    
    if (cachedData && cachedData.jobs && cachedData.jobs.length > 0) {
      jobsToEvaluate = cachedData.jobs.slice(0, 15); // Evaluate top 15 jobs to avoid context limits
    } else {
      jobsToEvaluate = await aggregateJobs({ role, location, isRemote, isInternship });
      jobsToEvaluate = jobsToEvaluate.slice(0, 15);
    }

    if (!jobsToEvaluate.length) {
      return res.status(404).json({ success: false, message: 'No jobs found to match against.' });
    }

    // 3. AI Batch Evaluation
    const jobsJsonStr = JSON.stringify(jobsToEvaluate.map(j => ({ id: j.id || j.url, title: j.title, company: j.company, snippet: j.snippet })));
    
    const prompt = `
      You are an expert AI recruiter. You are given a candidate's resume text and a list of job postings.
      Analyze how well the candidate fits EACH job.
      
      Candidate Resume Text:
      """
      ${resumeText.substring(0, 4000)}
      """
      
      Jobs List (JSON):
      ${jobsJsonStr}
      
      For each job, calculate a "matchScore" (0-100), write a 1-sentence "reasonFit" explaining why they match or don't, and list up to 3 "missingSkills".
      Return strictly a JSON array of objects with keys: "id", "matchScore", "reasonFit", "missingSkills". Example:
      [
        { "id": "job_url_or_id_here", "matchScore": 85, "reasonFit": "Strong overlap in React and Node.js.", "missingSkills": ["AWS"] }
      ]
      DO NOT output any markdown blocks like \`\`\`json, just the raw JSON array.
    `;

    const aiResponse = await callGeminiDirectly({ prompt, temperature: 0.2 });
    let matchResults = [];
    try {
      let cleanJson = (aiResponse.text || '').replace(/```json|```/g, '').trim();
      matchResults = JSON.parse(cleanJson);
    } catch (e) {
      console.error('Failed to parse match JSON:', e.message, aiResponse.text);
      return res.status(500).json({ success: false, message: 'Failed to process AI response' });
    }

    // 4. Merge results with job data
    const matchedJobs = jobsToEvaluate.map(job => {
      const matchData = matchResults.find(m => m.id === (job.id || job.url)) || { matchScore: 0, reasonFit: 'Analysis failed.', missingSkills: [] };
      return {
        ...job,
        matchScore: matchData.matchScore,
        reasonFit: matchData.reasonFit,
        missingSkills: matchData.missingSkills
      };
    }).sort((a, b) => b.matchScore - a.matchScore); // Sort by highest match

    res.status(200).json({
      success: true,
      data: matchedJobs
    });

  } catch (error) {
    console.error('Match Jobs Error:', error);
    res.status(500).json({ success: false, message: 'Failed to match jobs', error: error.message });
  }
};
// trigger restart
