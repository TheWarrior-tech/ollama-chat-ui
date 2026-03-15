'use client';
import { Conversation } from '@/types';
import { Plus, Trash2, X, Cpu, ChevronDown, MessageSquare, Share2, LogOut, User, Settings, Sun, Moon, Monitor } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/lib/theme';

interface Props {
  open: boolean; conversations: Conversation[]; activeId: string | null;
  models: string[]; selectedModel: string; userName: string;
  onModelChange: (m: string) => void; onSelect: (id: string) => void;
  onNew: () => void; onDelete: (id: string) => void;
  onShare: (id: string) => void; onToggle: () => void;
  onSignOut: () => void;
}

export default function Sidebar({ open, conversations, activeId, models, selectedModel, userName, onModelChange, onSelect, onNew, onDelete, onShare, onToggle, onSignOut }: Props) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  if (!open) return null;

  const themeOptions = [
    { value: 'dark', icon: Moon, label: 'Dark' },
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'system', icon: Monitor, label: 'System' },
  ] as const;

  return (
    <aside className="w-[260px] flex-shrink-0 flex flex-col h-full border-r transition-colors" style={{ background: 'var(--sidebar)', borderColor: 'var(--border)' }}>
      {/* Logo */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-accent flex items-center justify-center shadow-glow-sm">
            <Cpu size={15} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight" style={{ color: 'var(--text)' }}>NeuralChat</p>
            <p className="text-[9px] uppercase tracking-[0.18em] font-medium" style={{ color: 'var(--muted)' }}>Local AI</p>
          </div>
        </div>
        <button onClick={onToggle} className="p-1.5 rounded-lg transition-all" style={{ color: 'var(--muted)' }}><X size={13} /></button>
      </div>

      {/* Model selector */}
      <div className="px-4 pb-3">
        <label className="text-[9px] uppercase tracking-[0.15em] font-semibold mb-1.5 block" style={{ color: 'var(--muted)' }}>Model</label>
        <div className="relative">
          <select value={selectedModel} onChange={e => onModelChange(e.target.value)}
            className="w-full appearance-none text-xs rounded-xl px-3 py-2.5 pr-8 outline-none cursor-pointer transition-all"
            style={{ background: 'var(--elevated)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
            {models.length === 0 && <option value="">No models found</option>}
            {models.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <ChevronDown size={11} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--muted)' }} />
        </div>
      </div>

      {/* New chat */}
      <div className="px-4 pb-4">
        <button onClick={onNew}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all bg-gradient-subtle border hover:shadow-glow-sm"
          style={{ borderColor: 'rgba(99,102,241,0.2)', color: 'var(--accent-light)' }}>
          <Plus size={13} /> New Chat
        </button>
      </div>

      {/* Theme switcher */}
      <div className="px-4 pb-4">
        <label className="text-[9px] uppercase tracking-[0.15em] font-semibold mb-2 block" style={{ color: 'var(--muted)' }}>Theme</label>
        <div className="grid grid-cols-3 gap-1 p-1 rounded-xl" style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}>
          {themeOptions.map(({ value, icon: Icon, label }) => (
            <button key={value} onClick={() => setTheme(value)}
              className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-medium transition-all`}
              style={{
                background: theme === value ? 'var(--surface)' : 'transparent',
                color: theme === value ? 'var(--accent-light)' : 'var(--muted)',
                border: theme === value ? '1px solid var(--border-med)' : '1px solid transparent',
                boxShadow: theme === value ? 'var(--shadow)' : 'none',
              }}>
              <Icon size={11} />{label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pb-2"><span className="text-[9px] uppercase tracking-[0.15em] font-semibold" style={{ color: 'var(--muted)' }}>History</span></div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-0.5 scrollbar-hide">
        {conversations.length === 0 && (
          <div className="flex flex-col items-center justify-center mt-8 gap-2">
            <MessageSquare size={20} style={{ color: 'var(--muted)', opacity: 0.4 }} />
            <p className="text-xs" style={{ color: 'var(--muted)', opacity: 0.6 }}>No chats yet</p>
          </div>
        )}
        {conversations.map(c => (
          <div key={c.id} onClick={() => onSelect(c.id)}
            className="group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all"
            style={{
              background: activeId === c.id ? 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08))' : 'transparent',
              border: activeId === c.id ? '1px solid rgba(99,102,241,0.2)' : '1px solid transparent',
              color: activeId === c.id ? 'var(--text)' : 'var(--muted-light)',
            }}>
            <span className="text-xs truncate flex-1">{c.title}</span>
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all ml-1 flex-shrink-0">
              {/* Share button — visible on hover */}
              <button
                onClick={e => { e.stopPropagation(); onShare(c.id); }}
                title="Share this chat"
                className="p-1.5 rounded-lg transition-all hover:bg-blue-500/10"
                style={{ color: c.shared ? '#60a5fa' : 'var(--muted)' }}>
                <Share2 size={10} />
              </button>
              <button onClick={e => { e.stopPropagation(); onDelete(c.id); }}
                className="p-1.5 rounded-lg transition-all"
                style={{ color: 'var(--muted)' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
              >
                <Trash2 size={10} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-3" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}>
            <User size={12} style={{ color: 'var(--muted-light)' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate" style={{ color: 'var(--text)' }}>{userName}</p>
            <p className="text-[10px]" style={{ color: 'var(--muted)' }}>Local account</p>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => router.push('/settings')} className="p-1.5 rounded-lg transition-all" style={{ color: 'var(--muted)' }} title="Settings">
              <Settings size={12} />
            </button>
            <button onClick={onSignOut} className="p-1.5 rounded-lg transition-all" style={{ color: 'var(--muted)' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
              title="Sign out">
              <LogOut size={12} />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 6px rgba(52,211,153,0.8)' }} />
          <p className="text-[10px]" style={{ color: 'var(--muted)' }}>Private & local</p>
        </div>
      </div>
    </aside>
  );
}
