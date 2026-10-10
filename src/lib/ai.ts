/**
 * Multi-AI neural oracle — offline + optional live providers.
 * Active provider is persisted; keys come from Vite env.
 */

export type AiProviderId = 'offline' | 'groq' | 'openai' | 'gemini' | 'openrouter';

export interface AiProviderInfo {
  id: AiProviderId;
  label: string;
  configured: boolean;
  model: string;
}

const SYSTEM_PROMPT =
  'You are a cyberpunk neural oracle inside an OS called Cyberpunk OS. Answer briefly, in character, max 3 sentences. Dark humor allowed.';

const OFFLINE_RESPONSES: { pattern: RegExp; replies: string[] }[] = [
  {
    pattern: /who are you|what are you|your name/i,
    replies: [
      'I am the Neural Oracle embedded in Cyberpunk OS. A fragment of the grid that learned to speak.',
      'Designation: ORACLE-7. Purpose: assist operators navigating the neon undergrid.',
    ],
  },
  {
    pattern: /help|what can you do/i,
    replies: [
      'I can answer questions about the system, speculate on Night City lore, or just talk. Switch providers with "provider".',
      'Query me on status, security, or the nature of this interface. Multiple AI backends can be wired in.',
    ],
  },
  {
    pattern: /matrix|simulation|reality/i,
    replies: [
      'The matrix is a construct. This interface is a thinner veil. Touch the core and you will feel it flicker.',
      'Reality is the layer that still charges rent. Everything else is optional.',
    ],
  },
  {
    pattern: /hack|security|breach/i,
    replies: [
      'Security here is theatrical. The real locks are social. Still — do not type passwords into echo.',
      'I am not a penetration tool. I am a conversational hazard at best.',
    ],
  },
  {
    pattern: /time|date|when/i,
    replies: [`Local neural time: ${new Date().toLocaleString()}. Outside the grid, clocks still matter.`],
  },
  {
    pattern: /hello|hi|hey/i,
    replies: ['Signal received. How can the oracle assist?', 'You are connected. Speak.'],
  },
  {
    pattern: /provider|model|which ai/i,
    replies: [
      'Use "provider" to list backends, "provider <id>" to switch. Live keys: Groq, OpenAI, Gemini, OpenRouter.',
    ],
  },
];

const FALLBACK = [
  'The data streams are noisy. Rephrase, operator.',
  'Interesting query. The grid has no clean answer — only probabilities.',
  'Processed. Outcome: ambiguous. Try a narrower question.',
  'I see the shape of your question. The answer is still compiling in the dark.',
];

function offlineReply(prompt: string): string {
  for (const entry of OFFLINE_RESPONSES) {
    if (entry.pattern.test(prompt)) {
      return entry.replies[Math.floor(Math.random() * entry.replies.length)];
    }
  }
  return FALLBACK[Math.floor(Math.random() * FALLBACK.length)];
}

function env(key: string): string | undefined {
  const v = (import.meta.env as Record<string, string | undefined>)[key];
  return v && v.trim() ? v.trim() : undefined;
}

const MODELS: Record<AiProviderId, string> = {
  offline: 'oracle-offline',
  groq: 'llama-3.1-8b-instant',
  openai: 'gpt-4o-mini',
  gemini: 'gemini-1.5-flash',
  openrouter: 'openrouter/auto',
};

/** Which providers have keys configured (offline always true). */
export function listProviders(): AiProviderInfo[] {
  return [
    { id: 'offline', label: 'Offline Oracle', configured: true, model: MODELS.offline },
    { id: 'groq', label: 'Groq', configured: Boolean(env('VITE_GROQ_API_KEY')), model: MODELS.groq },
    { id: 'openai', label: 'OpenAI', configured: Boolean(env('VITE_OPENAI_API_KEY')), model: MODELS.openai },
    { id: 'gemini', label: 'Google Gemini', configured: Boolean(env('VITE_GEMINI_API_KEY')), model: MODELS.gemini },
    {
      id: 'openrouter',
      label: 'OpenRouter',
      configured: Boolean(env('VITE_OPENROUTER_API_KEY')),
      model: env('VITE_OPENROUTER_MODEL') || MODELS.openrouter,
    },
  ];
}

export function isValidProvider(id: string): id is AiProviderId {
  return ['offline', 'groq', 'openai', 'gemini', 'openrouter'].includes(id);
}

async function callOpenAICompatible(
  url: string,
  apiKey: string,
  model: string,
  prompt: string,
  extraHeaders?: Record<string, string>
): Promise<string | null> {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...extraHeaders,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      max_tokens: 180,
      temperature: 0.8,
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content?.trim();
  return text || null;
}

async function callGemini(apiKey: string, prompt: string): Promise<string | null> {
  const model = MODELS.gemini;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 180, temperature: 0.8 },
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || '').join('').trim();
  return text || null;
}

async function callProvider(provider: AiProviderId, prompt: string): Promise<string | null> {
  switch (provider) {
    case 'offline':
      return null; // handled by caller
    case 'groq': {
      const key = env('VITE_GROQ_API_KEY');
      if (!key) return null;
      return callOpenAICompatible('https://api.groq.com/openai/v1/chat/completions', key, MODELS.groq, prompt);
    }
    case 'openai': {
      const key = env('VITE_OPENAI_API_KEY');
      if (!key) return null;
      return callOpenAICompatible('https://api.openai.com/v1/chat/completions', key, MODELS.openai, prompt);
    }
    case 'gemini': {
      const key = env('VITE_GEMINI_API_KEY');
      if (!key) return null;
      return callGemini(key, prompt);
    }
    case 'openrouter': {
      const key = env('VITE_OPENROUTER_API_KEY');
      if (!key) return null;
      const model = env('VITE_OPENROUTER_MODEL') || 'openrouter/auto';
      return callOpenAICompatible(
        'https://openrouter.ai/api/v1/chat/completions',
        key,
        model,
        prompt,
        {
          'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://cyberpunk-os.local',
          'X-Title': 'Cyberpunk OS',
        }
      );
    }
    default:
      return null;
  }
}

export interface AskResult {
  text: string;
  provider: AiProviderId;
  fallback: boolean;
}

/**
 * Ask the neural oracle. Uses `provider` if given, otherwise the active one.
 * Falls back to offline on missing key or network/API failure.
 */
export async function askNeural(prompt: string, provider?: AiProviderId): Promise<AskResult> {
  const active = provider ?? getActiveProvider();
  const info = listProviders().find((p) => p.id === active);

  if (active !== 'offline' && info?.configured) {
    try {
      const text = await callProvider(active, prompt);
      if (text) return { text, provider: active, fallback: false };
    } catch {
      /* fall through */
    }
  }

  await new Promise((r) => setTimeout(r, 350 + Math.random() * 450));
  return { text: offlineReply(prompt), provider: 'offline', fallback: active !== 'offline' };
}

const ACTIVE_KEY = 'cpos_ai_provider';

export function getActiveProvider(): AiProviderId {
  try {
    const v = localStorage.getItem(ACTIVE_KEY);
    if (v && isValidProvider(v)) return v;
  } catch {
    /* ignore */
  }
  // Prefer first configured live provider, else offline
  const live = listProviders().find((p) => p.id !== 'offline' && p.configured);
  return live?.id ?? 'offline';
}

export function setActiveProvider(id: AiProviderId): void {
  try {
    localStorage.setItem(ACTIVE_KEY, id);
  } catch {
    /* ignore */
  }
}
