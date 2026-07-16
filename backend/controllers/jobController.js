const { callGeminiDirectly } = require('../utils/geminiClient');
const { parseStructuredJson } = require('../utils/jsonParser');
const SavedJob = require('../models/SavedJob');
const JobCache = require('../models/JobCache');
const Resume = require('../models/Resume');
const { aggregateJobs } = require('../services/jobAggregator');

/**
 * AI-Powered Real-Time Job Aggregator
 * Orchestrates multi-platform scraping, caching, deduplication, and AI sorting.
 */
exports.searchJobs = async (req, res) => {
  try {
    const userId = String(req.user?.uid || req.user?._id || req.user?.id);
    let { role, location, isRemote, isInternship, page = 1, limit = 10 } = req.body || {};
    
    // 1. Fetch user profile, resume, and GPS target
    const resume = await Resume.findOne({ user: userId });
    const userSkills = resume?.skills || ['JavaScript', 'React', 'Node.js', 'HTML', 'CSS'];
    
    const CareerGPS = require('../models/CareerGPS');
    const gps = await CareerGPS.findOne({ userId }).sort({ updatedAt: -1 });
    const gpsDestination = gps?.destination || 'Software Engineer';
    
    // 2. Set default role if none provided (Netflix style)
    if (!role) {
      role = gpsDestination;
    }
    
    // 3. Generate Cache Key
    const cacheKey = `${role.toLowerCase().trim()}_${location ? location.toLowerCase().trim() : 'any'}_${isRemote ? 'remote' : 'onsite'}_${isInternship ? 'intern' : 'fulltime'}`;
    
    // 4. Fetch or aggregate jobs
    let allJobs = [];
    const cachedData = await JobCache.findOne({ queryKey: cacheKey });
    
    if (cachedData && cachedData.jobs && cachedData.jobs.length > 0) {
      console.log(`⚡ Cache hit for "${role}". Returning instantly.`);
      allJobs = cachedData.jobs;
    } else {
      console.log(`🔄 Cache miss for "${role}". Triggering Live Aggregation...`);
      allJobs = await aggregateJobs({ role, location, isRemote, isInternship });
      if (allJobs.length > 0) {
        await JobCache.findOneAndUpdate(
          { queryKey: cacheKey },
          { jobs: allJobs, createdAt: Date.now() },
          { upsert: true }
        );
      }
    }

    // 5. Enrich with Smart Matching Engine and Job Insights
    const enrichedJobs = allJobs.map(job => {
      // Skills check
      const jobSkills = job.skills && job.skills.length > 0 ? job.skills : ['React', 'Node.js', 'JavaScript'];
      const matchingSkills = jobSkills.filter(s => 
        userSkills.some(us => us.toLowerCase() === s.toLowerCase())
      );
      const missingSkills = jobSkills.filter(s => 
        !userSkills.some(us => us.toLowerCase() === s.toLowerCase())
      );
      
      // Calculate match score
      let matchScore = 60;
      if (jobSkills.length > 0) {
        matchScore = Math.round(60 + (matchingSkills.length / jobSkills.length) * 35);
      }
      if (job.title.toLowerCase().includes(gpsDestination.toLowerCase())) {
        matchScore = Math.min(100, matchScore + 5);
      }
      
      // Calculate whyRecommended explanation
      const whyRecommended = [];
      matchingSkills.slice(0, 2).forEach(s => whyRecommended.push(`Matches ${s}`));
      if (gpsDestination && job.title.toLowerCase().includes(gpsDestination.toLowerCase())) {
        whyRecommended.push(`Matches Career GPS`);
      }
      if (job.experience && job.experience.toLowerCase().includes('entry')) {
        whyRecommended.push('Beginner Friendly');
      }
      if (whyRecommended.length === 0) {
        whyRecommended.push('Matches Career Track');
      }
      
      // Salary
      const salary = job.salary && job.salary !== 'Competitive' && job.salary !== 'Not specified'
        ? job.salary
        : `${Math.floor(Math.random() * 8 + 8)} - ${Math.floor(Math.random() * 12 + 16)} LPA`;
        
      // Deadline (e.g. 5-15 days from now)
      const deadlineDate = new Date(Date.now() + (Math.floor(Math.random() * 10) + 3) * 24 * 60 * 60 * 1000);
      const applicationDeadline = deadlineDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      
      // Readiness score
      const readinessScore = Math.round(50 + (matchingSkills.length / Math.max(1, jobSkills.length)) * 45);

      return {
        ...job,
        skills: jobSkills,
        matchScore,
        whyRecommended,
        salary,
        experienceLevel: job.experience || 'Mid-level',
        remoteHybridOnsite: job.location.toLowerCase().includes('remote') ? 'Remote' : (Math.random() > 0.5 ? 'Hybrid' : 'Onsite'),
        applicationDeadline,
        companyRating: (Math.random() * 1.5 + 3.5).toFixed(1),
        openPositions: Math.floor(Math.random() * 4) + 1,
        readinessScore,
        missingSkills
      };
    });

    // Sort by match score
    enrichedJobs.sort((a, b) => b.matchScore - a.matchScore);

    // 6. Calculate stats
    const savedJobs = await SavedJob.find({ userUid: userId });
    const appliedJobsCount = savedJobs.filter(j => j.status === 'applied').length;
    const interviewingJobsCount = savedJobs.filter(j => j.status === 'interviewing').length;
    
    // Average Match Score
    const totalMatch = enrichedJobs.reduce((sum, j) => sum + j.matchScore, 0);
    const avgMatchScore = enrichedJobs.length > 0 ? Math.round(totalMatch / enrichedJobs.length) : 85;

    const stats = {
      jobsMatched: enrichedJobs.length,
      applicationsSent: appliedJobsCount,
      interviewsScheduled: interviewingJobsCount,
      companiesHiring: Array.from(new Set(enrichedJobs.map(j => j.company))).length,
      avgMatchScore
    };

    // 7. MNC Hiring Pulse ("Who's Hiring Today")
    const hiringPulse = [
      { company: 'Google', logoText: 'G', color: '#4285F4', openRoles: 142, location: 'Bangalore & Remote' },
      { company: 'Microsoft', logoText: 'MS', color: '#00A4EF', openRoles: 98, location: 'Hyderabad & Bangalore' },
      { company: 'Amazon', logoText: 'Az', color: '#FF9900', openRoles: 110, location: 'Pune, Chennai & Remote' },
      { company: 'Meta', logoText: 'M', color: '#0668E1', openRoles: 75, location: 'Remote (India)' },
      { company: 'NVIDIA', logoText: 'NV', color: '#76B900', openRoles: 64, location: 'Bangalore & Pune' },
      { company: 'Apple', logoText: '', color: '#000000', openRoles: 42, location: 'Bangalore & Hyderabad' }
    ];

    // 8. Pagination Logic
    const startIndex = (Number(page) - 1) * Number(limit);
    const paginatedJobs = enrichedJobs.slice(startIndex, startIndex + Number(limit));

    res.status(200).json({
      success: true,
      count: enrichedJobs.length,
      page: Number(page),
      totalPages: Math.ceil(enrichedJobs.length / Number(limit)),
      stats,
      hiringPulse,
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
      fitData = parseStructuredJson(aiResponse.text);
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
const updateUserCareerStateJob = async (userId) => {
  try {
    const UserCareerState = require('../models/UserCareerState');
    const SavedJob = require('../models/SavedJob');
    const userUid = String(userId);
    const count = await SavedJob.countDocuments({ userUid });
    await UserCareerState.findOneAndUpdate(
      { userId: userUid },
      {
        $set: {
          currentStage: 'job-hunting',
          'jobState.savedJobsCount': count
        }
      },
      { upsert: true }
    );
  } catch (stateErr) {
    console.warn('Could not update UserCareerState on job save:', stateErr.message);
  }
};

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

    await updateUserCareerStateJob(userUid);

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
    await updateUserCareerStateJob(userUid);
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
        const pdfParse = require('pdf-parse');
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
      matchResults = parseStructuredJson(aiResponse.text);
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

/**
 * Update Saved Job Application Status & Award XP on Transition to Applied
 */
exports.updateSavedJobStatus = async (req, res) => {
  try {
    const userUid = req.user?.uid || req.user?._id || req.user?.id;
    const { jobId } = req.params;
    const { status } = req.body;

    if (!['saved', 'applied', 'interviewing', 'rejected', 'offered'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const savedJob = await SavedJob.findOne({ userUid: String(userUid), jobId });
    if (!savedJob) {
      return res.status(404).json({ success: false, message: 'Saved job not found' });
    }

    const previousStatus = savedJob.status;
    savedJob.status = status;
    await savedJob.save();

    // Award XP ONLY when transitioned to 'applied' for the first time
    let xpAwarded = false;
    if (status === 'applied' && previousStatus !== 'applied') {
      const { awardXP } = require('../utils/gamification');
      await awardXP(String(req.user?._id || req.user?.id || req.user?.uid), 'JOB_APPLIED').catch(() => {});
      xpAwarded = true;
    }

    res.status(200).json({ 
      success: true, 
      xpAwarded, 
      message: xpAwarded ? 'Job application submitted! +50 XP earned.' : 'Job status updated successfully.',
      data: savedJob 
    });
  } catch (error) {
    console.error('Update Job Status Error:', error);
    res.status(500).json({ success: false, message: 'Failed to update job status' });
  }
};
// trigger restart
