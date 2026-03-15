'use client';

import { Conversation } from '@/types';
import { MessageSquare, Plus, Trash2, X, Bot } from 'lucide-react';

interface Props {
  open: boolean;
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onToggle: () => void;
}

export default function Sidebar({ open, conversations, activeId, onSelect, onNew, onDelete, onToggle }: Props) {
  if (!open) return null;
  return (
    <div className="w-64 flex-shrink-0 bg-sidebar flex flex-col h-full border-r border-border">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Bot size={22} className="text-accent" />
          <span className="font-semibold text-white text-sm">Ollama Chat</span>
        </div>
        <button onClick={onToggle} className="p-1 rounded-lg hover:bg-input text-muted hover:text-white transition">
          <X size={16} />
        </button>
      </div>
      <div className="p-3">
        <button
          onClick={onNew}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border hover:bg-input transition text-sm text-white"
        >
          <Plus size={16} className="text-muted" />
          New Chat
        </button>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-hide px-2 pb-4">
        {conversations.length === 0 && (
          <p className="text-center text-muted text-xs mt-8">No conversations yet</p>
        )}
        {conversations.map(c => (
          <div
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={`group flex items-center justify-between px-3 py-2.5 rounded-lg mb-1 cursor-pointer transition ${
              activeId === c.id ? 'bg-input text-white' : 'text-muted hover:bg-input hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <MessageSquare size={14} className="flex-shrink-0" />
              <span className="text-sm truncate">{c.title}</span>
            </div>
            <button
              onClick={e => { e.stopPropagation(); onDelete(c.id); }}
              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:text-red-400 transition"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
