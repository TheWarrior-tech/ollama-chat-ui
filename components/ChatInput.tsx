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
    if (el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 200) + 'px'; }
  };

  return (
    <div className="px-4 md:px-8 pb-6 pt-2 flex-shrink-0 relative z-10">
      <div className="max-w-2xl mx-auto">
        <div className={`relative rounded-2xl transition-all duration-300 shadow-2xl ${
          webSearch
            ? 'bg-surface border border-blue-500/30 ring-1 ring-blue-500/15 shadow-[0_0_30px_rgba(59,130,246,0.1)]'
            : 'bg-surface border border-border hover:border-border-med focus-within:border-accent/40 focus-within:ring-1 focus-within:ring-accent/15 focus-within:shadow-glow-sm'
        }`}>
          <textarea
            ref={ref}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKey}
            onInput={onInput}
            placeholder={webSearch ? 'Search the web and ask anything...' : 'Ask NeuralChat anything...'}
            rows={1}
            disabled={isStreaming}
            className="w-full bg-transparent text-text text-sm placeholder-muted resize-none outline-none px-5 pt-4 pb-14 max-h-[200px] scrollbar-hide leading-relaxed disabled:opacity-50 font-[Inter]"
          />
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 pb-3.5">
            <div className="flex items-center gap-2">
              <button onClick={onToggleWeb}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  webSearch
                    ? 'bg-blue-500/15 text-blue-300 border border-blue-500/25 shadow-[0_0_10px_rgba(59,130,246,0.15)]'
                    : 'text-muted hover:text-text-dim hover:bg-elevated border border-transparent'
                }`}>
                <Globe size={12} />
                {webSearch ? 'Web On' : 'Web'}
              </button>
            </div>
            <div className="flex items-center gap-2">
              {isStreaming ? (
                <button onClick={onStop}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-all">
                  <Square size={10} fill="currentColor" /> Stop
                </button>
              ) : (
                <button onClick={send} disabled={!input.trim()}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                    input.trim()
                      ? 'bg-gradient-accent text-white shadow-glow-md hover:shadow-glow-lg hover:scale-105 active:scale-95'
                      : 'bg-elevated border border-border text-muted cursor-not-allowed opacity-40'
                  }`}>
                  <ArrowUp size={15} />
                </button>
              )}
            </div>
          </div>
        </div>
        <p className="text-center text-[10px] text-muted/40 mt-2.5 tracking-wide">NeuralChat · Private & local · Shift+Enter for new line</p>
      </div>
    </div>
  );
}
