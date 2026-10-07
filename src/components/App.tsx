import React, { useEffect, Suspense, lazy, memo, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import {
  useCyberpunkStore,
  selectSystemTime,
  selectAuthStatus,
  selectUsername,
  selectBooted,
  selectWindows,
} from '../store/useCyberpunkStore';
import TerminalWindow from './TerminalWindow';
import LoginModal from './LoginModal';
import UserPanel from './UserPanel';
import BootSequence from './BootSequence';
import ToastContainer from './Toast';
import Dock from './Dock';
import PresencePanel from './PresencePanel';
import { sound } from '../lib/sound';

const Scene = lazy(() => import('../scenes/Scene'));

const Header = memo(() => {
  const systemTime = useCyberpunkStore(selectSystemTime);
  const authStatus = useCyberpunkStore(selectAuthStatus);
  const username = useCyberpunkStore(selectUsername);
  const soundEnabled = useCyberpunkStore((s) => s.soundEnabled);
  const setShowLogin = useCyberpunkStore((s) => s.setShowLogin);
  const setShowUserPanel = useCyberpunkStore((s) => s.setShowUserPanel);
  const showUserPanel = useCyberpunkStore((s) => s.showUserPanel);
  const toggleSound = useCyberpunkStore((s) => s.toggleSound);
  const openWindow = useCyberpunkStore((s) => s.openWindow);
  const achievements = useCyberpunkStore((s) => s.achievements);

  const isAuth = authStatus === 'authenticated';

  return (
    <header className="absolute top-0 left-0 right-0 z-50 bg-black/70 border-b border-cyan-500/50 backdrop-blur-md px-4 py-3 flex items-center justify-between neon-border">
      <div className="flex items-center gap-3">
        <span className={`w-2.5 h-2.5 rounded-full animate-pulse shadow-[0_0_8px] ${isAuth ? 'bg-emerald-400 shadow-emerald-400' : 'bg-red-500 shadow-red-500'}`} />
        <span className="neon-text tracking-widest text-sm">
          CYBERPUNK OS v0.3.0 // [{authStatus.toUpperCase()}]
        </span>
        <span className="text-[10px] text-cyan-600 tracking-wider hidden sm:inline">
          ACH {achievements.length}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => { sound.click(); openWindow(); }}
          className="text-[10px] tracking-wider text-cyan-400/80 hover:text-cyan-300 border border-cyan-500/30 px-2 py-1 rounded-sm"
          title="New terminal window"
        >
          + TERM
        </button>
        <button
          onClick={() => {
            const next = !soundEnabled;
            toggleSound();
            sound.setEnabled(next);
            if (next) sound.click();
          }}
          className="text-[10px] tracking-wider text-cyan-500/70 hover:text-cyan-300 border border-cyan-500/30 px-2 py-1 rounded-sm"
        >
          {soundEnabled ? 'SND' : 'MUTE'}
        </button>
        {isAuth && username ? (
          <button
            onClick={() => { sound.click(); setShowUserPanel(!showUserPanel); }}
            className="flex items-center gap-2 text-xs tracking-wider text-emerald-400/90 hover:text-emerald-300 border border-emerald-500/40 px-2.5 py-1 rounded-sm"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            {username.toUpperCase()}
          </button>
        ) : (
          <button
            onClick={() => { sound.click(); setShowLogin(true); }}
            className="text-xs tracking-wider text-cyan-400/80 hover:text-cyan-300 border border-cyan-500/40 px-2.5 py-1 rounded-sm"
          >
            LOGIN
          </button>
        )}
        <div className="text-xs tracking-[0.2em] text-cyan-300/80 ml-1">{systemTime}</div>
      </div>
    </header>
  );
});
Header.displayName = 'Header';

const WindowLayer: React.FC = () => {
  const windows = useCyberpunkStore(selectWindows);
  return (
    <>
      {windows.map((w) => (
        <TerminalWindow key={w.id} win={w} />
      ))}
    </>
  );
};

const App: React.FC = () => {
  const booted = useCyberpunkStore(selectBooted);
  const setBooted = useCyberpunkStore((s) => s.setBooted);
  const openWindow = useCyberpunkStore((s) => s.openWindow);
  const windows = useCyberpunkStore(selectWindows);
  const loadWorkspace = useCyberpunkStore((s) => s.loadWorkspace);

  useEffect(() => {
    const theme = useCyberpunkStore.getState().theme;
    document.documentElement.setAttribute('data-theme', theme);
    const id = setInterval(() => useCyberpunkStore.getState().updateTime(), 1000);
    return () => clearInterval(id);
  }, []);

  const handleBootComplete = useCallback(() => {
    setBooted(true);
    sound.startAmbient();
    // Try restore workspace, else open one terminal
    const restored = loadWorkspace();
    if (!restored) {
      openWindow();
    }
  }, [setBooted, openWindow, loadWorkspace]);

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#050508] text-cyan-400 font-mono relative">
      {!booted && <BootSequence onComplete={handleBootComplete} />}

      <div className="crt-overlay" />
      <Header />

      <Canvas
        className="absolute inset-0"
        camera={{ position: [0, 0, 11], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, powerPreference: 'high-performance', alpha: false }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>

      {booted && (
        <>
          <WindowLayer />
          <Dock />
          <PresencePanel />
          <UserPanel />
          <LoginModal />
          <ToastContainer />
        </>
      )}
    </div>
  );
};

export default App;
