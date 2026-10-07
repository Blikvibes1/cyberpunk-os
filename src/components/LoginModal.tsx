import React, { useState } from 'react';
import { useCyberpunkStore, selectShowLogin } from '../store/useCyberpunkStore';
import { sound } from '../lib/sound';
import { getSupabase } from '../adapters/SupabaseAdapter';
import { hasSupabase } from '../config/config';

const LoginModal: React.FC = () => {
  const isOpen = useCyberpunkStore(selectShowLogin);
  const setShowLogin = useCyberpunkStore((s) => s.setShowLogin);
  const addLog = useCyberpunkStore((s) => s.addLog);
  const setAuthStatus = useCyberpunkStore((s) => s.setAuthStatus);
  const login = useCyberpunkStore((s) => s.login);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const name = username.trim();
    if (!name) {
      addLog('USERNAME REQUIRED', 'warn');
      return;
    }

    setLoading(true);
    setAuthStatus('authenticating');
    addLog(`Authenticating ${name.toUpperCase()}...`, 'system');

    if (hasSupabase() && password.trim()) {
      const adapter = getSupabase();
      const email = name.includes('@') ? name : `${name}@cyberpunk.local`;
      let { user, error } = await adapter.signIn(email, password);
      if (error) {
        const up = await adapter.signUp(email, password);
        user = up.user;
        error = up.error;
      }
      if (error || !user) {
        addLog(`Supabase auth: ${error?.message || 'failed'} — falling back to demo login`, 'warn');
      } else {
        addLog('Supabase session established.', 'success');
      }
    } else {
      await new Promise((r) => setTimeout(r, 900));
    }

    login(name);

    sound.success();
    addLog(`NEURAL ACCESS GRANTED TO ${name.toUpperCase()}`, 'success');
    useCyberpunkStore.getState().addToast(`Welcome, ${name}`, 'success');
    addLog('────────────────────────────────', 'system');
    addLog(`Welcome, ${name}. Clearance Level 3 active.`, 'success');
    addLog('New commands unlocked: profile, matrix, panel, logout', 'info');
    addLog('Type "help" to see the full command list.', 'info');

    setUsername('');
    setPassword('');
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center font-mono">
      <div className="border border-cyan-500/70 bg-zinc-950/95 p-8 w-full max-w-md neon-border backdrop-blur-sm">
        <div className="text-xl mb-2 text-center neon-text tracking-widest">
          NEURAL LOGIN
        </div>
        <p className="text-[10px] text-cyan-600 text-center mb-6 tracking-wider">
          AUTHENTICATE TO UNLOCK FULL ACCESS
        </p>

        <input
          type="text"
          placeholder="USERNAME"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          className="w-full bg-transparent border border-cyan-500/60 p-3 mb-4 text-cyan-400 focus:outline-none focus:border-cyan-400 placeholder:text-cyan-800"
          autoFocus
          disabled={loading}
        />

        <input
          type="password"
          placeholder="PASSWORD"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          className="w-full bg-transparent border border-cyan-500/60 p-3 mb-6 text-cyan-400 focus:outline-none focus:border-cyan-400 placeholder:text-cyan-800"
          disabled={loading}
        />

        <button
          onClick={handleLogin}
          disabled={loading}
          className="cyber-btn w-full border border-cyan-500 py-3 hover:bg-cyan-950/50 transition-colors disabled:opacity-50 tracking-wider"
        >
          {loading ? 'AUTHENTICATING...' : 'AUTHENTICATE'}
        </button>

        <button
          onClick={() => setShowLogin(false)}
          disabled={loading}
          className="text-xs mt-4 text-red-400/80 hover:text-red-300 block mx-auto disabled:opacity-40"
        >
          CANCEL
        </button>

        <p className="text-[10px] text-cyan-700 mt-6 text-center">
          Demo mode — any credentials work
        </p>
      </div>
    </div>
  );
};

export default LoginModal;
