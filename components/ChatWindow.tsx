'use client';
import { useEffect, useRef, useState } from 'react';
import { Message } from '@/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { nightOwl } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Bot, User, Copy, Check, ChevronDown, ChevronUp, Brain, ExternalLink, Globe } from 'lucide-react';

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] text-muted hover:text-text hover:bg-white/5 transition-all">
      {copied ? <><Check size={10} className="text-green-400" />Copied</> : <><Copy size={10} />Copy</>}
    </button>
  );
}

function ThinkingBlock({ thinking, isStreaming }: { thinking: string; isStreaming: boolean }) {
  const [open, setOpen] = useState(true);
  useEffect(() => { if (!isStreaming) setOpen(false); }, [isStreaming]);
  return (
    <div className="mb-3 rounded-xl border border-purple-500/20 bg-purple-500/5 overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-purple-500/10 transition-colors">
        <Brain size={12} className={`text-purple-400 flex-shrink-0 ${isStreaming ? 'animate-pulse' : ''}`} />
        <span className="text-xs text-purple-300 font-medium flex-1">{isStreaming ? 'Thinking...' : 'Thought process'}</span>
        <span className="text-[10px] text-purple-400/60">{thinking.length} chars</span>
        {open ? <ChevronUp size={11} className="text-purple-400/60" /> : <ChevronDown size={11} className="text-purple-400/60" />}
      </button>
      {open && (
        <div className="px-4 pb-3 pt-1 text-[11px] text-purple-200/50 leading-relaxed font-mono whitespace-pre-wrap max-h-56 overflow-y-auto scrollbar-hide border-t border-purple-500/10">
          {thinking}
        </div>
      )}
    </div>
  );
}

function SourcesBlock({ sources }: { sources: { title: string; url: string; snippet: string }[] }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="mb-3 rounded-xl border border-blue-500/20 bg-blue-500/5 overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-blue-500/10 transition-colors">
        <Globe size={12} className="text-blue-400 flex-shrink-0" />
        <span className="text-xs text-blue-300 font-medium flex-1">Web Sources</span>
        <span className="text-[10px] text-blue-400/60 bg-blue-500/10 px-2 py-0.5 rounded-full">{sources.length}</span>
        {open ? <ChevronUp size={11} className="text-blue-400/60" /> : <ChevronDown size={11} className="text-blue-400/60" />}
      </button>
      {open && (
        <div className="px-3 pb-3 pt-1 border-t border-blue-500/10 grid grid-cols-1 gap-1.5">
          {sources.map((s, i) => (
            <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
              className="flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-blue-500/10 transition-colors group">
              <span className="text-[10px] text-blue-400/60 font-mono mt-0.5 flex-shrink-0 w-4">[{i+1}]</span>
              <div className="min-w-0">
                <p className="text-xs text-blue-200 font-medium truncate group-hover:text-blue-100">{s.title}</p>
                <p className="text-[10px] text-muted mt-0.5 line-clamp-2 leading-relaxed">{s.snippet}</p>
              </div>
              <ExternalLink size={10} className="text-muted/40 flex-shrink-0 mt-1 group-hover:text-blue-400 transition-colors" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function ThinkingDots() {
  return (
    <div className="flex items-center gap-1.5 py-1">
      <span className="w-1.5 h-1.5 rounded-full bg-accent dot-1 inline-block" />
      <span className="w-1.5 h-1.5 rounded-full bg-accent dot-2 inline-block" />
      <span className="w-1.5 h-1.5 rounded-full bg-accent dot-3 inline-block" />
    </div>
  );
}

export default function ChatWindow({ messages, isStreaming }: { messages: Message[]; isStreaming: boolean }) {
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, messages[messages.length - 1]?.content?.length]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/20 to-purple-500/20 border border-accent/20 flex items-center justify-center">
            <Bot size={28} className="text-accent" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-400/20 border border-green-400/40 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-green-400" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-text mb-2 tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text">NeuralChat</h1>
        <p className="text-muted text-sm max-w-xs leading-relaxed mb-8">Your local AI assistant. Fast, private, and always on-device.</p>
        <div className="grid grid-cols-2 gap-2 max-w-sm w-full">
          {[
            { icon: '⚡', text: 'Explain a concept' },
            { icon: '🐍', text: 'Write Python code' },
            { icon: '🔍', text: 'Debug my code' },
            { icon: '🌐', text: 'Search the web' },
          ].map(s => (
            <div key={s.text} className="p-3 border border-border/60 rounded-xl text-xs text-muted hover:border-accent/30 hover:bg-accent/5 hover:text-text-dim cursor-pointer transition-all text-left group">
              <span className="mr-1.5">{s.icon}</span>{s.text}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {messages.map((msg, i) => {
          const isLast = i === messages.length - 1;
          const streaming = isLast && isStreaming;
          return (
            <div key={msg.id} className="msg-animate">
              {msg.role === 'user' ? (
                <div className="flex justify-end">
                  <div className="flex items-end gap-2.5 max-w-[80%]">
                    <div className="bg-surface border border-border-light rounded-2xl rounded-br-md px-4 py-3 text-sm text-text leading-relaxed">
                      {msg.content}
                    </div>
                    <div className="w-7 h-7 rounded-full bg-elevated border border-border flex items-center justify-center flex-shrink-0">
                      <User size={12} className="text-muted" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent/30 to-purple-500/20 border border-accent/30 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-lg shadow-accent/10">
                    <Bot size={13} className="text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {msg.sources && msg.sources.length > 0 && (
                      <SourcesBlock sources={msg.sources} />
                    )}
                    {msg.thinking && (
                      <ThinkingBlock thinking={msg.thinking} isStreaming={streaming && msg.content === ''} />
                    )}
                    {msg.content === '' && !msg.thinking && streaming ? (
                      <ThinkingDots />
                    ) : (
                      <div className={`prose text-sm ${streaming && msg.content !== '' ? 'streaming-cursor' : ''}`}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                          code({ className, children, ...props }: any) {
                            const match = /language-(\w+)/.exec(className || '');
                            const code = String(children).replace(/\n$/, '');
                            return match ? (
                              <div className="rounded-xl overflow-hidden border border-border/60 my-3">
                                <div className="flex items-center justify-between px-4 py-2 bg-[#0d0d1a] border-b border-border/60">
                                  <span className="text-[10px] text-accent/80 font-mono uppercase tracking-widest">{match[1]}</span>
                                  <CopyBtn text={code} />
                                </div>
                                <SyntaxHighlighter style={nightOwl} language={match[1]} PreTag="div"
                                  customStyle={{ margin: 0, background: '#080810', padding: '14px 16px', fontSize: '0.78rem', lineHeight: '1.65' }}
                                >{code}</SyntaxHighlighter>
                              </div>
                            ) : <code className="bg-[#1a1a2e] text-purple-400 px-1.5 py-0.5 rounded text-[0.8em] font-mono" {...props}>{children}</code>;
                          },
                          img: ({ src, alt }) => <img src={src} alt={alt} className="rounded-xl max-w-full mt-2 border border-border" />,
                          a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline underline-offset-2">{children}</a>,
                        }}>{msg.content}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
