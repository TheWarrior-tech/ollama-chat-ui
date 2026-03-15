'use client';
import { useEffect, useRef, useState } from 'react';
import { Message } from '@/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { nightOwl } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Bot, User, Copy, Check, ChevronDown, ChevronUp, Brain, ExternalLink, Globe, Sparkles } from 'lucide-react';

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium text-muted hover:text-text hover:bg-white/5 transition-all">
      {copied ? <><Check size={10} className="text-emerald-400" />Copied</> : <><Copy size={10} />Copy</>}
    </button>
  );
}

function SourceFavicon({ url }: { url: string }) {
  const [err, setErr] = useState(false);
  let hostname = '';
  try { hostname = new URL(url).hostname; } catch {}
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
  if (err || !hostname) {
    return (
      <div className="w-4 h-4 rounded-sm bg-blue-500/20 flex items-center justify-center flex-shrink-0">
        <Globe size={10} className="text-blue-400" />
      </div>
    );
  }
  return <img src={faviconUrl} onError={() => setErr(true)} className="w-4 h-4 rounded-sm flex-shrink-0" alt="" />;
}

function SourcesBlock({ sources }: { sources: { title: string; url: string; snippet: string }[] }) {
  const [expanded, setExpanded] = useState(false);
  const preview = sources.slice(0, 3);
  const rest = sources.slice(3);

  return (
    <div className="mb-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Globe size={13} className="text-blue-400" />
        <span className="text-xs font-semibold text-text-dim">{sources.length} Sources</span>
      </div>

      {/* Source cards grid — Perplexity style */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {preview.map((s, i) => {
          let hostname = '';
          try { hostname = new URL(s.url).hostname.replace('www.', ''); } catch {}
          return (
            <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
              className="group flex flex-col justify-between p-3 rounded-xl border border-border hover:border-border-med bg-elevated/60 hover:bg-elevated transition-all shadow-card min-h-[80px]">
              <p className="text-[11px] font-medium text-text-dim group-hover:text-text transition-colors leading-relaxed line-clamp-3">{s.title}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <SourceFavicon url={s.url} />
                <span className="text-[10px] text-muted truncate">{hostname}</span>
                <ExternalLink size={9} className="text-muted/30 flex-shrink-0 ml-auto group-hover:text-blue-400 transition-colors" />
              </div>
            </a>
          );
        })}

        {/* +N more card */}
        {rest.length > 0 && !expanded && (
          <button onClick={() => setExpanded(true)}
            className="flex flex-col items-center justify-center p-3 rounded-xl border border-border hover:border-border-med bg-elevated/40 hover:bg-elevated transition-all min-h-[80px] group">
            <span className="text-lg font-bold text-text-dim group-hover:text-text transition-colors">+{rest.length}</span>
            <span className="text-[10px] text-muted mt-0.5">more</span>
          </button>
        )}
      </div>

      {/* Expanded sources */}
      {expanded && rest.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-2">
          {rest.map((s, i) => {
            let hostname = '';
            try { hostname = new URL(s.url).hostname.replace('www.', ''); } catch {}
            return (
              <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                className="group flex flex-col justify-between p-3 rounded-xl border border-border hover:border-border-med bg-elevated/60 hover:bg-elevated transition-all shadow-card min-h-[80px]">
                <p className="text-[11px] font-medium text-text-dim group-hover:text-text transition-colors leading-relaxed line-clamp-3">{s.title}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <SourceFavicon url={s.url} />
                  <span className="text-[10px] text-muted truncate">{hostname}</span>
                  <ExternalLink size={9} className="text-muted/30 flex-shrink-0 ml-auto group-hover:text-blue-400 transition-colors" />
                </div>
              </a>
            );
          })}
        </div>
      )}

      {expanded && (
        <button onClick={() => setExpanded(false)} className="flex items-center gap-1 text-[10px] text-muted hover:text-text-dim transition-colors">
          <ChevronUp size={11} /> Show less
        </button>
      )}
    </div>
  );
}

function ThinkingBlock({ thinking, isStreaming }: { thinking: string; isStreaming: boolean }) {
  const [open, setOpen] = useState(true);
  useEffect(() => { if (!isStreaming) setTimeout(() => setOpen(false), 600); }, [isStreaming]);
  return (
    <div className="mb-4 rounded-2xl border border-violet/20 bg-violet/5 overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2.5 px-4 py-3 text-left hover:bg-violet/8 transition-all">
        <div className={`w-5 h-5 rounded-lg bg-violet/20 border border-violet/30 flex items-center justify-center flex-shrink-0 ${isStreaming ? 'animate-pulse' : ''}`}>
          <Brain size={11} className="text-violet-400" />
        </div>
        <span className="text-xs font-semibold text-violet-300 flex-1">{isStreaming ? 'Reasoning...' : 'View reasoning'}</span>
        <span className="text-[10px] text-violet-400/50 font-mono">{(thinking.length / 1000).toFixed(1)}k chars</span>
        {open ? <ChevronUp size={12} className="text-violet-400/50" /> : <ChevronDown size={12} className="text-violet-400/50" />}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-2 text-[11px] text-violet-200/40 leading-relaxed font-mono whitespace-pre-wrap max-h-60 overflow-y-auto scrollbar-hide border-t border-violet/10">
          {thinking}
        </div>
      )}
    </div>
  );
}

