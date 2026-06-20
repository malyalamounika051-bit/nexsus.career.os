/**
 * ASR (Automatic Speech Recognition) Service
 *
 * Provides a provider-abstracted transcription pipeline with:
 *  - Deepgram as the primary cloud provider
 *  - OpenAI Whisper as the fallback cloud provider
 *  - BrowserTranscriptProvider for zero-config operation (uses browser-captured text)
 *  - Technical vocabulary boosting for software engineering interviews
 *  - Speech analytics (WPM, filler words, pause frequency)
 */

// ---------------------------------------------------------------------------
// Technical Vocabulary Booster
// ---------------------------------------------------------------------------

/**
 * TechnicalVocabularyBooster corrects common ASR mis-transcriptions of
 * technical terms by running a case-insensitive replacement pass over the
 * raw transcript.
 */
class TechnicalVocabularyBooster {
  constructor() {
    this.vocabularyLists = {
      frontend: [
        'React', 'Next.js', 'TypeScript', 'JavaScript', 'Vue', 'Angular',
        'Svelte', 'Webpack', 'Vite', 'Tailwind'
      ],
      backend: [
        'Node.js', 'Express', 'Django', 'Flask', 'Spring', 'GraphQL',
        'REST', 'PostgreSQL', 'MongoDB', 'Redis', 'Docker', 'Kubernetes'
      ],
      aiMl: [
        'TensorFlow', 'PyTorch', 'LangChain', 'LangGraph', 'Transformer',
        'GPT', 'BERT', 'RAG', 'Vector Database', 'Embedding', 'Fine-tuning',
        'Machine Learning', 'Artificial Intelligence', 'Neural Network',
        'Deep Learning'
      ],
      cloud: [
        'AWS', 'Azure', 'GCP', 'Lambda', 'S3', 'EC2', 'CloudFront',
        'Terraform', 'CI/CD'
      ]
    };

    // Build a flat lookup map: lowercased term -> canonical form
    this._canonicalMap = new Map();
    for (const category of Object.values(this.vocabularyLists)) {
      for (const term of category) {
        this._canonicalMap.set(term.toLowerCase(), term);
      }
    }
  }

  /**
   * Boost a transcript by replacing mis-cased or mis-spaced technical terms
   * with their canonical forms.
   *
   * @param {string} text - Raw transcript text
   * @returns {string} Boosted transcript
   */
  boost(text) {
    if (!text) return text;

    let boosted = text;

    // Sort terms longest-first so multi-word terms match before their parts
    const sortedTerms = [...this._canonicalMap.entries()].sort(
      (a, b) => b[0].length - a[0].length
    );

    for (const [lower, canonical] of sortedTerms) {
      // Use word-boundary-aware regex so we don't replace partial matches
      const escaped = lower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = new RegExp(`\\b${escaped}\\b`, 'gi');
      boosted = boosted.replace(pattern, canonical);
    }

    return boosted;
  }

  /**
   * Return all vocabulary terms as a flat array (useful for provider hints).
   * @returns {string[]}
   */
  getAllTerms() {
    const terms = [];
    for (const category of Object.values(this.vocabularyLists)) {
      terms.push(...category);
    }
    return terms;
  }
}

// ---------------------------------------------------------------------------
// Speech Analytics
// ---------------------------------------------------------------------------

const FILLER_PATTERNS = [
  // Multi-word fillers must come first so they are matched before singles
  { pattern: /\byou know\b/gi, label: 'you know' },
  { pattern: /\bsort of\b/gi, label: 'sort of' },
  { pattern: /\bkind of\b/gi, label: 'kind of' },
  { pattern: /\bbasically\b/gi, label: 'basically' },
  { pattern: /\bactually\b/gi, label: 'actually' },
  { pattern: /\blike\b/gi, label: 'like' },
  { pattern: /\bum\b/gi, label: 'um' },
  { pattern: /\buh\b/gi, label: 'uh' }
];

/**
 * SpeechAnalytics computes quantitative metrics from a transcript.
 */
