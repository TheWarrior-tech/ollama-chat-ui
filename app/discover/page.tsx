'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink, RefreshCw, Loader2, Search } from 'lucide-react';

export default function DiscoverPage() {
  const router = useRouter();
  const [topic, setTopic] = useState('ai');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = async (t: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/discover?topic=${t}`);
      const json = await res.json();
      setData(json);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(topic); }, [topic]);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <div className="ambient-bg" />
      <div className="max-w-4xl mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/')} className="p-2 rounded-xl transition-all"
              style={{ background: 'var(--elevated)', border: '1px solid var(--border)', color: 'var(--muted)' }}>
              <ArrowLeft size={15} />
            </button>
            <div>
              <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Discover</h1>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>Today’s top stories, powered by live search</p>
            </div>
          </div>
          <button onClick={() => load(topic)} disabled={loading}
            className="p-2 rounded-xl transition-all"
            style={{ background: 'var(--elevated)', border: '1px solid var(--border)', color: 'var(--muted)' }}>
            {loading ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
          </button>
        </div>

        {/* Topic pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {(data?.topics || []).map((t: any) => (
            <button key={t.id} onClick={() => setTopic(t.id)}
              className="flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-all whitespace-nowrap"
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

        {/* Articles grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl p-4 animate-pulse" style={{ background: 'var(--surface)', border: '1px solid var(--border)', height: '140px' }} />
            ))}
          </div>
        ) : data?.articles?.length === 0 ? (
          <div className="text-center py-16">
            <Search size={32} className="mx-auto mb-3" style={{ color: 'var(--muted)', opacity: 0.3 }} />
            <p style={{ color: 'var(--muted)' }}>No articles found. SearXNG may not be running.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(data?.articles || []).map((a: any, i: number) => (
              <a key={i} href={a.url} target="_blank" rel="noopener noreferrer"
                className="group block rounded-2xl p-4 transition-all hover:scale-[1.02] msg-animate"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', animationDelay: `${i * 0.04}s`, opacity: 0 }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; e.currentTarget.style.boxShadow = 'var(--glow-sm)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'var(--elevated)', color: 'var(--muted)' }}>{a.source}</span>
                  <ExternalLink size={11} style={{ color: 'var(--muted)', flexShrink: 0, opacity: 0 }} className="group-hover:opacity-100 transition-opacity" />
                </div>
                <h3 className="text-sm font-semibold leading-snug mb-2 line-clamp-2" style={{ color: 'var(--text)' }}>{a.title}</h3>
                <p className="text-xs leading-relaxed line-clamp-3" style={{ color: 'var(--text-dim)' }}>{a.snippet}</p>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
