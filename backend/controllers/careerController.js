const Career = require('../models/Career');
const { callGeminiDirectly } = require('../utils/geminiClient');
const { awardXP } = require('../utils/gamification');
const { parseStructuredJson } = require('../utils/jsonParser');

/* ── Helpers ─────────────────────────────────────────────── */

/** Avoid RegExp syntax errors / ReDoS when matching user-entered career titles */
const escapeRegex = (str = '') => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');


/* ── Normalize & validate AI output ──────────────────────── */

const VALID_RESOURCE_TYPES = new Set([
  'video', 'article', 'course', 'book', 'certification',
  'platform', 'tool', 'tutorial', 'documentation',
]);
const VALID_RESOURCE_CATEGORIES = new Set([
  'youtube', 'course', 'blog', 'docs', 'platform', 'community', 'book', 'other',
]);
const VALID_DIFFICULTIES = new Set(['beginner', 'intermediate', 'advanced']);

const normalizeRoadmapData = (data, fallbackDomain) => {
  const out = { ...data };

  // Domain & description
  if (!out.domain || typeof out.domain !== 'string') out.domain = fallbackDomain;
  out.domain = String(out.domain).trim().slice(0, 200);
  if (!out.description || typeof out.description !== 'string') {
    out.description = `A comprehensive career roadmap for ${out.domain}.`;
  }
  out.description = String(out.description).trim().slice(0, 4000);

  // Market data
  out.avgSalary = out.avgSalary != null ? String(out.avgSalary).trim().slice(0, 120) : '₹6-18 LPA';
  out.growthRate = out.growthRate != null ? String(out.growthRate).trim().slice(0, 40) : '15% YoY';
  const d = String(out.demand || '').trim().toLowerCase();
  if (['high', 'h'].includes(d)) out.demand = 'High';
  else if (['medium', 'med', 'm'].includes(d)) out.demand = 'Medium';
  else if (['low', 'l'].includes(d)) out.demand = 'Low';
  else if (!['High', 'Medium', 'Low'].includes(out.demand)) out.demand = 'Medium';

  let score = Number(out.demandScore);
  out.demandScore = Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : 70;

  let future = Number(out.futureScore);
  out.futureScore = Number.isFinite(future) ? Math.max(0, Math.min(100, Math.round(future))) : 70;

  // Arrays
  const toStrArr = (arr, max = 20) =>
    (Array.isArray(arr) ? arr : []).map(s => String(s || '').trim()).filter(Boolean).slice(0, max);

  out.skills = toStrArr(out.skills, 24);
  out.trendingSkills = toStrArr(out.trendingSkills, 16);
  out.alternativePaths = toStrArr(out.alternativePaths, 8);

  // Study strategy
  if (!out.studyStrategy || typeof out.studyStrategy !== 'string') {
    out.studyStrategy = `Focus on building projects after each phase. Dedicate 2-3 hours daily and aim to complete one phase before moving to the next.`;
  }
  out.studyStrategy = String(out.studyStrategy).trim().slice(0, 2000);

  // Salary range
  if (out.salaryRange && typeof out.salaryRange === 'object') {
    out.salaryRange = {
      min: String(out.salaryRange.min || '₹4 LPA').trim().slice(0, 40),
      max: String(out.salaryRange.max || '₹25 LPA').trim().slice(0, 40),
      currency: String(out.salaryRange.currency || 'INR').trim().slice(0, 10),
    };
  } else {
    out.salaryRange = { min: '₹4 LPA', max: '₹25 LPA', currency: 'INR' };
  }

  // ── Roadmap phases ──────────────────────────────────────
  if (!Array.isArray(out.roadmap)) out.roadmap = [];
  out.roadmap = out.roadmap.filter(p => p && typeof p === 'object').slice(0, 10);

  out.roadmap.forEach((phase, idx) => {
    // Phase name
    if (!phase.phase || String(phase.phase).trim() === '') {
      phase.phase = `Phase ${idx + 1}`;
    }
    phase.phase = String(phase.phase).trim().slice(0, 500);

    // Duration
    if (!phase.duration || String(phase.duration).trim() === '') {
      phase.duration = '4-6 weeks';
    }
    phase.duration = String(phase.duration).trim().slice(0, 80);

    // Difficulty
    const diff = String(phase.difficulty || '').trim().toLowerCase();
    phase.difficulty = VALID_DIFFICULTIES.has(diff) ? diff : (idx < 2 ? 'beginner' : idx < 5 ? 'intermediate' : 'advanced');

    // String arrays
    phase.skills = toStrArr(phase.skills, 12);
    phase.topics = toStrArr(phase.topics, 15);
    phase.tools = toStrArr(phase.tools, 10);
    phase.certifications = toStrArr(phase.certifications, 5);
    phase.practiceTasks = toStrArr(phase.practiceTasks, 8);
    phase.projects = toStrArr(phase.projects, 6);

    // Defaults
    if (phase.topics.length === 0) phase.topics = [`Core concepts for ${out.domain}`];
    if (phase.skills.length === 0) phase.skills = [`Foundational ${out.domain} skills`];
    if (phase.projects.length === 0) phase.projects = [`Build a small project for ${out.domain}`];

    // Resources
    if (!Array.isArray(phase.resources)) phase.resources = [];
    phase.resources = phase.resources.filter(r => r && typeof r === 'object').slice(0, 15);
    phase.resources.forEach(r => {
      if (!r.title || String(r.title).trim() === '') r.title = 'Learning resource';
      r.title = String(r.title).trim().slice(0, 200);
      if (!r.url || String(r.url).trim() === '') r.url = '#';
      r.url = String(r.url).trim().slice(0, 2000);
      const t = String(r.type || '').toLowerCase();
      r.type = VALID_RESOURCE_TYPES.has(t) ? t : 'article';
      const c = String(r.category || '').toLowerCase();
      r.category = VALID_RESOURCE_CATEGORIES.has(c) ? c : 'other';
    });

    if (phase.resources.length === 0) {
      phase.resources.push({
        title: 'Google Search',
        url: `https://www.google.com/search?q=${encodeURIComponent(out.domain + ' ' + phase.phase + ' tutorial')}`,
        type: 'article',
        category: 'other',
      });
    }

    phase.completed = false;
  });

  // Ensure minimum 7 phases
  const phaseNames = [
    'Beginner Phase', 'Foundation Phase', 'Skill Development Phase',
    'Project Phase', 'Internship & Freelance Phase', 'Advanced Phase',
    'Career Preparation Phase',
  ];
  while (out.roadmap.length < 7) {
    const n = out.roadmap.length;
    out.roadmap.push({
      phase: phaseNames[n] || `Phase ${n + 1}`,
      duration: '4-6 weeks',
      difficulty: n < 2 ? 'beginner' : n < 5 ? 'intermediate' : 'advanced',
      skills: [`${out.domain} skill set ${n + 1}`],
      topics: [`Study milestone ${n + 1} for ${out.domain}`],
      tools: [],
      certifications: [],
      practiceTasks: [`Practice exercise for ${out.domain}`],
      projects: [`Portfolio project ${n + 1} for ${out.domain}`],
      resources: [{
        title: 'Google Search',
        url: `https://www.google.com/search?q=${encodeURIComponent(out.domain + ' learning resources')}`,
        type: 'article',
        category: 'other',
      }],
      completed: false,
    });
  }

  return out;
};

