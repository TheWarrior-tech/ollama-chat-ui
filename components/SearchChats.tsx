'use client';
import { useState, useEffect, useRef } from 'react';
import { Search, X, MessageSquare } from 'lucide-react';
import { Conversation } from '@/types';

interface Props {
  conversations: Conversation[];
  onSelect: (id: string) => void;
  onClose: () => void;
}

export default function SearchChats({ conversations, onSelect, onClose }: Props) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const results = query.trim()
    ? conversations.filter(c =>
        c.title.toLowerCase().includes(query.toLowerCase()) ||
        c.messages.some(m => m.content.toLowerCase().includes(query.toLowerCase()))
      ).slice(0, 8)
    : conversations.slice(0, 8);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}>
      <div className="w-full max-w-lg scale-in" style={{ opacity: 0 }} onClick={e => e.stopPropagation()}>
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <Search size={15} style={{ color: 'var(--muted)' }} />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Escape' && onClose()}
              placeholder="Search chats and messages..."
              className="flex-1 text-sm bg-transparent outline-none"
              style={{ color: 'var(--text)' }}
            />
            {query && <button onClick={() => setQuery('')} style={{ color: 'var(--muted)' }}><X size={13} /></button>}
          </div>
          {/* Results */}
          <div className="py-2 max-h-80 overflow-y-auto scrollbar-hide">
            {results.length === 0 ? (
              <p className="text-center text-xs py-6" style={{ color: 'var(--muted)' }}>No chats found</p>
            ) : results.map(c => {
              const match = query.trim() ? c.messages.find(m => m.content.toLowerCase().includes(query.toLowerCase())) : null;
              return (
                <button key={c.id} onClick={() => { onSelect(c.id); onClose(); }}
                  className="w-full flex items-start gap-3 px-4 py-3 transition-all text-left"
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--elevated)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <MessageSquare size={14} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 2 }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{c.title}</p>
                    {match && <p className="text-xs truncate mt-0.5" style={{ color: 'var(--muted)' }}>…{match.content.slice(0, 80)}…</p>}
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--muted)', opacity: 0.6 }}>{c.messages.length} messages</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        <p className="text-center text-[10px] mt-3" style={{ color: 'var(--muted)', opacity: 0.5 }}>Press Esc to close · ↑↓ to navigate</p>
      </div>
    </div>
  );
}
