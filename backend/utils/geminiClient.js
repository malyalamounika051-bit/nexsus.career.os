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
  'meta-llama/llama-3.3-70b-instruct:free',
  'qwen/qwen3-coder:free',
  'meta-llama/llama-3.2-3b-instruct:free',
  'nousresearch/hermes-3-llama-3.1-405b:free',
  'qwen/qwen3-next-80b-a3b-instruct:free',
];

/** Small delay helper */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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
  return status === 429 || status === 402 || msg.includes('quota') || msg.includes('rate_limit') || msg.includes('resource_exhausted');
};
const isModelNotFoundError = (error) => error?.response?.status === 404;

let detectedFreeTier = false;

const callNvidiaNIM = async ({ messages, temperature = 0.6, maxTokens }) => {
  const nvidiaKey = process.env.NVIDIA_API_KEY || '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';
  if (!nvidiaKey) throw new Error('NVIDIA API Key is not configured in .env');

  console.log('🤖 OpenRouter rate-limited. Falling back to NVIDIA NIM (meta/llama-3.1-70b-instruct)...');

  const response = await axios.post(
    'https://integrate.api.nvidia.com/v1/chat/completions',
    {
      model: 'meta/llama-3.1-70b-instruct',
      messages,
      temperature,
      max_tokens: maxTokens || 4096,
    },
    {
      headers: {
        Authorization: `Bearer ${nvidiaKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 120000, // 120 seconds timeout for NVIDIA NIM
    }
  );

  const content = response?.data?.choices?.[0]?.message?.content || '';
  if (!content || content.trim() === '') {
    throw new Error('NVIDIA NIM returned empty response.');
  }

  console.log(`✅ SUCCESS: AI response generated using NVIDIA NIM.`);
  return { text: content };
};

/**
 * Core AI call function targeting OpenRouter
 * Automatically fails over across an array of models if one fails/times out.
 * Includes retry-after support for rate-limited free models.
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

  try {
    // Determine which models to try
    let modelsToTry = model ? [model, ...MODEL_CHAIN.filter(m => m !== model)] : [...MODEL_CHAIN];
    
    if (detectedFreeTier) {
      modelsToTry = modelsToTry.filter(m => m.includes(':free'));
      if (modelsToTry.length === 0) {
        modelsToTry = ['meta-llama/llama-3.3-70b-instruct:free'];
      }
    }

    let lastError = null;

    for (let i = 0; i < modelsToTry.length; i++) {
      const currentModel = modelsToTry[i];
      const isFreeModel = currentModel.includes(':free');

      // For free models, attempt up to 2 retries with delay on 429
      const maxAttempts = isFreeModel ? 2 : 1;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        console.log(`🤖 Calling OpenRouter AI: ${currentModel}${attempt > 0 ? ` (retry ${attempt})` : ''}...`);

        try {
          const response = await axios.post(
            `${OPENROUTER_BASE_URL}/chat/completions`,
            {
              model: currentModel,
              messages: finalMessages,
              temperature,
              top_p: 0.95,
              max_tokens: maxTokens || 4096,
            },
            {
              headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://nexus-career-os.vercel.app',
                'X-Title': 'Nexus Career OS',
              },
              timeout: 90000, // 90s timeout for large responses
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
          const status = error?.response?.status;

          if (status === 402) {
            console.warn(`💡 Detected Free-Tier API Key (402 Payment Required for paid model). Automatically switching to Free models.`);
            detectedFreeTier = true;
          }

          // If rate limited on a free model, wait and retry
          if (status === 429 && isFreeModel && attempt < maxAttempts - 1) {
            const retryAfter = error?.response?.data?.error?.metadata?.retry_after_seconds || 5;
            const waitMs = Math.min((retryAfter + 1) * 1000, 30000);
            console.log(`⏳ Rate limited on ${currentModel}. Waiting ${Math.ceil(waitMs / 1000)}s before retry...`);
            await sleep(waitMs);
            continue;
          }

          console.warn(`❌ Model ${currentModel} failed: ${error.message} (status: ${status || 'N/A'})`);
          break; // Move to next model
        }
      }

      if (i < modelsToTry.length - 1) {
        console.log(`🔄 Trying next model in chain...`);
        // Small delay between model switches to avoid rapid-fire rate limiting
        await sleep(500);
      } else {
        console.error('❌ All OpenRouter models in the failover chain failed.');
        console.error('Final Error Status:', lastError?.response?.status);
        console.error('Final Error Data:', JSON.stringify(lastError?.response?.data, null, 2));
      }
    }

    throw lastError;
  } catch (error) {
    console.warn('⚠️ OpenRouter exhausted or rate limited. Attempting ultimate fallback to NVIDIA NIM...');
    try {
      return await callNvidiaNIM({ messages: finalMessages, temperature, maxTokens });
    } catch (nvidiaErr) {
      console.error('❌ Ultimate NVIDIA NIM fallback failed:', nvidiaErr.message);
      throw error; // Throw original OpenRouter error to preserve correct status (e.g. 429)
    }
  }
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
  MODEL_CHAIN,
};
