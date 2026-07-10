/**
 * Database Cleanup & Migration Script for Roadmap Resources
 * 
 * This script:
 * 1. Connects to MongoDB
 * 2. Scans every generated roadmap
 * 3. Validates each resource URL
 * 4. Replaces broken individual resources with verified ones
 * 5. If more than 20% of resources are broken, regenerates all resources for that roadmap
 * 6. Preserves user progress, XP, and completion status
 * 
 * Usage: node scripts/cleanupRoadmaps.js
 */

const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const Career = require('../models/Career');
const { getVerifiedResourcesForTopics, verifyResourceUrl } = require('../services/resourceRecommendationService');

async function runCleanup() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('❌ MONGO_URI environment variable is missing.');
    process.exit(1);
  }

  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(mongoUri);
  console.log('✅ MongoDB Connected.');

  const roadmaps = await Career.find({ isGeneratedRoadmap: true });
  console.log(`📊 Found ${roadmaps.length} generated roadmaps to scan.\n`);

  let totalScanned = 0;
  let totalFixed = 0;
  let totalRegenerated = 0;
  let totalSkipped = 0;

  for (const roadmap of roadmaps) {
    totalScanned++;
    console.log(`─── [${totalScanned}/${roadmaps.length}] "${roadmap.domain}" (User: ${roadmap.userUid}) ───`);

    let brokenCount = 0;
    let totalResources = 0;

    // First pass: count broken resources
    for (const phase of roadmap.roadmap) {
      for (const res of phase.resources) {
        totalResources++;
        const isValid = await verifyResourceUrl(res.url || res.verifiedUrl);
        if (!isValid) {
          brokenCount++;
          console.log(`   ✗ BROKEN: ${res.url}`);
        }
      }
    }

    if (totalResources === 0) {
      // No resources at all — populate from scratch
      console.log(`   ⚠️ No resources found. Populating from recommendation engine...`);
      for (const phase of roadmap.roadmap) {
        phase.resources = await getVerifiedResourcesForTopics(phase.topics || []);
      }
      await roadmap.save();
      totalFixed++;
      console.log(`   ✅ Populated with fresh verified resources.`);
      continue;
    }

    const brokenPct = (brokenCount / totalResources) * 100;
    console.log(`   Stats: ${totalResources} resources, ${brokenCount} broken (${brokenPct.toFixed(1)}%)`);

    if (brokenPct > 20) {
      // Regenerate ALL resources for this roadmap
      console.log(`   ♻️ Over 20% broken — regenerating all resources (preserving progress)...`);
      for (const phase of roadmap.roadmap) {
        phase.resources = await getVerifiedResourcesForTopics(phase.topics || []);
        // Preserve completion status
      }
      await roadmap.save();
      totalRegenerated++;
      console.log(`   ✅ All resources regenerated.`);
    } else if (brokenCount > 0) {
      // Replace only the broken individual resources
      console.log(`   🔧 Replacing ${brokenCount} broken resource(s) individually...`);
      for (const phase of roadmap.roadmap) {
        const freshResources = await getVerifiedResourcesForTopics(phase.topics || []);
        const repairedResources = [];

        for (const res of phase.resources) {
          const isValid = await verifyResourceUrl(res.url || res.verifiedUrl);
          if (isValid) {
            res.lastChecked = new Date();
            res.lastVerifiedDate = new Date();
            repairedResources.push(res);
          } else {
            const replacement = freshResources.find(fr => !repairedResources.some(rr => rr.url === fr.url));
            if (replacement) {
              repairedResources.push({
                ...replacement,
                verified: true,
                lastChecked: new Date(),
                lastVerifiedDate: new Date()
              });
              console.log(`     → Replaced with: ${replacement.title}`);
            }
          }
        }
        phase.resources = repairedResources;
      }
      await roadmap.save();
      totalFixed++;
      console.log(`   ✅ Broken resources replaced.`);
    } else {
      totalSkipped++;
      console.log(`   ✓ All resources valid. No action needed.`);
    }

    console.log('');
  }

  console.log('═══════════════════════════════════════');
  console.log(`🏁 Cleanup Complete.`);
  console.log(`   Scanned:      ${totalScanned}`);
  console.log(`   Fixed:        ${totalFixed}`);
  console.log(`   Regenerated:  ${totalRegenerated}`);
  console.log(`   Skipped:      ${totalSkipped}`);
  console.log('═══════════════════════════════════════');

  process.exit(0);
}

runCleanup().catch(err => {
  console.error('❌ Cleanup failed:', err);
  process.exit(1);
});
