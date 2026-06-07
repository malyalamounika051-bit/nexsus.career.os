/**
 * V3 Matching Engine for Opportunity Radar
 * Formula:
 * - 40% Skills (match overlap)
 * - 30% Career Goal (GPS destination alignment)
 * - 20% Projects (completed project context)
 * - 10% Experience / Difficulty Fit (difficulty alignment)
 */
const calculateOpportunityMatch = (opportunity, userSkills = [], gpsDestination = '', completedRoadmapsCount = 0) => {
  let score = 0;
  const whyRecommended = [];
  const missingSkills = [];

  // 1. Skills Matching (40%)
  const required = (opportunity.requiredSkills || []).map(s => s.toLowerCase().trim());
  const userNorm = (userSkills || []).map(s => s.toLowerCase().trim());
  
  let matchCount = 0;
  required.forEach(s => {
    const isMatched = userNorm.some(us => us.includes(s) || s.includes(us));
    if (isMatched) {
      matchCount++;
    } else {
      // Format back to capitalized
      missingSkills.push(s.charAt(0).toUpperCase() + s.slice(1));
    }
  });

  const skillScore = required.length > 0 ? (matchCount / required.length) * 40 : 30; // default 30 if no skills req
  score += skillScore;
  
  if (matchCount > 0) {
    const matchedNames = required.filter(s => userNorm.some(us => us.includes(s) || s.includes(us)))
      .slice(0, 2)
      .map(s => s.charAt(0).toUpperCase() + s.slice(1));
    whyRecommended.push(`Matches ${matchedNames.join(', ')} skills`);
  }

  // 2. Career Goal GPS Destination Alignment (30%)
  let goalScore = 15; // default fallback
  if (gpsDestination) {
    const dest = gpsDestination.toLowerCase().trim();
    const title = (opportunity.title || '').toLowerCase();
    const desc = (opportunity.description || '').toLowerCase();
    const tags = (opportunity.tags || []).map(t => t.toLowerCase());

    const isMatch = title.includes(dest) || desc.includes(dest) || tags.some(t => dest.includes(t) || t.includes(dest));
    if (isMatch) {
      goalScore = 30;
      whyRecommended.push(`Aligns with your ${gpsDestination} Goal`);
    } else {
      whyRecommended.push(`Broadens experience beyond ${gpsDestination}`);
    }
  } else {
    whyRecommended.push('Exploratory opportunity');
  }
  score += goalScore;

  // 3. Projects and Roadmap Alignment (20%)
  let projectScore = 10;
  if (completedRoadmapsCount > 0) {
    projectScore = 20;
    whyRecommended.push('Matches completed roadmap projects');
  } else {
    whyRecommended.push('Great starter project for resume portfolio');
  }
  score += projectScore;

  // 4. Experience & Difficulty Fit (10%)
  let expScore = 10;
  if (opportunity.difficulty) {
    whyRecommended.push(`Favorable ${opportunity.difficulty} difficulty`);
  } else {
    whyRecommended.push('Open to all levels');
  }
  score += expScore;

  // Cap matching score at 100, min at 40 for verified
  const matchScore = Math.max(40, Math.min(100, Math.round(score)));

  // Categorize
  let matchLabel = 'Moderate Match';
  if (matchScore >= 80) matchLabel = 'Excellent Match';
  else if (matchScore >= 60) matchLabel = 'Strong Match';

  return {
    matchScore,
    matchLabel,
    whyRecommended: Array.from(new Set(whyRecommended)).slice(0, 4),
    missingSkills: missingSkills.slice(0, 3)
  };
};

module.exports = { calculateOpportunityMatch };
