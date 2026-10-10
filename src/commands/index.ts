import { commandBus, CommandHandler } from '../core/CommandBus';
import { useCyberpunkStore } from '../store/useCyberpunkStore';
import { sound } from '../lib/sound';
import {
  askNeural,
  listProviders,
  getActiveProvider,
  setActiveProvider,
  isValidProvider,
  type AiProviderId,
} from '../lib/ai';
import { ACHIEVEMENTS } from '../lib/achievements';
import { resolvePath, listDir, readFile, treeLines, getNode } from '../lib/fs';
import { multiplayer } from '../lib/multiplayer';
import { hasSupabase } from '../config/config';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const requireAuth = (addLog: (m: string, l?: any) => void): boolean => {
  if (!useCyberpunkStore.getState().isAuthenticated()) {
    addLog('Access denied. Authenticate first with "login".', 'error');
    return false;
  }
  return true;
};

const helpCommand: CommandHandler = {
  meta: { name: 'help', description: 'List commands or show details', usage: 'help [command]', aliases: ['?', 'h'] },
  async execute({ parsed, addLog }) {
    if (parsed.args[0]) {
      const cmd = commandBus.get(parsed.args[0]);
      if (!cmd) { addLog(`No such command: ${parsed.args[0]}`, 'error'); return; }
      addLog(`┌─ ${cmd.meta.name.toUpperCase()}`, 'system');
      addLog(`│  ${cmd.meta.description}`);
      if (cmd.meta.usage) addLog(`│  Usage: ${cmd.meta.usage}`);
      if (cmd.meta.aliases?.length) addLog(`│  Aliases: ${cmd.meta.aliases.join(', ')}`);
      addLog('└─', 'system');
      return;
    }
    addLog('═══ NEURAL COMMAND INTERFACE ═══', 'system');
    commandBus.getAll().sort((a, b) => a.meta.name.localeCompare(b.meta.name)).forEach((cmd) => {
      addLog(`  ${cmd.meta.name.padEnd(12)} ${cmd.meta.description}`);
    });
    const aliases = useCyberpunkStore.getState().aliases;
    if (Object.keys(aliases).length) {
      addLog('── Aliases ──', 'system');
      Object.entries(aliases).forEach(([k, v]) => addLog(`  ${k.padEnd(12)} → ${v}`));
    }
    addLog('Type "help <command>" for details.', 'system');
  },
};

const clearCommand: CommandHandler = {
  meta: { name: 'clear', description: 'Clear the terminal buffer', aliases: ['cls'] },
  execute() { useCyberpunkStore.getState().clearLog(); },
};

const statusCommand: CommandHandler = {
  meta: { name: 'status', description: 'System & neural link status', aliases: ['info', 'sys'] },
  async execute({ addLog }) {
    const { authStatus, systemTime, username, windows, achievements } = useCyberpunkStore.getState();
    addLog('┌─ SYSTEM STATUS', 'system');
    addLog(`│  Time          : ${systemTime}`);
    addLog(`│  Neural Link   : ${authStatus.toUpperCase()}`);
    addLog(`│  Identity      : ${username ?? 'guest'}`);
    addLog(`│  Windows       : ${windows.length}`);
    addLog(`│  Achievements  : ${achievements.length}`);
    addLog(`│  Uptime        : ${Math.floor(performance.now() / 1000)}s`);
    addLog('└─', 'system');
  },
};

const scanCommand: CommandHandler = {
  meta: { name: 'scan', description: 'Network / sector scan', usage: 'scan [target]', aliases: ['netscan'] },
  async execute({ parsed, addLog }) {
    const target = parsed.args[0] ?? 'local sector';
    sound.scan();
    addLog(`Initiating scan on "${target}"...`, 'system');
    await delay(500);
    addLog('  ▸ Sweeping frequency bands...', 'info');
    await delay(700);
    addLog('  ▸ 14 nodes detected', 'success');
    await delay(400);
    addLog('  ▸ 2 encrypted channels', 'warn');
    await delay(450);
    addLog(`Scan complete. Target "${target}" mapped.`, 'success');
    useCyberpunkStore.getState().addToast('Scan complete', 'success');
    useCyberpunkStore.getState().unlockAchievement('first_scan');
  },
};

