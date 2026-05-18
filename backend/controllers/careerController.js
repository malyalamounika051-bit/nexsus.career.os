const Career = require('../models/Career');
const { callGeminiDirectly } = require('../utils/geminiClient');

/* ── Helpers ─────────────────────────────────────────────── */

/** Avoid RegExp syntax errors / ReDoS when matching user-entered career titles */
const escapeRegex = (str = '') => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Parse AI response that may contain fenced JSON or mixed text + JSON */
const parseStructuredJson = (raw) => {
  if (raw == null || String(raw).trim() === '') {
    throw new Error('Empty response from AI model.');
  }
  let text = String(raw).trim();
  const fence = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fence) text = fence[1].trim();

  const tryParse = (candidate) => JSON.parse(candidate);

  // Fast path: pure JSON
  try { return tryParse(text); } catch { /* continue */ }

  // Extract first JSON object from mixed model output
  const extractFirstJsonObject = (input) => {
    const s = String(input);
    const start = s.indexOf('{');
    if (start < 0) return null;
    let depth = 0, inString = false, escaped = false;
    for (let i = start; i < s.length; i++) {
      const ch = s[i];
      if (inString) {
        if (escaped) { escaped = false; }
        else if (ch === '\\') { escaped = true; }
        else if (ch === '"') { inString = false; }
        continue;
      }
      if (ch === '"') { inString = true; continue; }
      if (ch === '{') depth += 1;
      if (ch === '}') depth -= 1;
      if (depth === 0) return s.slice(start, i + 1);
    }
    return null;
  };

  const extracted = extractFirstJsonObject(text);
  if (extracted) return tryParse(extracted);

  throw new Error('Model did not return a JSON object.');
};

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
    career.progress = {
      completedPhases: completedCount,
      totalPhases: career.roadmap.length,
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

    // ── Check cache: return existing high-quality roadmap ──
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
      console.log(`♻️ Regenerating stale roadmap for "${existingCareer.domain}"...`);
      await Career.deleteOne({ _id: existingCareer._id });
    }

    // ── Build AI prompt ──────────────────────────────────────
    const structuredPrompt = `You are a world-class career counselor, technical education architect, and industry expert. You have deep knowledge of hiring standards, modern tech stacks, learning science, and real-world career progression.

Your task: Create an EXCEPTIONALLY detailed and PRACTICAL career roadmap for: "${query}"

RESPOND ONLY WITH VALID JSON — no markdown, no explanations, no extra text. First character must be "{", last must be "}".

The JSON must match this EXACT structure:

{
  "domain": "Career Title",
  "description": "2-3 sentence compelling career description",
  "skills": ["skill1", "skill2", ...],
  "demandScore": 78,
  "futureScore": 82,
  "avgSalary": "₹X-Y LPA",
  "growthRate": "X% YoY",
  "demand": "High",
  "trendingSkills": ["trending1", "trending2", ...],
  "salaryRange": { "min": "₹4 LPA", "max": "₹30 LPA", "currency": "INR" },
  "alternativePaths": ["Related Career 1", "Related Career 2", ...],
  "studyStrategy": "A personalized 3-4 sentence AI study strategy covering daily hours, learning approach, project cadence, and community engagement.",
  "roadmap": [
    {
      "phase": "Phase 1: Beginner Phase",
      "duration": "4-6 weeks",
      "difficulty": "beginner",
      "skills": ["HTML5", "CSS3", "Basic JavaScript"],
      "topics": ["How the web works", "HTML semantic elements", "CSS Flexbox & Grid", "JavaScript basics"],
      "tools": ["VS Code", "Chrome DevTools", "Git"],
      "certifications": ["freeCodeCamp Responsive Web Design"],
      "practiceTasks": ["Build a personal portfolio page", "Complete 30 CSS challenges"],
      "projects": ["Personal portfolio website with responsive design"],
      "resources": [
        { "title": "Traversy Media - HTML Crash Course", "url": "https://youtube.com/...", "type": "video", "category": "youtube" },
        { "title": "MDN Web Docs", "url": "https://developer.mozilla.org", "type": "documentation", "category": "docs" },
        { "title": "freeCodeCamp", "url": "https://freecodecamp.org", "type": "platform", "category": "platform" },
        { "title": "CSS-Tricks", "url": "https://css-tricks.com", "type": "article", "category": "blog" },
        { "title": "The Odin Project", "url": "https://theodinproject.com", "type": "course", "category": "course" }
      ]
    }
  ]
}

STRICT REQUIREMENTS:

1. PHASES — Create EXACTLY 7 progressive phases:
   - Phase 1: Beginner Phase (fundamentals, environment setup, core concepts)
   - Phase 2: Foundation Phase (core technologies, primary stack)
   - Phase 3: Skill Development Phase (intermediate skills, patterns)
   - Phase 4: Project Phase (real-world projects, portfolio building)
   - Phase 5: Internship & Freelance Phase (work experience, freelancing)
   - Phase 6: Advanced Phase (advanced topics, specialization, system design)
   - Phase 7: Career Preparation Phase (interview prep, resume, job search)

2. SKILLS (4-8 per phase) — Specific and actionable:
   ✅ "React Hooks (useState, useEffect, useContext)"
   ❌ "Learn frontend"

3. TOPICS (4-8 per phase) — Hyper-specific learning objectives:
   ✅ "REST API Design with Express.js and middleware patterns"
   ❌ "Study backend"

4. TOOLS (2-5 per phase) — Real software/tools used by professionals

5. CERTIFICATIONS (1-3 per phase) — Real, obtainable certifications

6. PRACTICE TASKS (2-4 per phase) — Concrete exercises

7. PROJECTS (1-3 per phase) — Portfolio-worthy, specific:
   ✅ "Build a real-time chat app using Socket.io, React, and MongoDB"
   ❌ "Build a project"

8. RESOURCES (4-8 per phase) — MUST be REAL and SPECIFIC with working URLs:
   - category "youtube": YouTube channels/videos (Traversy Media, freeCodeCamp, Fireship, etc.)
   - category "course": Online courses (Udemy, Coursera, edX, etc.)
   - category "docs": Official documentation
   - category "blog": Tech blogs and articles
   - category "platform": Practice platforms (LeetCode, HackerRank, Exercism, etc.)
   - category "community": Forums/communities (Reddit, Discord, Stack Overflow, etc.)
   - Each resource MUST have: title, url, type, category

9. MARKET DATA — Realistic values:
   - demandScore: 0-100
   - futureScore: 0-100 (predicted demand in 5 years)
   - salaryRange: Min and max for India
   - alternativePaths: 4-6 related careers
   - studyStrategy: 3-4 sentences of personalized advice

CRITICAL: Return ONLY valid JSON. First character "{", last character "}".`;

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
      if (userEmail) generatedData.userEmail = userEmail;
      generatedData.progress = {
        completedPhases: 0,
        totalPhases: generatedData.roadmap.length,
        lastUpdated: new Date(),
      };

      // Upsert to DB
      let newCareer;
      try {
        newCareer = await Career.findOneAndUpdate(
          {
            domain: { $regex: new RegExp(`^${escapeRegex(generatedData.domain)}$`, 'i') },
            userUid: String(userUid),
            isGeneratedRoadmap: true,
          },
          generatedData,
          { upsert: true, new: true, runValidators: true },
        );
      } catch (dbError) {
        console.error('Career upsert error:', dbError.message || dbError);
        const err = new Error(dbError?.message || 'Could not save roadmap to database.');
        err.isDbValidation = true;
        throw err;
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
          message: 'AI quota exhausted. Please try again in a few minutes.',
        });
      }
      if (isDbValidation) {
        return res.status(400).json({
          success: false,
          message: 'Roadmap generated but could not be saved. Try a slightly different title.',
        });
      }
      return res.status(isOverloaded ? 503 : 500).json({
        success: false,
        message: isOverloaded
          ? 'AI service is temporarily busy. Please try again shortly.'
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
