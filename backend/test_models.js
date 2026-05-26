const axios = require('axios');

const API_KEY = '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';
const models = [
  'meta/llama-3.3-70b-instruct',
  'meta/llama-3.1-70b-instruct',
  'mistralai/mixtral-8x7b-instruct-v0.1',
];

(async () => {
  for (const m of models) {
    try {
      const r = await axios.post(
        'https://integrate.api.nvidia.com/v1/chat/completions',
        {
          model: m,
          messages: [{ role: 'user', content: 'Return ONLY valid JSON: {"test": true, "count": 3}' }],
          max_tokens: 200,
          temperature: 0.2,
        },
        {
          headers: {
            Authorization: `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );
      const text = r.data?.choices?.[0]?.message?.content || '';
      console.log(`✅ ${m} => ${text.slice(0, 150)}`);
    } catch (e) {
      const detail = e.response?.data?.detail || e.response?.data || e.message;
      console.log(`❌ ${m} => ${e.response?.status || 'ERR'} ${JSON.stringify(detail).slice(0, 200)}`);
    }
  }

  // Also test Gemini with gemini-2.0-flash-lite and gemini-1.5-flash (other models)
  const geminiKey = 'AIzaSyAOrTYCwQFlB5xoG9Gl8_NaFcRYUYOzcTM';
  const geminiModels = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash'];
  for (const gm of geminiModels) {
    try {
      const r = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${gm}:generateContent?key=${geminiKey}`,
        { contents: [{ parts: [{ text: 'Say hello' }] }] },
        { timeout: 15000 }
      );
      const text = r.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      console.log(`✅ Gemini ${gm} => ${text.slice(0, 100)}`);
    } catch (e) {
      const msg = e.response?.data?.error?.message || e.message;
      console.log(`❌ Gemini ${gm} => ${e.response?.status || 'ERR'} ${msg.slice(0, 200)}`);
    }
  }
})();
