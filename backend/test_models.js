const axios = require('axios');
require('dotenv').config();
const API_KEY = process.env.OPENROUTER_API_KEY;
const models = [
  'meta-llama/llama-3.3-70b-instruct',
  'meta-llama/llama-3.1-70b-instruct',
  'mistralai/mixtral-8x7b-instruct',
];

(async () => {
  for (const m of models) {
    try {
      const r = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
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
            'HTTP-Referer': 'https://nexus-career-os.vercel.app',
            'X-Title': 'Nexus Career OS',
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
})();
