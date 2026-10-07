/**
 * Multiplayer presence via Supabase Realtime (optional).
 * Falls back to simulated peer activity when not configured.
 */

import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { getConfig } from '../config/config';

export interface PresenceUser {
  id: string;
  name: string;
  online_at: string;
  simulated?: boolean;
}

type PresenceListener = (users: PresenceUser[]) => void;
type BroadcastListener = (payload: { user: string; message: string }) => void;

class MultiplayerService {
  private client: SupabaseClient | null = null;
  private channel: RealtimeChannel | null = null;
  private presenceListeners = new Set<PresenceListener>();
  private broadcastListeners = new Set<BroadcastListener>();
  private simulated: PresenceUser[] = [];
  private simTimer: ReturnType<typeof setInterval> | null = null;
  private selfId = crypto.randomUUID();
  private selfName = 'guest';

  isLive(): boolean {
    return this.client !== null && this.channel !== null;
  }

  async connect(displayName: string): Promise<'live' | 'simulated'> {
    this.selfName = displayName || 'guest';
    const config = getConfig();

    if (config.VITE_SUPABASE_URL && config.VITE_SUPABASE_ANON_KEY) {
      try {
        this.client = createClient(config.VITE_SUPABASE_URL, config.VITE_SUPABASE_ANON_KEY);
        this.channel = this.client.channel('cyberpunk-os-lobby', {
          config: { presence: { key: this.selfId } },
        });

        this.channel
          .on('presence', { event: 'sync' }, () => {
            const state = this.channel?.presenceState() ?? {};
            const users: PresenceUser[] = [];
            Object.values(state).forEach((arr: any) => {
              (arr as PresenceUser[]).forEach((u) => users.push(u));
            });
            this.emitPresence(users);
          })
          .on('broadcast', { event: 'terminal' }, ({ payload }) => {
            this.broadcastListeners.forEach((fn) => fn(payload as any));
          });

        await this.channel.subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await this.channel?.track({
              id: this.selfId,
              name: this.selfName,
              online_at: new Date().toISOString(),
            });
          }
        });

        this.stopSimulated();
        return 'live';
      } catch (e) {
        console.warn('Supabase multiplayer failed, using simulation', e);
        this.client = null;
        this.channel = null;
      }
    }

    this.startSimulated();
    return 'simulated';
  }

  async disconnect(): Promise<void> {
    this.stopSimulated();
    if (this.channel) {
      await this.channel.untrack();
      await this.client?.removeChannel(this.channel);
    }
    this.channel = null;
    this.client = null;
    this.emitPresence([]);
  }

  async broadcast(message: string): Promise<void> {
    if (this.channel) {
      await this.channel.send({
        type: 'broadcast',
        event: 'terminal',
        payload: { user: this.selfName, message },
      });
    }
  }

  onPresence(fn: PresenceListener): () => void {
    this.presenceListeners.add(fn);
    return () => this.presenceListeners.delete(fn);
  }

  onBroadcast(fn: BroadcastListener): () => void {
    this.broadcastListeners.add(fn);
    return () => this.broadcastListeners.delete(fn);
  }

  private emitPresence(users: PresenceUser[]) {
    this.presenceListeners.forEach((fn) => fn(users));
  }

  private startSimulated() {
    this.stopSimulated();
    const ghosts: PresenceUser[] = [
      { id: 'sim-1', name: 'netrunner_77', online_at: new Date().toISOString(), simulated: true },
      { id: 'sim-2', name: 'chrome_fox', online_at: new Date().toISOString(), simulated: true },
    ];
    this.simulated = [
      { id: this.selfId, name: this.selfName, online_at: new Date().toISOString() },
      ...ghosts,
    ];
    this.emitPresence(this.simulated);

    this.simTimer = setInterval(() => {
      const lines = [
        'scanned sector-4',
        'ping core',
        'status check',
        'alias s scan',
      ];
      const ghost = ghosts[Math.floor(Math.random() * ghosts.length)];
      const msg = lines[Math.floor(Math.random() * lines.length)];
      this.broadcastListeners.forEach((fn) =>
        fn({ user: ghost.name, message: msg })
      );
    }, 28000);
  }

  private stopSimulated() {
    if (this.simTimer) clearInterval(this.simTimer);
    this.simTimer = null;
    this.simulated = [];
  }
}

export const multiplayer = new MultiplayerService();
