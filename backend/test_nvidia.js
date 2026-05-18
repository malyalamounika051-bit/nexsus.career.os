const axios = require('axios');

const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';
const apiKey = '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';

const modelsToTest = [
  "meta/llama-3.1-8b-instruct",
  "meta/llama-3.2-3b-instruct",
];

async function testChat(model) {
  console.log(`\n--- Testing Model: ${model} ---`);
  try {
    const start = Date.now();
    const res = await axios.post(
      `${NVIDIA_BASE_URL}/chat/completions`,
      {
        model,
        messages: [
          { role: 'system', content: 'You are a helpful career mentor.' },
          { role: 'user', content: 'Generate 1 sentence career advice for an Architect.' }
        ],
        temperature: 0.6,
        max_tokens: 50,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );
    const duration = (Date.now() - start) / 1000;
    console.log(`✅ SUCCESS in ${duration}s!`);
    return true;
  } catch (err) {
    console.log(`❌ FAILED: ${err.message}`);
    return false;
  }
}

async function run() {
  for (const m of modelsToTest) {
    await testChat(m);
  }
}
run();
