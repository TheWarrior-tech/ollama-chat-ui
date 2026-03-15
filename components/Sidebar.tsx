'use client';
import { Conversation } from '@/types';
import { Plus, Trash2, X, ChevronDown, MessageSquare, Share2, LogOut, User, Settings, Sun, Moon, Monitor, Pin, PinOff, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/lib/theme';
import { useState } from 'react';

interface Props {
  open: boolean; conversations: Conversation[]; activeId: string | null;
  models: string[]; selectedModel: string; userName: string;
  onModelChange: (m: string) => void; onSelect: (id: string) => void;
  onNew: () => void; onDelete: (id: string) => void;
  onShare: (id: string) => void; onPin: (id: string, pinned: boolean) => void;
  onToggle: () => void; onSignOut: () => void;
}

export default function Sidebar({ open, conversations, activeId, models, selectedModel, userName, onModelChange, onSelect, onNew, onDelete, onShare, onPin, onToggle, onSignOut }: Props) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (!open) return null;

  const pinned = conversations.filter(c => c.pinned);
  const recent = conversations.filter(c => !c.pinned);

  const SectionLabel = ({ label }: { label: string }) => (
    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] px-3 pt-4 pb-1.5" style={{ color: 'var(--text-faint)' }}>{label}</p>
  );

  const ConvoItem = ({ c }: { c: Conversation }) => {
    const isActive = activeId === c.id;
    const isHovered = hoveredId === c.id;
    return (
      <div
        className={`chat-item ${isActive ? 'active' : ''}`}
        onClick={() => onSelect(c.id)}
        onMouseEnter={() => setHoveredId(c.id)}
        onMouseLeave={() => setHoveredId(null)}
      >
        {/* Active indicator bar */}
        {isActive && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
            style={{ background: 'var(--gradient-accent)' }} />
        )}
        <div className="flex items-center gap-2 flex-1 min-w-0 pl-1">
          {c.pinned && <Pin size={9} style={{ color: 'var(--accent)', flexShrink: 0, opacity: 0.8 }} />}
          <span className="text-[12.5px] truncate font-medium" style={{ color: isActive ? 'var(--text)' : 'var(--text-dim)', lineHeight: 1.4 }}>{c.title}</span>
        </div>
        <div className="actions">
          <button onClick={e => { e.stopPropagation(); onPin(c.id, !c.pinned); }}
            className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--muted)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent-light)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}>
            {c.pinned ? <PinOff size={10} /> : <Pin size={10} />}
          </button>
          <button onClick={e => { e.stopPropagation(); onShare(c.id); }}
            className="p-1.5 rounded-lg transition-colors" style={{ color: c.shared ? '#60a5fa' : 'var(--muted)' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#60a5fa')}
            onMouseLeave={e => (e.currentTarget.style.color = c.shared ? '#60a5fa' : 'var(--muted)')}>
            <Share2 size={10} />
          </button>
          <button onClick={e => { e.stopPropagation(); onDelete(c.id); }}
            className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--muted)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--rose)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}>
            <Trash2 size={10} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <aside
      className="w-[264px] flex-shrink-0 flex flex-col h-full"
      style={{ background: 'var(--sidebar)', borderRight: '1px solid var(--border)' }}
    >
      {/* ── Logo ── */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--gradient-accent)', boxShadow: 'var(--glow-sm)' }}>
              <Zap size={16} className="text-white" strokeWidth={2.5} />
            </div>
            {/* Online dot */}
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 flex items-center justify-center"
              style={{ background: 'var(--bg)', borderColor: 'var(--sidebar)' }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--emerald)', boxShadow: '0 0 5px var(--emerald)' }} />
            </div>
          </div>
          <div>
            <p className="text-[14px] font-bold tracking-tight" style={{ color: 'var(--text)', letterSpacing: '-0.025em' }}>NeuralChat</p>
            <p className="text-[9.5px] font-medium uppercase tracking-[0.16em]" style={{ color: 'var(--text-faint)' }}>Local AI</p>
          </div>
        </div>
        <button onClick={onToggle}
          className="w-7 h-7 rounded-xl flex items-center justify-center transition-colors"
          style={{ color: 'var(--muted)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--elevated)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
          <X size={13} />
        </button>
      </div>

      {/* ── New Chat ── */}
      <div className="px-4 pb-3">
        <button onClick={onNew}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-[13px] font-semibold transition-all"
          style={{ background: 'var(--gradient-accent)', color: 'white', boxShadow: 'var(--glow-xs)', letterSpacing: '-0.01em' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--gradient-accent-h)'; e.currentTarget.style.boxShadow = 'var(--glow-sm)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--gradient-accent)'; e.currentTarget.style.boxShadow = 'var(--glow-xs)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
          <Plus size={14} strokeWidth={2.5} />
          New Chat
        </button>
      </div>

      {/* ── Model selector ── */}
      <div className="px-4 pb-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] mb-1.5" style={{ color: 'var(--text-faint)' }}>Model</p>
        <div className="relative">
          <select value={selectedModel} onChange={e => onModelChange(e.target.value)}
            className="w-full appearance-none text-[12.5px] font-medium rounded-xl px-3 py-2.5 pr-8 outline-none cursor-pointer transition-all"
            style={{ background: 'var(--elevated)', border: '1px solid var(--border-med)', color: 'var(--text-dim)', letterSpacing: '-0.01em' }}
            onFocus={e => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'}
            onBlur={e => e.currentTarget.style.borderColor = 'var(--border-med)'}>
            {models.length === 0 && <option value="">No models found</option>}
            {models.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--muted)' }} />
        </div>
      </div>

      {/* ── Theme toggle ── */}
      <div className="px-4 pb-4">
        <div className="grid grid-cols-3 gap-0.5 p-0.5 rounded-xl" style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}>
          {([['dark', 'Dark', Moon], ['light', 'Light', Sun], ['system', 'System', Monitor]] as const).map(([v, l, Icon]) => (
            <button key={v} onClick={() => setTheme(v)}
              className="flex items-center justify-center gap-1.5 py-2 rounded-[10px] text-[11px] font-semibold transition-all"
              style={{
                background: theme === v ? 'var(--surface)' : 'transparent',
                color: theme === v ? 'var(--accent-light)' : 'var(--text-faint)',
                boxShadow: theme === v ? 'var(--shadow-sm)' : 'none',
              }}>
              <Icon size={10} />{l}
            </button>
          ))}
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="mx-4 mb-1" style={{ height: '1px', background: 'var(--border)' }} />

      {/* ── Conversations ── */}
      <div className="flex-1 overflow-y-auto px-2 pb-2 scrollbar-hide">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-12 gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}>
              <MessageSquare size={16} style={{ color: 'var(--muted)', opacity: 0.6 }} />
            </div>
            <p className="text-xs text-center leading-relaxed" style={{ color: 'var(--text-faint)' }}>No chats yet.<br />Click New Chat to start.</p>
          </div>
        ) : (
          <>
            {pinned.length > 0 && (
              <>
                <SectionLabel label="Pinned" />
                {pinned.map(c => <ConvoItem key={c.id} c={c} />)}
                <div className="mx-3 my-2" style={{ height: '1px', background: 'var(--border)' }} />
              </>
            )}
            {recent.length > 0 && (
              <>
                {pinned.length > 0 && <SectionLabel label="Recent" />}
                {recent.map(c => <ConvoItem key={c.id} c={c} />)}
              </>
            )}
          </>
        )}
      </div>

      {/* ── User footer ── */}
      <div className="px-3 py-3 mx-2 mb-2 rounded-2xl" style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--gradient-accent)', boxShadow: 'var(--glow-xs)' }}>
            <User size={13} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12.5px] font-semibold truncate" style={{ color: 'var(--text)', letterSpacing: '-0.01em' }}>{userName}</p>
            <p className="text-[10px] font-medium" style={{ color: 'var(--text-faint)' }}>Local account</p>
          </div>
          <button onClick={() => router.push('/settings')}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: 'var(--muted)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--card)'; e.currentTarget.style.color = 'var(--text-dim)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--muted)'; }}>
            <Settings size={12} />
          </button>
          <button onClick={onSignOut}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: 'var(--muted)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.1)'; e.currentTarget.style.color = 'var(--rose)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--muted)'; }}>
            <LogOut size={12} />
          </button>
        </div>
      </div>
    </aside>
  );
}
