const CareerGPS = require('../models/CareerGPS');
const CareerTemplate = require('../models/CareerTemplate');
const Career = require('../models/Career');
const Resume = require('../models/Resume');
const UserCareerState = require('../models/UserCareerState');
const { awardXP } = require('../utils/gamification');
const { callGeminiDirectly } = require('../utils/geminiClient');
const { parseStructuredJson } = require('../utils/jsonParser');

// Helper to escape regex special characters
const escapeRegex = (str = '') => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Helper to generate a URL-friendly slug
const makeSlug = (str = '') => 
  String(str)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

// Helper to clean and validate YouTube resources
const validateAndCleanYoutubeResources = (resources) => {
  const seenUrls = new Set();
  const cleaned = [];
  const validTypes = ['course', 'youtube', 'docs', 'blog', 'community', 'book', 'platform', 'other'];
  
  for (const res of resources) {
    let type = String(res.type || '').toLowerCase().trim();
    let category = String(res.category || '').toLowerCase().trim();
    
    // Normalizing type/category
    const isYt = type === 'youtube' || category === 'youtube' || type.includes('video') || category.includes('video');
    
    if (!isYt) {
      if (type === 'documentation') {
        type = 'docs';
      } else if (type === 'article') {
        type = 'blog';
      }
      
      if (!validTypes.includes(type)) {
        type = 'other';
      }
      
      cleaned.push({
        ...res,
        type
      });
      continue;
    }
    
    // Validate YouTube URL structure
    let url = String(res.url || '').trim();
    if (!url || url === '#' || url.includes('placeholder')) continue;
    
    const isYoutubeUrl = url.includes('youtube.com') || url.includes('youtu.be');
    if (!isYoutubeUrl) continue;
    
    // De-duplicate URLs
    if (seenUrls.has(url)) continue;
    seenUrls.add(url);
    
    cleaned.push({
      title: res.title || 'YouTube Tutorial',
      type: 'youtube',
      provider: 'YouTube',
      channel: res.channel || 'Educational Channel',
      url: url,
      duration: res.duration || '20 mins',
      qualityScore: Number(res.qualityScore) || 90,
      estimatedHours: Number(res.estimatedHours) || 1
    });
  }
  
  return cleaned;
};

// Formats a user GPS object with the master template structure to return to the UI
const formatGpsResponse = (gps, template) => {
  if (!gps || !template) return null;

  const gpsObj = gps.toObject();
  const templateObj = template.toObject();

  // Merge checkpoints
  const mergedCheckpoints = templateObj.checkpoints.map(tplCp => {
    // Look up completion progress for this checkpoint level
    const userCp = gpsObj.completedCheckpoints?.find(ucp => ucp.level === tplCp.level);
    
    const mappedCriteria = tplCp.completionCriteria.map(tplCrit => {
      const userCrit = userCp?.completedCriteria?.find(ucrit => ucrit.title === tplCrit.title);
      return {
        title: tplCrit.title,
        type: tplCrit.type,
        completed: userCrit ? userCrit.completed : false
      };
    });

    return {
      level: tplCp.level,
      title: tplCp.title,
      description: tplCp.description,
      estimatedTime: tplCp.estimatedTime,
      xpReward: 250 + ((tplCp.level - 1) * 50),
      skills: tplCp.skills || [],
      resources: tplCp.resources || [],
      certifications: tplCp.certifications || [],
      projects: tplCp.projects || [],
      completionCriteria: mappedCriteria,
      completed: userCp ? userCp.completed : false
    };
  });

  return {
    _id: gpsObj._id,
    userId: gpsObj.userId,
    templateId: gpsObj.templateId,
    destination: gpsObj.destination,
    currentLevel: gpsObj.currentLevel,
    xp: gpsObj.xp,
    streak: gpsObj.streak,
    progress: gpsObj.progress,
    currentCheckpoint: gpsObj.currentCheckpoint,
    lastActiveAt: gpsObj.lastActiveAt,
    badges: gpsObj.badges || [],
    projects: gpsObj.projects || [],
    createdAt: gpsObj.createdAt,
    updatedAt: gpsObj.updatedAt,
    // Inject Template Info
    templateVersion: templateObj.version || '1.0',
    estimatedDuration: templateObj.estimatedDuration || '6 Months',
    popularityScore: templateObj.popularity || 0,
    totalLearners: templateObj.totalUsers || 0,
    checkpoints: mergedCheckpoints
  };
};

