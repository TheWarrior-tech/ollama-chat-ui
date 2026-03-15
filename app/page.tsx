'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import ChatWindow from '@/components/ChatWindow';
import ChatInput from '@/components/ChatInput';
import ShareToast, { useShareToast } from '@/components/ShareToast';
import { Message, Conversation } from '@/types';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [models, setModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [webSearch, setWebSearch] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const activeConvoRef = useRef<Conversation | null>(null);
  const shareToast = useShareToast();

  const activeConvo = conversations.find(c => c.id === activeId) ?? null;
  activeConvoRef.current = activeConvo;

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth');
  }, [status]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    fetch('/api/models').then(r => r.json()).then(d => {
      const list: string[] = d.models || [];
      setModels(list);
      if (list.length) setSelectedModel(list[0]);
    }).catch(() => {});
    fetch('/api/conversations').then(r => r.json()).then(data => {
      if (Array.isArray(data)) {
        const convos: Conversation[] = data.map((c: any) => ({
          id: c.id, title: c.title, model: selectedModel, shared: c.shared,
          messages: (c.messages || []).map((m: any) => ({
            id: m.id, role: m.role, content: m.content,
            thinking: m.thinking ?? undefined,
            sources: m.sources ?? undefined,
            timestamp: new Date(m.createdAt).getTime(),
          })),
        }));
        setConversations(convos);
        if (convos.length) setActiveId(convos[0].id);
      }
    }).catch(() => {});
  }, [status]);

  const newChat = useCallback(async () => {
    const res = await fetch('/api/conversations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'New Chat' }) });
    const convo = await res.json();
    const c: Conversation = { id: convo.id, title: convo.title, messages: [], model: selectedModel, shared: false };
    setConversations(p => [c, ...p]);
    setActiveId(c.id);
  }, [selectedModel]);

  const handleShare = async (id: string) => {
    await fetch(`/api/conversations/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shared: true }),
    });
    setConversations(p => p.map(c => c.id === id ? { ...c, shared: true } : c));
    const url = `${window.location.origin}/share/${id}`;
    await navigator.clipboard.writeText(url).catch(() => {});
    shareToast.show(url);
  };

  const sendMessage = async (content: string) => {
    if (!activeId || isStreaming) return;
    const tempUserId = 'temp-user-' + Date.now();
    const tempAiId = 'temp-ai-' + Date.now();
    const userMsg: Message = { id: tempUserId, role: 'user', content, timestamp: Date.now() };
    const aMsg: Message = { id: tempAiId, role: 'assistant', content: '', thinking: undefined, sources: undefined, timestamp: Date.now() };

    setConversations(p => p.map(c => c.id === activeId ? {
      ...c, messages: [...c.messages, userMsg, aMsg],
      title: c.title === 'New Chat' ? content.slice(0, 45) : c.title
    } : c));

    if (activeConvo?.title === 'New Chat') {
      fetch(`/api/conversations/${activeId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: content.slice(0, 45) }) }).catch(() => {});
    }

    fetch(`/api/conversations/${activeId}/messages`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'user', content }),
    }).catch(() => {});

    setIsStreaming(true);
    abortRef.current = new AbortController();

    try {
      const memRes = await fetch('/api/memory');
      const memData = await memRes.json();
      const memories: string[] = (memData.memories || []).map((m: any) => m.content ?? m);

      let sources: any[] = [];

      if (webSearch) {
        const sRes = await fetch('/api/search', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: content }),
          signal: abortRef.current.signal,
        });
        const sData = await sRes.json();
        sources = sData.results || [];
        if (sources.length > 0) {
          setConversations(p => p.map(c => c.id === activeId
            ? { ...c, messages: c.messages.map(m => m.id === tempAiId ? { ...m, sources } : m) } : c));
        }
      }

      const priorMessages = (activeConvoRef.current?.messages.filter(m => m.id !== tempAiId && m.id !== tempUserId) || [])
        .map(m => ({ role: m.role, content: m.content }));

      const systemParts: string[] = [
        'You are NeuralChat, a helpful and knowledgeable AI assistant.',
        'Always give full, detailed, well-structured answers. Never truncate or summarise prematurely.',
      ];
      if (memories.length > 0) {
        systemParts.push('', 'Things you know about this user:', ...memories.map(m => `- ${m}`));
      }
      if (sources.length > 0) {
        systemParts.push('', 'Web search results (cite inline as [1], [2] etc):',
          ...sources.map((s: any, i: number) => `[${i+1}] ${s.title}\n${s.snippet}\nURL: ${s.url}`));
      }

      const messages = [
        { role: 'system', content: systemParts.join('\n') },
        ...priorMessages,
        { role: 'user', content },
      ];

      const res = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: selectedModel, messages }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) throw new Error('Chat API failed');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '', fullThinking = '', leftover = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = leftover + decoder.decode(value, { stream: true });
        const lines = text.split('\n');
        leftover = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const json = JSON.parse(line);
            if (json.thinking) fullThinking += json.thinking;
            if (json.content) fullContent += json.content;
            setConversations(p => p.map(c => c.id === activeId
              ? { ...c, messages: c.messages.map(m => m.id === tempAiId
                  ? { ...m, content: fullContent, thinking: fullThinking || undefined } : m) } : c));
          } catch {}
        }
      }

      fetch(`/api/conversations/${activeId}/messages`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'assistant', content: fullContent, thinking: fullThinking || undefined, sources: sources.length ? sources : undefined }),
      }).catch(() => {});

      if (content.toLowerCase().match(/my name is|i am |i like |i prefer |i use |i work/)) {
        fetch('/api/memory', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: content.slice(0, 200) }) }).catch(() => {});
      }

    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        setConversations(p => p.map(c => c.id === activeId
          ? { ...c, messages: c.messages.map(m => m.id === tempAiId && m.content === ''
              ? { ...m, content: '⚠️ Could not reach Ollama. Run `ollama serve` first.' } : m) } : c));
      }
    } finally {
      setIsStreaming(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
      </div>
    );
  }
  if (status === 'unauthenticated') return null;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <div className="ambient-bg" />
      <Sidebar
        open={sidebarOpen}
        conversations={conversations}
        activeId={activeId}
        models={models}
        selectedModel={selectedModel}
        userName={(session?.user as any)?.name || session?.user?.email || ''}
        onModelChange={setSelectedModel}
        onSelect={setActiveId}
        onNew={newChat}
        onDelete={async id => {
          await fetch(`/api/conversations/${id}`, { method: 'DELETE' });
          setConversations(p => p.filter(c => c.id !== id));
          if (activeId === id) setActiveId(conversations.find(c => c.id !== id)?.id ?? null);
        }}
        onShare={handleShare}
        onToggle={() => setSidebarOpen(o => !o)}
        onSignOut={() => signOut({ callbackUrl: '/auth' })}
      />
      <div className="flex flex-col flex-1 min-w-0 h-full relative z-10">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-3.5 flex-shrink-0 glass" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-xl transition-all" style={{ color: 'var(--muted)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              </button>
            )}
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-400 animate-ping opacity-60" />
              </div>
              <span className="text-xs font-medium" style={{ color: 'var(--text-dim)' }}>{selectedModel || 'No model'}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {activeId && (
              <button
                onClick={() => handleShare(activeId)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                style={{ background: 'var(--elevated)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}
                title="Share this chat"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                Share
              </button>
            )}
            <span className="text-[10px] font-semibold tracking-[0.2em] uppercase" style={{ color: 'var(--muted)' }}>NeuralChat</span>
          </div>
        </header>
        <ChatWindow messages={activeConvo?.messages ?? []} isStreaming={isStreaming} />
        <ChatInput
          onSend={sendMessage} isStreaming={isStreaming}
          onStop={() => { abortRef.current?.abort(); setIsStreaming(false); }}
          webSearch={webSearch} onToggleWeb={() => setWebSearch(w => !w)}
        />
      </div>
      <ShareToast url={shareToast.url} visible={shareToast.visible} onClose={shareToast.hide} />
    </div>
  );
}
