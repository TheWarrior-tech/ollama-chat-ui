'use client';
import { useState, useEffect, useCallback } from 'react';
import { Search, RefreshCw, Loader2, X, AlertCircle } from 'lucide-react';

interface Article {
  title: string;
  url: string;
  snippet: string;
  source: string;
  publishedDate?: string | null;
  thumbnail?: string;
}
interface Topic { id: string; label: string; }
interface Props { onAskAI: (prompt: string) => void; onClose: () => void; }

const FALLBACK_TOPICS: Topic[] = [
  { id:'ai', label:'AI & Tech' }, { id:'science', label:'Science' },
  { id:'world', label:'World' }, { id:'finance', label:'Finance' },
  { id:'health', label:'Health' }, { id:'space', label:'Space' },
  { id:'sport', label:'Sport' }, { id:'gaming', label:'Gaming' },
];

function timeAgo(d?: string | null) {
  if (!d) return '';
  try {
    const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  } catch { return ''; }
}

// Replicates Perplexica's thumbnail URL cleaning
function cleanThumb(url?: string) {
  if (!url) return '';
  try {
    const u = new URL(url);
    // Perplexica strips all params except `id`
    const id = u.searchParams.get('id');
    return u.origin + u.pathname + (id ? `?id=${id}` : '');
  } catch { return url; }
}

export default function DiscoverPanel({ onAskAI, onClose }: Props) {
  const [topic, setTopic] = useState('ai');
  const [data, setData] = useState<{ topics: Topic[]; articles: Article[]; error?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (t: string) => {
    setLoading(true);
    setData(null);
    try {
      const res = await fetch(`/api/discover?topic=${t}`);
      const json = await res.json();
      setData(json);
    } catch {
      setData({ topics: FALLBACK_TOPICS, articles: [], error: 'Network error.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(topic); }, [topic]);

  // Perplexica behaviour: clicking a card fires "Summary: <url>" into the chat
  const handleCard = (article: Article) => {
    onAskAI(`Summary: ${article.url}`);
    onClose();
  };

  const topics = data?.topics || FALLBACK_TOPICS;
  const articles = data?.articles || [];

  return (
    <div className="fixed inset-0 z-40 flex flex-col" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <div className="ambient-bg" />

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-8 py-5 flex-shrink-0 relative z-10"
        style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3">
          <Search size={26} style={{ color: 'var(--text)' }} strokeWidth={2} />
          <h1 className="text-[28px] font-semibold tracking-tight" style={{ color: 'var(--text)', letterSpacing: '-0.03em' }}>Discover</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => load(topic)} disabled={loading}
            className="header-pill" style={{ gap: '6px' }}>
            {loading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
            Refresh
          </button>
          <button onClick={onClose} className="header-pill">
            <X size={13} />Close
          </button>
        </div>
      </div>

      {/* Perplexica-style thin hr divider */}
      <div className="relative z-10" style={{ borderBottom: '1px solid var(--border)' }} />

      {/* ── Topic pills ── */}
      <div className="flex gap-2 px-8 py-4 overflow-x-auto scrollbar-hide flex-shrink-0 relative z-10">
        {topics.map(t => (
          <button key={t.id} onClick={() => setTopic(t.id)}
            className="flex-shrink-0 px-4 py-2 rounded-full text-[13px] font-semibold transition-all whitespace-nowrap"
            style={{
              background: topic === t.id ? 'var(--gradient-accent)' : 'var(--elevated)',
              border: '1px solid ' + (topic === t.id ? 'transparent' : 'var(--border-med)'),
              color: topic === t.id ? 'white' : 'var(--text-dim)',
              boxShadow: topic === t.id ? 'var(--glow-sm)' : 'none',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Grid ── */}
      <div className="flex-1 overflow-y-auto px-8 pb-10 relative z-10">
        {loading ? (
          // Skeleton — same card shape as real cards
          <div className="grid lg:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-5">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden shimmer" style={{ border: '1px solid var(--border)', height: '260px' }} />
            ))}
          </div>
        ) : data?.error ? (
          <div className="flex flex-col items-center justify-center min-h-[55vh] text-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}>
              <AlertCircle size={24} style={{ color: 'var(--rose)' }} />
            </div>
            <p className="font-semibold" style={{ color: 'var(--text)' }}>Could not load stories</p>
            <p className="text-sm max-w-sm leading-relaxed" style={{ color: 'var(--muted-light)' }}>{data.error}</p>
            <button onClick={() => load(topic)} className="btn-primary flex items-center gap-2 mt-1">
              <RefreshCw size={13} />Try again
            </button>
          </div>
        ) : articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[55vh] text-center gap-3">
            <Search size={36} style={{ color: 'var(--muted)', opacity: 0.25 }} />
            <p className="text-sm" style={{ color: 'var(--muted-light)' }}>No stories with images found for this topic.</p>
            <button onClick={() => load(topic)} className="btn-ghost flex items-center gap-2 mt-1">
              <RefreshCw size={13} />Refresh
            </button>
          </div>
        ) : (
          // Perplexica grid: lg=3 cols, sm=2 cols, xs=1 col
          <div className="grid lg:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-5 pb-8">
            {articles.map((a, i) => (
              <button
                key={i}
                onClick={() => handleCard(a)}
                className="group text-left rounded-2xl overflow-hidden transition-all msg-animate"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  animationDelay: `${i * 0.04}s`,
                  opacity: 0,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                  e.currentTarget.style.borderColor = 'var(--border-med)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = 'var(--border)';
                }}
              >
                {/* Thumbnail — aspect-video like Perplexica */}
                <div className="w-full overflow-hidden" style={{ aspectRatio: '16/9', background: 'var(--elevated)' }}>
                  <img
                    src={cleanThumb(a.thumbnail)}
                    alt={a.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={e => {
                      (e.currentTarget.parentElement as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>

                {/* Text — matches Perplexica's px-6 py-4 */}
                <div className="px-5 py-4">
                  {/* Source + time */}
                  <div className="flex items-center gap-2 mb-2">
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${a.source}&sz=32`}
                      className="w-4 h-4 rounded-sm"
                      alt=""
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    <span className="text-[11px] font-semibold truncate" style={{ color: 'var(--muted-light)' }}>{a.source}</span>
                    {a.publishedDate && (
                      <span className="text-[10px] ml-auto flex-shrink-0" style={{ color: 'var(--text-faint)' }}>{timeAgo(a.publishedDate)}</span>
                    )}
                  </div>

                  {/* Title — Perplexica slices to 100 chars */}
                  <p className="font-bold text-[15px] leading-snug mb-2 line-clamp-2" style={{ color: 'var(--text)', letterSpacing: '-0.01em' }}>
                    {a.title.length > 100 ? a.title.slice(0, 100) + '…' : a.title}
                  </p>

                  {/* Snippet — Perplexica slices to 100 chars */}
                  <p className="text-sm leading-relaxed line-clamp-2" style={{ color: 'var(--text-dim)' }}>
                    {a.snippet.slice(0, 100)}{a.snippet.length > 100 ? '…' : ''}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
