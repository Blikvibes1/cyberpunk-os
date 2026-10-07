import React from 'react';
import { useCyberpunkStore, selectWindows } from '../store/useCyberpunkStore';
import { sound } from '../lib/sound';

/**
 * Bottom dock for minimized windows — Mac Genie restore + Omarchy-style indicators
 */
const Dock: React.FC = () => {
  const windows = useCyberpunkStore(selectWindows);
  const restoreWindow = useCyberpunkStore((s) => s.restoreWindow);
  const openWindow = useCyberpunkStore((s) => s.openWindow);
  const minimized = windows.filter((w) => w.minimized);

  return (
    <div className="dock-bar absolute bottom-3 left-1/2 -translate-x-1/2 z-[60] flex items-end gap-2 px-3 py-2 bg-black/70 border border-cyan-500/30 backdrop-blur-md rounded-lg neon-border">
      {/* New terminal */}
      <button
        onClick={() => {
          sound.click();
          openWindow();
        }}
        className="flex flex-col items-center gap-0.5 px-2 py-1 hover:bg-cyan-500/10 rounded transition-colors group"
        title="New Terminal"
      >
        <span className="text-lg text-cyan-400 group-hover:scale-110 transition-transform">◈</span>
        <span className="text-[8px] text-cyan-600 tracking-wider">NEW</span>
      </button>

      {minimized.length > 0 && <div className="w-px h-8 bg-cyan-500/30 mx-1" />}

      {minimized.map((w) => (
        <button
          key={w.id}
          onClick={() => {
            sound.click();
            restoreWindow(w.id);
          }}
          className="flex flex-col items-center gap-0.5 px-2 py-1 hover:bg-cyan-500/10 rounded transition-colors group genie-restore"
          title={`Restore ${w.title}`}
        >
          <span className="text-sm text-amber-400/90 group-hover:scale-110 transition-transform">▤</span>
          <span className="text-[8px] text-cyan-600 tracking-wider max-w-[48px] truncate">
            {w.title.replace('NEURAL TERMINAL ', 'T')}
          </span>
        </button>
      ))}

      {windows.length === 0 && (
        <span className="text-[9px] text-cyan-700 px-2">no windows — click NEW</span>
      )}
    </div>
  );
};

export default Dock;