const echoCommand: CommandHandler = {
  meta: { name: 'echo', description: 'Print arguments', usage: 'echo <text...>', minArgs: 1 },
  execute({ parsed, addLog }) { addLog(parsed.args.join(' ')); },
};

const loginCommand: CommandHandler = {
  meta: { name: 'login', description: 'Open neural authentication', aliases: ['auth'] },
  execute({ addLog }) {
    if (useCyberpunkStore.getState().isAuthenticated()) {
      addLog('Already authenticated. Use "logout".', 'warn');
      return;
    }
    addLog('Opening neural login interface...', 'system');
    useCyberpunkStore.getState().setShowLogin(true);
  },
};

const logoutCommand: CommandHandler = {
  meta: { name: 'logout', description: 'End neural session', aliases: ['signout'] },
  async execute({ addLog }) {
    if (!requireAuth(addLog)) return;
    const { username, logout } = useCyberpunkStore.getState();
    addLog(`Terminating session for ${username}...`, 'system');
    await delay(400);
    logout();
    addLog('Session terminated. Guest access.', 'warn');
  },
};

const whoamiCommand: CommandHandler = {
  meta: { name: 'whoami', description: 'Show current identity' },
  execute({ addLog }) {
    const { username, authStatus } = useCyberpunkStore.getState();
    addLog(authStatus === 'authenticated' && username
      ? `${username}@cyberpunk-os // AUTHENTICATED`
      : 'guest@cyberpunk-os // UNAUTHENTICATED');
  },
};

const profileCommand: CommandHandler = {
  meta: { name: 'profile', description: 'User profile (requires login)', aliases: ['me'] },
  async execute({ addLog }) {
    if (!requireAuth(addLog)) return;
    const { username, systemTime, achievements } = useCyberpunkStore.getState();
    addLog('┌─ NEURAL PROFILE', 'system');
    addLog(`│  Handle        : ${username}`);
    addLog(`│  Clearance     : LEVEL 3`);
    addLog(`│  Sector        : NIGHT CITY`);
    addLog(`│  Achievements  : ${achievements.length}`);
    addLog(`│  Access        : FULL`);
    addLog('└─', 'system');
  },
};

const matrixCommand: CommandHandler = {
  meta: { name: 'matrix', description: 'Enter data stream (requires login)', aliases: ['stream'] },
  async execute({ addLog }) {
    if (!requireAuth(addLog)) return;
    addLog('Connecting to data stream...', 'system');
    await delay(400);
    const lines = [
      '01001000 01100101 01101100 01101100 01101111',
      '01001110 01100101 01110101 01110010 01100001',
      '01001100 01101001 01101110 01101011 00100000',
      '01000011 01111001 01100010 01100101 01110010',
    ];
    for (const line of lines) { addLog(line, 'info'); await delay(280); }
    addLog('Stream connection stable.', 'success');
    useCyberpunkStore.getState().unlockAchievement('matrix_dive');
  },
};

const panelCommand: CommandHandler = {
  meta: { name: 'panel', description: 'Toggle user panel (requires login)', aliases: ['hud'] },
  execute({ addLog }) {
    if (!requireAuth(addLog)) return;
    const { showUserPanel, setShowUserPanel } = useCyberpunkStore.getState();
    setShowUserPanel(!showUserPanel);
    addLog(showUserPanel ? 'User panel hidden.' : 'User panel visible.', 'system');
  },
};

const windowCommand: CommandHandler = {
  meta: { name: 'window', description: 'Open a new terminal window', usage: 'window [title]', aliases: ['term', 'new'] },
  execute({ parsed, addLog }) {
    const title = parsed.args.join(' ') || undefined;
    const id = useCyberpunkStore.getState().openWindow(title);
    addLog(`Opened window ${id}`, 'success');
    sound.click();
  },
};

