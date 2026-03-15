'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Sidebar from '@/components/Sidebar';
import ChatWindow from '@/components/ChatWindow';
import ChatInput from '@/components/ChatInput';
import ModelSelector from '@/components/ModelSelector';
import { Message, Conversation } from '@/types';

export default function Home() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [models, setModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const abortRef = useRef<AbortController | null>(null);

  const activeConversation = conversations.find(c => c.id === activeId) || null;

  useEffect(() => {
    fetch('/api/models')
      .then(r => r.json())
      .then(data => {
        const list: string[] = data.models || [];
        setModels(list);
        if (list.length > 0) setSelectedModel(list[0]);
      })
      .catch(() => setModels([]));
  }, []);

  const newConversation = useCallback(() => {
    const id = uuidv4();
    const convo: Conversation = { id, title: 'New Chat', messages: [], model: selectedModel };
    setConversations(prev => [convo, ...prev]);
    setActiveId(id);
  }, [selectedModel]);

  useEffect(() => {
    if (!activeId && conversations.length === 0) newConversation();
  }, [models]);

  const sendMessage = async (content: string, isImage: boolean = false) => {
    if (!activeId) return;
    const userMsg: Message = { id: uuidv4(), role: 'user', content, isImage: false, timestamp: Date.now() };

    setConversations(prev => prev.map(c =>
      c.id === activeId
        ? { ...c, messages: [...c.messages, userMsg], title: c.title === 'New Chat' ? content.slice(0, 40) : c.title }
        : c
    ));

    if (isImage) {
      setIsStreaming(true);
      try {
        const res = await fetch('/api/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: content })
        });
        const data = await res.json();
        const assistantMsg: Message = {
          id: uuidv4(), role: 'assistant',
          content: data.image ? `![Generated Image](data:image/png;base64,${data.image})` : 'Image generation failed.',
          isImage: true, timestamp: Date.now()
        };
        setConversations(prev => prev.map(c =>
          c.id === activeId ? { ...c, messages: [...c.messages, assistantMsg] } : c
        ));
      } finally {
        setIsStreaming(false);
      }
      return;
    }

    const assistantMsgId = uuidv4();
    const assistantMsg: Message = { id: assistantMsgId, role: 'assistant', content: '', isImage: false, timestamp: Date.now() };
    setConversations(prev => prev.map(c =>
      c.id === activeId ? { ...c, messages: [...c.messages, assistantMsg] } : c
    ));

    setIsStreaming(true);
    abortRef.current = new AbortController();

    try {
      const convMessages = activeConversation?.messages || [];
      const history = [...convMessages, userMsg].map(m => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: selectedModel, messages: history }),
        signal: abortRef.current.signal
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let full = '';

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(Boolean);
        for (const line of lines) {
          try {
            const json = JSON.parse(line);
            if (json.message?.content) {
              full += json.message.content;
              setConversations(prev => prev.map(c =>
                c.id === activeId
                  ? { ...c, messages: c.messages.map(m => m.id === assistantMsgId ? { ...m, content: full } : m) }
                  : c
              ));
            }
          } catch {}
        }
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        setConversations(prev => prev.map(c =>
          c.id === activeId
            ? { ...c, messages: c.messages.map(m => m.id === assistantMsgId ? { ...m, content: 'Error connecting to Ollama. Make sure it is running.' } : m) }
            : c
        ));
      }
    } finally {
      setIsStreaming(false);
    }
  };

  const stopStreaming = () => {
    abortRef.current?.abort();
    setIsStreaming(false);
  };

  const deleteConversation = (id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeId === id) {
      const remaining = conversations.filter(c => c.id !== id);
      setActiveId(remaining[0]?.id || null);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-chat">
      <Sidebar
        open={sidebarOpen}
        conversations={conversations}
        activeId={activeId}
        onSelect={setActiveId}
        onNew={newConversation}
        onDelete={deleteConversation}
        onToggle={() => setSidebarOpen(o => !o)}
      />
      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          {!sidebarOpen && (
            <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-input text-muted hover:text-white transition">
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/></svg>
            </button>
          )}
          <ModelSelector models={models} selected={selectedModel} onChange={setSelectedModel} />
        </div>
        <ChatWindow messages={activeConversation?.messages || []} isStreaming={isStreaming} />
        <ChatInput onSend={sendMessage} isStreaming={isStreaming} onStop={stopStreaming} />
      </div>
    </div>
  );
}