// @desc    Generate personalized career journey
// @route   POST /api/gps/generate
// @access  Private
const generateRoute = async (req, res) => {
  try {
    const { destination } = req.body;
    const userId = String(req.user?.uid || req.user?._id || req.user?.id);

    if (!destination) {
      return res.status(400).json({ success: false, message: 'Destination role is required' });
    }

    const careerSlug = makeSlug(destination);
    let template = await CareerTemplate.findOne({ careerSlug });

    // Step 1: Migrate from legacy Careers collection if it exists
    if (!template) {
      const legacyCareer = await Career.findOne({
        domain: { $regex: new RegExp(`^${escapeRegex(destination.trim())}$`, 'i') },
        isGeneratedRoadmap: true
      });

      if (legacyCareer) {
        console.log(`📦 Migrating legacy roadmap for "${destination}" to master template...`);
        const cleanedCheckpoints = (legacyCareer.roadmap || []).map((phase, idx) => {
          // Normalize resources
          const normalizedResources = (phase.resources || []).map(r => ({
            title: r.title || 'Learning resource',
            type: String(r.type || 'other').toLowerCase() === 'video' ? 'youtube' : String(r.type || 'other').toLowerCase(),
            provider: r.provider || 'Online Resource',
            url: r.url || '#',
            qualityScore: 90,
            estimatedHours: 2
          }));

          const cleanedResources = validateAndCleanYoutubeResources(normalizedResources);

          // Normalize projects
          const normalizedProjects = (phase.projects || []).map(p => ({
            title: typeof p === 'string' ? p : (p.title || 'Hands-on Project'),
            difficulty: phase.difficulty ? (phase.difficulty.charAt(0).toUpperCase() + phase.difficulty.slice(1)) : 'Beginner',
            description: `Apply your skills practically by building a fully working ${typeof p === 'string' ? p : p.title}.`,
            githubExamples: ['https://github.com/topics/portfolio-project'],
            resources: ['Project documentation & guidelines'],
            expectedOutcome: 'Complete functional application deployed on the web with public GitHub repository.'
          }));

          // Generate criteria
          const criteria = [];
          const firstCourse = cleanedResources.find(r => r.type === 'course' || r.type === 'youtube');
          criteria.push({
            title: firstCourse ? `Finish recommended course: ${firstCourse.title}` : 'Review recommended learning resources',
            type: 'course'
          });

          if (normalizedProjects.length > 0) {
            normalizedProjects.forEach(proj => {
              criteria.push({ title: `Complete project: ${proj.title}`, type: 'project' });
            });
          } else {
            criteria.push({ title: 'Build a practice project demonstrating skills learned', type: 'project' });
          }

          const skillsToInclude = (phase.skills || []).slice(0, 3);
          skillsToInclude.forEach(sk => {
            criteria.push({ title: `Master skill: ${sk}`, type: 'task' });
          });

          criteria.push({ title: 'Pass checkpoint evaluation quiz', type: 'quiz' });

          return {
            level: idx + 1,
            title: phase.phase || `Phase ${idx + 1}`,
            description: phase.skills && phase.skills.length > 0 
              ? `Master ${phase.skills.slice(0, 3).join(', ')}` 
              : `Learn essentials of ${phase.phase}`,
            estimatedTime: phase.duration || '2 Weeks',
            skills: phase.skills || [],
            resources: cleanedResources,
            certifications: phase.certifications || [],
            projects: normalizedProjects,
            completionCriteria: criteria
          };
        });

        template = await CareerTemplate.create({
          careerSlug,
          title: legacyCareer.domain,
          description: legacyCareer.description || `Learning path for ${legacyCareer.domain}`,
          version: '1.0',
          estimatedDuration: '6 Months',
          checkpoints: cleanedCheckpoints,
          createdBy: 'migration',
          popularity: 1,
          totalUsers: 1
        });
      }
    }

    // Step 2: Generate from AI if still not found
    if (!template) {
      console.log(`🤖 Template missing. Generating new roadmap via AI for: "${destination}"...`);
      const prompt = `You are a world-class educational designer and career advisor.
Create a highly detailed, comprehensive career roadmap for: "${destination}".

Return ONLY valid JSON. No markdown, no fences. The first character must be "{", last must be "}".

JSON Schema:
{
  "title": "${destination}",
  "description": "Comprehensive career description.",
  "estimatedDuration": "10 Months",
  "checkpoints": [
    {
      "level": 1,
      "title": "Phase 1 Title",
      "description": "Short description of what the user will achieve in this level.",
      "estimatedTime": "4 Weeks",
      "skills": ["HTML5", "CSS3", "JavaScript"],
      "resources": [
        {
          "title": "Coursera - HTML, CSS, and Javascript for Web Developers",
          "type": "course",
          "provider": "Coursera",
          "url": "https://www.coursera.org/learn/html-css-javascript-for-web-developers",
          "qualityScore": 95,
          "estimatedHours": 24
        },
        {
          "title": "JavaScript Full Course",
          "type": "youtube",
          "provider": "YouTube",
          "channel": "freeCodeCamp",
          "url": "https://www.youtube.com/watch?v=PkZNo7MFNFg",
          "duration": "3 hours",
          "qualityScore": 95,
          "estimatedHours": 3
        }
      ],
      "certifications": ["freeCodeCamp Responsive Web Design Certification"],
      "projects": [
        {
          "title": "Personal Portfolio",
          "difficulty": "Beginner",
          "description": "Build a responsive personal portfolio site.",
          "githubExamples": ["https://github.com/freeCodeCamp/portfolio-template"],
          "resources": ["MDN Web Docs for Semantic HTML"],
          "expectedOutcome": "Fully functional responsive portfolio website hosted publicly."
        }
      ]
    }
  ]
}

CRITICAL REQUIREMENTS:
- Create exactly 7 progressive checkpoints (levels 1 to 7).
- Each checkpoint must contain 4-8 specific skills, 3-6 high-quality resources, and 1-2 portfolio-worthy projects.
- Include real, valid URLs for all courses and documentation.
- For YouTube tutorials, provide only verified educational channels (e.g. freeCodeCamp, Programming with Mosh, Traversy Media) and actual valid URLs.
- The returned JSON must match the schema exactly. Return ONLY valid JSON.`;

      const response = await callGeminiDirectly({ prompt, temperature: 0.6 });
      let parsed = parseStructuredJson(response.text);

      const parsedCheckpoints = (parsed.checkpoints || []).map((phase, idx) => {
        const cleanedRes = validateAndCleanYoutubeResources(phase.resources || []);
        
        // Generate criteria
        const criteria = [];
        const firstCourse = cleanedRes.find(r => r.type === 'course' || r.type === 'youtube');
        criteria.push({
          title: firstCourse ? `Finish recommended course: ${firstCourse.title}` : 'Review recommended learning resources',
          type: 'course'
        });

        const projs = phase.projects || [];
        if (projs.length > 0) {
          projs.forEach(proj => {
            criteria.push({ title: `Complete project: ${proj.title || proj}`, type: 'project' });
          });
        } else {
          criteria.push({ title: 'Build a practice project demonstrating skills learned', type: 'project' });
        }

        const skillsToInclude = (phase.skills || []).slice(0, 3);
        skillsToInclude.forEach(sk => {
          criteria.push({ title: `Master skill: ${sk}`, type: 'task' });
        });

        criteria.push({ title: 'Pass checkpoint evaluation quiz', type: 'quiz' });

        return {
          level: idx + 1,
          title: phase.title || `Phase ${idx + 1}`,
          description: phase.description || `Learn essentials of level ${idx + 1}`,
          estimatedTime: phase.estimatedTime || '2 Weeks',
          skills: phase.skills || [],
          resources: cleanedRes,
          certifications: phase.certifications || [],
          projects: projs.map(p => ({
            title: p.title || p,
            difficulty: p.difficulty || 'Beginner',
            description: p.description || `Build a practice ${p.title || p}`,
            githubExamples: p.githubExamples || ['https://github.com'],
            resources: p.resources || ['Documentation'],
            expectedOutcome: p.expectedOutcome || 'Complete working system'
          })),
          completionCriteria: criteria
        };
      });

      template = await CareerTemplate.create({
        careerSlug,
        title: parsed.title || destination,
        description: parsed.description || `Complete roadmap for ${destination}`,
        version: '1.0',
        estimatedDuration: parsed.estimatedDuration || '8 Months',
        checkpoints: parsedCheckpoints,
        createdBy: 'ai'
      });
    }

    // Step 3: Increment Template Stats
    template.popularity += 1;
    template.totalUsers += 1;
    await template.save();

    // Step 4: Personalization Check (User Resume/Skills)
    const resume = await Resume.findOne({ user: userId });
    const knownSkills = new Set(
      (resume?.skills || []).map(s => String(s).toLowerCase().trim())
    );

    // Build completedCheckpoints with pre-completed user skills
    const completedCheckpoints = template.checkpoints.map(cp => {
      const completedCriteria = cp.completionCriteria.map(crit => {
        let isCompleted = false;

        // Auto-complete if they already know the skill
        if (crit.type === 'task') {
          const matchedSkill = cp.skills.find(sk => 
            knownSkills.has(sk.toLowerCase().trim()) && 
            crit.title.toLowerCase().includes(sk.toLowerCase().trim())
          );
          if (matchedSkill) {
            isCompleted = true;
          }
        }

        return {
          title: crit.title,
          completed: isCompleted
        };
      });

      // A level is completed if all criteria are completed
      const allDone = completedCriteria.every(cc => cc.completed);

      return {
        level: cp.level,
        completed: allDone,
        completedCriteria
      };
    });

    // Recalculate overall progress %
    const totalCriteria = completedCheckpoints.reduce((sum, cp) => sum + cp.completedCriteria.length, 0);
    const completedCriteriaCount = completedCheckpoints.reduce((sum, cp) => sum + cp.completedCriteria.filter(c => c.completed).length, 0);
    const progress = totalCriteria > 0 ? Math.round((completedCriteriaCount / totalCriteria) * 100) : 0;

    // Find current active checkpoint (first incomplete level)
    const nextIncomplete = completedCheckpoints.find(c => !c.completed);
    const currentCheckpoint = nextIncomplete 
      ? (template.checkpoints.find(cp => cp.level === nextIncomplete.level)?.title || '') 
      : 'Destination Reached!';

    // Save user state progress
    const gps = await CareerGPS.findOneAndUpdate(
      { userId, templateId: template._id },
      {
        destination: template.title,
        currentLevel: 1,
        xp: completedCriteriaCount * 50, // award XP for personalized pre-completed items
        streak: 1,
        progress,
        currentCheckpoint,
        completedCheckpoints,
        badges: completedCriteriaCount > 0 ? [{ name: 'Fast Track', unlockedAt: new Date() }] : [],
        projects: []
      },
      { upsert: true, new: true }
    );

    // Update UserCareerState progress stage
    await UserCareerState.findOneAndUpdate(
      { userId },
      {
        $set: { currentStage: 'roadmap-active' },
        $addToSet: {
          activeRoadmaps: {
            roadmapId: template._id,
            domain: template.title,
            completedPhases: completedCheckpoints.filter(c => c.completed).length,
            totalPhases: template.checkpoints.length,
            lastUpdatedAt: new Date()
          }
        }
      },
      { upsert: true }
    );

    awardXP(userId, 'ROADMAP_GENERATED').catch(() => {});

    const responseData = formatGpsResponse(gps, template);
    res.status(201).json({ success: true, data: responseData });
  } catch (err) {
    console.error('GPS Generate Error:', err);
    res.status(500).json({ success: false, message: 'Failed to generate GPS route: ' + err.message });
  }
};

