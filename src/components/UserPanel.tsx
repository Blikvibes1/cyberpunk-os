import React from 'react';
import {
  useCyberpunkStore,
  selectShowUserPanel,
  selectUsername,
  selectAuthStatus,
  selectSystemTime,
} from '../store/useCyberpunkStore';

const UserPanel: React.FC = () => {
  const visible = useCyberpunkStore(selectShowUserPanel);
  const username = useCyberpunkStore(selectUsername);
  const authStatus = useCyberpunkStore(selectAuthStatus);
  const systemTime = useCyberpunkStore(selectSystemTime);
  const setShowUserPanel = useCyberpunkStore((s) => s.setShowUserPanel);
  const logout = useCyberpunkStore((s) => s.logout);
  const addLog = useCyberpunkStore((s) => s.addLog);

  if (!visible || authStatus !== 'authenticated' || !username) return null;

  const handleLogout = () => {
    addLog(`Terminating session for ${username}...`, 'system');
    logout();
    addLog('Session terminated. Reverted to guest access.', 'warn');
  };

  return (
    <div className="absolute top-16 right-5 w-64 z-40 bg-black/80 border border-cyan-500/50 backdrop-blur-md neon-border rounded-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-cyan-500/30">
        <span className="text-[10px] tracking-widest text-cyan-400/80">USER PANEL</span>
        <button
          onClick={() => setShowUserPanel(false)}
          className="text-cyan-600 hover:text-cyan-300 text-xs leading-none"
          title="Hide panel"
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div className="p-3 text-[11px] space-y-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399] animate-pulse" />
          <span className="text-emerald-400 font-medium tracking-wide">{username}</span>
        </div>

        <div className="text-cyan-500/70 space-y-0.5 pl-4">
          <div>Clearance : LEVEL 3</div>
          <div>Sector    : NIGHT CITY</div>
          <div>Status    : AUTHENTICATED</div>
          <div>Time      : {systemTime}</div>
        </div>

        <div className="pt-2 border-t border-cyan-500/20 space-y-1.5">
          <button
            onClick={() => {
              addLog('> profile', 'system');
              addLog('┌─ NEURAL PROFILE', 'system');
              addLog(`│  Handle        : ${username}`, 'info');
              addLog('│  Clearance     : LEVEL 3', 'info');
              addLog('│  Sector        : NIGHT CITY', 'info');
              addLog('│  Access        : FULL', 'info');
              addLog('└─', 'system');
            }}
            className="cyber-btn w-full text-left px-2 py-1.5 border border-cyan-500/40 text-cyan-300/90 hover:bg-cyan-950/40 text-[10px] tracking-wider"
          >
            VIEW PROFILE
          </button>
          <button
            onClick={handleLogout}
            className="cyber-btn w-full text-left px-2 py-1.5 border border-red-500/40 text-red-400/90 hover:bg-red-950/30 text-[10px] tracking-wider"
          >
            LOGOUT
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserPanel;
