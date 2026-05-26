const axios = require('axios');

/**
 * NVIDIA NIM AI Client (OpenAI-compatible)
 * Primary AI backend. Falls back from Gemini to NVIDIA when quota is exhausted.
 */

const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';
const DEFAULT_MODEL = 'meta/llama-3.3-70b-instruct';
const NVIDIA_MODEL_CHAIN = [
  'meta/llama-3.3-70b-instruct',
  'meta/llama-3.1-8b-instruct',
  'meta/llama-3.1-70b-instruct',
];

/**
 * Mapper: Gemini-like `contents` -> OpenAI messages
 * Supports:
 * - string prompt
 * - array of { role, parts: [{ text }] }
 */
const mapGeminiToOpenAI = (contents) => {
  if (typeof contents === 'string') {
    const text = contents.trim();
    return text ? [{ role: 'user', content: text }] : [];
  }

  if (!Array.isArray(contents)) return [];

  return contents
    .map((c) => {
      const role = c?.role === 'model' ? 'assistant' : (c?.role || 'user');
      const content =
        Array.isArray(c?.parts)
          ? c.parts.map((p) => p?.text).filter(Boolean).join('\n')
          : (typeof c?.parts === 'string' ? c.parts : '');
      const trimmed = String(content || '').trim();
      return trimmed ? { role, content: trimmed } : null;
    })
    .filter(Boolean);
};

const isQuotaError = (error) => {
  const status = error?.response?.status;
  const msg = (error?.message || '').toLowerCase();
  return status === 429 || msg.includes('quota') || msg.includes('resource_exhausted');
};
const isModelNotFoundError = (error) => error?.response?.status === 404;

/**
 * Core AI call function targeting NVIDIA NIM
 * Automatically fails over across an array of validated models if one fails/times out.
 */
const callAI = async ({ messages, systemInstruction, temperature = 0.6, model }) => {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) throw new Error('NVIDIA_API_KEY is not configured in .env');

  const finalMessages = [];
  if (systemInstruction) {
    finalMessages.push({ role: 'system', content: systemInstruction });
  }
  finalMessages.push(...(messages || []));

  if (finalMessages.length === 0) {
    throw new Error('AI request had no messages to send.');
  }

  // Determine which models to try
  const modelsToTry = model ? [model] : [...NVIDIA_MODEL_CHAIN];
  let lastError = null;

  for (let i = 0; i < modelsToTry.length; i++) {
    const currentModel = modelsToTry[i];
    console.log(`🤖 Calling NVIDIA AI: ${currentModel}...`);

    try {
      const response = await axios.post(
        `${NVIDIA_BASE_URL}/chat/completions`,
        {
          model: currentModel,
          messages: finalMessages,
          temperature,
          top_p: 0.95,
          max_tokens: 8192, // Increased: roadmap JSON can be 6000+ tokens
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 45000, // 45s — fast failover to backup models if congested
        }
      );

      const choice = response?.data?.choices?.[0];
      const content = choice?.message?.content || '';
      
      if (!content || content.trim() === '') {
        console.warn(`⚠️ NVIDIA model ${currentModel} returned empty response.`);
        throw new Error(`Empty response from model ${currentModel}`);
      }
      
      console.log(`✅ SUCCESS: AI response generated using ${currentModel}.`);
      return { text: content };
    } catch (error) {
      lastError = error;
      console.warn(`❌ Model ${currentModel} failed: ${error.message}`);
      
      if (i < modelsToTry.length - 1) {
        console.log(`🔄 Retrying next model in chain...`);
      } else {
        console.error('❌ All NVIDIA models in the failover chain failed.');
        console.error('Final Error Status:', error?.response?.status);
        console.error('Final Error Data:', JSON.stringify(error?.response?.data, null, 2));
      }
    }
  }

  throw lastError;
};

/**
 * Wrapper for controllers (Gemini SDK style shape)
 */
const callGeminiSDK = async (config) => {
  const messages = mapGeminiToOpenAI(config.contents);
  const systemInstruction = config.config?.systemInstruction;
  const temperature = config.config?.temperature ?? 0.6;

  const result = await callAI({ messages, systemInstruction, temperature });
  return { text: result.text };
};

/**
 * Wrapper for mentorController (Gemini REST style shape)
 */
const callGeminiREST = async ({ contents, systemInstruction, generationConfig }) => {
  const messages = mapGeminiToOpenAI(contents);
  const temperature = generationConfig?.temperature ?? 0.7;
  const result = await callAI({ messages, systemInstruction, temperature });
  return {
    candidates: [
      {
        content: {
          parts: [{ text: result.text }],
        },
      },
    ],
  };
};

/**
 * Call AI for structured JSON responses.
 * Tries Google Gemini first, falls back to NVIDIA NIM if Gemini fails (quota, etc.)
 */
const callGeminiDirectly = async ({ prompt, temperature = 0.6 }) => {
  const geminiKey = process.env.GEMINI_API_KEY;

  // Gemini model fallback chain — different models may have separate free-tier quotas
  const GEMINI_MODELS = [
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-2.0-flash-lite',
  ];

  // 1. Try Google Gemini models (if key exists)
  if (geminiKey && geminiKey !== 'YOUR_GEMINI_API_KEY') {
    for (const model of GEMINI_MODELS) {
      try {
        console.log(`🤖 Calling Google Gemini API (${model})...`);
        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
          {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 8192,
            },
          },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 180000,
          }
        );

        const candidates = response?.data?.candidates || [];
        if (candidates.length === 0) throw new Error('No candidates in Gemini response');
        const content = candidates[0]?.content?.parts?.[0]?.text || '';
        if (!content || content.trim() === '') throw new Error('Gemini API returned empty response');
        console.log(`✅ Gemini (${model}) succeeded.`);
        return { text: content };
      } catch (geminiError) {
        const status = geminiError?.response?.status;
        const errMsg = geminiError?.response?.data?.error?.message || geminiError.message || '';
        console.warn(`⚠️ Gemini ${model} failed (status ${status}): ${errMsg}`);
        // Continue to next model
      }
    }
    console.log('🔄 All Gemini models exhausted, falling back to NVIDIA NIM...');
  }

  // 2. Fallback: Use NVIDIA NIM
  const messages = [{ role: 'user', content: prompt }];
  const result = await callAI({ messages, temperature });
  return { text: result.text };
};

module.exports = {
  callGeminiSDK,
  callGeminiREST,
  callGeminiDirectly,
  isQuotaError,
  isModelNotFoundError,
  MODEL_CHAIN: [DEFAULT_MODEL],
};
