import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { persist, WindowSnapshot } from '../lib/persistence';
import { getAchievement } from '../lib/achievements';
import type { PresenceUser } from '../lib/multiplayer';

export type LogLevel = 'info' | 'success' | 'warn' | 'error' | 'system';
export type AuthStatus = 'guest' | 'authenticating' | 'authenticated' | 'offline';

export interface LogEntry {
  id: string;
  message: string;
  timestamp: string;
  level: LogLevel;
}

export interface ToastItem {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warn' | 'error';
}

export interface TerminalWindow {
  id: string;
  title: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minimized: boolean;
  zIndex: number;
  log: LogEntry[];
}

interface CyberpunkState {
  systemTime: string;
  authStatus: AuthStatus;
  username: string | null;
  commandHistory: string[];
  aliases: Record<string, string>;
  showLogin: boolean;
  showUserPanel: boolean;
  booted: boolean;
  toasts: ToastItem[];
  soundEnabled: boolean;
  windows: TerminalWindow[];
  nextWindowId: number;
  focusedWindowId: string | null;
  achievements: string[];
  commandCount: number;
  corePulse: number;
  theme: 'cyan' | 'magenta' | 'green';
  cwd: string;
  presenceUsers: PresenceUser[];
  multiplayerMode: 'off' | 'live' | 'simulated';
  showPresence: boolean;

