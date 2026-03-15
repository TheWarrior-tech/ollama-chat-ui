'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

// Chat URL = share URL. If user owns the chat, load it in the main UI.
// If it's a shared/public chat, render read-only view.
export default function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [chat, setChat] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    fetch(`/api/conversations/${id}/public`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { router.push('/'); return; }
        setChat(data);
        setIsOwner(data.isOwner || false);
        setLoading(false);
        // If owner, redirect to main UI with this chat selected
        if (data.isOwner) router.push(`/?chat=${id}`);
      })
      .catch(() => router.push('/'));
  }, [id, status]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background:'var(--bg)' }}>
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor:'var(--accent)', borderTopColor:'transparent' }} />
    </div>
  );

  if (!chat) return null;

  return (
    <div className="min-h-screen" style={{ background:'var(--bg)', color:'var(--text)' }}>
      <div className="ambient-bg" />
      <div className="max-w-2xl mx-auto px-4 py-10 relative z-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8 fade-in">
          <div className="w-9 h-9 rounded-xl bg-gradient-accent flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/></svg>
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color:'var(--text)' }}>{chat.title}</h1>
            <p className="text-xs" style={{ color:'var(--muted)' }}>Shared by {chat.ownerName || 'Anonymous'} · {chat.messages?.length || 0} messages</p>
          </div>
        </div>

        {/* Messages */}
        <div className="space-y-4">
          {(chat.messages || []).map((m: any, i: number) => (
            <div key={i} className={`flex msg-animate ${m.role==='user'?'justify-end':'justify-start'}`}>
              <div className="max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed"
                style={m.role==='user'
                  ? { background:'var(--user-bubble)', color:'var(--user-bubble-text)' }
                  : { background:'var(--ai-bubble)', border:'1px solid var(--ai-bubble-border)', color:'var(--text-dim)' }
                }>
                {m.content}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <a href="/" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
            style={{ background:'var(--elevated)', border:'1px solid var(--border)', color:'var(--text-dim)' }}>
            Try NeuralChat yourself
          </a>
        </div>
      </div>
    </div>
  );
}
