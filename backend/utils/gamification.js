const User = require('../models/User');

// XP awards for different actions
const XP_AWARDS = {
  DAILY_LOGIN: 10,
  ASSESSMENT_COMPLETED: 50,
  ROADMAP_GENERATED: 30,
  MENTOR_CHAT: 5,
  SKILL_GAP_ANALYSIS: 40,
  CAREER_SIMULATION: 20,
};

// Badge definitions
const BADGE_DEFS = {
  FIRST_ASSESSMENT: { name: 'First Steps', icon: '🎯' },
  FIVE_ASSESSMENTS: { name: 'Career Explorer', icon: '🧭' },
  ROADMAP_MASTER: { name: 'Roadmap Master', icon: '🗺️' },
  SEVEN_DAY_STREAK: { name: 'On Fire', icon: '🔥' },
  THIRTY_DAY_STREAK: { name: 'Unstoppable', icon: '⚡' },
  XP_100: { name: 'Rising Star', icon: '⭐' },
  XP_500: { name: 'Career Pro', icon: '🏆' },
  XP_1000: { name: 'Nexus Legend', icon: '👑' },
  MENTOR_FAN: { name: 'Wisdom Seeker', icon: '🧠' },
  SKILL_ANALYST: { name: 'Skill Analyst', icon: '🔍' },
};

/**
 * Award XP and check for new badges
 * @param {string} userId 
 * @param {string} action - key from XP_AWARDS
 * @returns {Object} { xp, level, newBadges }
 */
const awardXP = async (userId, action) => {
  try {
    const xpAmount = XP_AWARDS[action] || 0;
    if (!xpAmount) return null;

    const user = await User.findById(userId);
    if (!user) return null;

    user.xp = (user.xp || 0) + xpAmount;
    user.level = Math.floor(user.xp / 200) + 1;

    // Check for new badges
    const newBadges = [];
    const existingBadgeNames = (user.badges || []).map(b => b.name);

    const checkBadge = (key) => {
      const badge = BADGE_DEFS[key];
      if (!existingBadgeNames.includes(badge.name)) {
        newBadges.push(badge);
        user.badges.push({ name: badge.name, icon: badge.icon });
      }
    };

    // XP milestones
    if (user.xp >= 100) checkBadge('XP_100');
    if (user.xp >= 500) checkBadge('XP_500');
    if (user.xp >= 1000) checkBadge('XP_1000');

    // Action-based badges
    if (action === 'ASSESSMENT_COMPLETED') {
      const assessmentCount = user.assessmentCount || 0;
      if (assessmentCount <= 1) checkBadge('FIRST_ASSESSMENT');
      if (assessmentCount >= 5) checkBadge('FIVE_ASSESSMENTS');
    }

    if (action === 'ROADMAP_GENERATED') checkBadge('ROADMAP_MASTER');
    if (action === 'SKILL_GAP_ANALYSIS') checkBadge('SKILL_ANALYST');

    // Streak badges
    if ((user.streak || 0) >= 7) checkBadge('SEVEN_DAY_STREAK');
    if ((user.streak || 0) >= 30) checkBadge('THIRTY_DAY_STREAK');

    await user.save();

    return {
      xp: user.xp,
      level: user.level,
      newBadges,
    };
  } catch (err) {
    console.error('Gamification Error:', err.message);
    return null;
  }
};

/**
 * Update login streak
 * @param {string} userId
 */
const updateStreak = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    const now = new Date();
    const lastActive = user.lastActiveDate ? new Date(user.lastActiveDate) : null;

    if (lastActive) {
      const diffDays = Math.floor((now - lastActive) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        user.streak = (user.streak || 0) + 1;
      } else if (diffDays > 1) {
        user.streak = 1; // Reset streak
      }
      // Same day = no change
    } else {
      user.streak = 1;
    }

    user.lastActiveDate = now;

    // Award daily login XP
    const lastLoginDate = lastActive ? lastActive.toDateString() : '';
    if (lastLoginDate !== now.toDateString()) {
      user.xp = (user.xp || 0) + XP_AWARDS.DAILY_LOGIN;
      user.level = Math.floor(user.xp / 200) + 1;
    }

    await user.save();
  } catch (err) {
    console.error('Streak Update Error:', err.message);
  }
};

module.exports = { awardXP, updateStreak, XP_AWARDS, BADGE_DEFS };
