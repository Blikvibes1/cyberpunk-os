import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useCyberpunkStore, LogLevel } from '../store/useCyberpunkStore';
import { commandBus } from '../core/CommandBus';
import { sound } from '../lib/sound';

const LEVEL_COLORS: Record<LogLevel, string> = {
  info: 'text-cyan-300/90',
  success: 'text-emerald-400',
  warn: 'text-amber-400',
  error: 'text-red-400',
  system: 'text-purple-300',
};

const Terminal: React.FC = () => {
  // Legacy single-terminal view: bind to focused window log
  const terminalLog = useCyberpunkStore((s) => {
    const id = s.focusedWindowId;
    const win = s.windows.find((w) => w.id === id) ?? s.windows[0];
    return win?.log ?? [];
  });
  const commandHistory = useCyberpunkStore((s) => s.commandHistory);
  const addLog = useCyberpunkStore((s) => s.addLog);
  const addToHistory = useCyberpunkStore((s) => s.addToHistory);

  const [input, setInput] = useState('');
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLog]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const updateSuggestions = useCallback((value: string) => {
    if (!value.trim()) {
      setSuggestions([]);
      return;
    }
    const [cmdPart] = value.trim().split(/\s+/);
    const all = commandBus.getAll().map((h) => h.meta.name);
    const matches = all.filter((n) => n.startsWith(cmdPart.toLowerCase()));
    setSuggestions(matches.slice(0, 6));
    setSelectedSuggestion(0);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);
    setHistoryIndex(-1);
    updateSuggestions(val);
  };

  const runCommand = async (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;

    sound.click();
    addLog(`> ${trimmed}`, 'system');
    addToHistory(trimmed);
    setInput('');
    setSuggestions([]);
    setHistoryIndex(-1);

    await commandBus.execute(trimmed, addLog);
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

  return (
    <div
      className="absolute bottom-5 left-5 w-[480px] max-h-[360px] flex flex-col
                 bg-black/80 border border-cyan-500/50 backdrop-blur-md
                 neon-border rounded-sm overflow-hidden z-40"
      onClick={() => inputRef.current?.focus()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-cyan-500/30 text-[10px] tracking-widest text-cyan-400/70">
        <span>NEURAL TERMINAL // v0.2</span>
        <span className="animate-pulse text-emerald-400">● LIVE</span>
      </div>

      {/* Log */}
      <div className="flex-1 overflow-y-auto terminal-scroll p-3 text-[11px] font-mono space-y-0.5 min-h-[200px] max-h-[260px]">
        {terminalLog.map((log: import('../store/useCyberpunkStore').LogEntry) => (
          <div key={log.id} className={`${LEVEL_COLORS[log.level]} leading-relaxed`}>
            <span className="text-cyan-700/60 select-none">[{log.timestamp}] </span>
            {log.message}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="border-t border-cyan-500/20 bg-black/90 px-3 py-1.5 text-[10px]">
          {suggestions.map((s, i) => (
            <span
              key={s}
              className={`inline-block mr-3 px-1.5 py-0.5 rounded cursor-default ${
                i === selectedSuggestion
                  ? 'bg-cyan-500/30 text-cyan-200'
                  : 'text-cyan-500/70'
              }`}
            >
              {s}
            </span>
          ))}
          <span className="text-cyan-700/50 ml-1">TAB</span>
        </div>
      )}

      {/* Input */}
      <div className="flex items-center gap-2 px-3 py-2 border-t border-cyan-500/40 bg-black/60">
        <span className="text-cyan-400 select-none">❯</span>
        <input
          ref={inputRef}
          value={input}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          autoComplete="off"
          className="flex-1 bg-transparent outline-none text-cyan-100 text-[12px] caret-cyan-400 placeholder:text-cyan-800"
          placeholder="enter command..."
        />
      </div>
    </div>
  );
};

export default Terminal;
