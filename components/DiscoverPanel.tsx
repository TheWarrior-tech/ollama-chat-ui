'use client';
import { useState, useEffect, useCallback } from 'react';
import { Compass, RefreshCw, Loader2, ExternalLink, X, Send, Sparkles, ChevronRight, Clock, AlertCircle } from 'lucide-react';

interface Article {
  title: string;
  url: string;
  snippet: string;
  source: string;
  publishedDate?: string | null;
  image?: string;
}
interface Topic { id: string; label: string; }
interface Props { onAskAI: (prompt: string) => void; onClose: () => void; }

function timeAgo(dateStr?: string | null): string {
  if (!dateStr) return '';
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  } catch { return ''; }
}

function ArticleImage({ src, title }: { src?: string; title: string }) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (!src || failed) {
    // Placeholder gradient based on title hash
    const hue = title.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
    return (
      <div className="w-full h-44 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, hsl(${hue},40%,20%), hsl(${(hue+60)%360},50%,15%))` }}>
        <Compass size={28} style={{ color: `hsl(${hue},60%,60%)`, opacity: 0.5 }} />
      </div>
    );
  }

  return (
    <div className="w-full h-44 rounded-xl overflow-hidden relative">
      {!loaded && <div className="absolute inset-0 animate-pulse" style={{ background: 'var(--elevated)' }} />}
      <img
        src={src}
        alt={title}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.3s, transform 0.5s' }}
      />
    </div>
  );
}

