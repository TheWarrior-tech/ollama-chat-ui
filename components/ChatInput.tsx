'use client';
import { useState, useRef, KeyboardEvent } from 'react';
import { ArrowUp, Square } from 'lucide-react';

export default function ChatInput({ onSend, isStreaming, onStop }: {
  onSend: (content: string) => void;
  isStreaming: boolean;
  onStop: () => void;
}) {
  const [input, setInput] = useState('');
  const ref = useRef<HTMLTextAreaElement>(null);

  const send = () => {
    const t = input.trim();
    if (!t || isStreaming) return;
    onSend(t);
    setInput('');
    if (ref.current) { ref.current.style.height = 'auto'; }
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const onInput = () => {
    const el = ref.current;
    if (el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 220) + 'px'; }
  };

  const hasText = input.trim().length > 0;

  return (
    <div className="px-4 md:px-8 pb-5 pt-2 flex-shrink-0">
      <div className="max-w-3xl mx-auto">
        <div className="relative bg-elevated border border-border hover:border-border-light focus-within:border-accent/50 rounded-2xl transition-all shadow-lg shadow-black/20">
          <textarea
            ref={ref}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKey}
            onInput={onInput}
            placeholder="Message Ollama..."
            rows={1}
            disabled={isStreaming}
            className="w-full bg-transparent text-text text-sm placeholder-muted resize-none outline-none px-4 py-4 pr-14 max-h-[220px] scrollbar-hide leading-relaxed disabled:opacity-50"
          />
          <div className="absolute right-3 bottom-3">
            {isStreaming ? (
              <button
                onClick={onStop}
                className="w-8 h-8 rounded-xl bg-red-500/20 border border-red-500/40 hover:bg-red-500/30 flex items-center justify-center transition-all"
              >
                <Square size={13} className="text-red-400" fill="currentColor" />
              </button>
            ) : (
              <button
                onClick={send}
                disabled={!hasText}
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                  hasText
                    ? 'bg-accent hover:bg-accent-dim text-white btn-glow'
                    : 'bg-elevated border border-border text-muted cursor-not-allowed'
                }`}
              >
                <ArrowUp size={14} />
              </button>
            )}
          </div>
        </div>
        <p className="text-center text-[10px] text-muted mt-2.5">Ollama Chat · Private & local · Shift+Enter for new line</p>
      </div>
    </div>
  );
}