// @desc    Load user's current journey
// @route   GET /api/gps/current
// @access  Private
const getCurrentGPS = async (req, res) => {
  try {
    const userId = String(req.user?.uid || req.user?._id || req.user?.id);
    const { templateId } = req.query;
    
    let gps;
    if (templateId) {
      gps = await CareerGPS.findOne({ userId, templateId });
    } else {
      gps = await CareerGPS.findOne({ userId }).sort({ updatedAt: -1 });
    }
    
    if (!gps) {
      return res.status(200).json({ success: true, data: null });
    }

    const template = await CareerTemplate.findById(gps.templateId);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Roadmap template not found for this GPS journey' });
    }

    const responseData = formatGpsResponse(gps, template);
    res.status(200).json({ success: true, data: responseData });
  } catch (err) {
    console.error('GPS Current Error:', err);
    res.status(500).json({ success: false, message: 'Failed to load GPS status: ' + err.message });
  }
};

// @desc    Mark completion criteria complete/incomplete and award XP
// @route   PATCH /api/gps/task
// @access  Private
const updateTaskProgress = async (req, res) => {
  try {
    const userId = String(req.user?.uid || req.user?._id || req.user?.id);
    const { checkpointLevel, taskTitle, completed, templateId } = req.body;

    if (checkpointLevel == null || !taskTitle) {
      return res.status(400).json({ success: false, message: 'Checkpoint level and criteria title are required.' });
    }

    let gps;
    if (templateId) {
      gps = await CareerGPS.findOne({ userId, templateId });
    } else {
      gps = await CareerGPS.findOne({ userId }).sort({ updatedAt: -1 });
    }
    if (!gps) {
      return res.status(404).json({ success: false, message: 'GPS journey not found' });
    }

    const template = await CareerTemplate.findById(gps.templateId);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Roadmap template not found' });
    }

    // Find user checkpoint progress using index to mutate the Mongoose subdocument directly
    let userCpIdx = gps.completedCheckpoints.findIndex(c => Number(c.level) === Number(checkpointLevel));
    if (userCpIdx === -1) {
      gps.completedCheckpoints.push({ level: Number(checkpointLevel), completed: false, completedCriteria: [] });
      userCpIdx = gps.completedCheckpoints.length - 1;
    }
    const userCp = gps.completedCheckpoints[userCpIdx];

    // Find matching criteria progress
    let userCritIdx = userCp.completedCriteria.findIndex(c => c.title === taskTitle);
    const wasCompleted = userCritIdx !== -1 ? userCp.completedCriteria[userCritIdx].completed : false;

    if (userCritIdx === -1) {
      userCp.completedCriteria.push({ title: taskTitle, completed: Boolean(completed) });
    } else {
      userCp.completedCriteria[userCritIdx].completed = Boolean(completed);
    }

    let xpEarned = 0;
    const isNowCompleted = Boolean(completed);
    if (isNowCompleted && !wasCompleted) {
      xpEarned += 50; 
    } else if (!isNowCompleted && wasCompleted) {
      xpEarned -= 50;
    }

    // Check if checkpoint level is fully completed
    const tplCp = template.checkpoints.find(c => c.level === Number(checkpointLevel));
    if (tplCp) {
      const allDone = tplCp.completionCriteria.every(tc => {
        const match = userCp.completedCriteria.find(uc => uc.title === tc.title);
        return match ? match.completed : false;
      });

      const checkpointWasCompleted = userCp.completed;
      userCp.completed = allDone;

      if (userCp.completed && !checkpointWasCompleted) {
        xpEarned += 250 + ((Number(checkpointLevel) - 1) * 50); // level-specific checkpoint completion reward
      } else if (!userCp.completed && checkpointWasCompleted) {
        xpEarned -= 250 + ((Number(checkpointLevel) - 1) * 50);
      }
    }

    gps.xp = Math.max(0, gps.xp + xpEarned);

    // Leveling system
    let newLevel = 1;
    while (gps.xp >= 100 * Math.pow(newLevel, 2)) {
      newLevel++;
    }
    gps.currentLevel = newLevel;

    // Recalculate overall progress
    const totalCriteriaCount = template.checkpoints.reduce((sum, cp) => sum + cp.completionCriteria.length, 0);
    
    // Fill missing progress checkpoints mapping
    let completedCriteriaCount = 0;
    template.checkpoints.forEach(cp => {
      const ucp = gps.completedCheckpoints.find(u => u.level === cp.level);
      cp.completionCriteria.forEach(tc => {
        const ucrit = ucp?.completedCriteria?.find(u => u.title === tc.title);
        if (ucrit?.completed) completedCriteriaCount++;
      });
    });

    gps.progress = totalCriteriaCount > 0 ? Math.round((completedCriteriaCount / totalCriteriaCount) * 100) : 0;

    // Set next incomplete checkpoint title
    const nextIncomplete = template.checkpoints.find(cp => {
      const ucp = gps.completedCheckpoints.find(u => u.level === cp.level);
      return !ucp?.completed;
    });
    gps.currentCheckpoint = nextIncomplete ? nextIncomplete.title : 'Destination Reached!';

    // Badge triggers
    if (completedCriteriaCount >= 1 && !gps.badges.some(b => b.name === 'First Checkpoint')) {
      gps.badges.push({ name: 'First Checkpoint', unlockedAt: new Date() });
    }
    if (gps.progress >= 100 && !gps.badges.some(b => b.name === 'Career Explorer')) {
      gps.badges.push({ name: 'Career Explorer', unlockedAt: new Date() });
    }

    // Streak & activity tracking
    if (xpEarned > 0) {
      const today = new Date();
      const lastActive = gps.lastActiveAt ? new Date(gps.lastActiveAt) : today;
      const diffTime = Math.abs(today.setHours(0,0,0,0) - lastActive.setHours(0,0,0,0));
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        gps.streak += 1;
      } else if (diffDays > 1) {
        gps.streak = 1;
      }
      gps.lastActiveAt = new Date();
    }

    if (gps.streak >= 3 && !gps.badges.some(b => b.name === '3-Day Streak')) {
      gps.badges.push({ name: '3-Day Streak', unlockedAt: new Date() });
    }
    if (gps.streak >= 7 && !gps.badges.some(b => b.name === '7-Day Streak')) {
      gps.badges.push({ name: '7-Day Streak', unlockedAt: new Date() });
    }
    gps.markModified('completedCheckpoints');
    await gps.save();

    // Also update UserCareerState
    try {
      const completedLevels = template.checkpoints.filter(cp => {
        const u = gps.completedCheckpoints.find(ucp => ucp.level === cp.level);
        return u?.completed;
      }).length;

      await UserCareerState.findOneAndUpdate(
        { userId, 'activeRoadmaps.roadmapId': gps.templateId },
        {
          $set: {
            'activeRoadmaps.$.completedPhases': completedLevels,
            'activeRoadmaps.$.lastUpdatedAt': new Date()
          }
        }
      );
    } catch (stateErr) {
      console.warn('Could not update UserCareerState progress:', stateErr.message);
    }

    const responseData = formatGpsResponse(gps, template);
    res.status(200).json({ success: true, data: responseData });
  } catch (err) {
    console.error('GPS Update Task Error:', err);
    res.status(500).json({ success: false, message: 'Failed to update task progress: ' + err.message });
  }
};

