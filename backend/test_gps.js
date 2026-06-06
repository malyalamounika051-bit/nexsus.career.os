const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

async function testGPS() {
  // Generate a local JWT token corresponding to a test user ID
  const token = jwt.sign({ id: '69f759eac5f172426fe8820e', email: 'malyalamounika0@gmail.com' }, process.env.JWT_SECRET || 'fallbacksecret', { expiresIn: '1h' });
  const headers = { Authorization: `Bearer ${token}` };

  console.log("--- 1. Testing GPS Route Generation ---");
  let generatedData = null;
  try {
    const res = await axios.post('http://localhost:5000/api/gps/generate', { destination: "Full Stack Developer" }, { headers });
    console.log("GPS Generate Success! Current Level:", res.data.data.currentLevel);
    console.log("Total checkpoints created:", res.data.data.checkpoints.length);
    generatedData = res.data.data;
  } catch (err) {
    console.error("GPS Generate Error:", err.response?.status, err.response?.data || err.message);
    return;
  }

  if (!generatedData || generatedData.checkpoints.length === 0) {
    console.error("No checkpoint data to test further.");
    return;
  }

  const firstCheckpoint = generatedData.checkpoints[0];
  const firstTask = firstCheckpoint.tasks[0];

  console.log("\n--- 2. Testing Get Current GPS Journey ---");
  try {
    const res = await axios.get('http://localhost:5000/api/gps/current', { headers });
    console.log("GPS Get Current Success! Active Destination:", res.data.data.destination);
  } catch (err) {
    console.error("GPS Get Current Error:", err.response?.status, err.response?.data || err.message);
  }

  console.log(`\n--- 3. Testing Task Progression Toggle (Checkpoint Level ${firstCheckpoint.level}, Task: "${firstTask.title}") ---`);
  try {
    const res = await axios.patch('http://localhost:5000/api/gps/task', {
      checkpointLevel: firstCheckpoint.level,
      taskTitle: firstTask.title,
      completed: true
    }, { headers });
    console.log("GPS Update Task Success! Earned XP:", res.data.data.xp);
    console.log("Updated Progress %:", res.data.data.progress);
  } catch (err) {
    console.error("GPS Update Task Error:", err.response?.status, err.response?.data || err.message);
  }

  console.log("\n--- 4. Testing Project Submission ---");
  try {
    const res = await axios.post('http://localhost:5000/api/gps/project', {
      projectName: "My First Portfolio Site",
      githubUrl: "https://github.com/test/portfolio",
      description: "Built using React and CSS Grid."
    }, { headers });
    console.log("GPS Project Submission Success! Current XP:", res.data.data.xp);
    console.log("Active badges:", res.data.data.badges.map(b => b.name));
  } catch (err) {
    console.error("GPS Project Submission Error:", err.response?.status, err.response?.data || err.message);
  }
}

testGPS();
