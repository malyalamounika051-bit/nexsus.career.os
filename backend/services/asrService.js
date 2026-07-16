/**
 * ASR (Automatic Speech Recognition) Service
 *
 * Provides a provider-abstracted transcription pipeline with:
 *  - AssemblyAI as the primary cloud provider
 *  - Deepgram as the secondary cloud provider
 *  - OpenAI Whisper as the fallback cloud provider
 *  - BrowserTranscriptProvider for zero-config operation (uses browser-captured text)
 *  - Technical vocabulary boosting for software engineering interviews
 *  - Speech analytics (WPM, filler words, pause frequency)
 */

const { AssemblyAI } = require('assemblyai');

// ---------------------------------------------------------------------------
// Technical Vocabulary Booster
// ---------------------------------------------------------------------------

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

    this._canonicalMap = new Map();
    for (const category of Object.values(this.vocabularyLists)) {
      for (const term of category) {
        this._canonicalMap.set(term.toLowerCase(), term);
      }
    }
  }

  boost(text) {
    if (!text) return text;
    let boosted = text;
    const sortedTerms = [...this._canonicalMap.entries()].sort(
      (a, b) => b[0].length - a[0].length
    );

    for (const [lower, canonical] of sortedTerms) {
      const escaped = lower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = new RegExp(`\\b${escaped}\\b`, 'gi');
      boosted = boosted.replace(pattern, canonical);
    }
    return boosted;
  }

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
  { pattern: /\byou know\b/gi, label: 'you know' },
  { pattern: /\bsort of\b/gi, label: 'sort of' },
  { pattern: /\bkind of\b/gi, label: 'kind of' },
  { pattern: /\bbasically\b/gi, label: 'basically' },
  { pattern: /\bactually\b/gi, label: 'actually' },
  { pattern: /\blike\b/gi, label: 'like' },
  { pattern: /\bum\b/gi, label: 'um' },
  { pattern: /\buh\b/gi, label: 'uh' }
];

class SpeechAnalytics {
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

    const words = text.trim().split(/\s+/).filter(Boolean);
    const wordsSpoken = words.length;
    const durationMinutes = duration > 0 ? duration / 60 : 0;
    const speakingSpeed = durationMinutes > 0
      ? Math.round((wordsSpoken / durationMinutes) * 10) / 10
      : 0;

    const fillerWords = [];
    let fillerWordCount = 0;

    for (const { pattern, label } of FILLER_PATTERNS) {
      pattern.lastIndex = 0;
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        fillerWords.push(label);
        fillerWordCount += matches.length;
      }
    }

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
 * AssemblyAIProvider — primary speech-to-text cloud provider.
 */
class AssemblyAIProvider {
  constructor() {
    this.name = 'assemblyai';
    this.apiKey = process.env.ASSEMBLYAI_API_KEY || '9f41c789c7fc4f32b3c26c62cc23c1db';
    this.client = new AssemblyAI({ apiKey: this.apiKey });
    this._booster = new TechnicalVocabularyBooster();
  }

  async transcribe(audioBuffer, options = {}) {
    if (!audioBuffer) {
      throw new Error('Audio data buffer is required for AssemblyAI transcription.');
    }

    // Run transcription via AssemblyAI SDK upload + transcribe
    const transcriptResponse = await this.client.transcripts.transcribe({
      audio: audioBuffer,
      punctuate: true,
      format_text: true,
      word_boost: this._booster.getAllTerms(),
      boost_param: 'high',
      language_detection: true,
      speaker_labels: true,
      entity_detection: false
    });

    if (transcriptResponse.status === 'error') {
      throw new Error(`AssemblyAI Error: ${transcriptResponse.error}`);
    }

    const rawTranscript = transcriptResponse.text || '';
    const transcript = this._booster.boost(rawTranscript);
    const duration = transcriptResponse.audio_duration || options.duration || 0;
    const analytics = SpeechAnalytics.analyse(transcript, duration);

    return {
      transcript,
      confidence: transcriptResponse.confidence || 0.90,
      language: transcriptResponse.language_code || 'en',
      duration,
      analytics,
      words: transcriptResponse.words || [],
      wordCount: analytics.wordsSpoken,
      speakingDuration: duration
    };
  }
}

class BrowserTranscriptProvider {
  constructor() {
    this.name = 'browser';
    this._booster = new TechnicalVocabularyBooster();
  }

  async transcribe(_audioBuffer, options = {}) {
    const raw = options.browserTranscript || '';
    const duration = options.duration || 0;
    const language = options.language || 'en';

    const transcript = this._booster.boost(raw);
    const analytics = SpeechAnalytics.analyse(transcript, duration);
    const confidence = raw.length > 0 ? 0.85 : 0;

    return { transcript, confidence, language, duration, analytics, words: [], wordCount: analytics.wordsSpoken, speakingDuration: duration };
  }
}

class DeepgramProvider {
  constructor() {
    this.name = 'deepgram';
    this.apiKey = process.env.DEEPGRAM_API_KEY || '';
    this._booster = new TechnicalVocabularyBooster();
  }

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
      analytics,
      words: alt.words || [],
      wordCount: analytics.wordsSpoken,
      speakingDuration: duration
    };
  }
}

class OpenAIWhisperProvider {
  constructor() {
    this.name = 'whisper';
    this.apiKey = process.env.OPENAI_API_KEY || '';
    this._booster = new TechnicalVocabularyBooster();
  }

  async transcribe(audioBuffer, options = {}) {
    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const https = require('https');
    const language = options.language || 'en';

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
      confidence: 0.9,
      language,
      duration,
      analytics,
      words: [],
      wordCount: analytics.wordsSpoken,
      speakingDuration: duration
    };
  }
}

// ---------------------------------------------------------------------------
// Provider Registry
// ---------------------------------------------------------------------------

const PROVIDER_MAP = {
  assemblyai: AssemblyAIProvider,
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

class ASRService {
  constructor(config = {}) {
    this.primaryName = config.primaryProvider
      || process.env.ASR_PRIMARY_PROVIDER
      || 'assemblyai';
    this.fallbackName = config.fallbackProvider
      || process.env.ASR_FALLBACK_PROVIDER
      || 'browser';

    this.primary = createProvider(this.primaryName);
    this.fallback = createProvider(this.fallbackName);
  }

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

module.exports = {
  ASRService,
  TechnicalVocabularyBooster,
  SpeechAnalytics,
  AssemblyAIProvider,
  BrowserTranscriptProvider,
  DeepgramProvider,
  OpenAIWhisperProvider
};
