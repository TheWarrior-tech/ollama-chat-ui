'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { Send, Square, ImageIcon, MessageSquare } from 'lucide-react';

interface Props {
  onSend: (content: string, isImage: boolean) => void;
  isStreaming: boolean;
  onStop: () => void;
}

export default function ChatInput({ onSend, isStreaming, onStop }: Props) {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'chat' | 'image'>('chat');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    onSend(trimmed, mode === 'image');
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 200) + 'px';
    }
  };

  return (
    <div className="px-4 pb-6 pt-2">
      <div className="max-w-3xl mx-auto">
        <div className="bg-input rounded-2xl border border-border shadow-lg">
          <div className="flex items-center gap-2 px-4 pt-3 pb-1">
            <button
              onClick={() => setMode('chat')}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition ${ mode === 'chat' ? 'bg-accent text-white' : 'text-muted hover:text-white hover:bg-border' }`}
            >
              <MessageSquare size={12} /> Chat
            </button>
            <button
              onClick={() => setMode('image')}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition ${ mode === 'image' ? 'bg-accent text-white' : 'text-muted hover:text-white hover:bg-border' }`}
            >
              <ImageIcon size={12} /> Image Gen
            </button>
          </div>
          <div className="flex items-end gap-3 px-4 pb-3 pt-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              onInput={handleInput}
              placeholder={mode === 'image' ? 'Describe the image you want to generate...' : 'Message Ollama...'}
              rows={1}
              className="flex-1 bg-transparent text-white placeholder-muted text-sm resize-none outline-none py-1 max-h-48 scrollbar-hide"
            />
            {isStreaming ? (
              <button onClick={onStop} className="p-2 rounded-lg bg-red-500 hover:bg-red-600 transition flex-shrink-0">
                <Square size={16} className="text-white" fill="white" />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="p-2 rounded-lg bg-accent hover:bg-accent-hover transition flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send size={16} className="text-white" />
              </button>
            )}
          </div>
        </div>
        <p className="text-center text-xs text-muted mt-2">Ollama Chat · Running locally · {mode === 'image' ? '🎨 Image mode' : '💬 Chat mode'}</p>
      </div>
    </div>
  );
}
