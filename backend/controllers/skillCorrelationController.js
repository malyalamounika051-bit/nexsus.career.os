const Career = require('../models/Career');

// Helper to parse salary string (e.g. "₹6-12 LPA", "₹12-25 LPA") to average LPA number
const parseAvgLpa = (salaryStr) => {
  if (!salaryStr) return 6.0;
  // Extract numbers
  const matches = salaryStr.match(/(\d+[\.\d]*)/g);
  if (matches && matches.length >= 2) {
    const min = parseFloat(matches[0]);
    const max = parseFloat(matches[1]);
    return (min + max) / 2;
  } else if (matches && matches.length === 1) {
    return parseFloat(matches[0]);
  }
  return 6.0;
};

// @desc   Get skill trend correlations (Data Science co-occurrence analysis)
// @route  GET /api/careers/skill-correlation
// @access Private
const getSkillCorrelation = async (req, res) => {
  try {
    const careers = await Career.find({});
    
    // 1. Gather all skills and clean them
    // Map to keep track of case-normalization (e.g. "react.js" and "React" mapped to unified name)
    const rawSkillsList = [];
    const skillToNormalized = new Map();
    const normalizedToDisplay = new Map();

    careers.forEach(career => {
      // Collect skills from main skills array
      const domainSkills = career.skills || [];
      // Also collect skills from roadmap phases
      const phaseSkills = [];
      if (career.roadmap && Array.isArray(career.roadmap)) {
        career.roadmap.forEach(phase => {
          if (phase.skills && Array.isArray(phase.skills)) {
            phaseSkills.push(...phase.skills);
          }
        });
      }
      
      const allCareerSkills = [...new Set([...domainSkills, ...phaseSkills])];
      rawSkillsList.push({
        domain: career.domain,
        avgSalaryLpa: parseAvgLpa(career.avgSalary),
        demandScore: career.demandScore || 70,
        skills: allCareerSkills.map(s => {
          const trimmed = s.trim();
          const lower = trimmed.toLowerCase();
          skillToNormalized.set(trimmed, lower);
          if (!normalizedToDisplay.has(lower) || trimmed.length < normalizedToDisplay.get(lower).length) {
            // Keep the best display casing (often shorter or PascalCased)
            normalizedToDisplay.set(lower, trimmed);
          }
          return lower;
        }).filter(Boolean)
      });
    });

    // 2. Count individual skill frequencies
    const skillCounts = new Map();
    rawSkillsList.forEach(item => {
      item.skills.forEach(skill => {
        skillCounts.set(skill, (skillCounts.get(skill) || 0) + 1);
      });
    });

    // Get all unique display skills, sorted alphabetically
    const allUniqueSkills = Array.from(normalizedToDisplay.entries())
      .map(([lower, display]) => ({ id: lower, name: display, count: skillCounts.get(lower) }))
      .sort((a, b) => b.count - a.count); // sort by popularity

    const selectedSkillQuery = req.query.skill;

    if (!selectedSkillQuery) {
      // Just return list of unique skills for search autocomplete
      return res.json({
        success: true,
        skills: allUniqueSkills
      });
    }

    const targetSkillLower = selectedSkillQuery.trim().toLowerCase();
    
    if (!skillCounts.has(targetSkillLower)) {
      return res.status(404).json({
        success: false,
        message: `Skill "${selectedSkillQuery}" not found in current dataset.`
      });
    }

    const targetCount = skillCounts.get(targetSkillLower);
    const coOccurrences = new Map();
    const matchingCareers = [];
    let totalSalaryLpa = 0;
    let totalDemandScore = 0;

    rawSkillsList.forEach(item => {
      if (item.skills.includes(targetSkillLower)) {
        matchingCareers.push({
          domain: item.domain,
          avgSalaryLpa: item.avgSalaryLpa,
          demandScore: item.demandScore
        });
        totalSalaryLpa += item.avgSalaryLpa;
        totalDemandScore += item.demandScore;

        // Calculate co-occurrences of other skills in the same career path
        item.skills.forEach(otherSkill => {
          if (otherSkill !== targetSkillLower) {
            coOccurrences.set(otherSkill, (coOccurrences.get(otherSkill) || 0) + 1);
          }
        });
      }
    });

    const avgSalaryLpa = matchingCareers.length > 0 ? (totalSalaryLpa / matchingCareers.length) : 6.0;
    const avgDemandScore = matchingCareers.length > 0 ? Math.round(totalDemandScore / matchingCareers.length) : 70;

    // Convert co-occurrences to conditional probabilities: P(OtherSkill | TargetSkill)
    const correlationList = Array.from(coOccurrences.entries()).map(([otherSkill, coCount]) => {
      const probability = parseFloat((coCount / targetCount).toFixed(3)); // P(otherSkill | targetSkill)
      return {
        skill: normalizedToDisplay.get(otherSkill) || otherSkill,
        id: otherSkill,
        coCount,
        probability: Math.round(probability * 100), // convert to percentage
      };
    })
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 10); // get top 10 associations

    res.json({
      success: true,
      data: {
        skill: normalizedToDisplay.get(targetSkillLower) || targetSkillLower,
        count: targetCount,
        avgSalaryLpa: parseFloat(avgSalaryLpa.toFixed(1)),
        avgDemandScore,
        matchingCareers: matchingCareers.slice(0, 5),
        correlations: correlationList
      }
    });

  } catch (error) {
    console.error('Skill Correlation Error:', error);
    res.status(500).json({ success: false, message: 'Server error calculating skill trends.' });
  }
};

module.exports = {
  getSkillCorrelation
};
