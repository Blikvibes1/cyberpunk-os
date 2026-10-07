import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  useCyberpunkStore,
  LogLevel,
  TerminalWindow as Tw,
} from '../store/useCyberpunkStore';
import { commandBus } from '../core/CommandBus';
import { sound } from '../lib/sound';

const LEVEL_COLORS: Record<LogLevel, string> = {
  info: 'text-cyan-300/90',
  success: 'text-emerald-400',
  warn: 'text-amber-400',
  error: 'text-red-400',
  system: 'text-purple-300',
};

interface Props {
  win: Tw;
}

const TerminalWindow: React.FC<Props> = ({ win }) => {
  const focusWindow = useCyberpunkStore((s) => s.focusWindow);
  const closeWindow = useCyberpunkStore((s) => s.closeWindow);
  const minimizeWindow = useCyberpunkStore((s) => s.minimizeWindow);
  const moveWindow = useCyberpunkStore((s) => s.moveWindow);
  const resizeWindow = useCyberpunkStore((s) => s.resizeWindow);
  const commandHistory = useCyberpunkStore((s) => s.commandHistory);
  const addLog = useCyberpunkStore((s) => s.addLog);
  const addToHistory = useCyberpunkStore((s) => s.addToHistory);
  const resolveAlias = useCyberpunkStore((s) => s.resolveAlias);
  const incrementCommandCount = useCyberpunkStore((s) => s.incrementCommandCount);
  const focusedWindowId = useCyberpunkStore((s) => s.focusedWindowId);

  const [input, setInput] = useState('');
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  const [genieOut, setGenieOut] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<{ ox: number; oy: number; sx: number; sy: number } | null>(null);

  const isFocused = focusedWindowId === win.id;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [win.log]);

  useEffect(() => {
    if (isFocused && !win.minimized) inputRef.current?.focus();
  }, [isFocused, win.minimized]);

  const updateSuggestions = useCallback((value: string) => {
    if (!value.trim()) {
      setSuggestions([]);
      return;
    }
    const [cmdPart] = value.trim().split(/\s+/);
    const all = commandBus.getAll().map((h) => h.meta.name);
    const aliases = Object.keys(useCyberpunkStore.getState().aliases);
    const matches = [...all, ...aliases].filter((n) =>
      n.startsWith(cmdPart.toLowerCase())
    );
    setSuggestions([...new Set(matches)].slice(0, 6));
    setSelectedSuggestion(0);
  }, []);

  const runCommand = async (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    sound.click();
    addLog(`> ${trimmed}`, 'system', win.id);
    addToHistory(trimmed);
    setInput('');
    setSuggestions([]);
    setHistoryIndex(-1);
    incrementCommandCount();

    const resolved = resolveAlias(trimmed);
    if (resolved !== trimmed) {
      addLog(`(alias → ${resolved})`, 'info', win.id);
    }
    await commandBus.execute(resolved, (msg, level) => addLog(msg, level, win.id));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (suggestions.length > 0) {
        setSelectedSuggestion((i) => (i - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (commandHistory.length === 0) return;
      const next = Math.min(historyIndex + 1, commandHistory.length - 1);
      setHistoryIndex(next);
      setInput(commandHistory[next] ?? '');
      setSuggestions([]);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (suggestions.length > 0) {
        setSelectedSuggestion((i) => (i + 1) % suggestions.length);
        return;
      }
      if (historyIndex <= 0) {
        setHistoryIndex(-1);
        setInput('');
        return;
      }
      const next = historyIndex - 1;
      setHistoryIndex(next);
      setInput(commandHistory[next] ?? '');
      return;
    }
    if (e.key === 'Tab' && suggestions.length > 0) {
      e.preventDefault();
      const chosen = suggestions[selectedSuggestion];
      const parts = input.trim().split(/\s+/);
      parts[0] = chosen;
      setInput(parts.join(' ') + (parts.length === 1 ? ' ' : ''));
      setSuggestions([]);
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      runCommand(input);
    }
  };

  const onDragStart = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    focusWindow(win.id);
    dragRef.current = { ox: e.clientX, oy: e.clientY, sx: win.x, sy: win.y };
    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      moveWindow(
        win.id,
        dragRef.current.sx + (ev.clientX - dragRef.current.ox),
        Math.max(48, dragRef.current.sy + (ev.clientY - dragRef.current.oy))
      );
    };
    const onUp = () => {
      dragRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const handleMinimize = () => {
    sound.click();
    setGenieOut(true);
    setTimeout(() => {
      minimizeWindow(win.id);
      setGenieOut(false);
    }, 380);
  };

  if (win.minimized && !genieOut) return null;

  return (
    <div
      className={`terminal-window absolute flex flex-col bg-black/85 border border-cyan-500/50 backdrop-blur-md neon-border rounded-sm overflow-hidden
        ${isFocused ? 'ring-1 ring-cyan-400/40' : 'opacity-90'}
        ${genieOut ? 'genie-minimize' : ''}`}
      style={{
        left: win.x,
        top: win.y,
        width: win.w,
        height: win.h,
        zIndex: win.zIndex,
      }}
      onMouseDown={() => focusWindow(win.id)}
    >
      {/* Title bar — Omarchy/Hyprland-inspired */}
      <div
        className="flex items-center justify-between px-2 py-1.5 border-b border-cyan-500/30 cursor-move select-none bg-black/50"
        onMouseDown={onDragStart}
      >
        <div className="flex items-center gap-2 text-[10px] tracking-widest text-cyan-400/80">
          <span className="text-cyan-600">◈</span>
          {win.title}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleMinimize}
            className="w-5 h-5 flex items-center justify-center text-amber-400/80 hover:bg-amber-500/20 rounded-sm text-xs"
            title="Minimize (Genie)"
          >
            –
          </button>
          <button
            onClick={() => {
              sound.click();
              closeWindow(win.id);
            }}
            className="w-5 h-5 flex items-center justify-center text-red-400/80 hover:bg-red-500/20 rounded-sm text-xs"
            title="Close"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Log */}
      <div className="flex-1 overflow-y-auto terminal-scroll p-3 text-[11px] font-mono space-y-0.5 min-h-0">
        {win.log.length === 0 && (
          <div className="empty-hint">No output yet — type help</div>
        )}
        {win.log.map((log) => (
          <div key={log.id} className={`${LEVEL_COLORS[log.level]} leading-relaxed`}>
            <span className="text-cyan-700/60 select-none">[{log.timestamp}] </span>
            {log.message}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {suggestions.length > 0 && (
        <div className="border-t border-cyan-500/20 bg-black/90 px-3 py-1 text-[10px]">
          {suggestions.map((s, i) => (
            <span
              key={s}
              className={`inline-block mr-2 px-1.5 py-0.5 rounded ${
                i === selectedSuggestion ? 'bg-cyan-500/30 text-cyan-200' : 'text-cyan-500/70'
              }`}
            >
              {s}
            </span>
          ))}
          <span className="text-cyan-700/50">TAB</span>
        </div>
      )}

      <div className="flex items-center gap-2 px-3 py-2 border-t border-cyan-500/40 bg-black/60">
        <span className="text-cyan-400 select-none">❯</span>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setHistoryIndex(-1);
            updateSuggestions(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          autoComplete="off"
          className="flex-1 bg-transparent outline-none text-cyan-100 text-[12px] caret-cyan-400 placeholder:text-cyan-800"
          placeholder="command..."
        />
      </div>
      <div
        className="resize-handle"
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const sx = e.clientX;
          const sy = e.clientY;
          const sw = win.w;
          const sh = win.h;
          const onMove = (ev: MouseEvent) => {
            resizeWindow(win.id, sw + (ev.clientX - sx), sh + (ev.clientY - sy));
          };
          const onUp = () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
          };
          window.addEventListener('mousemove', onMove);
          window.addEventListener('mouseup', onUp);
        }}
      />
    </div>
  );
};

export default TerminalWindow;