function ThinkingDots() {
  return (
    <div className="flex items-center gap-1.5 py-2">
      {[0,1,2].map(i => (
        <span key={i} className={`w-1.5 h-1.5 rounded-full bg-gradient-accent inline-block dot-${i+1}`} />
      ))}
    </div>
  );
}

const SUGGESTIONS = [
  { icon: Sparkles, text: 'Explain quantum entanglement simply', color: 'text-yellow-400' },
  { icon: Brain, text: 'Help me debug my code', color: 'text-violet-400' },
  { icon: Globe, text: 'Search the web for latest AI news', color: 'text-blue-400' },
  { icon: Bot, text: 'Write a creative short story', color: 'text-emerald-400' },
];

export default function ChatWindow({ messages, isStreaming }: { messages: Message[]; isStreaming: boolean }) {
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, messages[messages.length - 1]?.content?.length]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 relative">
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-3xl bg-gradient-accent flex items-center justify-center shadow-glow-lg">
            <Bot size={34} className="text-white" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-bg border-2 border-bg flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          </div>
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-3">
          <span className="bg-gradient-to-r from-white via-white to-text-dim bg-clip-text text-transparent">NeuralChat</span>
        </h1>
        <p className="text-text-dim text-sm max-w-xs leading-relaxed mb-10">Your premium local AI assistant. All models, all private, zero cloud.</p>
        <div className="grid grid-cols-2 gap-2.5 max-w-sm w-full">
          {SUGGESTIONS.map((s, i) => (
            <div key={i} className="group p-4 rounded-2xl border border-border hover:border-border-med bg-surface/50 hover:bg-elevated cursor-pointer transition-all hover:shadow-card text-left">
              <s.icon size={16} className={`${s.color} mb-2.5`} />
              <p className="text-xs text-text-dim group-hover:text-text transition-colors leading-relaxed">{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {messages.map((msg, i) => {
          const isLast = i === messages.length - 1;
          const streaming = isLast && isStreaming;
          return (
            <div key={msg.id} className="msg-animate">
              {msg.role === 'user' ? (
                <div className="flex justify-end gap-3">
                  <div className="max-w-[78%] bg-elevated border border-border-med rounded-2xl rounded-br-md px-5 py-3.5 text-sm text-text leading-relaxed shadow-card">
                    {msg.content}
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-elevated border border-border-med flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User size={13} className="text-muted-light" />
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-accent flex items-center justify-center flex-shrink-0 mt-0.5 shadow-glow-sm">
                    <Bot size={14} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {msg.sources && msg.sources.length > 0 && <SourcesBlock sources={msg.sources} />}
                    {msg.thinking && <ThinkingBlock thinking={msg.thinking} isStreaming={streaming && msg.content === ''} />}
                    {msg.content === '' && !msg.thinking && streaming ? (
                      <ThinkingDots />
                    ) : (
                      <div className={`prose text-sm ${streaming && msg.content !== '' ? 'streaming-cursor' : ''}`}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                          // Render [1], [2] etc as superscript citation links
                          text({ children }: any) {
                            const str = String(children);
                            const parts = str.split(/(\[\d+\])/);
                            if (parts.length === 1) return <>{str}</>;
                            return <>{parts.map((p, j) => {
                              const m = p.match(/^\[(\d+)\]$/);
                              if (m && msg.sources) {
                                const idx = parseInt(m[1]) - 1;
                                const src = msg.sources[idx];
                                return src ? (
                                  <a key={j} href={src.url} target="_blank" rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-500/20 border border-blue-500/30 text-[9px] font-bold text-blue-300 hover:bg-blue-500/40 transition-all mx-0.5 no-underline align-super" style={{textDecoration:'none'}}>
                                    {m[1]}
                                  </a>
                                ) : <span key={j}>{p}</span>;
                              }
                              return <span key={j}>{p}</span>;
                            })}</>;
                          },
                          code({ className, children, ...props }: any) {
                            const match = /language-(\w+)/.exec(className || '');
                            const code = String(children).replace(/\n$/, '');
                            return match ? (
                              <div className="rounded-2xl overflow-hidden border border-border-med my-4 shadow-card">
                                <div className="flex items-center justify-between px-4 py-2.5 bg-[#080812] border-b border-border">
                                  <div className="flex items-center gap-2">
                                    <div className="flex gap-1.5">
                                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                                      <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                                    </div>
                                    <span className="text-[10px] text-accent-light/70 font-mono uppercase tracking-widest ml-1">{match[1]}</span>
                                  </div>
                                  <CopyBtn text={code} />
                                </div>
                                <SyntaxHighlighter style={nightOwl} language={match[1]} PreTag="div"
                                  customStyle={{ margin:0, background:'#06060f', padding:'16px 18px', fontSize:'0.78rem', lineHeight:'1.7' }}
                                >{code}</SyntaxHighlighter>
                              </div>
                            ) : <code className="bg-accent/10 text-accent-light px-1.5 py-0.5 rounded-md text-[0.8em] font-mono border border-accent/15" {...props}>{children}</code>;
                          },
                          img: ({ src, alt }) => <img src={src} alt={alt} className="rounded-2xl max-w-full mt-3 border border-border shadow-card" />,
                          a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-accent-light hover:text-white underline underline-offset-3 transition-colors">{children}</a>,
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
