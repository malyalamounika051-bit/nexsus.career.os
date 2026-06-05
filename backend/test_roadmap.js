const axios = require('axios');
require('dotenv').config();
const API_KEY = process.env.OPENROUTER_API_KEY;

const prompt = `You are a career counselor. Create a career roadmap for "Full Stack Developer".
RESPOND ONLY WITH VALID JSON — no markdown, no explanations. First character must be "{", last must be "}".
The JSON must have: {"domain":"string","description":"string","skills":["s1","s2"],"demandScore":78,"roadmap":[{"phase":"Phase 1","duration":"4 weeks","skills":["HTML"],"topics":["Web basics"],"tools":["VS Code"],"projects":["Portfolio site"],"resources":[{"title":"MDN","url":"https://developer.mozilla.org","type":"article","category":"docs"}]}]}
Create exactly 7 phases. Each phase needs skills, topics, tools, projects, resources arrays.
CRITICAL: Return ONLY valid JSON.`;

(async () => {
  console.log('Testing OpenRouter with roadmap prompt...');
  console.log('Prompt length:', prompt.length, 'chars');
  const start = Date.now();
  
  try {
    const r = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'meta-llama/llama-3.3-70b-instruct',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 8192,
        temperature: 0.6,
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://nexus-career-os.vercel.app',
          'X-Title': 'Nexus Career OS',
        },
        timeout: 120000,
      }
    );
    
    const text = r.data?.choices?.[0]?.message?.content || '';
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`Response in ${elapsed}s, length: ${text.length} chars`);
    console.log('Finish reason:', r.data?.choices?.[0]?.finish_reason);
    console.log('First 200 chars:', text.slice(0, 200));
    console.log('Last 100 chars:', text.slice(-100));
    
    // Try to parse
    try {
      let clean = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      console.log('\n✅ JSON PARSED SUCCESSFULLY');
      console.log('Domain:', parsed.domain);
      console.log('Phases:', parsed.roadmap?.length);
      if (parsed.roadmap) {
        parsed.roadmap.forEach((p, i) => {
          console.log(`  Phase ${i+1}: ${p.phase} | skills:${p.skills?.length} topics:${p.topics?.length} projects:${p.projects?.length} resources:${p.resources?.length}`);
        });
      }
    } catch (parseErr) {
      console.log('\n❌ JSON PARSE FAILED:', parseErr.message);
      console.log('Full response:\n', text.slice(0, 500));
    }
  } catch (e) {
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`❌ OpenRouter FAILED after ${elapsed}s:`, e.response?.status, JSON.stringify(e.response?.data || e.message).slice(0, 300));
  }
})();
