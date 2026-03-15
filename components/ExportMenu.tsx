'use client';
import { useState, useRef, useEffect } from 'react';
import { Download, X, FileText, Code, Printer } from 'lucide-react';
import { Message } from '@/types';

interface Props { messages: Message[]; title: string; onClose: () => void; }

export default function ExportMenu({ messages, title, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h); }, []);

  const exportMarkdown = () => {
    const lines = [`# ${title}`, '', `*Exported ${new Date().toLocaleDateString('en-GB')}*`, ''];
    messages.forEach(m => {
      lines.push(`## ${m.role === 'user' ? '👤 You' : '🤖 NeuralChat'}`);
      lines.push(m.content, '');
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `${title.replace(/\s+/g, '-').toLowerCase()}.md`; a.click();
    onClose();
  };

  const exportJSON = () => {
    const data = { title, exportedAt: new Date().toISOString(), messages: messages.map(m => ({ role: m.role, content: m.content, timestamp: m.timestamp })) };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `${title.replace(/\s+/g, '-').toLowerCase()}.json`; a.click();
    onClose();
  };

  const exportText = () => {
    const lines = messages.map(m => `[${m.role === 'user' ? 'You' : 'AI'}]: ${m.content}`);
    const blob = new Blob([lines.join('\n\n')], { type: 'text/plain' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `${title.replace(/\s+/g, '-').toLowerCase()}.txt`; a.click();
    onClose();
  };

  const options = [
    { icon: FileText, label: 'Markdown (.md)', desc: 'Formatted with headers', action: exportMarkdown },
    { icon: Code, label: 'JSON (.json)', desc: 'Raw structured data', action: exportJSON },
    { icon: Printer, label: 'Plain text (.txt)', desc: 'Simple text format', action: exportText },
  ];

  return (
    <div ref={ref} className="absolute top-12 right-0 z-50 w-56 rounded-2xl overflow-hidden scale-in" style={{ opacity: 0, background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <span className="text-xs font-semibold" style={{ color: 'var(--text)' }}>Export Chat</span>
        <button onClick={onClose} style={{ color: 'var(--muted)' }}><X size={12} /></button>
      </div>
      {options.map((o, i) => (
        <button key={i} onClick={o.action}
          className="w-full flex items-center gap-3 px-4 py-3 transition-all text-left"
          onMouseEnter={e => e.currentTarget.style.background = 'var(--elevated)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          <o.icon size={14} style={{ color: 'var(--accent)' }} />
          <div><p className="text-xs font-medium" style={{ color: 'var(--text)' }}>{o.label}</p><p className="text-[10px]" style={{ color: 'var(--muted)' }}>{o.desc}</p></div>
        </button>
      ))}
    </div>
  );
}
