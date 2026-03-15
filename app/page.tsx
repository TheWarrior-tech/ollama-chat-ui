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
  const [webSearch, setWebSearch] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const activeConvoRef = useRef<Conversation | null>(null);

  const activeConvo = conversations.find(c => c.id === activeId) ?? null;
  activeConvoRef.current = activeConvo;

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

  const sendMessage = async (content: string) => {
    if (!activeId || isStreaming) return;

    const userMsg: Message = { id: uuidv4(), role: 'user', content, timestamp: Date.now() };
    const aId = uuidv4();
    const aMsg: Message = { id: aId, role: 'assistant', content: '', thinking: undefined, sources: undefined, timestamp: Date.now() };

    // Add BOTH messages in a single state update — fixes duplicate bug
    setConversations(p => p.map(c => c.id === activeId ? {
      ...c,
      messages: [...c.messages, userMsg, aMsg],
      title: c.title === 'New Chat' ? content.slice(0, 45) : c.title
    } : c));

    setIsStreaming(true);
    abortRef.current = new AbortController();

    try {
      // Web search: fetch sources first, inject into context
      let sources: { title: string; url: string; snippet: string }[] | undefined;
      let augmentedContent = content;

      if (webSearch) {
        const sRes = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: content }),
          signal: abortRef.current.signal,
        });
        const sData = await sRes.json();
        sources = sData.results || [];
        if (sources && sources.length > 0) {
          const ctx = sources.map((s, i) => `[${i+1}] ${s.title}\n${s.snippet}\nURL: ${s.url}`).join('\n\n');
          augmentedContent = `Answer the following using the web search results below as context. Cite sources as [1], [2] etc.\n\nSearch results:\n${ctx}\n\nQuestion: ${content}`;
          // Show sources on assistant message immediately
          setConversations(p => p.map(c => c.id === activeId
            ? { ...c, messages: c.messages.map(m => m.id === aId ? { ...m, sources } : m) }
            : c
          ));
        }
      }

      const history = [...(activeConvoRef.current?.messages.filter(m => m.id !== aId) || []), { role: 'user', content: augmentedContent }];

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: selectedModel, messages: history }),
        signal: abortRef.current.signal,
      });

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let fullThinking = '';
      let leftover = '';

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
              ? { ...c, messages: c.messages.map(m => m.id === aId
                  ? { ...m, content: fullContent, thinking: fullThinking || undefined }
                  : m) }
              : c
            ));
          } catch {}
        }
      }
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        setConversations(p => p.map(c => c.id === activeId
          ? { ...c, messages: c.messages.map(m => m.id === aId && m.content === ''
              ? { ...m, content: '⚠️ Could not reach Ollama. Make sure it is running with `ollama serve`.' }
              : m) }
          : c
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
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-border bg-bg/90 backdrop-blur-md flex-shrink-0">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-surface text-muted hover:text-text transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              </button>
            )}
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.8)]" />
              <span className="text-xs text-muted font-medium">{selectedModel || 'No model'}</span>
            </div>
          </div>
        </div>
        <ChatWindow messages={activeConvo?.messages ?? []} isStreaming={isStreaming} />
        <ChatInput
          onSend={sendMessage}
          isStreaming={isStreaming}
          onStop={() => { abortRef.current?.abort(); setIsStreaming(false); }}
          webSearch={webSearch}
          onToggleWeb={() => setWebSearch(w => !w)}
        />
      </div>
    </div>
  );
}