const aliasCommand: CommandHandler = {
  meta: { name: 'alias', description: 'Create or list command aliases', usage: 'alias [name] [command...]' },
  execute({ parsed, addLog }) {
    const { aliases, setAlias, removeAlias } = useCyberpunkStore.getState();
    if (!parsed.args.length) {
      if (!Object.keys(aliases).length) { addLog('No aliases defined.', 'info'); return; }
      addLog('── Aliases ──', 'system');
      Object.entries(aliases).forEach(([k, v]) => addLog(`  ${k} → ${v}`));
      return;
    }
    if (parsed.args.length === 1) {
      removeAlias(parsed.args[0]);
      addLog(`Removed alias: ${parsed.args[0]}`, 'warn');
      return;
    }
    const name = parsed.args[0];
    const cmd = parsed.args.slice(1).join(' ');
    setAlias(name, cmd);
    addLog(`Alias set: ${name} → ${cmd}`, 'success');
  },
};

const askCommand: CommandHandler = {
  meta: {
    name: 'ask',
    description: 'Consult the neural AI oracle (multi-provider)',
    usage: 'ask [@provider] <question>',
    aliases: ['ai', 'oracle'],
    minArgs: 1,
  },
  async execute({ parsed, addLog }) {
    let args = [...parsed.args];
    let override: AiProviderId | undefined;

    // ask @groq what is the matrix  |  ask --openai hello
    if (args[0]?.startsWith('@') || args[0]?.startsWith('--')) {
      const raw = args[0].replace(/^@/, '').replace(/^--/, '').toLowerCase();
      if (isValidProvider(raw)) {
        override = raw;
        args = args.slice(1);
      }
    }

    if (!args.length) {
      addLog('Usage: ask [@provider] <question>', 'warn');
      addLog('Providers: offline | groq | openai | gemini | openrouter', 'info');
      return;
    }

    const prompt = args.join(' ');
    const active = override ?? getActiveProvider();
    addLog(`Oracle [${active}] ← ${prompt}`, 'system');
    addLog('Thinking...', 'info');
    const result = await askNeural(prompt, override);
    if (result.fallback) {
      addLog(`Live provider failed or unconfigured — fell back to offline.`, 'warn');
    }
    addLog(`Oracle [${result.provider}] → ${result.text}`, 'success');
    useCyberpunkStore.getState().unlockAchievement('first_ask');
  },
};

const providerCommand: CommandHandler = {
  meta: {
    name: 'provider',
    description: 'List or switch AI backends',
    usage: 'provider [offline|groq|openai|gemini|openrouter]',
    aliases: ['providers', 'model'],
  },
  execute({ parsed, addLog }) {
    const arg = parsed.args[0]?.toLowerCase();
    if (arg) {
      if (!isValidProvider(arg)) {
        addLog(`Unknown provider: ${arg}`, 'error');
        addLog('Valid: offline | groq | openai | gemini | openrouter', 'info');
        return;
      }
      const info = listProviders().find((p) => p.id === arg)!;
      if (arg !== 'offline' && !info.configured) {
        addLog(`${info.label} has no API key in env. Still selecting it — ask will fall back to offline until configured.`, 'warn');
      }
      setActiveProvider(arg);
      addLog(`Active AI provider → ${info.label} (${info.model})`, 'success');
      return;
    }

    const active = getActiveProvider();
    addLog('AI providers:', 'system');
    for (const p of listProviders()) {
      const mark = p.id === active ? '●' : '○';
      const status = p.configured ? 'ready' : 'no key';
      addLog(`  ${mark} ${p.id.padEnd(11)} ${p.label.padEnd(16)} [${status}] model=${p.model}`, 'info');
    }
    addLog('Switch: provider <id>   One-shot: ask @groq <question>', 'system');
  },
};

const saveCommand: CommandHandler = {
  meta: { name: 'save', description: 'Save workspace (windows, aliases)', aliases: ['wsave'] },
  execute({ addLog }) {
    useCyberpunkStore.getState().saveWorkspace();
    addLog('Workspace persisted to local storage.', 'success');
  },
};