// @desc    Store completed project details
// @route   POST /api/gps/project
// @access  Private
const submitProject = async (req, res) => {
  try {
    const userId = String(req.user?.uid || req.user?._id || req.user?.id);
    const { projectName, githubUrl, description, templateId } = req.body;

    if (!projectName || !githubUrl) {
      return res.status(400).json({ success: false, message: 'Project name and GitHub URL are required.' });
    }

    let gps;
    if (templateId) {
      gps = await CareerGPS.findOne({ userId, templateId });
    } else {
      gps = await CareerGPS.findOne({ userId }).sort({ updatedAt: -1 });
    }
    if (!gps) {
      return res.status(404).json({ success: false, message: 'GPS journey not found' });
    }

    const template = await CareerTemplate.findById(gps.templateId);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Roadmap template not found' });
    }

    gps.projects.push({
      projectName,
      githubUrl,
      description: description || '',
      status: 'completed',
      submittedAt: new Date()
    });

    // Award project completion (+500 XP)
    gps.xp += 500;

    // Automatically check off matching project criteria in first incomplete checkpoint
    const incompleteUcp = gps.completedCheckpoints.find(ucp => !ucp.completed);
    if (incompleteUcp) {
      const matchingCrit = incompleteUcp.completedCriteria.find(crit => 
        crit.title.toLowerCase().includes('project') || 
        crit.title.toLowerCase().includes(projectName.toLowerCase())
      );
      if (matchingCrit && !matchingCrit.completed) {
        matchingCrit.completed = true;

        // Verify if this checkpoint level is now completed
        const tplCp = template.checkpoints.find(c => c.level === incompleteUcp.level);
        if (tplCp) {
          const allDone = tplCp.completionCriteria.every(tc => {
            const match = incompleteUcp.completedCriteria.find(uc => uc.title === tc.title);
            return match ? match.completed : false;
          });

          if (allDone && !incompleteUcp.completed) {
            incompleteUcp.completed = true;
            gps.xp += 250 + ((incompleteUcp.level - 1) * 50);
          }
        }
      }
    }

    // Check level-up
    let newLevel = 1;
    while (gps.xp >= 100 * Math.pow(newLevel, 2)) {
      newLevel++;
    }
    gps.currentLevel = newLevel;

    // Recalculate progress percentage
    const totalCriteriaCount = template.checkpoints.reduce((sum, cp) => sum + cp.completionCriteria.length, 0);
    let completedCriteriaCount = 0;
    template.checkpoints.forEach(cp => {
      const ucp = gps.completedCheckpoints.find(u => u.level === cp.level);
      cp.completionCriteria.forEach(tc => {
        const ucrit = ucp?.completedCriteria?.find(u => u.title === tc.title);
        if (ucrit?.completed) completedCriteriaCount++;
      });
    });

    gps.progress = totalCriteriaCount > 0 ? Math.round((completedCriteriaCount / totalCriteriaCount) * 100) : 0;

    // Set next incomplete checkpoint title
    const nextIncomplete = template.checkpoints.find(cp => {
      const ucp = gps.completedCheckpoints.find(u => u.level === cp.level);
      return !ucp?.completed;
    });
    gps.currentCheckpoint = nextIncomplete ? nextIncomplete.title : 'Destination Reached!';

    if (!gps.badges.some(b => b.name === 'First Project')) {
      gps.badges.push({ name: 'First Project', unlockedAt: new Date() });
    }

    gps.markModified('completedCheckpoints');
    await gps.save();
    
    const responseData = formatGpsResponse(gps, template);
    res.status(200).json({ success: true, data: responseData });
  } catch (err) {
    console.error('GPS Submit Project Error:', err);
    res.status(500).json({ success: false, message: 'Failed to submit project: ' + err.message });
  }
};

