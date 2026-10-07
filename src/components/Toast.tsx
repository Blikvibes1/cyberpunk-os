import React, { useEffect } from 'react';
import { useCyberpunkStore } from '../store/useCyberpunkStore';
import { sound } from '../lib/sound';

export interface ToastItem {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warn' | 'error';
}

const ToastContainer: React.FC = () => {
  const toasts = useCyberpunkStore((s) => s.toasts);
  const removeToast = useCyberpunkStore((s) => s.removeToast);

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[90] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <Toast key={t.id} item={t} onDone={() => removeToast(t.id)} />
      ))}
    </div>
  );
};

const Toast: React.FC<{ item: ToastItem; onDone: () => void }> = ({ item, onDone }) => {
  useEffect(() => {
    if (item.type === 'success') sound.notify();
    else if (item.type === 'error') sound.error();
    else sound.click();

    const timer = setTimeout(onDone, 3200);
    return () => clearTimeout(timer);
  }, [item, onDone]);

  const colors = {
    info: 'border-cyan-500/60 text-cyan-300',
    success: 'border-emerald-500/60 text-emerald-300',
    warn: 'border-amber-500/60 text-amber-300',
    error: 'border-red-500/60 text-red-300',
  };

  return (
    <div
      className={`pointer-events-auto px-4 py-2.5 bg-black/90 border backdrop-blur-md text-[11px] tracking-wide rounded-sm shadow-lg animate-[slideDown_0.3s_ease]
        ${colors[item.type]}`}
      style={{
        animation: 'slideDown 0.3s ease',
      }}
    >
      {item.message}
    </div>
  );
};

export default ToastContainer;
