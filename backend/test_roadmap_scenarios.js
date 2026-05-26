const jwt = require('jsonwebtoken');
const dns = require('dns');

// Force Google DNS — system resolver blocks SRV queries on Windows
dns.setServers(['8.8.8.8', '8.8.4.4']);

require('dotenv').config({ path: require('path').join(__dirname, '.env') });

async function runTests() {
  const token = jwt.sign(
    { id: '69f759eac5f172426fe8820e', email: 'malyalamounika0@gmail.com' },
    process.env.JWT_SECRET || 'fallbacksecret',
    { expiresIn: '1h' }
  );

  const authHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  console.log("=== Scenario 1: Without Auth Token (Should return 401) ===");
  try {
    const res = await fetch('http://localhost:5000/api/careers/generate-roadmap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'Frontend Engineer' })
    });
    const data = await res.json();
    console.log(`Status: ${res.status}`);
    console.log('Response:', data);
  } catch (err) {
    console.error('Error in Scenario 1:', err.message);
  }

  console.log("\n=== Scenario 2: Empty Query (Should return 400) ===");
  try {
    const res = await fetch('http://localhost:5000/api/careers/generate-roadmap', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ query: '' })
    });
    const data = await res.json();
    console.log(`Status: ${res.status}`);
    console.log('Response:', data);
  } catch (err) {
    console.error('Error in Scenario 2:', err.message);
  }

  const testCareer = 'DevOps Engineer ' + Math.floor(Math.random() * 10000);
  console.log(`\n=== Scenario 3: Generate New Roadmap for "${testCareer}" (Takes 30-60s) ===`);
  try {
    const start = Date.now();
    const res = await fetch('http://localhost:5000/api/careers/generate-roadmap', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ query: testCareer })
    });
    const data = await res.json();
    const duration = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`Status: ${res.status} (completed in ${duration}s)`);
    console.log(`Success: ${data.success}`);
    if (data.success) {
      console.log(`Domain: ${data.data?.domain}`);
      console.log(`Description: ${data.data?.description}`);
      console.log(`Phases generated: ${data.data?.roadmap?.length}`);
      console.log(`Cached: ${data.cached}`);
    } else {
      console.log('Response:', data);
    }
  } catch (err) {
    console.error('Error in Scenario 3:', err.message);
  }

  console.log(`\n=== Scenario 4: Get Cached Roadmap for "${testCareer}" (Should be near instant) ===`);
  try {
    const start = Date.now();
    const res = await fetch('http://localhost:5000/api/careers/generate-roadmap', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ query: testCareer })
    });
    const data = await res.json();
    const duration = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`Status: ${res.status} (completed in ${duration}s)`);
    console.log(`Success: ${data.success}`);
    if (data.success) {
      console.log(`Domain: ${data.data?.domain}`);
      console.log(`Cached: ${data.cached}`);
    } else {
      console.log('Response:', data);
    }
  } catch (err) {
    console.error('Error in Scenario 4:', err.message);
  }
}

runTests();
