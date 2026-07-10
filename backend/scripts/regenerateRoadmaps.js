/**
 * Full Database Reset and Roadmap Regeneration Script
 * 
 * 1. Wipes all existing documents in the Career collection (with isGeneratedRoadmap: true).
 * 2. Loops through the supported career domains.
 * 3. Calls the new AI Career Roadmap 3.0 generation logic for each.
 * 4. Checks and binds verified resources dynamically.
 * 5. Saves only validated resources and outputs a detailed summary.
 */

const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const Career = require('../models/Career');
const { getVerifiedResourcesForTopics } = require('../services/resourceRecommendationService');
const { callAI } = require('../utils/geminiClient');
const { parseStructuredJson } = require('../utils/jsonParser');

// Supported careers to regenerate
const SUPPORTED_CAREERS = [
  'Software Engineer',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Mobile App Developer',
  'Data Analyst',
  'Data Scientist',
  'AI/ML Engineer',
  'DevOps Engineer',
  'Cybersecurity Analyst',
  'Project Manager',
  'Product Manager',
  'Business Analyst',
  'Operations Manager',
  'Human Resources (HR) Executive',
  'Digital Marketing Specialist',
  'SEO Specialist',
  'Social Media Manager',
  'Sales Executive',
  'Customer Success Manager',
  'Accountant',
  'Financial Analyst',
  'Investment Analyst',
  'UI/UX Designer',
  'Graphic Designer',
  'Content Writer',
  'Customer Support Executive',
  'Administrative Assistant',
  'Mechanical Engineer',
  'Electrical Engineer'
];

async function generateRoadmapForCareer(careerName) {
  const query = careerName;
  const structuredPrompt = `You are an expert career counselor. Create a personalized career roadmap for: "${query}"
Student Profile:
- Skill Level: Beginner
- Target Role: ${query}
- Experience: 0 years
- Weekly Study Hours: 15
- Learning Style: Mixed
- Country: India
- Degree: Not specified

Return ONLY valid JSON. First character must be "{".

JSON structure:
{
  "domain": "${query}",
  "description": "Comprehensive career roadmap description",
  "skills": ["skill1", "skill2"],
  "demandScore": 85,
  "futureScore": 90,
  "avgSalary": "₹8-15 LPA",
  "growthRate": "20% YoY",
  "demand": "High",
  "trendingSkills": ["trending1"],
  "salaryRange": { "min": "₹6 LPA", "max": "₹35 LPA", "currency": "INR" },
  "alternativePaths": ["Related Career 1"],
  "studyStrategy": "Actionable strategy based on the profile.",
  "roadmap": [
    {
      "phase": "Phase 1: Foundation",
      "description": "Foundational milestone",
      "duration": "4 weeks",
      "difficulty": "beginner",
      "skills": ["skillA"],
      "topics": ["topicA"],
      "tools": ["toolA"],
      "certifications": ["certA"],
      "practiceTasks": ["taskA"],
      "projects": ["projA"],
      "learningObjectives": ["objectiveA"],
      "portfolioGoal": "goalA",
      "certificationRecommendation": "recA",
      "resumeUpdate": "updateA",
      "githubTarget": "gitA",
      "interviewReadiness": "readyA",
      "expectedOutcome": "outcomeA",
      "miniProject": "miniA",
      "majorProject": "majorA"
    }
  ]
}

REQUIREMENTS:
- Generate EXACTLY 7 phases named: "Phase 1: Foundation", "Phase 2: Core Skills", "Phase 3: Intermediate Development", "Phase 4: Advanced Concepts", "Phase 5: Real World Projects", "Phase 6: Interview & Career Preparation", "Phase 7: Job Ready / Industry Ready"
- Do NOT generate resources, URLs, links, course names, or platform references. Only generate the learning path structure.
`;

  try {
    const aiResponse = await callAI({
      messages: [{ role: 'user', content: structuredPrompt }],
      temperature: 0.2
    });

    const parsed = parseStructuredJson(aiResponse.text);
    if (!parsed || !parsed.roadmap || parsed.roadmap.length === 0) {
      throw new Error('Invalid JSON structure returned from LLM');
    }

    // Bind verified resources for each phase and normalize difficulty
    for (const phase of parsed.roadmap) {
      // Normalize difficulty to valid schema enums
      let diff = String(phase.difficulty || 'beginner').toLowerCase().trim();
      if (diff === 'expert' || diff === 'advanced' || diff === 'hard') {
        phase.difficulty = 'advanced';
      } else if (diff === 'medium' || diff === 'intermediate') {
        phase.difficulty = 'intermediate';
      } else {
        phase.difficulty = 'beginner';
      }
      
      phase.resources = await getVerifiedResourcesForTopics(phase.topics || []);
    }

    return parsed;
  } catch (err) {
    console.error(`Error generating roadmap for "${careerName}":`, err.message);
    return null;
  }
}

async function executeMigration() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('❌ MONGO_URI is missing.');
    return { success: false, message: 'MONGO_URI is missing' };
  }

  // Deletion Phase
  console.log('🧹 Wiping existing generated roadmaps from the database...');
  const deleteResult = await Career.deleteMany({ isGeneratedRoadmap: true });
  console.log(`🗑️ Deleted ${deleteResult.deletedCount} legacy roadmaps.`);

  let generatedCount = 0;
  let totalVerifiedResources = 0;

  for (const career of SUPPORTED_CAREERS) {
    console.log(`🚀 Regenerating: "${career}"...`);
    const data = await generateRoadmapForCareer(career);
    if (data) {
      const doc = new Career({
        ...data,
        isGeneratedRoadmap: true,
        userUid: 'SYSTEM_GEN',
        experienceLevel: 'Beginner',
        availableWeeklyHours: 15,
        learningStyle: 'Mixed',
        country: 'India',
        preferredLanguage: 'English'
      });
      await doc.save();
      generatedCount++;

      // Count resources
      for (const phase of data.roadmap) {
        totalVerifiedResources += phase.resources.length;
      }
      console.log(`   ✨ Saved "${career}" with ${data.roadmap.length} phases.`);
    }
  }

  return {
    deletedCount: deleteResult.deletedCount,
    generatedCount,
    totalVerifiedResources
  };
}

// Allow running via backend server process directly or CLI if DNS allows
if (require.main === module) {
  console.log('🔌 Connecting to database...');
  mongoose.connect(process.env.MONGO_URI)
    .then(() => executeMigration())
    .then(summary => {
      console.log('\n═══════════════════════════════════════');
      console.log('📊 REGENERATION SUMMARY');
      console.log('═══════════════════════════════════════');
      console.log(`Deleted Roadmaps:   ${summary.deletedCount}`);
      console.log(`Generated Roadmaps: ${summary.generatedCount}`);
      console.log(`Verified Resources: ${summary.totalVerifiedResources}`);
      console.log('═══════════════════════════════════════');
      process.exit(0);
    })
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { executeMigration };
