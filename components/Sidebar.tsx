'use client';
import { Conversation } from '@/types';
import { Plus, Trash2, X, Cpu, ChevronDown } from 'lucide-react';

interface Props {
  open: boolean;
  conversations: Conversation[];
  activeId: string | null;
  models: string[];
  selectedModel: string;
  onModelChange: (m: string) => void;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onToggle: () => void;
}

export default function Sidebar({ open, conversations, activeId, models, selectedModel, onModelChange, onSelect, onNew, onDelete, onToggle }: Props) {
  if (!open) return null;
  return (
    <div className="w-[260px] flex-shrink-0 flex flex-col h-full bg-sidebar border-r border-border">
      <div className="flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-accent/20 border border-accent/30 flex items-center justify-center">
            <Cpu size={14} className="text-accent" />
          </div>
          <div>
            <span className="font-bold text-text text-sm tracking-tight">NeuralChat</span>
            <span className="block text-[9px] text-muted tracking-widest uppercase">Local AI</span>
          </div>
        </div>
        <button onClick={onToggle} className="p-1.5 rounded-lg hover:bg-elevated text-muted hover:text-text transition-colors">
          <X size={14} />
        </button>
      </div>

      <div className="px-3 pb-3">
        <div className="relative">
          <select
            value={selectedModel}
            onChange={e => onModelChange(e.target.value)}
            className="w-full appearance-none bg-elevated border border-border text-text-dim text-xs rounded-lg px-3 py-2.5 pr-8 outline-none cursor-pointer hover:border-border-light hover:text-text transition-colors"
          >
            {models.length === 0 && <option value="">No models found</option>}
            {models.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
        </div>
      </div>

      <div className="px-3 pb-3">
        <button
          onClick={onNew}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border hover:border-accent/40 hover:bg-accent/5 text-text-dim hover:text-text text-xs font-medium transition-all"
        >
          <Plus size={14} /> New Chat
        </button>
      </div>

      <div className="px-3 pb-2">
        <span className="text-[10px] uppercase tracking-widest text-muted font-semibold">Conversations</span>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5 scrollbar-hide">
        {conversations.length === 0 && <p className="text-center text-muted text-xs mt-6">No chats yet</p>}
        {conversations.map(c => (
          <div
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={`group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
              activeId === c.id
                ? 'bg-accent/10 border border-accent/20 text-text'
                : 'text-muted-light hover:bg-elevated hover:text-text border border-transparent'
            }`}
          >
            <span className="text-xs truncate flex-1">{c.title}</span>
            <button
              onClick={e => { e.stopPropagation(); onDelete(c.id); }}
              className="opacity-0 group-hover:opacity-100 ml-2 p-1 rounded-lg hover:text-red-400 text-muted transition-all flex-shrink-0"
            >
              <Trash2 size={11} />
            </button>
          </div>
        ))}
      </div>

      <div className="px-4 py-3 border-t border-border">
        <p className="text-[10px] text-muted">NeuralChat · Private & local</p>
      </div>
    </div>
  );
}
