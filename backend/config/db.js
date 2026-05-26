const mongoose = require('mongoose');
const dns = require('dns');

// Force Google DNS — system resolver blocks SRV queries (ECONNREFUSED on Windows)
dns.setServers(['8.8.8.8', '8.8.4.4']);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 20000,
      tls: true,
      tlsAllowInvalidCertificates: true,
      tlsAllowInvalidHostnames: true,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // One-time cleanup: drop the stale legacy index that causes E11000 on roadmap saves.
    // This runs silently on every startup and is a no-op once the index is gone.
    try {
      await conn.connection.db.collection('careers').dropIndex('userId_1_domain_1_isGeneratedRoadmap_1');
      console.log('🗑️  Dropped stale careers index: userId_1_domain_1_isGeneratedRoadmap_1');
    } catch (idxErr) {
      // IndexNotFound (27) means it's already been dropped — that's fine
      if (idxErr.codeName !== 'IndexNotFound' && idxErr.code !== 27) {
        console.warn('⚠️  Could not drop stale index (non-critical):', idxErr.message);
      }
    }
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    // Don't crash the server — API calls will fail gracefully
  }
};

module.exports = connectDB;
