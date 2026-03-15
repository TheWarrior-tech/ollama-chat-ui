'use client';
import { useState, useEffect } from 'react';
import { Check, Copy, Link } from 'lucide-react';

export function useShareToast() {
  const [visible, setVisible] = useState(false);
  const [url, setUrl] = useState('');

  const show = (shareUrl: string) => {
    setUrl(shareUrl);
    setVisible(true);
  };

  useEffect(() => {
    if (visible) {
      const t = setTimeout(() => setVisible(false), 4000);
      return () => clearTimeout(t);
    }
  }, [visible]);

  return { visible, url, show, hide: () => setVisible(false) };
}

export default function ShareToast({ url, visible, onClose }: { url: string; visible: boolean; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 fade-in">
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-surface border border-border-med shadow-card backdrop-blur-xl max-w-sm">
        <div className="w-7 h-7 rounded-lg bg-gradient-accent flex items-center justify-center flex-shrink-0">
          <Link size={13} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-text">Share link ready</p>
          <p className="text-[10px] text-muted truncate mt-0.5">{url}</p>
        </div>
        <button onClick={copy}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-elevated border border-border text-xs font-medium text-text-dim hover:text-text transition-all flex-shrink-0">
          {copied ? <><Check size={10} className="text-emerald-400" />Copied!</> : <><Copy size={10} />Copy</>}
        </button>
        <button onClick={onClose} className="text-muted hover:text-text transition-colors text-lg leading-none">&times;</button>
      </div>
    </div>
  );
}
