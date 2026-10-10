import { z } from 'zod';

const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url().optional().or(z.literal('')),
  VITE_SUPABASE_ANON_KEY: z.string().optional().or(z.literal('')),
  VITE_GROQ_API_KEY: z.string().optional().or(z.literal('')),
  VITE_OPENAI_API_KEY: z.string().optional().or(z.literal('')),
  VITE_GEMINI_API_KEY: z.string().optional().or(z.literal('')),
  VITE_OPENROUTER_API_KEY: z.string().optional().or(z.literal('')),
  VITE_OPENROUTER_MODEL: z.string().optional().or(z.literal('')),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function getConfig(): EnvConfig {
  try {
    return envSchema.parse({
      VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || '',
      VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
      VITE_GROQ_API_KEY: import.meta.env.VITE_GROQ_API_KEY || '',
      VITE_OPENAI_API_KEY: import.meta.env.VITE_OPENAI_API_KEY || '',
      VITE_GEMINI_API_KEY: import.meta.env.VITE_GEMINI_API_KEY || '',
      VITE_OPENROUTER_API_KEY: import.meta.env.VITE_OPENROUTER_API_KEY || '',
      VITE_OPENROUTER_MODEL: import.meta.env.VITE_OPENROUTER_MODEL || '',
    });
  } catch {
    return {};
  }
}

export function hasSupabase(): boolean {
  const c = getConfig();
  return Boolean(c.VITE_SUPABASE_URL && c.VITE_SUPABASE_ANON_KEY);
}
