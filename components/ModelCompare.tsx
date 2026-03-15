'use client';
import { useState, useRef } from 'react';
import { X, GitCompare, ArrowUp, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Props { models: string[]; onClose: () => void; }

interface Result { model: string; content: string; loading: boolean; }

export default function ModelCompare({ models, onClose }: Props) {
  const [prompt, setPrompt] = useState('');
  const [selected, setSelected] = useState<string[]>(models.slice(0, 2));
  const [results, setResults] = useState<Result[]>([]);
  const [running, setRunning] = useState(false);
  const aborts = useRef<AbortController[]>([]);

  const run = async () => {
    if (!prompt.trim() || selected.length === 0) return;
    setRunning(true);
    aborts.current.forEach(a => a.abort());
    aborts.current = [];
    setResults(selected.map(m => ({ model: m, content: '', loading: true })));

    await Promise.all(selected.map(async (model, idx) => {
      const abort = new AbortController();
      aborts.current.push(abort);
      try {
        const res = await fetch('/api/chat', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }] }),
          signal: abort.signal,
        });
        if (!res.body) return;
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let full = '', leftover = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = leftover + dec.decode(value, { stream: true });
          const lines = chunk.split('\n'); leftover = lines.pop() ?? '';
          for (const line of lines) {
            if (!line.trim()) continue;
            try { const j = JSON.parse(line); if (j.content) { full += j.content; setResults(r => r.map((x, i) => i === idx ? { ...x, content: full } : x)); } } catch {}
          }
        }
        setResults(r => r.map((x, i) => i === idx ? { ...x, loading: false } : x));
      } catch {}
    }));
    setRunning(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <div className="ambient-bg" />
      <div className="flex items-center justify-between px-6 py-4 flex-shrink-0 glass" style={{ borderBottom: '1px solid var(--border)', position: 'relative', zIndex: 10 }}>
        <div className="flex items-center gap-3"><GitCompare size={16} style={{ color: 'var(--accent)' }} /><span className="font-bold" style={{ color: 'var(--text)' }}>Model Compare</span><span className="text-xs" style={{ color: 'var(--muted)' }}>Run the same prompt across multiple models side by side</span></div>
        <button onClick={() => { aborts.current.forEach(a => a.abort()); onClose(); }} style={{ color: 'var(--muted)' }}><X size={16} /></button>
      </div>

      {/* Model picker */}
      <div className="flex gap-2 px-6 py-3 overflow-x-auto scrollbar-hide flex-shrink-0" style={{ borderBottom: '1px solid var(--border)', position: 'relative', zIndex: 10 }}>
        {models.map(m => (
          <button key={m} onClick={() => setSelected(s => s.includes(m) ? s.filter(x => x !== m) : [...s, m])}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
            style={{ background: selected.includes(m) ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'var(--elevated)', border: selected.includes(m) ? 'none' : '1px solid var(--border)', color: selected.includes(m) ? 'white' : 'var(--text-dim)' }}>
            {m}
          </button>
        ))}
      </div>

      {/* Results grid */}
      <div className="flex-1 overflow-auto relative z-10">
        {results.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center"><GitCompare size={40} className="mx-auto mb-3" style={{ color: 'var(--muted)', opacity: 0.3 }} /><p style={{ color: 'var(--muted)' }}>Enter a prompt below and click Run to compare models</p></div>
          </div>
        ) : (
          <div className="grid h-full" style={{ gridTemplateColumns: `repeat(${results.length}, 1fr)` }}>
            {results.map((r, i) => (
              <div key={i} className="flex flex-col h-full overflow-hidden" style={{ borderRight: i < results.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div className="px-5 py-3 flex-shrink-0 flex items-center gap-2" style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
                  <div className="w-2 h-2 rounded-full" style={{ background: r.loading ? '#f59e0b' : '#34d399', boxShadow: `0 0 6px ${r.loading ? '#f59e0b' : '#34d399'}80` }} />
                  <span className="text-xs font-semibold" style={{ color: 'var(--text)' }}>{r.model}</span>
                  {r.loading && <Loader2 size={11} className="animate-spin ml-auto" style={{ color: 'var(--muted)' }} />}
                </div>
                <div className="flex-1 overflow-y-auto p-5 scrollbar-hide">
                  {r.content ? (
                    <div className="prose text-sm"><ReactMarkdown remarkPlugins={[remarkGfm]}>{r.content}</ReactMarkdown></div>
                  ) : r.loading ? (
                    <div className="flex gap-1 mt-2">{[0,1,2].map(j=><div key={j} className={`w-1.5 h-1.5 rounded-full dot-${j+1}`} style={{background:'var(--accent)'}}/>)}</div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Prompt input */}
      <div className="px-6 py-4 flex-shrink-0 relative z-10" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex gap-3 max-w-3xl mx-auto">
          <input value={prompt} onChange={e => setPrompt(e.target.value)} onKeyDown={e => e.key === 'Enter' && run()}
            placeholder="Enter a prompt to compare across selected models..."
            className="flex-1 text-sm rounded-2xl px-5 py-3 outline-none"
            style={{ background: 'var(--surface)', border: '1px solid var(--border-med)', color: 'var(--text)' }}
          />
          <button onClick={run} disabled={running || !prompt.trim() || selected.length === 0}
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: 'var(--glow-md)' }}>
            {running ? <Loader2 size={16} className="animate-spin" /> : <ArrowUp size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