class SpeechAnalytics {
  /**
   * Analyse a transcript string.
   *
   * @param {string} text     - The transcript text to analyse
   * @param {number} duration - Speaking duration in seconds
   * @returns {{ wordsSpoken: number, speakingSpeed: number, fillerWords: string[], fillerWordCount: number, pauseFrequency: number }}
   */
  static analyse(text, duration = 0) {
    if (!text || typeof text !== 'string') {
      return {
        wordsSpoken: 0,
        speakingSpeed: 0,
        fillerWords: [],
        fillerWordCount: 0,
        pauseFrequency: 0
      };
    }

    // Word count — split on whitespace, filter empties
    const words = text.trim().split(/\s+/).filter(Boolean);
    const wordsSpoken = words.length;

    // Speaking speed (words per minute)
    const durationMinutes = duration > 0 ? duration / 60 : 0;
    const speakingSpeed = durationMinutes > 0
      ? Math.round((wordsSpoken / durationMinutes) * 10) / 10
      : 0;

    // Filler word detection
    const fillerWords = [];
    let fillerWordCount = 0;

    for (const { pattern, label } of FILLER_PATTERNS) {
      // Reset regex state (global flag)
      pattern.lastIndex = 0;
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        fillerWords.push(label);
        fillerWordCount += matches.length;
      }
    }

    // Pause frequency — estimated as filler-word density per minute
    const pauseFrequency = durationMinutes > 0
      ? Math.round((fillerWordCount / durationMinutes) * 10) / 10
      : 0;

    return {
      wordsSpoken,
      speakingSpeed,
      fillerWords,
      fillerWordCount,
      pauseFrequency
    };
  }
}

// ---------------------------------------------------------------------------
// Providers
// ---------------------------------------------------------------------------

/**
 * BrowserTranscriptProvider — works without any external API keys.
 * Accepts the transcript text already captured by the browser's Web Speech
 * API and enriches it with vocabulary boosting + analytics.
 */
class BrowserTranscriptProvider {
  constructor() {
    this.name = 'browser';
    this._booster = new TechnicalVocabularyBooster();
  }

  /**
   * @param {Buffer|null} _audioBuffer - Unused (browser already did STT)
   * @param {{ browserTranscript?: string, duration?: number, language?: string }} options
   * @returns {Promise<{ transcript: string, confidence: number, language: string, duration: number, analytics: object }>}
   */
  async transcribe(_audioBuffer, options = {}) {
    const raw = options.browserTranscript || '';
    const duration = options.duration || 0;
    const language = options.language || 'en';

    // Boost technical terms
    const transcript = this._booster.boost(raw);

    // Compute analytics
    const analytics = SpeechAnalytics.analyse(transcript, duration);

    // Confidence is set to a reasonable baseline for browser STT
    const confidence = raw.length > 0 ? 0.85 : 0;

    return { transcript, confidence, language, duration, analytics };
  }
}

/**
 * DeepgramProvider — primary cloud ASR provider.
 * Requires DEEPGRAM_API_KEY environment variable.
 */
class DeepgramProvider {
  constructor() {
    this.name = 'deepgram';
    this.apiKey = process.env.DEEPGRAM_API_KEY || '';
    this._booster = new TechnicalVocabularyBooster();
  }

  /**
   * @param {Buffer} audioBuffer
   * @param {{ language?: string, duration?: number }} options
   */
  async transcribe(audioBuffer, options = {}) {
    if (!this.apiKey) {
      throw new Error('DEEPGRAM_API_KEY is not configured');
    }

    const https = require('https');
    const language = options.language || 'en';

    const keywords = this._booster.getAllTerms().map(t => `${t}:2`).join('&keywords=');

    const requestOptions = {
      hostname: 'api.deepgram.com',
      path: `/v1/listen?model=nova-2&language=${language}&smart_format=true&keywords=${keywords}`,
      method: 'POST',
      headers: {
        'Authorization': `Token ${this.apiKey}`,
        'Content-Type': 'audio/webm'
      }
    };

    const body = await new Promise((resolve, reject) => {
      const req = https.request(requestOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => resolve(data));
      });
      req.on('error', reject);
      req.write(audioBuffer);
      req.end();
    });

    const result = JSON.parse(body);
    const alt = result?.results?.channels?.[0]?.alternatives?.[0];
    if (!alt) throw new Error('No transcription result from Deepgram');

    const rawTranscript = alt.transcript || '';
    const transcript = this._booster.boost(rawTranscript);
    const duration = result?.metadata?.duration || options.duration || 0;
    const analytics = SpeechAnalytics.analyse(transcript, duration);

    return {
      transcript,
      confidence: alt.confidence || 0,
      language,
      duration,
      analytics
    };
  }
}

/**
 * OpenAIWhisperProvider — fallback cloud ASR provider.
 * Requires OPENAI_API_KEY environment variable.
 */
