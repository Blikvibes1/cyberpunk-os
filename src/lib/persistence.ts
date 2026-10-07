/**
 * localStorage persistence for history, aliases, achievements, workspace
 */

const KEYS = {
  history: 'cpos_history',
  aliases: 'cpos_aliases',
  achievements: 'cpos_achievements',
  workspace: 'cpos_workspace',
  username: 'cpos_username',
} as const;

export function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota or private mode */
  }
}

export const persist = {
  history: {
    load: () => loadJSON<string[]>(KEYS.history, []),
    save: (v: string[]) => saveJSON(KEYS.history, v),
  },
  aliases: {
    load: () => loadJSON<Record<string, string>>(KEYS.aliases, {}),
    save: (v: Record<string, string>) => saveJSON(KEYS.aliases, v),
  },
  achievements: {
    load: () => loadJSON<string[]>(KEYS.achievements, []),
    save: (v: string[]) => saveJSON(KEYS.achievements, v),
  },
  workspace: {
    load: () => loadJSON<WorkspaceSnapshot | null>(KEYS.workspace, null),
    save: (v: WorkspaceSnapshot) => saveJSON(KEYS.workspace, v),
  },
  username: {
    load: () => localStorage.getItem(KEYS.username),
    save: (v: string | null) => {
      if (v) localStorage.setItem(KEYS.username, v);
      else localStorage.removeItem(KEYS.username);
    },
  },
};

export interface WindowSnapshot {
  id: string;
  title: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minimized: boolean;
  zIndex: number;
}

export interface WorkspaceSnapshot {
  windows: WindowSnapshot[];
  aliases: Record<string, string>;
  soundEnabled: boolean;
  nextWindowId: number;
}
