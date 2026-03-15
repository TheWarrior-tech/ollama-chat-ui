'use client';
import { useState, useCallback } from 'react';
import { Check, X, Link } from 'lucide-react';

export function useShareToast() {
  const [visible, setVisible] = useState(false);
  const [url, setUrl] = useState('');
  const show = useCallback((u: string) => { setUrl(u); setVisible(true); setTimeout(() => setVisible(false), 4000); }, []);
  const hide = useCallback(() => setVisible(false), []);
  return { visible, url, show, hide };
}

export default function ShareToast({ url, visible, onClose }: { url: string; visible: boolean; onClose: () => void }) {
  if (!visible) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 scale-in flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)', opacity: 0 }}>
      <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
        <Check size={12} className="text-emerald-400" />
      </div>
      <div>
        <p className="text-xs font-semibold" style={{ color: 'var(--text)' }}>Link copied!</p>
        <p className="text-[10px] max-w-[220px] truncate" style={{ color: 'var(--muted)' }}>{url}</p>
      </div>
      <button onClick={onClose} className="p-1 rounded-lg" style={{ color: 'var(--muted)' }}><X size={11} /></button>
    </div>
  );
}