class OpenAIWhisperProvider {
  constructor() {
    this.name = 'whisper';
    this.apiKey = process.env.OPENAI_API_KEY || '';
    this._booster = new TechnicalVocabularyBooster();
  }

  /**
   * @param {Buffer} audioBuffer
   * @param {{ language?: string, duration?: number }} options
   */
  async transcribe(audioBuffer, options = {}) {
    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const https = require('https');
    const language = options.language || 'en';

    // Build multipart/form-data manually
    const boundary = '----ASRServiceBoundary' + Date.now();
    const preamble = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="file"; filename="audio.webm"',
      'Content-Type: audio/webm',
      '',
      ''
    ].join('\r\n');

    const modelField = [
      '',
      `--${boundary}`,
      'Content-Disposition: form-data; name="model"',
      '',
      'whisper-1',
      `--${boundary}`,
      'Content-Disposition: form-data; name="language"',
      '',
      language,
      `--${boundary}`,
      'Content-Disposition: form-data; name="prompt"',
      '',
      this._booster.getAllTerms().join(', '),
      `--${boundary}--`,
      ''
    ].join('\r\n');

    const payload = Buffer.concat([
      Buffer.from(preamble, 'utf-8'),
      audioBuffer,
      Buffer.from(modelField, 'utf-8')
    ]);

    const requestOptions = {
      hostname: 'api.openai.com',
      path: '/v1/audio/transcriptions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': payload.length
      }
    };

    const body = await new Promise((resolve, reject) => {
      const req = https.request(requestOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => resolve(data));
      });
      req.on('error', reject);
      req.write(payload);
      req.end();
    });

    const result = JSON.parse(body);
    if (!result.text) throw new Error('No transcription result from OpenAI Whisper');

    const transcript = this._booster.boost(result.text);
    const duration = options.duration || 0;
    const analytics = SpeechAnalytics.analyse(transcript, duration);

    return {
      transcript,
      confidence: 0.9, // Whisper doesn't return per-utterance confidence
      language,
      duration,
      analytics
    };
  }
}

// ---------------------------------------------------------------------------
// Provider Registry
// ---------------------------------------------------------------------------

const PROVIDER_MAP = {
  deepgram: DeepgramProvider,
  whisper: OpenAIWhisperProvider,
  browser: BrowserTranscriptProvider
};

function createProvider(name) {
  const Provider = PROVIDER_MAP[name];
  if (!Provider) {
    throw new Error(`Unknown ASR provider: "${name}". Available: ${Object.keys(PROVIDER_MAP).join(', ')}`);
  }
  return new Provider();
}

// ---------------------------------------------------------------------------
// ASR Service (main entry point)
// ---------------------------------------------------------------------------

class ASRService {
  /**
   * @param {{ primaryProvider?: string, fallbackProvider?: string }} config
   */
  constructor(config = {}) {
    this.primaryName = config.primaryProvider
      || process.env.ASR_PRIMARY_PROVIDER
      || 'browser';
    this.fallbackName = config.fallbackProvider
      || process.env.ASR_FALLBACK_PROVIDER
      || 'browser';

    this.primary = createProvider(this.primaryName);
    this.fallback = createProvider(this.fallbackName);
  }

  /**
   * Transcribe audio (or enhance a browser transcript) with automatic
   * fallback if the primary provider fails.
   *
   * @param {Buffer|null} audioBuffer - Raw audio data (null when using browser provider)
   * @param {{ browserTranscript?: string, duration?: number, language?: string }} options
   * @returns {Promise<{ transcript: string, confidence: number, language: string, duration: number, analytics: object }>}
   */
  async transcribe(audioBuffer, options = {}) {
    try {
      const result = await this.primary.transcribe(audioBuffer, options);
      return result;
    } catch (primaryError) {
      console.warn(
        `[ASR] Primary provider "${this.primaryName}" failed: ${primaryError.message}. ` +
        `Falling back to "${this.fallbackName}".`
      );

      try {
        const result = await this.fallback.transcribe(audioBuffer, options);
        return result;
      } catch (fallbackError) {
        console.error(
          `[ASR] Fallback provider "${this.fallbackName}" also failed: ${fallbackError.message}`
        );
        throw new Error(
          `All ASR providers failed. Primary: ${primaryError.message}; Fallback: ${fallbackError.message}`
        );
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  ASRService,
  TechnicalVocabularyBooster,
  SpeechAnalytics,
  BrowserTranscriptProvider,
  DeepgramProvider,
  OpenAIWhisperProvider
};
