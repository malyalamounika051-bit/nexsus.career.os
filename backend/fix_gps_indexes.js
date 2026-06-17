process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
require('dotenv').config({ path: './backend/.env' });
const mongoose = require('mongoose');
const dns = require('dns');

dns.setServers(['8.8.8.8', '8.8.4.4']);

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const careergpsCol = collections.find(c => c.name.includes('careergps'));
    
    if (!careergpsCol) {
      console.log('❌ Could not find careergpss collection.');
      await mongoose.disconnect();
      return;
    }
    
    const col = db.collection(careergpsCol.name);
    console.log(`Using collection: ${careergpsCol.name}`);

    // List all current indexes
    const indexes = await col.indexes();
    console.log('\n📋 Current indexes:');
    indexes.forEach(i => console.log(' -', i.name, JSON.stringify(i.key)));

    // Drop the unique userId_1 index
    try {
      await col.dropIndex('userId_1');
      console.log(`\n🗑️  Dropped index: userId_1`);
    } catch (e) {
      if (e.codeName === 'IndexNotFound') {
        console.log(`ℹ️  Index already removed: userId_1`);
      } else {
        console.error(`❌ Could not drop userId_1:`, e.message);
      }
    }

    // List remaining indexes
    const remaining = await col.indexes();
    console.log('\n✅ Remaining indexes:');
    remaining.forEach(i => console.log(' -', i.name, JSON.stringify(i.key)));

    await mongoose.disconnect();
    console.log('\n✅ Done!');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
