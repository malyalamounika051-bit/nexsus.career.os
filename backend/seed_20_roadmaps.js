process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
require('dotenv').config({ path: './backend/.env' });
const mongoose = require('mongoose');
const dns = require('dns');

// Force Google DNS — system resolver blocks SRV queries on Windows
dns.setServers(['8.8.8.8', '8.8.4.4']);

const Career = require('./models/Career');
const { generateRoadmap } = require('./controllers/careerController');

const POPULAR_20_CAREERS = [
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
  'Cybersecurity Analyst',
  'Ethical Hacker',
  'Product Manager',
  'Business Analyst',
  'UI/UX Designer',
  'QA Automation Engineer',
  'Game Developer',
  'Digital Marketing Specialist',
  'Systems Administrator'
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function seed() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected!');

    const systemUserUid = "system_seeder_2026";

    for (let i = 0; i < POPULAR_20_CAREERS.length; i++) {
      const careerName = POPULAR_20_CAREERS[i];
      console.log(`\n[${i + 1}/${POPULAR_20_CAREERS.length}] Checking: "${careerName}"`);

      // Check if already cached
      const existing = await Career.findOne({
        domain: { $regex: new RegExp(`^${careerName}$`, 'i') },
        isGeneratedRoadmap: true
      });

      if (existing) {
        const hasProjects = existing.roadmap?.some(p => p.projects && p.projects.length > 0);
        const hasEnoughPhases = existing.roadmap?.length >= 7;
        if (hasProjects && hasEnoughPhases) {
          console.log(`✨ "${careerName}" already cached. Skipping.`);
          continue;
        }
      }

      console.log(`🤖 Requesting AI generation for: "${careerName}"...`);
      
      const req = {
        body: { query: careerName },
        user: { uid: systemUserUid, email: 'seeder@nexus.com' }
      };

      const res = {
        status: function(code) {
          return this;
        },
        json: function(data) {
          if (data.success) {
            console.log(`✅ Generated & cached "${careerName}"`);
          } else {
            console.error(`❌ Failed:`, data.message);
          }
        }
      };

      await generateRoadmap(req, res);

      // Sleep 5 seconds to stay safe from rate limits
      await sleep(5000);
    }

    console.log('\n🎉 Finished seeding 20 common roadmaps.');
  } catch (err) {
    console.error('Fatal seeding error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
