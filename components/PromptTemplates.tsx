'use client';
import { useState } from 'react';
import { X, BookOpen, Plus, Trash2, ChevronRight } from 'lucide-react';

const BUILT_IN = [
  { label: 'Explain like I\'m 5', prompt: 'Explain the following in simple terms that a 5-year-old could understand: ' },
  { label: 'Fix my code', prompt: 'Find and fix all bugs in the following code. Explain what was wrong:\n\n' },
  { label: 'Write unit tests', prompt: 'Write comprehensive unit tests for the following code:\n\n' },
  { label: 'Summarise', prompt: 'Summarise the following in 3 concise bullet points:\n\n' },
  { label: 'Pros and cons', prompt: 'List the key pros and cons of: ' },
  { label: 'Improve my writing', prompt: 'Improve the clarity, flow, and grammar of the following text. Keep the original meaning:\n\n' },
  { label: 'Translate to Scots', prompt: 'Translate the following into Scottish English:\n\n' },
  { label: 'SQL query', prompt: 'Write an optimised SQL query to: ' },
  { label: 'Git commit message', prompt: 'Write a concise git commit message following conventional commits for these changes:\n\n' },
  { label: 'Code review', prompt: 'Do a thorough code review of the following. Check for bugs, performance, security, and style:\n\n' },
  { label: 'Regex pattern', prompt: 'Write a regex pattern that matches: ' },
  { label: 'Docker command', prompt: 'Give me the Docker command to: ' },
];

const STORAGE_KEY = 'nc-custom-templates';

function getCustom(): { label: string; prompt: string }[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
function saveCustom(t: { label: string; prompt: string }[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(t));
}

interface Props { onSelect: (prompt: string) => void; onClose: () => void; }

export default function PromptTemplates({ onSelect, onClose }: Props) {
  const [custom, setCustom] = useState(getCustom);
  const [newLabel, setNewLabel] = useState('');
  const [newPrompt, setNewPrompt] = useState('');
  const [adding, setAdding] = useState(false);
  const [filter, setFilter] = useState('');

  const all = [...BUILT_IN, ...custom];
  const filtered = filter.trim() ? all.filter(t => t.label.toLowerCase().includes(filter.toLowerCase())) : all;

  const add = () => {
    if (!newLabel.trim() || !newPrompt.trim()) return;
    const t = { label: newLabel.trim(), prompt: newPrompt.trim() + ' ' };
    const updated = [...custom, t];
    setCustom(updated); saveCustom(updated);
    setNewLabel(''); setNewPrompt(''); setAdding(false);
  };

  const del = (label: string) => {
    const updated = custom.filter(t => t.label !== label);
    setCustom(updated); saveCustom(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }} onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden scale-in" style={{ opacity: 0, background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)', maxHeight: '80vh' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2"><BookOpen size={14} style={{ color: 'var(--accent)' }} /><span className="text-sm font-bold" style={{ color: 'var(--text)' }}>Prompt Templates</span></div>
          <button onClick={onClose} style={{ color: 'var(--muted)' }}><X size={14} /></button>
        </div>
        <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Search templates..." className="w-full text-sm rounded-xl px-3 py-2 outline-none" style={{ background: 'var(--elevated)', border: '1px solid var(--border)', color: 'var(--text)' }} />
        </div>
        <div className="overflow-y-auto scrollbar-hide" style={{ maxHeight: '50vh' }}>
          {filtered.map((t, i) => (
            <div key={i} className="group flex items-center justify-between px-4 py-3 cursor-pointer transition-all" style={{ borderBottom: '1px solid var(--border)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--elevated)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              onClick={() => { onSelect(t.prompt); onClose(); }}>
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <ChevronRight size={12} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                <span className="text-sm truncate" style={{ color: 'var(--text)' }}>{t.label}</span>
              </div>
              {custom.some(c => c.label === t.label) && (
                <button onClick={e => { e.stopPropagation(); del(t.label); }} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg" style={{ color: 'var(--muted)' }} onMouseEnter={e => e.currentTarget.style.color='#f87171'}><Trash2 size={11} /></button>
              )}
            </div>
          ))}
        </div>
        <div className="px-4 py-3" style={{ borderTop: '1px solid var(--border)' }}>
          {adding ? (
            <div className="space-y-2">
              <input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="Template name" className="w-full text-xs rounded-xl px-3 py-2 outline-none" style={{ background: 'var(--elevated)', border: '1px solid var(--border)', color: 'var(--text)' }} />
              <textarea value={newPrompt} onChange={e => setNewPrompt(e.target.value)} placeholder="Prompt text (leave a trailing space for user input)" rows={2} className="w-full text-xs rounded-xl px-3 py-2 outline-none resize-none" style={{ background: 'var(--elevated)', border: '1px solid var(--border)', color: 'var(--text)' }} />
              <div className="flex gap-2">
                <button onClick={add} className="flex-1 py-2 rounded-xl text-xs font-semibold text-white" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>Save</button>
                <button onClick={() => setAdding(false)} className="px-3 py-2 rounded-xl text-xs" style={{ background: 'var(--elevated)', color: 'var(--muted)' }}>Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAdding(true)} className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium transition-all" style={{ background: 'var(--elevated)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
              <Plus size={12} />Add custom template
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