  addLog: (message: string, level?: LogLevel, windowId?: string) => void;
  clearLog: (windowId?: string) => void;
  addToHistory: (cmd: string) => void;
  updateTime: () => void;
  setAuthStatus: (s: AuthStatus) => void;
  setShowLogin: (v: boolean) => void;
  setShowUserPanel: (v: boolean) => void;
  setBooted: (v: boolean) => void;
  login: (username: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  addToast: (message: string, type?: ToastItem['type']) => void;
  removeToast: (id: string) => void;
  toggleSound: () => void;
  openWindow: (title?: string) => string;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  moveWindow: (id: string, x: number, y: number) => void;
  resizeWindow: (id: string, w: number, h: number) => void;
  setAlias: (name: string, command: string) => void;
  removeAlias: (name: string) => void;
  resolveAlias: (input: string) => string;
  unlockAchievement: (id: string) => void;
  saveWorkspace: () => void;
  loadWorkspace: () => boolean;
  pulseCore: () => void;
  incrementCommandCount: () => void;
  setTheme: (t: 'cyan' | 'magenta' | 'green') => void;
  setCwd: (path: string) => void;
  setPresenceUsers: (u: PresenceUser[]) => void;
  setMultiplayerMode: (m: 'off' | 'live' | 'simulated') => void;
  setShowPresence: (v: boolean) => void;
}

function bootLog(): LogEntry[] {
  const ts = () => new Date().toLocaleTimeString();
  return [
    { id: 'boot', message: 'NEURAL LINK ESTABLISHED // CYBERPUNK OS v0.3.0', timestamp: ts(), level: 'system' },
    { id: 'boot2', message: 'Guest session. Type "help" | "login" | "window".', timestamp: ts(), level: 'info' },
  ];
}

export const useCyberpunkStore = create<CyberpunkState>()(
  subscribeWithSelector((set, get) => ({
    systemTime: new Date().toLocaleTimeString(),
    authStatus: 'guest',
    username: persist.username.load(),
    commandHistory: persist.history.load(),
    aliases: persist.aliases.load(),
    showLogin: false,
    showUserPanel: false,
    booted: false,
    toasts: [],
    soundEnabled: true,
    windows: [],
    nextWindowId: 1,
    focusedWindowId: null,
    achievements: persist.achievements.load(),
    commandCount: 0,
    corePulse: 0,
    theme: (localStorage.getItem('cpos_theme') as any) || 'cyan',
    cwd: '/home/guest',
    presenceUsers: [],
    multiplayerMode: 'off',
    showPresence: true,

    addLog: (message, level = 'info', windowId) => {
      const entry: LogEntry = {
        id: crypto.randomUUID(),
        message,
        timestamp: new Date().toLocaleTimeString(),
        level,
      };
      set((state) => {
        const targetId = windowId ?? state.focusedWindowId ?? state.windows[0]?.id;
        if (!targetId) return state;
        return {
          windows: state.windows.map((w) =>
            w.id === targetId ? { ...w, log: [...w.log.slice(-100), entry] } : w
          ),
        };
      });
    },

    clearLog: (windowId) => {
      set((state) => {
        const targetId = windowId ?? state.focusedWindowId;
        if (!targetId) return state;
        return {
          windows: state.windows.map((w) =>
            w.id === targetId ? { ...w, log: [] } : w
          ),
        };
      });
    },

    addToHistory: (cmd) => {
      const t = cmd.trim();
      if (!t) return;
      set((s) => {
        const next = [t, ...s.commandHistory.filter((c) => c !== t)].slice(0, 50);
        persist.history.save(next);
        return { commandHistory: next };
      });
    },

    updateTime: () => set({ systemTime: new Date().toLocaleTimeString() }),
    setAuthStatus: (authStatus) => set({ authStatus }),
    setShowLogin: (showLogin) => set({ showLogin }),
    setShowUserPanel: (showUserPanel) => set({ showUserPanel }),
    setBooted: (booted) => {
      set({ booted });
      if (booted) get().unlockAchievement('first_boot');
    },

    login: (username) => {
      persist.username.save(username);
      set({ username, authStatus: 'authenticated', showLogin: false, showUserPanel: true });
      get().unlockAchievement('first_login');
    },

    logout: () => {
      persist.username.save(null);
      set({ username: null, authStatus: 'guest', showUserPanel: false });
    },

    isAuthenticated: () => get().authStatus === 'authenticated',

    addToast: (message, type = 'info') => {
      const id = crypto.randomUUID();
      set((s) => ({ toasts: [...s.toasts.slice(-4), { id, message, type }] }));
    },

    removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

    toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),

    openWindow: (title = 'NEURAL TERMINAL') => {
      const id = `win-${get().nextWindowId}`;
      const offset = (get().nextWindowId % 5) * 28;
      const maxZ = Math.max(10, ...get().windows.map((w) => w.zIndex), 10);
      const win: TerminalWindow = {
        id,
        title: `${title} #${get().nextWindowId}`,
        x: 40 + offset,
        y: 80 + offset,
        w: 480,
        h: 340,
        minimized: false,
        zIndex: maxZ + 1,
        log: bootLog(),
      };
      set((s) => ({
        windows: [...s.windows, win],
        nextWindowId: s.nextWindowId + 1,
        focusedWindowId: id,
      }));
      // check after state update
      setTimeout(() => {
        if (get().windows.filter((w) => !w.minimized).length >= 2) {
          get().unlockAchievement('multi_window');
        }
      }, 0);
      return id;
    },

    closeWindow: (id) =>
      set((s) => {
        const next = s.windows.filter((w) => w.id !== id);
        return {
          windows: next,
          focusedWindowId:
            s.focusedWindowId === id ? next[next.length - 1]?.id ?? null : s.focusedWindowId,
        };
      }),

    minimizeWindow: (id) =>
      set((s) => ({
        windows: s.windows.map((w) => (w.id === id ? { ...w, minimized: true } : w)),
      })),

    restoreWindow: (id) => {
      const maxZ = Math.max(10, ...get().windows.map((w) => w.zIndex), 10);
      set((s) => ({
        windows: s.windows.map((w) =>
          w.id === id ? { ...w, minimized: false, zIndex: maxZ + 1 } : w
        ),
        focusedWindowId: id,
      }));
    },

    focusWindow: (id) => {
      const maxZ = Math.max(10, ...get().windows.map((w) => w.zIndex), 10);
      set((s) => ({
        windows: s.windows.map((w) =>
          w.id === id ? { ...w, zIndex: maxZ + 1, minimized: false } : w
        ),
        focusedWindowId: id,
      }));
    },

    moveWindow: (id, x, y) =>
      set((s) => ({
        windows: s.windows.map((w) => (w.id === id ? { ...w, x, y } : w)),
      })),

    resizeWindow: (id, w, h) =>
      set((s) => ({
        windows: s.windows.map((win) =>
          win.id === id ? { ...win, w: Math.max(320, w), h: Math.max(200, h) } : win
        ),
      })),

    setAlias: (name, command) => {
      set((s) => {
        const aliases = { ...s.aliases, [name.toLowerCase()]: command };
        persist.aliases.save(aliases);
        return { aliases };
      });
      get().unlockAchievement('alias_master');
    },

    removeAlias: (name) =>
      set((s) => {
        const aliases = { ...s.aliases };
        delete aliases[name.toLowerCase()];
        persist.aliases.save(aliases);
        return { aliases };
      }),

    resolveAlias: (input) => {
      const parts = input.trim().split(/\s+/);
      const head = parts[0]?.toLowerCase();
      const aliases = get().aliases;
      if (head && aliases[head]) {
        return [aliases[head], ...parts.slice(1)].join(' ');
      }
      return input;
    },

    unlockAchievement: (id) => {
      if (get().achievements.includes(id)) return;
      const def = getAchievement(id);
      set((s) => {
        const achievements = [...s.achievements, id];
        persist.achievements.save(achievements);
        return { achievements };
      });
      if (def) get().addToast(`Achievement: ${def.title}`, 'success');
    },

    saveWorkspace: () => {
      const s = get();
      persist.workspace.save({
        windows: s.windows.map((w) => ({
          id: w.id, title: w.title, x: w.x, y: w.y, w: w.w, h: w.h,
          minimized: w.minimized, zIndex: w.zIndex,
        })),
        aliases: s.aliases,
        soundEnabled: s.soundEnabled,
        nextWindowId: s.nextWindowId,
      });
      get().unlockAchievement('workspace_save');
      get().addToast('Workspace saved', 'success');
    },

    loadWorkspace: () => {
      const snap = persist.workspace.load();
      if (!snap || !snap.windows?.length) return false;
      set({
        windows: snap.windows.map((w) => ({ ...w, log: bootLog() })),
        aliases: snap.aliases ?? {},
        soundEnabled: snap.soundEnabled ?? true,
        nextWindowId: snap.nextWindowId ?? snap.windows.length + 1,
        focusedWindowId: snap.windows.find((w) => !w.minimized)?.id ?? snap.windows[0]?.id,
      });
      get().addToast('Workspace restored', 'info');
      return true;
    },

    pulseCore: () => {
      set((s) => ({ corePulse: s.corePulse + 1 }));
      get().unlockAchievement('core_click');
      get().addLog('Core interaction detected. Resonance +1.', 'system');
      get().addToast('Core resonance detected', 'info');
    },

    setTheme: (theme) => {
      localStorage.setItem('cpos_theme', theme);
      document.documentElement.setAttribute('data-theme', theme);
      set({ theme });
    },
    setCwd: (cwd) => set({ cwd }),
    setPresenceUsers: (presenceUsers) => set({ presenceUsers }),
    setMultiplayerMode: (multiplayerMode) => set({ multiplayerMode }),
    setShowPresence: (showPresence) => set({ showPresence }),

    incrementCommandCount: () => {
      set((s) => {
        const commandCount = s.commandCount + 1;
        if (commandCount === 10) get().unlockAchievement('ten_commands');
        return { commandCount };
      });
    },
  }))
);

export const selectSystemTime = (s: CyberpunkState) => s.systemTime;
export const selectAuthStatus = (s: CyberpunkState) => s.authStatus;
export const selectUsername = (s: CyberpunkState) => s.username;
export const selectShowLogin = (s: CyberpunkState) => s.showLogin;
export const selectShowUserPanel = (s: CyberpunkState) => s.showUserPanel;
export const selectBooted = (s: CyberpunkState) => s.booted;
export const selectWindows = (s: CyberpunkState) => s.windows;
export const selectFocusedWindowId = (s: CyberpunkState) => s.focusedWindowId;
export const selectCorePulse = (s: CyberpunkState) => s.corePulse;
