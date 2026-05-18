const mongoose = require('mongoose');
const dns = require('dns');
require('dotenv').config();

// Force Google DNS — system resolver blocks SRV queries (ECONNREFUSED on Windows)
dns.setServers(['8.8.8.8', '8.8.4.4']);

async function run() {
  try {
    console.log('Connecting to DB:', process.env.MONGO_URI);
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 20000,
      tls: true,
      tlsAllowInvalidCertificates: true,
      tlsAllowInvalidHostnames: true,
    });
    console.log('✅ Connected successfully to', mongoose.connection.host);

    const collection = mongoose.connection.db.collection('careers');
    
    console.log('\nFetching current indexes on "careers" collection:');
    const indexes = await collection.indexes();
    console.log(JSON.stringify(indexes, null, 2));
    
    // Look for ANY unique index that includes ONLY domain, or is global
    for (const index of indexes) {
      const keys = Object.keys(index.key || {});
      const isDomainOnly = keys.length === 1 && keys[0] === 'domain';
      
      if (index.unique && isDomainOnly) {
        console.log(`⚠️ Found blocking UNIQUE index on "domain" only: "${index.name}". Dropping it...`);
        try {
          await collection.dropIndex(index.name);
          console.log(`✅ Successfully dropped index "${index.name}"!`);
        } catch (dropErr) {
          console.error(`❌ Failed to drop index:`, dropErr.message);
        }
      }
    }

    console.log('\nRe-verifying indexes...');
    const finalIndexes = await collection.indexes();
    console.log('Final indexes count:', finalIndexes.length);

    console.log('\nDone!');
    process.exit(0);
  } catch (err) {
    console.error('❌ ERROR:', err);
    process.exit(1);
  }
}
run();
