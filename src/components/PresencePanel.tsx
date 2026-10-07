import React, { useEffect } from 'react';
import { useCyberpunkStore } from '../store/useCyberpunkStore';
import { multiplayer } from '../lib/multiplayer';

const PresencePanel: React.FC = () => {
  const show = useCyberpunkStore((s) => s.showPresence);
  const users = useCyberpunkStore((s) => s.presenceUsers);
  const mode = useCyberpunkStore((s) => s.multiplayerMode);
  const setShowPresence = useCyberpunkStore((s) => s.setShowPresence);
  const addLog = useCyberpunkStore((s) => s.addLog);

  useEffect(() => {
    const unsub = multiplayer.onBroadcast(({ user, message }) => {
      addLog(`[net] ${user}: ${message}`, 'info');
    });
    return unsub;
  }, [addLog]);

  if (!show || mode === 'off') return null;

  return (
    <div className="absolute top-16 left-5 w-52 z-40 bg-black/80 border border-cyan-500/40 backdrop-blur-md neon-border rounded-sm overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-cyan-500/30 text-[10px] tracking-widest text-cyan-400/80">
        <span>
          GRID {mode === 'live' ? '● LIVE' : '○ SIM'}
        </span>
        <button
          onClick={() => setShowPresence(false)}
          className="text-cyan-600 hover:text-cyan-300"
        >
          ✕
        </button>
      </div>
      <div className="p-2 max-h-40 overflow-y-auto terminal-scroll space-y-1">
        {users.length === 0 && (
          <div className="empty-hint py-4">No peers online</div>
        )}
        {users.map((u) => (
          <div key={u.id} className="flex items-center gap-2 text-[11px] text-cyan-300/90 px-1">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                u.simulated ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
            />
            <span className="truncate">{u.name}</span>
            {u.simulated && (
              <span className="text-[8px] text-cyan-700 ml-auto">SIM</span>
            )}
          </div>
        ))}
      </div>
      <div className="px-2 py-1 border-t border-cyan-500/20 text-[8px] text-cyan-700 tracking-wider">
        {mode === 'live' ? 'Supabase Realtime' : 'Simulated peers'}
      </div>
    </div>
  );
};

export default PresencePanel;
