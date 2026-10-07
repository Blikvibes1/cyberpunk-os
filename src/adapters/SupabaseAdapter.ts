/**
 * Supabase adapter — auth + optional data access.
 * App runs fully offline when env vars are missing.
 */

import { createClient, SupabaseClient, AuthError, User } from '@supabase/supabase-js';
import { getConfig } from '../config/config';

export class SupabaseAdapter {
  public client: SupabaseClient | null = null;

  constructor() {
    const config = getConfig();
    if (config.VITE_SUPABASE_URL && config.VITE_SUPABASE_ANON_KEY) {
      this.client = createClient(config.VITE_SUPABASE_URL, config.VITE_SUPABASE_ANON_KEY);
    }
  }

  isReady(): boolean {
    return this.client !== null;
  }

  async signIn(email: string, password: string): Promise<{ user: User | null; error: AuthError | null }> {
    if (!this.client) {
      return {
        user: null,
        error: { message: 'Supabase not configured', name: 'Config', status: 0 } as AuthError,
      };
    }
    const { data, error } = await this.client.auth.signInWithPassword({ email, password });
    return { user: data.user, error };
  }

  async signUp(email: string, password: string): Promise<{ user: User | null; error: AuthError | null }> {
    if (!this.client) {
      return {
        user: null,
        error: { message: 'Supabase not configured', name: 'Config', status: 0 } as AuthError,
      };
    }
    const { data, error } = await this.client.auth.signUp({ email, password });
    return { user: data.user, error };
  }

  async signOut(): Promise<void> {
    await this.client?.auth.signOut();
  }

  async getSession() {
    if (!this.client) return null;
    const { data } = await this.client.auth.getSession();
    return data.session;
  }
}

let singleton: SupabaseAdapter | null = null;
export const getSupabase = () => {
  if (!singleton) singleton = new SupabaseAdapter();
  return singleton;
};