const loadCommand: CommandHandler = {
  meta: { name: 'load', description: 'Restore saved workspace', aliases: ['wload'] },
  execute({ addLog }) {
    const ok = useCyberpunkStore.getState().loadWorkspace();
    addLog(ok ? 'Workspace restored.' : 'No saved workspace found.', ok ? 'success' : 'warn');
  },
};

const achievementsCommand: CommandHandler = {
  meta: { name: 'achievements', description: 'List unlocked achievements', aliases: ['ach', 'badges'] },
  execute({ addLog }) {
    const unlocked = useCyberpunkStore.getState().achievements;
    addLog('═══ ACHIEVEMENTS ═══', 'system');
    ACHIEVEMENTS.forEach((a) => {
      const done = unlocked.includes(a.id);
      addLog(`  ${done ? '✓' : '·'} ${a.icon} ${a.title.padEnd(20)} ${a.description}`, done ? 'success' : 'info');
    });
    addLog(`${unlocked.length}/${ACHIEVEMENTS.length} unlocked`, 'system');
  },
};

const muteCommand: CommandHandler = {
  meta: { name: 'mute', description: 'Toggle sound', aliases: ['sound'] },
  execute({ addLog }) {
    const { soundEnabled, toggleSound } = useCyberpunkStore.getState();
    toggleSound();
    sound.setEnabled(!soundEnabled);
    addLog(soundEnabled ? 'Sound disabled.' : 'Sound enabled.', 'system');
  },
};

const aboutCommand: CommandHandler = {
  meta: { name: 'about', description: 'About Cyberpunk OS', aliases: ['version'] },
  execute({ addLog }) {
    addLog('┌─ CYBERPUNK OS v0.3.0', 'system');
    addLog('│  Multi-window · Genie minimize · 3D interaction');
    addLog('│  Achievements · AI oracle · Workspace persist');
    addLog('│  React + R3F + Command Bus');
    addLog('└─', 'system');
  },
};


const pwdCommand: CommandHandler = {
  meta: { name: 'pwd', description: 'Print working directory' },
  execute({ addLog }) {
    addLog(useCyberpunkStore.getState().cwd);
  },
};

const lsCommand: CommandHandler = {
  meta: { name: 'ls', description: 'List directory contents', usage: 'ls [path]', aliases: ['dir'] },
  execute({ parsed, addLog }) {
    const cwd = useCyberpunkStore.getState().cwd;
    const target = parsed.args[0] ? resolvePath(cwd, parsed.args[0]) : cwd;
    const items = listDir(target);
    if (!items) { addLog(`Not a directory: ${target}`, 'error'); return; }
    if (!items.length) { addLog('(empty)', 'info'); return; }
    items.forEach((name) => {
      const node = getNode(target === '/' ? `/${name}` : `${target}/${name}`);
      addLog(`${node?.type === 'dir' ? 'dir ' : '    '}${name}`);
    });
  },
};

const cdCommand: CommandHandler = {
  meta: { name: 'cd', description: 'Change directory', usage: 'cd <path>' },
  execute({ parsed, addLog }) {
    const cwd = useCyberpunkStore.getState().cwd;
    const target = parsed.args[0] ? resolvePath(cwd, parsed.args[0]) : '/home/guest';
    const node = getNode(target);
    if (!node || node.type !== 'dir') { addLog(`No such directory: ${target}`, 'error'); return; }
    useCyberpunkStore.getState().setCwd(target);
    addLog(target, 'system');
  },
};

const catCommand: CommandHandler = {
  meta: { name: 'cat', description: 'Read a file', usage: 'cat <path>', minArgs: 1 },
  execute({ parsed, addLog }) {
    const cwd = useCyberpunkStore.getState().cwd;
    const target = resolvePath(cwd, parsed.args[0]);
    const content = readFile(target);
    if (content === null) { addLog(`No such file: ${target}`, 'error'); return; }
    content.split('\n').forEach((line) => addLog(line));
  },
};

