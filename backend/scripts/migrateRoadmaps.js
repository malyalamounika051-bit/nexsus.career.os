const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const Career = require('../models/Career');
const { getVerifiedResourcesForTopics } = require('../services/resourceRecommendationService');

async function runMigration() {
  const mongoUri = process.env.MONGO_URI || 'mongodb+srv://malyalamounika0:Nexus1234@cluster0.naruycx.mongodb.net/nexus_career_os?retryWrites=true&w=majority&appName=Cluster0';
  
  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(mongoUri);
  console.log('✅ MongoDB Connected successfully.');

  const roadmaps = await Career.find({ isGeneratedRoadmap: true });
  console.log(`📊 Found ${roadmaps.length} generated roadmaps in the database.`);

  let migratedCount = 0;

  for (const roadmap of roadmaps) {
    console.log(`⚙️ Processing: "${roadmap.domain}" (User: ${roadmap.userUid})`);
    
    let updated = false;
    for (const phase of roadmap.roadmap) {
      const hasLegacy = phase.resources.some(r => !r.verified || r.url.includes('google.com/search') || !r.provider);
      if (hasLegacy || phase.resources.length === 0) {
        console.log(`   └─ Phase "${phase.phase}" has legacy resources. Fetching fresh verified links...`);
        phase.resources = await getVerifiedResourcesForTopics(phase.topics || []);
        updated = true;
      }
    }

    if (updated) {
      await roadmap.save();
      migratedCount++;
      console.log(`   ✨ Saved updated resources for "${roadmap.domain}".`);
    } else {
      console.log(`   ✓ Already up to date.`);
    }
  }

  console.log(`🏁 Migration complete. Successfully upgraded ${migratedCount} roadmaps.`);
  process.exit(0);
}

runMigration().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
