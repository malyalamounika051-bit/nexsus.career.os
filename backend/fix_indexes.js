/**
 * One-time script: drop the stale userId_1_domain_1_isGeneratedRoadmap_1 index
 * that causes E11000 duplicate key errors when saving roadmaps.
 * Run: node fix_indexes.js  (from the backend/ directory)
 */
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
require('dotenv').config();
const mongoose = require('mongoose');
const dns = require('dns');

// Force Google DNS — system resolver blocks SRV queries (ECONNREFUSED on Windows)
dns.setServers(['8.8.8.8', '8.8.4.4']);

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const col = db.collection('careers');

    // List all current indexes
    const indexes = await col.indexes();
    console.log('\n📋 Current indexes:');
    indexes.forEach(i => console.log(' -', i.name, JSON.stringify(i.key)));

    // Drop the broken legacy index (if it still exists)
    const broken = ['userId_1_domain_1_isGeneratedRoadmap_1'];
    for (const idx of broken) {
      try {
        await col.dropIndex(idx);
        console.log(`\n🗑️  Dropped index: ${idx}`);
      } catch (e) {
        if (e.codeName === 'IndexNotFound') {
          console.log(`ℹ️  Index already removed: ${idx}`);
        } else {
          console.error(`❌ Could not drop ${idx}:`, e.message);
        }
      }
    }

    // List remaining indexes
    const remaining = await col.indexes();
    console.log('\n✅ Remaining indexes:');
    remaining.forEach(i => console.log(' -', i.name, JSON.stringify(i.key)));

    await mongoose.disconnect();
    console.log('\n✅ Done — backend will auto-restart.');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
