/**
 * 🚀 Pre-Cache Roadmaps Script
 * 
 * This script runs through a list of popular careers and generates AI roadmaps for them,
 * saving them directly to MongoDB Atlas. This pre-caches them globally for all users,
 * ensuring instant load times and saving your API key quota when you go live!
 */

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
require('dotenv').config();
const mongoose = require('mongoose');
const dns = require('dns');

// Force Google DNS — system resolver blocks SRV queries on Windows
dns.setServers(['8.8.8.8', '8.8.4.4']);

const Career = require('./models/Career');
const { generateRoadmap } = require('./controllers/careerController');

// Popular careers to pre-cache
// Popular, general tech and business careers to pre-cache
const CAREERS_TO_PRE_CACHE = [
  // core tech & software
  'Software Engineer',
  'Full Stack Developer',
  'Frontend Developer',
  'Backend Developer',
  'Mobile App Developer',
  'AI Engineer',
  'Machine Learning Engineer',
  'Data Scientist',
  'Data Analyst',
  'DevOps Engineer',
  'Cloud Architect',
  'Python Backend Developer',
  'QA Automation Engineer',
  'Game Developer',
  'Blockchain Developer',
  'Embedded Systems Engineer',
  
  // cybersecurity & IT operations
  'Cybersecurity Analyst',
  'Ethical Hacker',
  'Network Engineer',
  'Systems Administrator',
  'IT Support Specialist',
  
  // business & product management
  'Product Manager',
  'Business Analyst',
  'Financial Analyst',
  'Investment Banker',
  'Human Resources Specialist',
  
  // creative & marketing
  'UI/UX Designer',
  'Graphic Designer',
  'Digital Marketing Specialist',
  'Social Media Manager',
  'Video Editor',
  'Content Writer',
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runSeeder() {
  try {
    console.log('🔌 Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected!');

    const systemUserUid = "system_seeder_2026";

    for (let i = 0; i < CAREERS_TO_PRE_CACHE.length; i++) {
      const careerName = CAREERS_TO_PRE_CACHE[i];
      console.log(`\n--------------------------------------------------`);
      console.log(`[${i + 1}/${CAREERS_TO_PRE_CACHE.length}] Checking global cache for: "${careerName}"`);

      // Check if it already exists globally
      const existing = await Career.findOne({
        domain: { $regex: new RegExp(`^${careerName}$`, 'i') },
        isGeneratedRoadmap: true,
      });

      if (existing) {
        const hasProjects = existing.roadmap?.some(p => p.projects && p.projects.length > 0);
        const hasEnoughPhases = existing.roadmap?.length >= 7;
        if (hasProjects && hasEnoughPhases) {
          console.log(`✨ "${careerName}" is already cached and high-quality! Skipping.`);
          continue;
        }
      }

      console.log(`🤖 Caching missing. Generating roadmap for "${careerName}" via AI...`);
      
      // Mock Express Request and Response
      const req = {
        body: { query: careerName },
        user: { uid: systemUserUid, email: 'seeder@nexus.com' }
      };

      let success = false;
      const res = {
        status: function(code) {
          console.log(`⚠️ HTTP Status: ${code}`);
          return this;
        },
        json: function(data) {
          if (data.success) {
            console.log(`✅ Success! "${careerName}" roadmap generated and saved globally.`);
            success = true;
          } else {
            console.error(`❌ Error generating "${careerName}":`, data.message);
          }
        }
      };

      const start = Date.now();
      await generateRoadmap(req, res);
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      console.log(`⏱️ Operation completed in ${elapsed}s`);

      // Add a cooling-off period of 25 seconds to protect your API key from hitting Rate Limits (RPM/TPM)
      if (i < CAREERS_TO_PRE_CACHE.length - 1) {
        const cooldown = 25;
        console.log(`⏳ Cooling down for ${cooldown} seconds to prevent API rate-limiting...`);
        await sleep(cooldown * 1000);
      }
    }

    console.log(`\n🎉 Pre-caching run completed successfully!`);
  } catch (error) {
    console.error('Seeder encountered a fatal error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB.');
    process.exit(0);
  }
}

runSeeder();
