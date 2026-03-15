'use client';
import { Conversation } from '@/types';
import { Plus, Trash2, X, Cpu, ChevronDown, MessageSquare, Share2, LogOut, User } from 'lucide-react';

interface Props {
  open: boolean; conversations: Conversation[]; activeId: string | null;
  models: string[]; selectedModel: string; userName: string;
  onModelChange: (m: string) => void; onSelect: (id: string) => void;
  onNew: () => void; onDelete: (id: string) => void;
  onShare: (id: string) => void; onToggle: () => void;
  onSignOut: () => void;
}

export default function Sidebar({ open, conversations, activeId, models, selectedModel, userName, onModelChange, onSelect, onNew, onDelete, onShare, onToggle, onSignOut }: Props) {
  if (!open) return null;
  return (
    <aside className="w-[260px] flex-shrink-0 flex flex-col h-full bg-sidebar border-r border-border relative z-20">
      <div className="flex items-center justify-between px-5 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-accent flex items-center justify-center shadow-glow-sm">
            <Cpu size={15} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white tracking-tight">NeuralChat</p>
            <p className="text-[9px] text-muted uppercase tracking-[0.18em] font-medium">Local AI</p>
          </div>
        </div>
        <button onClick={onToggle} className="p-1.5 rounded-lg hover:bg-elevated text-muted hover:text-text transition-all"><X size={13} /></button>
      </div>

      <div className="px-4 pb-3">
        <label className="text-[9px] uppercase tracking-[0.15em] text-muted font-semibold mb-1.5 block">Model</label>
        <div className="relative">
          <select value={selectedModel} onChange={e => onModelChange(e.target.value)}
            className="w-full appearance-none bg-elevated border border-border text-text-dim text-xs rounded-xl px-3 py-2.5 pr-8 outline-none cursor-pointer hover:border-border-med hover:text-text transition-all">
            {models.length === 0 && <option value="">No models found</option>}
            {models.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <ChevronDown size={11} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
        </div>
      </div>

      <div className="px-4 pb-4">
        <button onClick={onNew} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-subtle border border-accent/20 hover:border-accent/40 hover:shadow-glow-sm text-accent-light text-xs font-semibold transition-all">
          <Plus size={13} /> New Chat
        </button>
      </div>

      <div className="px-5 pb-2"><span className="text-[9px] uppercase tracking-[0.15em] text-muted font-semibold">History</span></div>

      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-0.5 scrollbar-hide">
        {conversations.length === 0 && (
          <div className="flex flex-col items-center justify-center mt-8 gap-2">
            <MessageSquare size={20} className="text-muted/40" />
            <p className="text-xs text-muted/60">No chats yet</p>
          </div>
        )}
        {conversations.map(c => (
          <div key={c.id} onClick={() => onSelect(c.id)}
            className={`group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
              activeId === c.id ? 'bg-gradient-subtle border border-accent/20 text-white' : 'text-muted-light hover:bg-elevated hover:text-text border border-transparent'
            }`}>
            <span className="text-xs truncate flex-1">{c.title}</span>
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all ml-1 flex-shrink-0">
              <button onClick={e => { e.stopPropagation(); onShare(c.id); }}
                className="p-1 rounded-lg hover:text-blue-400 text-muted transition-all" title="Copy share link">
                <Share2 size={10} />
              </button>
              <button onClick={e => { e.stopPropagation(); onDelete(c.id); }}
                className="p-1 rounded-lg hover:text-red-400 text-muted transition-all">
                <Trash2 size={10} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 py-3 border-t border-border">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-7 h-7 rounded-lg bg-elevated border border-border flex items-center justify-center flex-shrink-0">
            <User size={12} className="text-muted-light" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-text truncate">{userName}</p>
            <p className="text-[10px] text-muted">Local account</p>
          </div>
          <button onClick={onSignOut} className="p-1.5 rounded-lg hover:bg-elevated text-muted hover:text-red-400 transition-all" title="Sign out">
            <LogOut size={12} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
          <p className="text-[10px] text-muted">Private & local</p>
        </div>
      </div>
    </aside>
  );
}
