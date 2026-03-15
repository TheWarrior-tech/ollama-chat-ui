'use client';
import { useState, useRef, KeyboardEvent } from 'react';
import { ArrowUp, Square, Globe } from 'lucide-react';

export default function ChatInput({ onSend, isStreaming, onStop, webSearch, onToggleWeb }: {
  onSend: (content: string) => void;
  isStreaming: boolean;
  onStop: () => void;
  webSearch: boolean;
  onToggleWeb: () => void;
}) {
  const [input, setInput] = useState('');
  const ref = useRef<HTMLTextAreaElement>(null);

  const send = () => {
    const t = input.trim();
    if (!t || isStreaming) return;
    onSend(t);
    setInput('');
    if (ref.current) ref.current.style.height = 'auto';
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const onInput = () => {
    const el = ref.current;
    if (el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 220) + 'px'; }
  };

  return (
    <div className="px-4 md:px-10 pb-6 pt-2 flex-shrink-0">
      <div className="max-w-2xl mx-auto">
        <div className={`relative rounded-2xl border transition-all duration-200 shadow-2xl shadow-black/40 ${
          webSearch
            ? 'bg-surface border-blue-500/40 ring-1 ring-blue-500/20'
            : 'bg-surface border-border hover:border-border-light focus-within:border-accent/40 focus-within:ring-1 focus-within:ring-accent/20'
        }`}>
          <textarea
            ref={ref}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKey}
            onInput={onInput}
            placeholder={webSearch ? '🌐 Search the web and ask...' : 'Ask NeuralChat anything...'}
            rows={1}
            disabled={isStreaming}
            className="w-full bg-transparent text-text text-sm placeholder-muted resize-none outline-none px-4 pt-4 pb-12 max-h-[220px] scrollbar-hide leading-relaxed disabled:opacity-60"
          />
          {/* Bottom toolbar */}
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 pb-3">
            <div className="flex items-center gap-1.5">
              <button
                onClick={onToggleWeb}
                title="Toggle web search"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  webSearch
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    : 'text-muted hover:text-text hover:bg-elevated border border-transparent'
                }`}
              >
                <Globe size={12} />
                Web
              </button>
            </div>
            <div className="flex items-center gap-2">
              {isStreaming ? (
                <button onClick={onStop} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 text-xs hover:bg-red-500/25 transition-all">
                  <Square size={11} fill="currentColor" /> Stop
                </button>
              ) : (
                <button
                  onClick={send}
                  disabled={!input.trim()}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                    input.trim()
                      ? 'bg-accent hover:bg-accent-dim text-white shadow-lg shadow-accent/30'
                      : 'bg-elevated border border-border text-muted cursor-not-allowed opacity-50'
                  }`}
                >
                  <ArrowUp size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
        <p className="text-center text-[10px] text-muted/60 mt-2">NeuralChat · Local & private · Shift+Enter for new line</p>
      </div>
    </div>
  );
}
