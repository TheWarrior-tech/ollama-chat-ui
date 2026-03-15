'use client';
import { useState, useRef, KeyboardEvent } from 'react';
import { ArrowUp, Square, Globe, Paperclip, Mic } from 'lucide-react';

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
        {/* ChatGPT-style pill toolbar above input */}
        <div className="flex items-center gap-1.5 mb-2 px-1">
          <button
            onClick={onToggleWeb}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
              webSearch
                ? 'border-blue-500/40 text-blue-300'
                : 'text-[color:var(--muted)] hover:text-[color:var(--text-dim)]'
            }`}
            style={{
              background: webSearch ? 'rgba(59,130,246,0.1)' : 'var(--elevated)',
              borderColor: webSearch ? 'rgba(59,130,246,0.3)' : 'var(--border)',
            }}
          >
            <Globe size={11} />
            {webSearch ? 'Search On' : 'Search'}
          </button>
        </div>

        {/* Input box */}
        <div
          className="relative rounded-2xl transition-all duration-200 shadow-card"
          style={{
            background: 'var(--surface)',
            border: webSearch
              ? '1px solid rgba(59,130,246,0.3)'
              : '1px solid var(--border-med)',
            boxShadow: webSearch ? '0 0 20px rgba(59,130,246,0.08)' : 'var(--shadow)',
          }}
        >
          <textarea
            ref={ref}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKey}
            onInput={onInput}
            placeholder={webSearch ? 'Search the web and ask anything...' : 'Ask NeuralChat anything...'}
            rows={1}
            disabled={isStreaming}
            className="w-full bg-transparent text-sm placeholder-[color:var(--muted)] resize-none outline-none px-5 pt-4 pb-14 max-h-[200px] scrollbar-hide leading-relaxed disabled:opacity-50"
            style={{ color: 'var(--text)' }}
          />
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 pb-3.5">
            <div className="flex items-center gap-2" style={{ color: 'var(--muted)' }}>
              {/* Placeholder action buttons like Gemini */}
              <button className="p-1.5 rounded-lg transition-all hover:opacity-80" title="Attach file (coming soon)">
                <Paperclip size={14} />
              </button>
              <button className="p-1.5 rounded-lg transition-all hover:opacity-80" title="Voice input (coming soon)">
                <Mic size={14} />
              </button>
            </div>
            <div className="flex items-center gap-2">
              {isStreaming ? (
                <button onClick={onStop}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all"
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}>
                  <Square size={10} fill="currentColor" /> Stop
                </button>
              ) : (
                <button
                  onClick={send}
                  disabled={!input.trim()}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                    input.trim() ? 'bg-gradient-accent text-white hover:scale-105 active:scale-95' : 'cursor-not-allowed opacity-40'
                  }`}
                  style={{
                    boxShadow: input.trim() ? 'var(--glow-md)' : 'none',
                    background: input.trim() ? undefined : 'var(--elevated)',
                    border: input.trim() ? 'none' : '1px solid var(--border)',
                    color: input.trim() ? 'white' : 'var(--muted)',
                  }}
                >
                  <ArrowUp size={15} />
                </button>
              )}
            </div>
          </div>
        </div>
        <p className="text-center text-[10px] mt-2.5 tracking-wide" style={{ color: 'var(--muted)', opacity: 0.5 }}>NeuralChat · Private & local · Shift+Enter for new line</p>
      </div>
    </div>
  );
}