// @desc    Get master roadmap template by slug
// @route   GET /api/gps/template/:careerSlug
// @access  Public
const getTemplateBySlug = async (req, res) => {
  try {
    const { careerSlug } = req.params;
    const template = await CareerTemplate.findOne({ careerSlug });
    
    if (!template) {
      return res.status(404).json({ success: false, message: 'Career template not found' });
    }
    
    res.status(200).json({ success: true, data: template });
  } catch (err) {
    console.error('GPS Get Template Error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch career template: ' + err.message });
  }
};

// @desc    List all GPS journeys for user
// @route   GET /api/gps/list
// @access  Private
const listGPS = async (req, res) => {
  try {
    const userId = String(req.user?.uid || req.user?._id || req.user?.id);
    const gpsJourneys = await CareerGPS.find({ userId }).sort({ updatedAt: -1 });
    
    // Format each journey with its template
    const formatted = [];
    for (const gps of gpsJourneys) {
      const template = await CareerTemplate.findById(gps.templateId);
      if (template) {
        formatted.push(formatGpsResponse(gps, template));
      }
    }
    
    res.status(200).json({ success: true, data: formatted });
  } catch (err) {
    console.error('GPS List Error:', err);
    res.status(500).json({ success: false, message: 'Failed to list GPS journeys: ' + err.message });
  }
};

// @desc    Delete a GPS journey
// @route   DELETE /api/gps/:id
// @access  Private
const deleteGPS = async (req, res) => {
  try {
    const userId = String(req.user?.uid || req.user?._id || req.user?.id);
    const { id } = req.params;

    // Delete the GPS record
    const gps = await CareerGPS.findOneAndDelete({ _id: id, userId });
    if (!gps) {
      return res.status(404).json({ success: false, message: 'GPS journey not found' });
    }

    // Also remove it from UserCareerState activeRoadmaps
    const UserCareerState = require('../models/UserCareerState');
    await UserCareerState.findOneAndUpdate(
      { userId },
      {
        $pull: {
          activeRoadmaps: { roadmapId: gps.templateId }
        }
      }
    );

    res.status(200).json({ success: true, message: 'GPS route deleted successfully' });
  } catch (err) {
    console.error('GPS Delete Error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete GPS journey: ' + err.message });
  }
};

module.exports = {
  generateRoute,
  getCurrentGPS,
  updateTaskProgress,
  submitProject,
  getTemplateBySlug,
  listGPS,
  deleteGPS
};
