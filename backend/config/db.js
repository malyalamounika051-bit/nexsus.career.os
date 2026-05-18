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
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    // Don't crash the server — API calls will fail gracefully
  }
};

module.exports = connectDB;
