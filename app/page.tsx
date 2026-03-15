'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import ChatWindow from '@/components/ChatWindow';
import ChatInput from '@/components/ChatInput';
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

    // Update title if first message
    if (activeConvo?.title === 'New Chat') {
      fetch(`/api/conversations/${activeId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: content.slice(0, 45) }) }).catch(() => {});
    }

    // Save user message to DB
    fetch(`/api/conversations/${activeId}/messages`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'user', content }),
    }).catch(() => {});

    setIsStreaming(true);
    abortRef.current = new AbortController();

    try {
      // Fetch memory
      const memRes = await fetch('/api/memory');
      const memData = await memRes.json();
      const memories: string[] = memData.memories || [];

      let augmentedContent = content;
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
        'Always give full, detailed, well-structured answers.',
      ];

      if (memories.length > 0) {
        systemParts.push('', 'User memories (things you know about this user):', ...memories.map(m => `- ${m}`));
      }

      if (sources.length > 0) {
        systemParts.push('', 'Web search results (cite as [1], [2] etc):',
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

      // Save assistant message to DB
      fetch(`/api/conversations/${activeId}/messages`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'assistant', content: fullContent, thinking: fullThinking || undefined, sources: sources.length ? sources : undefined }),
      }).catch(() => {});

      // Auto-save memory: extract key facts from short replies
      if (content.toLowerCase().includes('my name is') || content.toLowerCase().includes('i am ') || content.toLowerCase().includes('i like ')) {
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
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  if (status === 'unauthenticated') return null;

  return (
    <div className="flex h-screen overflow-hidden bg-bg text-text relative">
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
        onShare={async id => {
          await fetch(`/api/conversations/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ shared: true }) });
          setConversations(p => p.map(c => c.id === id ? { ...c, shared: true } : c));
          const url = `${window.location.origin}/share/${id}`;
          await navigator.clipboard.writeText(url);
          alert(`Share link copied!\n${url}`);
        }}
        onToggle={() => setSidebarOpen(o => !o)}
        onSignOut={() => signOut({ callbackUrl: '/auth' })}
      />
      <div className="flex flex-col flex-1 min-w-0 h-full relative z-10">
        <header className="flex items-center justify-between px-6 py-3.5 border-b border-border glass flex-shrink-0">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-xl hover:bg-elevated text-muted hover:text-text transition-all">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              </button>
            )}
            <div className="flex items-center gap-2">
              <div className="relative"><div className="w-2 h-2 rounded-full bg-emerald-400" /><div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-400 animate-ping opacity-60" /></div>
              <span className="text-xs font-medium text-text-dim">{selectedModel || 'No model'}</span>
            </div>
          </div>
          <span className="text-[10px] font-semibold tracking-[0.2em] text-muted uppercase">NeuralChat</span>
        </header>
        <ChatWindow messages={activeConvo?.messages ?? []} isStreaming={isStreaming} />
        <ChatInput onSend={sendMessage} isStreaming={isStreaming}
          onStop={() => { abortRef.current?.abort(); setIsStreaming(false); }}
          webSearch={webSearch} onToggleWeb={() => setWebSearch(w => !w)} />
      </div>
    </div>
  );
}
