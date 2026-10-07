/**
 * Neural AI assistant — offline cyberpunk responses + optional free API
 * Set VITE_GROQ_API_KEY for live Groq (free tier) responses.
 */

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
      'I can answer questions about the system, speculate on Night City lore, or just talk. Try: ask what is the matrix',
      'Query me on status, security, or the nature of this interface. I am mostly helpful.',
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
    replies: [
      `Local neural time: ${new Date().toLocaleString()}. Outside the grid, clocks still matter.`,
    ],
  },
  {
    pattern: /hello|hi|hey/i,
    replies: [
      'Signal received. How can the oracle assist?',
      'You are connected. Speak.',
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

export async function askNeural(prompt: string): Promise<string> {
  const key = import.meta.env.VITE_GROQ_API_KEY as string | undefined;

  if (key) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'system',
              content:
                'You are a cyberpunk neural oracle inside an OS called Cyberpunk OS. Answer briefly, in character, max 3 sentences. Dark humor allowed.',
            },
            { role: 'user', content: prompt },
          ],
          max_tokens: 150,
          temperature: 0.8,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data?.choices?.[0]?.message?.content?.trim();
        if (text) return text;
      }
    } catch {
      /* fall through to offline */
    }
  }

  // Simulate thinking delay
  await new Promise((r) => setTimeout(r, 400 + Math.random() * 600));
  return offlineReply(prompt);
}