const treeCommand: CommandHandler = {
  meta: { name: 'tree', description: 'Show directory tree', usage: 'tree [path]' },
  execute({ parsed, addLog }) {
    const cwd = useCyberpunkStore.getState().cwd;
    const target = parsed.args[0] ? resolvePath(cwd, parsed.args[0]) : cwd;
    treeLines(target).forEach((line) => addLog(line));
  },
};

const themeCommand: CommandHandler = {
  meta: { name: 'theme', description: 'Switch color theme', usage: 'theme cyan|magenta|green' },
  execute({ parsed, addLog }) {
    const t = (parsed.args[0] || '').toLowerCase();
    if (!['cyan', 'magenta', 'green'].includes(t)) {
      addLog('Usage: theme cyan | magenta | green', 'warn');
      addLog(`Current: ${useCyberpunkStore.getState().theme}`, 'info');
      return;
    }
    useCyberpunkStore.getState().setTheme(t as any);
    addLog(`Theme set to ${t}`, 'success');
  },
};

const presenceCommand: CommandHandler = {
  meta: { name: 'presence', description: 'Toggle multiplayer presence panel', aliases: ['who', 'peers'] },
  execute({ addLog }) {
    const { showPresence, setShowPresence, presenceUsers, multiplayerMode } = useCyberpunkStore.getState();
    setShowPresence(!showPresence);
    addLog(`Presence panel ${showPresence ? 'hidden' : 'shown'} (${multiplayerMode}, ${presenceUsers.length} peers)`, 'system');
  },
};

const joinCommand: CommandHandler = {
  meta: { name: 'join', description: 'Join multiplayer grid (Supabase or simulated)', aliases: ['mp'] },
  async execute({ addLog }) {
    const name = useCyberpunkStore.getState().username || 'guest';
    addLog('Connecting to grid...', 'system');
    const mode = await multiplayer.connect(name);
    useCyberpunkStore.getState().setMultiplayerMode(mode);
    useCyberpunkStore.getState().setShowPresence(true);
    multiplayer.onPresence((users) => {
      useCyberpunkStore.getState().setPresenceUsers(users);
    });
    if (mode === 'live') {
      addLog('Connected via Supabase Realtime.', 'success');
    } else {
      addLog('Supabase not configured — simulated peers online.', 'warn');
      addLog('Set VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY for live multiplayer.', 'info');
    }
  },
};

const leaveCommand: CommandHandler = {
  meta: { name: 'leave', description: 'Leave multiplayer grid' },
  async execute({ addLog }) {
    await multiplayer.disconnect();
    useCyberpunkStore.getState().setMultiplayerMode('off');
    useCyberpunkStore.getState().setPresenceUsers([]);
    addLog('Left the grid.', 'warn');
  },
};

const sayCommand: CommandHandler = {
  meta: { name: 'say', description: 'Broadcast message to grid peers', usage: 'say <message>', minArgs: 1 },
  async execute({ parsed, addLog }) {
    const msg = parsed.args.join(' ');
    if (useCyberpunkStore.getState().multiplayerMode === 'off') {
      addLog('Not on the grid. Use "join" first.', 'error');
      return;
    }
    await multiplayer.broadcast(msg);
    addLog(`[you] ${msg}`, 'success');
  },
};


export function registerBuiltinCommands(): void {
  [
    helpCommand, clearCommand, statusCommand, scanCommand, echoCommand,
    loginCommand, logoutCommand, whoamiCommand, profileCommand, matrixCommand,
    panelCommand, windowCommand, aliasCommand, askCommand, providerCommand, saveCommand,
    loadCommand, achievementsCommand, muteCommand, aboutCommand,
    pwdCommand, lsCommand, cdCommand, catCommand, treeCommand,
    themeCommand, presenceCommand, joinCommand, leaveCommand, sayCommand,
  ].forEach((cmd) => commandBus.register(cmd));
}
