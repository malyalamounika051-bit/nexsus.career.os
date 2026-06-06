const CareerGPS = require('../models/CareerGPS');
const Career = require('../models/Career');
const { awardXP } = require('../utils/gamification');

// @desc    Generate personalized career journey
// @route   POST /api/gps/generate
// @access  Private
const generateRoute = async (req, res) => {
  try {
    const { destination } = req.body;
    const userId = String(req.user?.uid || req.user?._id || req.user?.id);

    if (!destination) {
      return res.status(400).json({ success: false, message: 'Destination is required' });
    }

    // Look up existing roadmap or find generic matching career
    let roadmap = await Career.findOne({ domain: destination, userUid: userId, isGeneratedRoadmap: true });
    if (!roadmap) {
      roadmap = await Career.findOne({ domain: destination, isGeneratedRoadmap: true });
    }
    if (!roadmap) {
      // Look up using flexible case-insensitive match
      roadmap = await Career.findOne({ domain: { $regex: new RegExp(`^${destination.trim()}$`, 'i') } });
    }

    // Fallback: create dynamic path checkpoints if no pre-generated roadmap exists
    if (!roadmap) {
      roadmap = {
        domain: destination,
        roadmap: [
          { phase: 'Foundations & Basics', skills: ['Basic Syntax', 'Core Concepts'], topics: ['Getting Started', 'Basic Syntax', 'First Application'] },
          { phase: 'Intermediate Skills', skills: ['Data handling', 'Control flows'], topics: ['Data Types', 'Conditionals', 'Loops'] },
          { phase: 'Advanced Concepts', skills: ['Architecture', 'Optimization'], topics: ['Performance', 'Clean Code', 'Debugging'] },
          { phase: 'Projects & Integration', skills: ['Project building', 'APIs'], topics: ['Database Integration', 'API Design', 'Frontend Connection'] },
          { phase: 'Interview Prep & Portfolios', skills: ['Interviews', 'Resumes'], topics: ['Mock Interviews', 'Resume Tweaks', 'Job Applications'] }
        ]
      };
    }

    const checkpoints = roadmap.roadmap.map((phase, idx) => {
      // Map resources to enriched structure
      const mappedResources = (phase.resources || []).map(res => {
        let resourceType = 'other';
        const typeStr = String(res.type || res.category || '').toLowerCase();
        const catStr = String(res.category || '').toLowerCase();

        if (typeStr.includes('video') || typeStr.includes('youtube') || catStr.includes('youtube') || catStr.includes('video')) {
          resourceType = 'youtube';
        } else if (typeStr.includes('course') || typeStr.includes('class') || catStr.includes('course')) {
          resourceType = 'course';
        } else if (typeStr.includes('doc') || typeStr.includes('ref') || catStr.includes('docs')) {
          resourceType = 'docs';
        } else if (typeStr.includes('blog') || typeStr.includes('article') || catStr.includes('blog')) {
          resourceType = 'blog';
        } else if (typeStr.includes('code') || typeStr.includes('platform') || catStr.includes('platform')) {
          resourceType = 'platform';
        } else if (typeStr.includes('community') || catStr.includes('community')) {
          resourceType = 'community';
        } else if (typeStr.includes('book') || catStr.includes('book')) {
          resourceType = 'book';
        }

        // Extract provider from URL hostname
        let provider = 'Online Resource';
        if (res.url) {
          try {
            const urlObj = new URL(res.url);
            const host = urlObj.hostname.replace('www.', '');
            if (host.includes('youtube.com') || host.includes('youtu.be')) {
              provider = 'YouTube';
            } else if (host.includes('coursera.org')) {
              provider = 'Coursera';
            } else if (host.includes('udemy.com')) {
              provider = 'Udemy';
            } else if (host.includes('github.com')) {
              provider = 'GitHub';
            } else if (host.includes('developer.mozilla.org')) {
              provider = 'MDN Web Docs';
            } else {
              provider = host.split('.')[0].toUpperCase();
            }
          } catch (e) {
            // Safe fallback
          }
        }

        return {
          title: res.title || 'Learning Guide',
          type: resourceType,
          provider,
          url: res.url || '#'
        };
      });

      // Map projects to enriched structure
      const mappedProjects = (phase.projects || []).map(proj => {
        const title = typeof proj === 'string' ? proj : (proj.title || 'Hands-on Project');
        return {
          title,
          difficulty: phase.difficulty ? (phase.difficulty.charAt(0).toUpperCase() + phase.difficulty.slice(1)) : 'Beginner',
          description: `Apply your skills practically by building a fully working ${title}.`,
          githubExamples: ['https://github.com/topics/portfolio-project'],
          resources: ['Project documentation & guidelines'],
          expectedOutcome: 'Complete functional application deployed on the web with public GitHub repository.'
        };
      });

      // Generate customized completion criteria list
      const criteria = [];

      // 1. Recommended course criterion
      const courseResource = mappedResources.find(r => r.type === 'course' || r.type === 'youtube');
      if (courseResource) {
        criteria.push({
          title: `Finish recommended course: ${courseResource.title}`,
          type: 'course',
          completed: false
        });
      } else {
        criteria.push({
          title: 'Review recommended learning resources',
          type: 'course',
          completed: false
        });
      }

      // 2. Project submission criteria
      if (mappedProjects.length > 0) {
        mappedProjects.forEach(proj => {
          criteria.push({
            title: `Complete project: ${proj.title}`,
            type: 'project',
            completed: false
          });
        });
      } else {
        criteria.push({
          title: 'Build a practice project demonstrating skills learned',
          type: 'project',
          completed: false
        });
      }

      // 3. Skills master criteria (up to 3 items)
      const tasksToInclude = (phase.topics && phase.topics.length > 0 ? phase.topics : phase.skills || []).slice(0, 3);
      tasksToInclude.forEach(task => {
        criteria.push({
          title: `Master skill: ${task}`,
          type: 'task',
          completed: false
        });
      });

      // 4. Pass evaluation quiz
      criteria.push({
        title: 'Pass checkpoint evaluation quiz',
        type: 'quiz',
        completed: false
      });

      return {
        level: idx + 1,
        title: phase.phase,
        description: phase.skills && phase.skills.length > 0 
          ? `Master ${phase.skills.slice(0, 3).join(', ')}` 
          : `Learn essentials of ${phase.phase}`,
        estimatedTime: phase.duration || '2 Weeks',
        xpReward: 250 + (idx * 50),
        skills: phase.skills || [],
        resources: mappedResources,
        certifications: phase.certifications || [],
        projects: mappedProjects,
        completionCriteria: criteria,
        completed: false
      };
    });

    const gps = await CareerGPS.findOneAndUpdate(
      { userId },
      {
        destination,
        currentLevel: 1,
        xp: 0,
        streak: 1,
        progress: 0,
        currentCheckpoint: checkpoints[0]?.title || '',
        checkpoints,
        badges: [],
        projects: []
      },
      { upsert: true, new: true }
    );

    res.status(201).json({ success: true, data: gps });
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
    const gps = await CareerGPS.findOne({ userId });
    
    res.status(200).json({ success: true, data: gps });
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
    const { checkpointLevel, taskTitle, completed } = req.body;

    if (checkpointLevel == null || !taskTitle) {
      return res.status(400).json({ success: false, message: 'Checkpoint level and criteria title are required.' });
    }

    const gps = await CareerGPS.findOne({ userId });
    if (!gps) {
      return res.status(404).json({ success: false, message: 'GPS journey not found' });
    }

    // Find checkpoint
    const checkpoint = gps.checkpoints.find(c => c.level === Number(checkpointLevel));
    if (!checkpoint) {
      return res.status(404).json({ success: false, message: 'Checkpoint not found' });
    }

    // Find completion criteria item
    const criterion = checkpoint.completionCriteria.find(c => c.title === taskTitle);
    if (!criterion) {
      return res.status(404).json({ success: false, message: 'Completion criteria item not found' });
    }

    const wasCompleted = criterion.completed;
    criterion.completed = Boolean(completed);

    let xpEarned = 0;
    if (criterion.completed && !wasCompleted) {
      xpEarned += 50; // +50 XP per task item
    } else if (!criterion.completed && wasCompleted) {
      xpEarned -= 50;
    }

    // Check if checkpoint is completed
    const allCriteriaDone = checkpoint.completionCriteria.every(c => c.completed);
    const checkpointWasCompleted = checkpoint.completed;
    checkpoint.completed = allCriteriaDone;

    if (checkpoint.completed && !checkpointWasCompleted) {
      xpEarned += checkpoint.xpReward || 250; // Award level-specific checkpoint completion reward
    } else if (!checkpoint.completed && checkpointWasCompleted) {
      xpEarned -= checkpoint.xpReward || 250;
    }

    gps.xp = Math.max(0, gps.xp + xpEarned);

    // Leveling system: level = floor(sqrt(xp / 100)) + 1
    let newLevel = 1;
    while (gps.xp >= 100 * Math.pow(newLevel, 2)) {
      newLevel++;
    }
    gps.currentLevel = newLevel;

    // Recalculate progress percentage
    const totalTasksCount = gps.checkpoints.reduce((sum, c) => sum + c.completionCriteria.length, 0);
    const completedTasksCount = gps.checkpoints.reduce((sum, c) => sum + c.completionCriteria.filter(t => t.completed).length, 0);
    gps.progress = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

    // Find current checkpoint (first incomplete checkpoint)
    const nextIncomplete = gps.checkpoints.find(c => !c.completed);
    gps.currentCheckpoint = nextIncomplete ? nextIncomplete.title : 'Destination Reached!';

    // Badge triggers
    if (completedTasksCount >= 1 && !gps.badges.some(b => b.name === 'First Checkpoint')) {
      gps.badges.push({ name: 'First Checkpoint', unlockedAt: new Date() });
    }
    if (gps.progress >= 100 && !gps.badges.some(b => b.name === 'Career Explorer')) {
      gps.badges.push({ name: 'Career Explorer', unlockedAt: new Date() });
    }

    // Streak and activity tracking
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

    await gps.save();
    res.status(200).json({ success: true, data: gps });
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
    const { projectName, githubUrl, description } = req.body;

    if (!projectName || !githubUrl) {
      return res.status(400).json({ success: false, message: 'Project name and GitHub URL are required.' });
    }

    const gps = await CareerGPS.findOne({ userId });
    if (!gps) {
      return res.status(404).json({ success: false, message: 'GPS journey not found' });
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

    // Automatically check off the matching project completion criteria in the active checkpoint
    const activeCpIndex = gps.checkpoints.findIndex(c => !c.completed);
    if (activeCpIndex !== -1) {
      const activeCheckpoint = gps.checkpoints[activeCpIndex];
      // Mark project criteria completed
      const projCriteria = activeCheckpoint.completionCriteria.find(c => c.type === 'project');
      if (projCriteria && !projCriteria.completed) {
        projCriteria.completed = true;
      }

      // Check if checkpoint is completed
      const allCriteriaDone = activeCheckpoint.completionCriteria.every(c => c.completed);
      if (allCriteriaDone) {
        activeCheckpoint.completed = true;
        gps.xp += activeCheckpoint.xpReward || 250;
      }
    }

    // Check level-up
    let newLevel = 1;
    while (gps.xp >= 100 * Math.pow(newLevel, 2)) {
      newLevel++;
    }
    gps.currentLevel = newLevel;

    // Recalculate progress percentage
    const totalTasksCount = gps.checkpoints.reduce((sum, c) => sum + c.completionCriteria.length, 0);
    const completedTasksCount = gps.checkpoints.reduce((sum, c) => sum + c.completionCriteria.filter(t => t.completed).length, 0);
    gps.progress = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

    // Find current checkpoint (first incomplete checkpoint)
    const nextIncomplete = gps.checkpoints.find(c => !c.completed);
    gps.currentCheckpoint = nextIncomplete ? nextIncomplete.title : 'Destination Reached!';

    if (!gps.badges.some(b => b.name === 'First Project')) {
      gps.badges.push({ name: 'First Project', unlockedAt: new Date() });
    }

    await gps.save();
    res.status(200).json({ success: true, data: gps });
  } catch (err) {
    console.error('GPS Submit Project Error:', err);
    res.status(500).json({ success: false, message: 'Failed to submit project: ' + err.message });
  }
};

module.exports = {
  generateRoute,
  getCurrentGPS,
  updateTaskProgress,
  submitProject
};
