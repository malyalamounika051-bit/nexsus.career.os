const jwt = require('jsonwebtoken');
require('dotenv').config({ path: './backend/.env' });

async function test() {
  const token = jwt.sign({ id: 'dummy_user_id', email: 'test@example.com' }, process.env.JWT_SECRET || 'fallbacksecret', { expiresIn: '1h' });
  
  const headers = { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  console.log("--- Testing AI Improve ---");
  try {
    const res = await fetch('http://localhost:5000/api/resumes/ai/improve-achievement', {
        method: 'POST',
        headers,
        body: JSON.stringify({ achievement: "Built a website" })
    });
    const data = await res.json();
    console.log("AI Improve Status:", res.status);
    console.log("AI Improve Data:", data);
  } catch (err) {
    console.log("AI Improve Error:", err.message);
  }

  console.log("\n--- Testing Save Resume ---");
  try {
    const payload = { 
        resumeTitle: "Test", templateId: "modern", isPublic: false, sectionOrder: [],
        personalInfo: { name: "Test" }
    };
    const res = await fetch('http://localhost:5000/api/resumes', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
    });
    const data = await res.json();
    console.log("Save Status:", res.status);
    console.log("Save Data:", data);
  } catch (err) {
    console.log("Save Error:", err.message);
  }
}

test();
