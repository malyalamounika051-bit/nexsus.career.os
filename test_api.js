const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: './backend/.env' });

async function test() {
  // 1. Create a dummy JWT token using local secret
  const token = jwt.sign({ id: 'dummy_user_id', email: 'test@example.com' }, process.env.JWT_SECRET || 'fallbacksecret', { expiresIn: '1h' });
  
  const headers = { Authorization: `Bearer ${token}` };

  console.log("--- Testing AI Improve ---");
  try {
    const res = await axios.post('http://localhost:5000/api/resumes/ai/improve-achievement', { achievement: "Built a website" }, { headers });
    console.log("AI Improve Success:", res.data);
  } catch (err) {
    console.log("AI Improve Error:", err.response?.status, err.response?.data);
  }

  console.log("\n--- Testing Save Resume ---");
  try {
    const payload = { 
        resumeTitle: "Test", templateId: "modern", isPublic: false, sectionOrder: [],
        personalInfo: { name: "Test" }
    };
    const res = await axios.post('http://localhost:5000/api/resumes', payload, { headers });
    console.log("Save Success:", res.data);
  } catch (err) {
    console.log("Save Error:", err.response?.status, err.response?.data);
  }
}

test();
