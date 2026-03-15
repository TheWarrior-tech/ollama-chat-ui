'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Cpu, ArrowLeft, Share2, Check, Lock } from 'lucide-react';

export default function SharedChatPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [chat, setChat] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    fetch(`/api/conversations/${id}/public`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { router.push('/'); return; }
        // If owner, redirect to main app selecting this chat
        if (data.isOwner) { router.push(`/?chat=${id}`); return; }
        setChat(data);
        setLoading(false);
      })
      .catch(() => router.push('/'));
  }, [id, status]);

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
    </div>
  );

  if (!chat) return null;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <div className="ambient-bg" />
      {/* Header */}
      <header className="sticky top-0 z-10 glass" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-accent flex items-center justify-center">
              <Cpu size={15} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{chat.title}</p>
              <p className="text-[10px]" style={{ color: 'var(--muted)' }}>Shared by {chat.ownerName} · {chat.messages?.length} messages</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={copyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
              style={{ background: 'var(--elevated)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
              {copied ? <><Check size={11} className="text-emerald-400" />Copied!</> : <><Share2 size={11} />Share</>}
            </button>
            <a href="/" className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white' }}>
              Try NeuralChat
            </a>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6 relative z-0">
        {(chat.messages || []).map((m: any, i: number) => (
          <div key={i} className={`flex gap-3 msg-animate ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'assistant' && (
              <div className="w-7 h-7 rounded-xl bg-gradient-accent flex items-center justify-center flex-shrink-0 mt-1">
                <Cpu size={13} className="text-white" />
              </div>
            )}
            <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
              m.role === 'user' ? 'rounded-br-sm' : 'rounded-bl-sm prose'
            }`}
              style={m.role === 'user'
                ? { background: 'var(--user-bubble)', color: 'var(--user-bubble-text)' }
                : { background: 'var(--ai-bubble)', border: '1px solid var(--ai-bubble-border)', color: 'var(--text-dim)' }
              }>
              {m.role === 'assistant' ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown> : m.content}
            </div>
          </div>
        ))}
        <div className="flex items-center justify-center gap-2 pt-8 pb-4">
          <Lock size={12} style={{ color: 'var(--muted)' }} />
          <p className="text-xs" style={{ color: 'var(--muted)' }}>This conversation was shared by its owner. View only.</p>
        </div>
      </div>
    </div>
  );
}
