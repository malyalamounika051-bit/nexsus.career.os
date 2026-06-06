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

    const checkpoints = roadmap.roadmap.map((phase, idx) => ({
      level: idx + 1,
      title: phase.phase,
      description: phase.skills && phase.skills.length > 0 ? `Master ${phase.skills.slice(0, 3).join(', ')}` : `Learn essentials of ${phase.phase}`,
      completed: false,
      rewardXP: 250,
      tasks: (phase.topics && phase.topics.length > 0 ? phase.topics : phase.skills || []).map(topic => ({
        title: topic,
        completed: false
      }))
    }));

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

// @desc    Mark task complete/incomplete and award XP
// @route   PATCH /api/gps/task
// @access  Private
const updateTaskProgress = async (req, res) => {
  try {
    const userId = String(req.user?.uid || req.user?._id || req.user?.id);
    const { checkpointLevel, taskTitle, completed } = req.body;

    if (checkpointLevel == null || !taskTitle) {
      return res.status(400).json({ success: false, message: 'Checkpoint level and task title are required.' });
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

    // Find task
    const task = checkpoint.tasks.find(t => t.title === taskTitle);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const wasCompleted = task.completed;
    task.completed = Boolean(completed);

    let xpEarned = 0;
    if (task.completed && !wasCompleted) {
      xpEarned += 50; // +50 XP per task
    } else if (!task.completed && wasCompleted) {
      xpEarned -= 50;
    }

    // Check if checkpoint is completed
    const allTasksDone = checkpoint.tasks.every(t => t.completed);
    const checkpointWasCompleted = checkpoint.completed;
    checkpoint.completed = allTasksDone;

    if (checkpoint.completed && !checkpointWasCompleted) {
      xpEarned += checkpoint.rewardXP || 250; // +250 XP per checkpoint completion
    } else if (!checkpoint.completed && checkpointWasCompleted) {
      xpEarned -= checkpoint.rewardXP || 250;
    }

    gps.xp = Math.max(0, gps.xp + xpEarned);

    // Leveling system: level = floor(sqrt(xp / 100)) + 1
    let newLevel = 1;
    while (gps.xp >= 100 * Math.pow(newLevel, 2)) {
      newLevel++;
    }
    gps.currentLevel = newLevel;

    // Recalculate progress percentage
    const totalTasksCount = gps.checkpoints.reduce((sum, c) => sum + c.tasks.length, 0);
    const completedTasksCount = gps.checkpoints.reduce((sum, c) => sum + c.tasks.filter(t => t.completed).length, 0);
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

    // Check level-up
    let newLevel = 1;
    while (gps.xp >= 100 * Math.pow(newLevel, 2)) {
      newLevel++;
    }
    gps.currentLevel = newLevel;

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
