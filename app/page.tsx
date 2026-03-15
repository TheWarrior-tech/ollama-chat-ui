'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Sidebar from '@/components/Sidebar';
import ChatWindow from '@/components/ChatWindow';
import ChatInput from '@/components/ChatInput';
import { Message, Conversation } from '@/types';

export default function Home() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [models, setModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const abortRef = useRef<AbortController | null>(null);

  const activeConvo = conversations.find(c => c.id === activeId) ?? null;

  useEffect(() => {
    fetch('/api/models').then(r => r.json()).then(d => {
      const list: string[] = d.models || [];
      setModels(list);
      if (list.length) setSelectedModel(list[0]);
    }).catch(() => {});
  }, []);

  const newChat = useCallback(() => {
    const id = uuidv4();
    setConversations(p => [{ id, title: 'New Chat', messages: [], model: selectedModel }, ...p]);
    setActiveId(id);
  }, [selectedModel]);

  useEffect(() => { if (conversations.length === 0) newChat(); }, [models]);

  const updateMessages = (id: string, fn: (msgs: Message[]) => Message[]) =>
    setConversations(p => p.map(c => c.id === id ? { ...c, messages: fn(c.messages) } : c));

  const sendMessage = async (content: string) => {
    if (!activeId || isStreaming) return;
    const userMsg: Message = { id: uuidv4(), role: 'user', content, timestamp: Date.now() };

    setConversations(p => p.map(c => c.id === activeId ? {
      ...c,
      messages: [...c.messages, userMsg],
      title: c.title === 'New Chat' ? content.slice(0, 45) : c.title
    } : c));

    const aId = uuidv4();
    const aMsg: Message = { id: aId, role: 'assistant', content: '', timestamp: Date.now() };
    setConversations(p => p.map(c => c.id === activeId ? { ...c, messages: [...c.messages, userMsg, aMsg] } : c));

    setIsStreaming(true);
    abortRef.current = new AbortController();

    try {
      const history = [...(activeConvo?.messages || []), userMsg].map(m => ({ role: m.role, content: m.content }));
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: selectedModel, messages: history }),
        signal: abortRef.current.signal,
      });

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      const flush = (text: string) => {
        buffer = text;
        setConversations(p => p.map(c => c.id === activeId
          ? { ...c, messages: c.messages.map(m => m.id === aId ? { ...m, content: text } : m) }
          : c
        ));
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        flush(buffer);
      }
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        updateMessages(activeId, msgs => msgs.map(m =>
          m.role === 'assistant' && m.content === '' ? { ...m, content: '⚠️ Could not reach Ollama. Make sure it is running with `ollama serve`.' } : m
        ));
      }
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-bg text-text">
      <Sidebar
        open={sidebarOpen}
        conversations={conversations}
        activeId={activeId}
        models={models}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        onSelect={id => setActiveId(id)}
        onNew={newChat}
        onDelete={id => {
          setConversations(p => p.filter(c => c.id !== id));
          if (activeId === id) setActiveId(conversations.find(c => c.id !== id)?.id ?? null);
        }}
        onToggle={() => setSidebarOpen(o => !o)}
      />
      <div className="flex flex-col flex-1 min-w-0 h-full">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-border bg-bg/80 backdrop-blur-sm flex-shrink-0">
          {!sidebarOpen && (
            <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-elevated text-muted hover:text-text transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
          )}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-sm text-muted-light font-medium">{selectedModel || 'No model selected'}</span>
          </div>
        </div>
        <ChatWindow messages={activeConvo?.messages ?? []} isStreaming={isStreaming} />
        <ChatInput
          onSend={sendMessage}
          isStreaming={isStreaming}
          onStop={() => { abortRef.current?.abort(); setIsStreaming(false); }}
        />
      </div>
    </div>
  );
}