export default function DiscoverPanel({ onAskAI, onClose }: Props) {
  const [topic, setTopic] = useState('ai');
  const [data, setData] = useState<{ topics: Topic[]; articles: Article[]; error?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [askingArticle, setAskingArticle] = useState<Article | null>(null);
  const [askPrompt, setAskPrompt] = useState('');

  const load = useCallback(async (t: string) => {
    setLoading(true);
    setData(null);
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
    const prompt = custom
      || `Summarise and analyse this article:\n\nTitle: ${article.title}\nSource: ${article.source}\nURL: ${article.url}\n\n${article.snippet ? 'Snippet: ' + article.snippet : ''}`;
    onAskAI(prompt);
    setAskingArticle(null);
    setAskPrompt('');
    onClose();
  };

  const topics = data?.topics || [];
  const articles = data?.articles || [];

  return (
    <div className="fixed inset-0 z-40 flex flex-col" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <div className="ambient-bg" />

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-6 py-4 flex-shrink-0 glass relative z-10"
        style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-accent flex items-center justify-center" style={{ boxShadow: 'var(--glow-sm)' }}>
            <Compass size={16} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-base" style={{ color: 'var(--text)' }}>Discover</p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>Live news via SearXNG · Ask AI about any story</p>
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
      <div className="flex gap-2 px-6 py-3 overflow-x-auto scrollbar-hide flex-shrink-0 relative z-10"
        style={{ borderBottom: '1px solid var(--border)' }}>
        {(topics.length ? topics : [
          { id:'ai', label:'AI & Tech' }, { id:'science', label:'Science' }, { id:'world', label:'World News' },
          { id:'finance', label:'Finance' }, { id:'health', label:'Health' }, { id:'space', label:'Space' },
          { id:'sport', label:'Sport' }, { id:'gaming', label:'Gaming' },
        ]).map(t => (
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

      {/* ── Articles ── */}
      <div className="flex-1 overflow-y-auto px-6 py-6 relative z-10">
        {loading ? (
          // Skeleton grid
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden animate-pulse" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="h-44" style={{ background: 'var(--elevated)' }} />
                <div className="p-4 space-y-2">
                  <div className="h-3 rounded-full w-1/3" style={{ background: 'var(--elevated)' }} />
                  <div className="h-4 rounded-full w-full" style={{ background: 'var(--elevated)' }} />
                  <div className="h-4 rounded-full w-4/5" style={{ background: 'var(--elevated)' }} />
                  <div className="h-3 rounded-full w-2/3" style={{ background: 'var(--elevated)' }} />
                </div>
              </div>
            ))}
          </div>
        ) : data?.error ? (
          // Error state
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertCircle size={28} style={{ color: '#f87171' }} />
            </div>
            <p className="text-base font-semibold mb-2" style={{ color: 'var(--text)' }}>Could not load stories</p>
            <p className="text-sm mb-6 max-w-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{data.error}</p>
            <button onClick={() => load(topic)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: 'var(--glow-md)' }}>
              <RefreshCw size={14} />Try again
            </button>
          </div>
        ) : articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <Compass size={40} className="mb-4" style={{ color: 'var(--muted)', opacity: 0.25 }} />
            <p className="text-sm" style={{ color: 'var(--muted)' }}>No stories found for this topic. Try refreshing.</p>
            <button onClick={() => load(topic)} className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
              <RefreshCw size={12} />Refresh
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {articles.map((a, i) => (
              <div key={i} className="group flex flex-col rounded-2xl overflow-hidden transition-all msg-animate"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', animationDelay: `${i * 0.05}s`, opacity: 0 }}
                onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(99,102,241,0.35)'; e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 32px rgba(0,0,0,0.2)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none'; }}
              >
                {/* Image */}
                <div className="px-3 pt-3 overflow-hidden">
                  <ArticleImage src={a.image} title={a.title} />
                </div>

                {/* Content */}
                <div className="flex flex-col flex-1 p-4">
                  {/* Source + time + external link */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <img
                        src={`https://www.google.com/s2/favicons?domain=${a.source}&sz=32`}
                        className="w-4 h-4 rounded-sm flex-shrink-0"
                        alt=""
                        onError={e => { (e.target as HTMLImageElement).style.display='none'; }}
                      />
                      <span className="text-[10px] font-semibold truncate" style={{ color: 'var(--muted)' }}>{a.source}</span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {a.publishedDate && (
                        <span className="text-[10px] flex items-center gap-0.5" style={{ color: 'var(--muted)', opacity: 0.7 }}>
                          <Clock size={9} />{timeAgo(a.publishedDate)}
                        </span>
                      )}
                      <a href={a.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                        className="p-1 rounded-lg transition-all" style={{ color: 'var(--muted)', background: 'var(--elevated)' }}>
                        <ExternalLink size={10} />
                      </a>
                    </div>
                  </div>

                  {/* Title */}
                  <p className="text-sm font-bold leading-snug mb-2 line-clamp-3" style={{ color: 'var(--text)' }}>{a.title}</p>

                  {/* Snippet */}
                  {a.snippet && (
                    <p className="text-[11px] leading-relaxed line-clamp-2 mb-3 flex-1" style={{ color: 'var(--text-dim)' }}>{a.snippet}</p>
                  )}

                  {/* Ask AI row */}
                  {askingArticle?.url === a.url ? (
                    <div className="flex gap-2 mt-auto">
                      <input autoFocus value={askPrompt} onChange={e => setAskPrompt(e.target.value)}
                        onKeyDown={e => { if (e.key==='Enter') askAI(a, askPrompt||undefined); if(e.key==='Escape') setAskingArticle(null); }}
                        placeholder="Ask anything about this..."
                        className="flex-1 text-xs rounded-xl px-3 py-2 outline-none"
                        style={{ background: 'var(--elevated)', border: '1px solid rgba(99,102,241,0.4)', color: 'var(--text)' }}
                      />
                      <button onClick={() => askAI(a, askPrompt||undefined)}
                        className="p-2 rounded-xl flex-shrink-0" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white' }}>
                        <Send size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2 mt-auto pt-1">
                      <button onClick={() => askAI(a)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-semibold transition-all"
                        style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)', color: 'var(--accent-light)' }}>
                        <Sparkles size={10} />Ask AI
                      </button>
                      <button onClick={() => { setAskingArticle(a); setAskPrompt(''); }}
                        className="flex items-center gap-1 px-3 py-2 rounded-xl text-[11px] transition-all"
                        style={{ background: 'var(--elevated)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
                        <ChevronRight size={11} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
