const axios = require('axios');
const dns = require('dns');

// Apply DNS servers
dns.setServers(['8.8.8.8', '8.8.4.4']);

console.log("Current DNS servers:", dns.getServers());

async function lookup(hostname) {
  try {
    const addresses = await new Promise((resolve, reject) => {
      dns.resolve4(hostname, (err, addrs) => {
        if (err) reject(err);
        else resolve(addrs);
      });
    });
    console.log(`✅ DNS resolved ${hostname}:`, addresses);
    return addresses[0];
  } catch (err) {
    console.error(`❌ DNS failed to resolve ${hostname}:`, err.message);
    return null;
  }
}

async function testAI() {
  await lookup('generativelanguage.googleapis.com');
  await lookup('integrate.api.nvidia.com');

  const geminiKey = 'AIzaSyAOrTYCwQFlB5xoG9Gl8_NaFcRYUYOzcTM';
  const nvidiaKey = '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';

  // Test Gemini
  console.log("\n--- Testing Google Gemini ---");
  try {
    const res = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
      {
        contents: [{ parts: [{ text: "Hello, respond with exactly 'Gemini OK'" }] }]
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000
      }
    );
    console.log("Gemini Status:", res.status);
    console.log("Gemini Data:", JSON.stringify(res.data?.candidates?.[0]?.content?.parts?.[0]?.text));
  } catch (err) {
    console.error("Gemini Error:", err.message);
    if (err.response) {
      console.error("Gemini Error Status:", err.response.status);
      console.error("Gemini Error Data:", JSON.stringify(err.response.data));
    }
  }

  // Test Nvidia
  console.log("\n--- Testing NVIDIA NIM ---");
  try {
    const res = await axios.post(
      `https://integrate.api.nvidia.com/v1/chat/completions`,
      {
        model: 'meta/llama-3.1-8b-instruct',
        messages: [{ role: 'user', content: "Hello, respond with exactly 'Nvidia OK'" }],
        max_tokens: 10
      },
      {
        headers: {
          Authorization: `Bearer ${nvidiaKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );
    console.log("Nvidia Status:", res.status);
    console.log("Nvidia Data:", JSON.stringify(res.data?.choices?.[0]?.message?.content));
  } catch (err) {
    console.error("Nvidia Error:", err.message);
    if (err.response) {
      console.error("Nvidia Error Status:", err.response.status);
      console.error("Nvidia Error Data:", JSON.stringify(err.response.data));
    }
  }
}

testAI();
