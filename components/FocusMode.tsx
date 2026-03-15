'use client';
import { X, Maximize2 } from 'lucide-react';
import ChatWindow from './ChatWindow';
import ChatInput from './ChatInput';
import { Message } from '@/types';

interface Props {
  messages: Message[];
  isStreaming: boolean;
  title: string;
  selectedModel: string;
  webSearch: boolean;
  onSend: (content: string, attachments?: any[]) => void;
  onStop: () => void;
  onToggleWeb: () => void;
  onClose: () => void;
}

export default function FocusMode({ messages, isStreaming, title, onSend, onStop, webSearch, onToggleWeb, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <div className="ambient-bg" />
      <div className="flex items-center justify-between px-8 py-3 flex-shrink-0 glass" style={{ borderBottom: '1px solid var(--border)', position: 'relative', zIndex: 10 }}>
        <div className="flex items-center gap-2">
          <Maximize2 size={14} style={{ color: 'var(--accent)' }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{title}</span>
        </div>
        <button onClick={onClose} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs" style={{ background: 'var(--elevated)', border: '1px solid var(--border)', color: 'var(--muted)' }}>
          <X size={12} />Exit Focus
        </button>
      </div>
      <div className="flex flex-col flex-1 min-h-0 relative z-10">
        <ChatWindow messages={messages} isStreaming={isStreaming} onRegenerate={() => {}} />
        <ChatInput onSend={onSend} isStreaming={isStreaming} onStop={onStop} webSearch={webSearch} onToggleWeb={onToggleWeb} />
      </div>
    </div>
  );
}
