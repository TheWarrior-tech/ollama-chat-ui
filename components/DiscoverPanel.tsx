'use client';
import { useState, useEffect, useCallback } from 'react';
import { Compass, RefreshCw, Loader2, ExternalLink, X, Send, Sparkles, ChevronRight } from 'lucide-react';

interface Article { title: string; url: string; snippet: string; source: string; }
interface Topic { id: string; label: string; }
interface Props { onAskAI: (prompt: string) => void; onClose: () => void; }

function SourceIcon({ source }: { source: string }) {
  const [err, setErr] = useState(false);
  if (!source || err) return <div className="w-5 h-5 rounded-md" style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }} />;
  return <img src={`https://www.google.com/s2/favicons?domain=${source}&sz=32`} onError={() => setErr(true)} className="w-5 h-5 rounded-md flex-shrink-0" alt="" />;
}

export default function DiscoverPanel({ onAskAI, onClose }: Props) {
  const [topic, setTopic] = useState('ai');
  const [data, setData] = useState<{ topics: Topic[]; articles: Article[]; error?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [askingArticle, setAskingArticle] = useState<Article | null>(null);
  const [askPrompt, setAskPrompt] = useState('');

  const load = useCallback(async (t: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/discover?topic=${t}`);
      const json = await res.json();
      setData(json);
    } catch {
      setData({ topics: [], articles: [], error: 'Network error. Check your connection.' });
    } finally {
      setLoading(false);
    }
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

  const topics = data?.topics || [];
  const articles = data?.articles || [];

  return (
    // Full-screen overlay with blur backdrop, sits above everything
    <div className="fixed inset-0 z-40 flex flex-col" style={{ background: 'var(--bg)' }}>
      <div className="ambient-bg" />

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-6 py-4 flex-shrink-0 glass relative z-10"
        style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-accent flex items-center justify-center" style={{ boxShadow: 'var(--glow-sm)' }}>
            <Compass size={16} className="text-white" />
          </div>
          <div>
            <p className="text-base font-bold" style={{ color: 'var(--text)' }}>Discover</p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>Live news · Ask AI about any story</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => load(topic)} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
            style={{ background: 'var(--elevated)', border: '1px solid var(--border)', color: 'var(--muted)' }}>
            {loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
            Refresh
          </button>
          <button onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
            style={{ background: 'var(--elevated)', border: '1px solid var(--border)', color: 'var(--muted)' }}>
            <X size={12} />Close
          </button>
        </div>
      </div>

      {/* ── Topic pills ── */}
      <div className="flex gap-2 px-6 py-4 overflow-x-auto scrollbar-hide flex-shrink-0 relative z-10"
        style={{ borderBottom: '1px solid var(--border)' }}>
        {topics.map(t => (
          <button key={t.id} onClick={() => setTopic(t.id)}
            className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap"
            style={{
              background: topic === t.id ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'var(--elevated)',
              border: topic === t.id ? 'none' : '1px solid var(--border)',
              color: topic === t.id ? 'white' : 'var(--text-dim)',
              boxShadow: topic === t.id ? 'var(--glow-sm)' : 'none',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Articles grid ── */}
      <div className="flex-1 overflow-y-auto px-6 py-6 relative z-10">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="rounded-2xl animate-pulse" style={{ background: 'var(--surface)', border: '1px solid var(--border)', height: '160px' }} />
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-24">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5" style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}>
              <Compass size={28} style={{ color: 'var(--muted)', opacity: 0.4 }} />
            </div>
            <p className="text-base font-semibold mb-2" style={{ color: 'var(--text)' }}>No stories loaded</p>
            <p className="text-sm mb-5 max-w-xs" style={{ color: 'var(--muted)' }}>
              {data?.error || 'Could not reach any news feeds. Make sure the server has internet access.'}
            </p>
            <button onClick={() => load(topic)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: 'var(--glow-md)' }}>
              <RefreshCw size={14} />Try again
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {articles.map((a, i) => (
              <div key={i} className="group flex flex-col rounded-2xl p-4 transition-all msg-animate cursor-default"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', animationDelay: `${i * 0.04}s`, opacity: 0 }}
                onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(99,102,241,0.3)'; e.currentTarget.style.background='var(--elevated)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.background='var(--surface)'; }}>

                {/* Source row */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <SourceIcon source={a.source} />
                    <span className="text-[11px] font-medium truncate max-w-[120px]" style={{ color: 'var(--muted)' }}>{a.source}</span>
                  </div>
                  <a href={a.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                    className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                    style={{ color: 'var(--muted)', background: 'var(--card)' }}>
                    <ExternalLink size={11} />
                  </a>
                </div>

                {/* Title + snippet */}
                <p className="text-sm font-semibold leading-snug mb-2 line-clamp-3 flex-1" style={{ color: 'var(--text)' }}>{a.title}</p>
                {a.snippet && <p className="text-[11px] leading-relaxed line-clamp-2 mb-3" style={{ color: 'var(--text-dim)' }}>{a.snippet}</p>}

                {/* Ask AI */}
                {askingArticle?.url === a.url ? (
                  <div className="flex gap-2">
                    <input autoFocus value={askPrompt} onChange={e => setAskPrompt(e.target.value)}
                      onKeyDown={e => { if (e.key==='Enter') askAI(a, askPrompt || undefined); if (e.key==='Escape') setAskingArticle(null); }}
                      placeholder="What do you want to know?"
                      className="flex-1 text-xs rounded-xl px-3 py-2 outline-none"
                      style={{ background: 'var(--card)', border: '1px solid rgba(99,102,241,0.35)', color: 'var(--text)' }}
                    />
                    <button onClick={() => askAI(a, askPrompt || undefined)}
                      className="p-2 rounded-xl flex-shrink-0" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white' }}>
                      <Send size={12} />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2 mt-auto">
                    <button onClick={() => askAI(a)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold flex-1 justify-center transition-all"
                      style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)', color: 'var(--accent-light)' }}>
                      <Sparkles size={10} />Ask AI
                    </button>
                    <button onClick={() => { setAskingArticle(a); setAskPrompt(''); }}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] transition-all"
                      style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
                      <ChevronRight size={10} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