/* ── Existing career endpoints ───────────────────────────── */

// @desc   Get all careers with market data
// @route  GET /api/careers
// @access Public
const getAllCareers = async (req, res) => {
  try {
    const careers = await Career.find({}).select('-weights');
    res.json({ success: true, count: careers.length, data: careers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc   Get single career by domain
// @route  GET /api/careers/:id
// @access Public
const getCareerById = async (req, res) => {
  try {
    const career = await Career.findById(req.params.id);
    if (!career) {
      return res.status(404).json({ success: false, message: 'Career not found' });
    }
    res.json({ success: true, data: career });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc   Get market insights (demand sorted)
// @route  GET /api/careers/market-insights
// @access Public
const getMarketInsights = async (req, res) => {
  try {
    const careers = await Career.find({}).select('domain demandScore avgSalary growthRate demand trendingSkills description').sort({ demandScore: -1 });
    res.json({ success: true, data: careers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/* ── Roadmap generation ──────────────────────────────────── */

// @desc   Get user's generated roadmaps
// @route  GET /api/careers/my-roadmaps
// @access Private
const getGeneratedRoadmaps = async (req, res) => {
  try {
    const userUid = req.user?.uid || req.user?._id || req.user?.id;
    const roadmaps = await Career.find({
      userUid: String(userUid),
      isGeneratedRoadmap: true,
    })
      .select('-weights')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: roadmaps.length, data: roadmaps });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc   Delete a generated roadmap
// @route  DELETE /api/careers/roadmap/:id
// @access Private
const deleteRoadmap = async (req, res) => {
  try {
    const userUid = req.user?.uid || req.user?._id || req.user?.id;
    const career = await Career.findOneAndDelete({
      _id: req.params.id,
      userUid: String(userUid),
      isGeneratedRoadmap: true,
    });
    if (!career) {
      return res.status(404).json({ success: false, message: 'Roadmap not found' });
    }
    res.json({ success: true, message: 'Roadmap deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc   Update progress for a roadmap phase
// @route  PATCH /api/careers/roadmap/:id/progress
// @access Private
const updateProgress = async (req, res) => {
  try {
    const userUid = req.user?.uid || req.user?._id || req.user?.id;
    const { phaseIndex, completed } = req.body;

    const career = await Career.findOne({
      _id: req.params.id,
      userUid: String(userUid),
      isGeneratedRoadmap: true,
    });

    if (!career) {
      return res.status(404).json({ success: false, message: 'Roadmap not found' });
    }

    if (phaseIndex < 0 || phaseIndex >= career.roadmap.length) {
      return res.status(400).json({ success: false, message: 'Invalid phase index' });
    }

    career.roadmap[phaseIndex].completed = Boolean(completed);

    // Recalculate progress
    const completedCount = career.roadmap.filter(p => p.completed).length;
    const readiness = Math.round((completedCount / career.roadmap.length) * 100);
    career.progress = {
      completedPhases: completedCount,
      totalPhases: career.roadmap.length,
      interviewReadiness: readiness,
      lastUpdated: new Date(),
    };

    await career.save();
    res.json({ success: true, data: career });
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc   Generate AI roadmap
// @route  POST /api/careers/generate-roadmap
// @access Private
const generateRoadmap = async (req, res) => {
  try {
    const { query: rawQuery } = req.body;
    const query = rawQuery != null ? String(rawQuery).trim() : '';
    if (!query) {
      return res.status(400).json({ success: false, message: 'Career query is required' });
    }

    const userUid = req.user?.uid || req.user?._id || req.user?.id;
    const userEmail = req.user?.email ? String(req.user.email).toLowerCase() : undefined;
    if (!userUid) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    // ── Check cache: return existing high-quality roadmap for this user ──
    const existingCareer = await Career.findOne({
      domain: { $regex: new RegExp(`^${escapeRegex(query)}$`, 'i') },
      userUid: String(userUid),
      isGeneratedRoadmap: true,
    });

    if (existingCareer) {
      const hasProjects = existingCareer.roadmap?.some(p => p.projects && p.projects.length > 0);
      const hasEnoughPhases = existingCareer.roadmap?.length >= 7;
      if (hasProjects && hasEnoughPhases) {
        return res.json({ success: true, data: existingCareer, cached: true });
      }
      // Stale entry — regenerate
      console.log(`♻️ Regenerating stale user roadmap for "${existingCareer.domain}"...`);
      await Career.deleteOne({ _id: existingCareer._id });
    }

    // ── Global Cache Check: If any other user generated a high-quality version of this roadmap, clone it! ──
    const globalCachedCareer = await Career.findOne({
      domain: { $regex: new RegExp(`^${escapeRegex(query)}$`, 'i') },
      isGeneratedRoadmap: true,
    }).sort({ createdAt: 1 });

    if (globalCachedCareer) {
      const hasProjects = globalCachedCareer.roadmap?.some(p => p.projects && p.projects.length > 0);
      const hasEnoughPhases = globalCachedCareer.roadmap?.length >= 7;
      if (hasProjects && hasEnoughPhases) {
        console.log(`⚡ Global Cache Hit! Cloning roadmap for "${globalCachedCareer.domain}" to user: ${userUid}`);
        
        const clonedRoadmapData = globalCachedCareer.toObject();
        delete clonedRoadmapData._id; // Let Mongoose generate a new ID
        clonedRoadmapData.userUid = String(userUid);
        clonedRoadmapData.userId = String(userUid);
        if (userEmail) clonedRoadmapData.userEmail = userEmail;
        clonedRoadmapData.progress = {
          completedPhases: 0,
          totalPhases: clonedRoadmapData.roadmap.length,
          lastUpdated: new Date(),
        };
        // Reset all phases to uncompleted for the new user's independent progress
        clonedRoadmapData.roadmap.forEach(phase => {
          phase.completed = false;
        });

        const clonedCareer = await Career.create(clonedRoadmapData);
        awardXP(userUid, 'ROADMAP_GENERATED').catch(() => {});
        return res.json({ success: true, data: clonedCareer, cached: true });
      }
    }

    // ── Build AI prompt ──────────────────────────────────────
        const structuredPrompt = `You are an expert career counselor and labor market analyst. Create a detailed career roadmap and educational pathway for: "${query}"

Return ONLY valid JSON — no markdown fences, no explanations. First character must be "{", last must be "}".

JSON structure:
{
  "domain": "Career Title",
  "description": "2-3 sentence career description",
  "skills": ["skill1", "skill2", ...],
  "demandScore": 78,
  "futureScore": 82,
  "avgSalary": "₹X-Y LPA",
  "growthRate": "X% YoY",
  "demand": "High",
  "trendingSkills": ["trending1", ...],
  "salaryRange": { "min": "₹4 LPA", "max": "₹30 LPA", "currency": "INR" },
  "alternativePaths": ["Related Career 1", "Related Career 2", ...],
  "studyStrategy": "3-4 sentence personalized study advice covering daily hours, approach, and community engagement.",
  "roadmap": [
    {
      "phase": "Phase 1: Beginner Phase",
      "duration": "4-6 weeks",
      "difficulty": "beginner",
      "skills": ["HTML5", "CSS3", "Basic JavaScript"],
      "topics": ["How the web works", "HTML semantic elements", "CSS Flexbox & Grid"],
      "tools": ["VS Code", "Chrome DevTools", "Git"],
      "certifications": ["freeCodeCamp Responsive Web Design"],
      "practiceTasks": ["Build a personal portfolio page", "Complete 30 CSS challenges"],
      "projects": ["Personal portfolio website with responsive design"],
      "resources": [
        { "title": "Coursera - HTML, CSS, and Javascript for Web Developers", "url": "https://www.coursera.org/learn/html-css-javascript-for-web-developers", "type": "course", "category": "course" },
        { "title": "Udemy - Modern JavaScript From The Beginning", "url": "https://www.udemy.com/course/modern-javascript-from-the-beginning/", "type": "course", "category": "course" },
        { "title": "YouTube - HTML & CSS Full Course for Beginners", "url": "https://www.youtube.com/watch?v=mU6anWqODqg", "type": "video", "category": "youtube" }
      ]
    }
  ]
}

REQUIREMENTS:
- DYNAMIC MARKET TRENDS: The demandScore, futureScore, avgSalary, growthRate, and trendingSkills must reflect the latest real-world industry demand, current hiring spikes, and labor statistics.
- EDUCATIONAL COURSE MAPPING: For each phase, the "resources" MUST include actual high-quality educational courses or popular structured video tutorials from platforms like Coursera, Udemy, edX, or YouTube. The resource objects must have realistic URL patterns and clear platform names in their titles.
- Create EXACTLY 7 phases: Beginner, Foundation, Skill Development, Project, Internship & Freelance, Advanced, Career Preparation
- Each phase: 4-8 skills, 4-8 topics, 2-5 tools, 1-3 certifications, 2-4 practiceTasks, 1-3 projects, 4-8 resources
- Skills/topics must be specific and actionable (e.g. "React Hooks" not "learn frontend")
- Projects must be portfolio-worthy and specific (e.g. "Real-time chat app with Socket.io and React")
- Resources must have real URLs. Types: video|article|course|book|certification|platform|tool|tutorial|documentation. Categories: youtube|course|blog|docs|platform|community|book|other
- difficulty values: beginner|intermediate|advanced
- demandScore and futureScore: 0-100
- Salary data for India in INR
- 4-6 alternativePaths (related careers)

Return ONLY valid JSON.`;

    try {
      const response = await callGeminiDirectly({
        prompt: structuredPrompt,
        temperature: 0.6,
      });

      const rawText = response?.text;
      let generatedData;
      try {
        generatedData = parseStructuredJson(rawText);
      } catch (parseErr) {
        console.error('Roadmap JSON parse error:', parseErr.message, 'snippet:', String(rawText).slice(0, 400));

        // Retry with stricter prompt
        const retry = await callGeminiDirectly({
          prompt: `${structuredPrompt}\n\nCRITICAL: Return ONLY a single valid JSON object. No markdown, no fences, no explanations. First char "{", last char "}".`,
          temperature: 0.2,
        });

        try {
          generatedData = parseStructuredJson(retry?.text);
        } catch (retryErr) {
          console.error('Roadmap JSON parse retry error:', retryErr.message);
          throw new Error(`Invalid JSON from AI: ${retryErr.message}`);
        }
      }

      generatedData = normalizeRoadmapData(generatedData, query.trim());
      generatedData.isGeneratedRoadmap = true;
      generatedData.userUid = String(userUid);
      generatedData.userId  = String(userUid); // also populate legacy field to satisfy old index
      if (userEmail) generatedData.userEmail = userEmail;
      generatedData.progress = {
        completedPhases: 0,
        totalPhases: generatedData.roadmap.length,
        lastUpdated: new Date(),
      };

      // Save to DB — use replaceOne+upsert so re-generating the same career overwrites cleanly
      let newCareer;
      try {
        const filter = {
          userUid: String(userUid),
          domain:  { $regex: new RegExp(`^${escapeRegex(generatedData.domain)}$`, 'i') },
          isGeneratedRoadmap: true,
        };

        // Try replaceOne with upsert first
        let replaced = false;
        try {
          await Career.replaceOne(filter, generatedData, { upsert: true });
          replaced = true;
        } catch (e11) {
          if (e11.code === 11000) {
            // Stale legacy index: hard-delete any conflicting doc then insert fresh
            console.warn('⚠️  E11000 — clearing stale index conflict and retrying...');
            await Career.collection.deleteMany({
              $or: [
                { domain: generatedData.domain, isGeneratedRoadmap: true, userId: null },
                { domain: generatedData.domain, isGeneratedRoadmap: true, userUid: String(userUid) },
              ]
            });
            await Career.collection.insertOne(generatedData);
          } else {
            throw e11;
          }
        }

        newCareer = await Career.findOne(filter) ||
                    await Career.findOne({ domain: generatedData.domain, userUid: String(userUid) });

        if (!newCareer) throw new Error('Roadmap was generated but could not be retrieved after save.');
        awardXP(userUid, 'ROADMAP_GENERATED').catch(() => {});
      } catch (dbError) {
        console.error('Career save error:', dbError.message || dbError);
        // Return the generated data to the user even if DB save fails
        // so they don't lose their roadmap
        console.warn('⚠️  Returning in-memory roadmap due to DB save failure.');
        return res.json({ success: true, data: generatedData, cached: false, saveWarning: true });
      }

      return res.json({ success: true, data: newCareer, cached: false });
    } catch (aiError) {
      console.error('AI Generation Error:', aiError.message || aiError);
      const errorMsg = aiError.message || '';
      const isOverloaded = errorMsg.includes('503') || errorMsg.includes('UNAVAILABLE');
      const isQuota = errorMsg.includes('429') || errorMsg.includes('quota') || errorMsg.includes('RESOURCE_EXHAUSTED');
      const isDbValidation = aiError.isDbValidation === true;

      if (isQuota) {
        return res.status(429).json({
          success: false,
          message: 'AI quota exhausted. Please wait a moment and try again — the system will automatically use a backup AI model.',
        });
      }
      if (isDbValidation) {
        return res.status(400).json({
          success: false,
          message: 'Roadmap generated but could not be saved. Try a slightly different title.',
        });
      }
      const isTimeout = errorMsg.includes('timeout') || errorMsg.includes('ETIMEDOUT');
      return res.status(isOverloaded ? 503 : 500).json({
        success: false,
        message: isOverloaded
          ? 'AI service is temporarily busy. Please try again shortly.'
          : isTimeout
          ? 'The AI took too long to respond. Please try a simpler career title or try again in a moment.'
          : (errorMsg.length < 220 ? errorMsg : 'Roadmap generation failed. Please try again.'),
      });
    }
  } catch (error) {
    console.error('Generate Roadmap Catch-All Error:', error);
    res.status(500).json({ success: false, message: 'Failed to process roadmap request.' });
  }
};

module.exports = {
  getAllCareers,
  getCareerById,
  getMarketInsights,
  generateRoadmap,
  getGeneratedRoadmaps,
  deleteRoadmap,
  updateProgress,
};
