const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: './backend/.env' });

async function testFreshRoadmap() {
  console.log('🏁 Running Fresh Roadmap Integration Test...');

  // Create a valid auth token using JWT secret from .env
  const token = jwt.sign(
    { id: '69f7e54b6c3cdf4bbc42c059', email: 'demo@nexus.com' },
    process.env.JWT_SECRET || 'nexus_career_os_super_secret_jwt_key_2024',
    { expiresIn: '7d' }
  );

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const startTime = Date.now();
  console.log('Sending request for fresh career: "Quantum Computing Engineer"...');

  try {
    const res = await axios.post(
      'http://127.0.0.1:5000/api/careers/generate-roadmap',
      { query: 'Quantum Computing Engineer' },
      { headers, timeout: 180000 }
    );
    const latency = Date.now() - startTime;
    console.log(`\n✅ Success! Status: ${res.status} (${latency}ms)`);
    console.log(`Domain: "${res.data.data.domain}"`);
    console.log(`Phases: ${res.data.data.roadmap?.length || 0}`);
    console.log(`Cached: ${res.data.cached ? 'Yes' : 'No'}`);
  } catch (err) {
    const latency = Date.now() - startTime;
    console.error(`\n❌ Error after ${latency}ms!`);
    console.error(`Status: ${err.response?.status}`);
    console.error('Body:', JSON.stringify(err.response?.data, null, 2));
  }
}

testFreshRoadmap();
