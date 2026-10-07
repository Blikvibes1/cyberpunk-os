import React, { useEffect, useState } from 'react';
import { sound } from '../lib/sound';

interface Props {
  onComplete: () => void;
}

const BOOT_LINES = [
  { text: 'CYBERPUNK OS v0.2.0', delay: 0 },
  { text: 'Initializing neural core...', delay: 400 },
  { text: 'Loading command bus............ OK', delay: 900 },
  { text: 'Mounting 3D render pipeline.... OK', delay: 1300 },
  { text: 'Calibrating neon grid........... OK', delay: 1700 },
  { text: 'Establishing secure channel..... OK', delay: 2100 },
  { text: 'NEURAL LINK READY', delay: 2600 },
];

const BootSequence: React.FC<Props> = ({ onComplete }) => {
  const [visibleLines, setVisibleLines] = useState<string[]>([]);
  const [fadeOut, setFadeOut] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    sound.boot();

    const timers: number[] = [];

    BOOT_LINES.forEach((line, i) => {
      const t = window.setTimeout(() => {
        setVisibleLines((prev) => [...prev, line.text]);
        setProgress(((i + 1) / BOOT_LINES.length) * 100);
        if (i > 0 && i < BOOT_LINES.length - 1) sound.click();
      }, line.delay);
      timers.push(t);
    });

    // Finish
    const finish = window.setTimeout(() => {
      sound.success();
      setFadeOut(true);
      window.setTimeout(onComplete, 700);
    }, 3200);
    timers.push(finish);

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center font-mono transition-opacity duration-700 ${
        fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Scanline overlay during boot */}
      <div className="crt-overlay opacity-70" />

      <div className="relative z-10 w-full max-w-lg px-6">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="text-4xl neon-text tracking-[0.3em] animate-neon-pulse">◈</div>
          <div className="text-xs text-cyan-500/60 tracking-[0.4em] mt-2">NEURAL INTERFACE</div>
        </div>

        {/* Boot log */}
        <div className="space-y-1.5 min-h-[180px] text-[12px]">
          {visibleLines.map((line, i) => (
            <div
              key={i}
              className={`${
                line.includes('READY')
                  ? 'text-emerald-400 neon-text'
                  : line.includes('OK')
                  ? 'text-cyan-300/90'
                  : 'text-cyan-500/80'
              }`}
            >
              {line.startsWith('CYBERPUNK') ? (
                <span className="tracking-widest text-cyan-300">{line}</span>
              ) : (
                <>
                  <span className="text-cyan-700">› </span>
                  {line}
                </>
              )}
            </div>
          ))}
          {visibleLines.length < BOOT_LINES.length && (
            <span className="inline-block w-2 h-3 bg-cyan-400 animate-pulse ml-1" />
          )}
        </div>

        {/* Progress bar */}
        <div className="mt-8 h-0.5 bg-cyan-950 rounded-full overflow-hidden">
          <div
            className="h-full bg-cyan-400 transition-all duration-300 shadow-[0_0_8px_#22d3ee]"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-[10px] text-cyan-600 mt-2 tracking-widest text-right">
          {Math.round(progress)}%
        </div>
      </div>
    </div>
  );
};

export default BootSequence;
