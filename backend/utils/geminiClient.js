const axios = require('axios');

/**
 * OpenRouter AI Client (OpenAI-compatible)
 * Central AI backend for all Nexus Career OS features.
 * Uses OpenRouter.ai which provides access to multiple LLM providers.
 */

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const DEFAULT_MODEL = 'meta-llama/llama-3.3-70b-instruct';
const MODEL_CHAIN = [
  'meta-llama/llama-3.3-70b-instruct',
  'meta-llama/llama-3.1-70b-instruct',
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
  return status === 429 || msg.includes('quota') || msg.includes('rate_limit') || msg.includes('resource_exhausted');
};
const isModelNotFoundError = (error) => error?.response?.status === 404;

/**
 * Core AI call function targeting OpenRouter
 * Automatically fails over across an array of models if one fails/times out.
 */
const callAI = async ({ messages, systemInstruction, temperature = 0.6, model, maxTokens }) => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY is not configured in .env');

  const finalMessages = [];
  if (systemInstruction) {
    finalMessages.push({ role: 'system', content: systemInstruction });
  }
  finalMessages.push(...(messages || []));

  if (finalMessages.length === 0) {
    throw new Error('AI request had no messages to send.');
  }

  // Determine which models to try
  const modelsToTry = model ? [model] : [...MODEL_CHAIN];
  let lastError = null;

  for (let i = 0; i < modelsToTry.length; i++) {
    const currentModel = modelsToTry[i];
    console.log(`🤖 Calling OpenRouter AI: ${currentModel}...`);

    try {
      const response = await axios.post(
        `${OPENROUTER_BASE_URL}/chat/completions`,
        {
          model: currentModel,
          messages: finalMessages,
          temperature,
          top_p: 0.95,
          max_tokens: maxTokens || 8192,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://nexus-career-os.vercel.app',
            'X-Title': 'Nexus Career OS',
          },
          timeout: 60000, // 60s timeout
        }
      );

      const choice = response?.data?.choices?.[0];
      const content = choice?.message?.content || '';
      
      if (!content || content.trim() === '') {
        console.warn(`⚠️ OpenRouter model ${currentModel} returned empty response.`);
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
        console.error('❌ All OpenRouter models in the failover chain failed.');
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
  const maxTokens = generationConfig?.maxOutputTokens;
  const result = await callAI({ messages, systemInstruction, temperature, maxTokens });
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
 * Call AI for structured/direct prompts.
 * All requests go through OpenRouter.
 */
const callGeminiDirectly = async ({ prompt, temperature = 0.6, maxTokens }) => {
  const messages = [{ role: 'user', content: prompt }];
  const result = await callAI({ messages, temperature, maxTokens });
  return { text: result.text };
};

module.exports = {
  callGeminiSDK,
  callGeminiREST,
  callGeminiDirectly,
  callAI,
  isQuotaError,
  isModelNotFoundError,
  MODEL_CHAIN: [DEFAULT_MODEL],
};
