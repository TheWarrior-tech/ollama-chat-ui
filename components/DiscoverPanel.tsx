'use client';
import { useState, useEffect, useCallback } from 'react';
import { Compass, RefreshCw, Loader2, ExternalLink, X, Send, Sparkles, ChevronRight, Globe } from 'lucide-react';

interface Article { title: string; url: string; snippet: string; source: string; }
interface Topic { id: string; label: string; }

interface Props {
  onAskAI: (prompt: string) => void;
  onClose: () => void;
}

export default function DiscoverPanel({ onAskAI, onClose }: Props) {
  const [topic, setTopic] = useState('ai');
  const [data, setData] = useState<{ topics: Topic[]; articles: Article[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [askingArticle, setAskingArticle] = useState<Article | null>(null);
  const [askPrompt, setAskPrompt] = useState('');

  const load = useCallback(async (t: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/discover?topic=${t}`);
      const json = await res.json();
      setData(json);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(topic); }, [topic]);

  const askAI = (article: Article, custom?: string) => {
    const prompt = custom ||
      `Summarise and analyse this article for me:\n\nTitle: ${article.title}\nSource: ${article.source}\nURL: ${article.url}\n\nSnippet: ${article.snippet}`;
    onAskAI(prompt);
    setAskingArticle(null);
    setAskPrompt('');
    onClose();
  };

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--sidebar)', borderLeft: '1px solid var(--border)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-gradient-accent flex items-center justify-center">
            <Compass size={13} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>Discover</p>
            <p className="text-[10px]" style={{ color: 'var(--muted)' }}>Live stories · Ask AI anything</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => load(topic)} disabled={loading}
            className="p-1.5 rounded-lg transition-all" style={{ color: 'var(--muted)', background: 'var(--elevated)' }}>
            {loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
          </button>
          <button onClick={onClose} className="p-1.5 rounded-lg transition-all" style={{ color: 'var(--muted)', background: 'var(--elevated)' }}>
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Topics */}
      <div className="flex gap-1.5 px-4 pb-3 overflow-x-auto scrollbar-hide flex-shrink-0">
        {(data?.topics || []).map(t => (
          <button key={t.id} onClick={() => setTopic(t.id)}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-semibold transition-all whitespace-nowrap"
            style={{
              background: topic === t.id ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'var(--elevated)',
              border: topic === t.id ? 'none' : '1px solid var(--border)',
              color: topic === t.id ? 'white' : 'var(--text-dim)',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Articles */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2.5 scrollbar-hide">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-2xl p-3.5 animate-pulse" style={{ background: 'var(--elevated)', height: '90px', border: '1px solid var(--border)' }} />
          ))
        ) : (data?.articles || []).length === 0 ? (
          <div className="text-center py-12">
            <Globe size={28} className="mx-auto mb-3" style={{ color: 'var(--muted)', opacity: 0.3 }} />
            <p className="text-xs" style={{ color: 'var(--muted)' }}>No results. SearXNG may not be running.</p>
          </div>
        ) : (
          (data?.articles || []).map((a, i) => (
            <div key={i} className="group rounded-2xl p-3.5 transition-all msg-animate"
              style={{ background: 'var(--elevated)', border: '1px solid var(--border)', animationDelay: `${i * 0.04}s`, opacity: 0 }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.25)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              {/* Source + link */}
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'var(--card)', color: 'var(--muted)' }}>{a.source}</span>
                <a href={a.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                  className="p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                  style={{ color: 'var(--muted)' }}>
                  <ExternalLink size={10} />
                </a>
              </div>

              {/* Title */}
              <p className="text-xs font-semibold leading-snug mb-1.5 line-clamp-2" style={{ color: 'var(--text)' }}>{a.title}</p>
              <p className="text-[11px] leading-relaxed line-clamp-2 mb-3" style={{ color: 'var(--text-dim)' }}>{a.snippet}</p>

              {/* Ask AI / custom ask */}
              {askingArticle?.url === a.url ? (
                <div className="flex gap-2 mt-2">
                  <input
                    autoFocus
                    value={askPrompt}
                    onChange={e => setAskPrompt(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && askPrompt.trim()) askAI(a, askPrompt); if (e.key === 'Escape') setAskingArticle(null); }}
                    placeholder="What do you want to know?"
                    className="flex-1 text-[11px] rounded-xl px-3 py-2 outline-none"
                    style={{ background: 'var(--card)', border: '1px solid rgba(99,102,241,0.3)', color: 'var(--text)' }}
                  />
                  <button onClick={() => askAI(a, askPrompt || undefined)}
                    className="p-2 rounded-xl transition-all"
                    style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white' }}>
                    <Send size={11} />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => askAI(a)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-semibold transition-all"
                    style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: 'var(--accent-light)' }}>
                    <Sparkles size={9} />Ask AI
                  </button>
                  <button onClick={() => { setAskingArticle(a); setAskPrompt(''); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-medium transition-all"
                    style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
                    Custom <ChevronRight size={9} />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
