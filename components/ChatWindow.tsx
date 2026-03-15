'use client';
import { useEffect, useRef, useState } from 'react';
import { Message } from '@/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { nightOwl, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Bot, User, Copy, Check, ChevronDown, ChevronUp, Brain, ExternalLink, Globe, Sparkles, ThumbsUp, ThumbsDown, RefreshCw, BookmarkPlus, Volume2 } from 'lucide-react';

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all" style={{ color: copied ? '#34d399' : 'var(--muted)' }}>{copied ? <><Check size={10}/>Copied</> : <><Copy size={10}/>Copy</>}</button>;
}

function SourceFavicon({ url }: { url: string }) {
  const [err, setErr] = useState(false);
  let hostname = ''; try { hostname = new URL(url).hostname; } catch {}
  if (err || !hostname) return <div className="w-4 h-4 rounded-sm flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.2)' }}><Globe size={10} className="text-blue-400" /></div>;
  return <img src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`} onError={() => setErr(true)} className="w-4 h-4 rounded-sm" alt="" />;
}

function SourcesBlock({ sources }: { sources: { title: string; url: string; snippet: string }[] }) {
  const [expanded, setExpanded] = useState(false);
  const preview = sources.slice(0, 3);
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-3"><Globe size={13} className="text-blue-400" /><span className="text-xs font-semibold" style={{ color: 'var(--text-dim)' }}>{sources.length} Sources</span></div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        {(expanded ? sources : preview).map((s, i) => { let h = ''; try { h = new URL(s.url).hostname.replace('www.',''); } catch {}
          return <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className="group flex flex-col justify-between p-3 rounded-xl transition-all" style={{ border: '1px solid var(--border)', background: 'var(--elevated)', minHeight: '80px' }}>
            <p className="text-[11px] font-medium leading-relaxed line-clamp-3" style={{ color: 'var(--text-dim)' }}>{s.title}</p>
            <div className="flex items-center gap-1.5 mt-2"><SourceFavicon url={s.url}/><span className="text-[10px] truncate" style={{ color: 'var(--muted)' }}>{h}</span><ExternalLink size={9} className="ml-auto" style={{ color: 'var(--muted)', opacity: 0.4 }}/></div>
          </a>;
        })}
        {!expanded && sources.length > 3 && <button onClick={() => setExpanded(true)} className="flex flex-col items-center justify-center p-3 rounded-xl transition-all" style={{ border: '1px solid var(--border)', background: 'var(--elevated)' }}><span className="text-lg font-bold" style={{ color: 'var(--text-dim)' }}>+{sources.length - 3}</span><span className="text-[10px]" style={{ color: 'var(--muted)' }}>more</span></button>}
      </div>
      {expanded && <button onClick={() => setExpanded(false)} className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--muted)' }}><ChevronUp size={11}/>Show less</button>}
    </div>
  );
}

function ThinkingBlock({ thinking, isStreaming }: { thinking: string; isStreaming: boolean }) {
  const [open, setOpen] = useState(true);
  useEffect(() => { if (!isStreaming) setTimeout(() => setOpen(false), 600); }, [isStreaming]);
  return (
    <div className="mb-4 rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(139,92,246,0.2)', background: 'rgba(139,92,246,0.04)' }}>
      <button onClick={() => setOpen(o=>!o)} className="w-full flex items-center gap-2.5 px-4 py-3 text-left transition-all">
        <div className={`w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 ${isStreaming?'animate-pulse':''}`} style={{ background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.3)' }}><Brain size={11} className="text-violet-400"/></div>
        <span className="text-xs font-semibold text-violet-300 flex-1">{isStreaming?'Reasoning...':'View reasoning'}</span>
        <span className="text-[10px] font-mono" style={{ color: 'rgba(167,139,250,0.5)' }}>{(thinking.length/1000).toFixed(1)}k</span>
        {open?<ChevronUp size={12} style={{ color: 'rgba(167,139,250,0.5)' }}/>:<ChevronDown size={12} style={{ color: 'rgba(167,139,250,0.5)' }}/>}
      </button>
      {open&&<div className="px-4 pb-4 pt-2 text-[11px] leading-relaxed font-mono whitespace-pre-wrap max-h-60 overflow-y-auto scrollbar-hide" style={{ borderTop: '1px solid rgba(139,92,246,0.1)', color: 'rgba(167,139,250,0.4)' }}>{thinking}</div>}
    </div>
  );
}

function ReadAloud({ content }: { content: string }) {
  const [playing, setPlaying] = useState(false);
  const toggle = () => {
    if (playing) { window.speechSynthesis.cancel(); setPlaying(false); return; }
    const clean = content.replace(/```[\s\S]*?```/g,'').replace(/[*_#`]/g,'').replace(/\n+/g,' ').trim();
    const u = new SpeechSynthesisUtterance(clean);
    u.rate = 0.95; u.lang = 'en-GB';
    const voices = window.speechSynthesis.getVoices();
    const v = voices.find(v => v.name.includes('Google UK English Female') || v.name.includes('Samantha'));
    if (v) u.voice = v;
    u.onend = () => setPlaying(false);
    u.onerror = () => setPlaying(false);
    setPlaying(true);
    window.speechSynthesis.speak(u);
  };
  return (
    <button onClick={toggle} title={playing ? 'Stop reading' : 'Read aloud'} className="p-1.5 rounded-lg transition-all" style={{ color: playing ? 'var(--accent-light)' : 'var(--muted)' }}>
      <Volume2 size={12} />
    </button>
  );
}

function MessageActions({ content, onRegenerate, onSaveMemory }: { content: string; onRegenerate?: () => void; onSaveMemory?: () => void }) {
  const [liked, setLiked] = useState<'up'|'down'|null>(null);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  return (
    <div className="flex items-center gap-0.5 mt-2 opacity-0 group-hover:opacity-100 transition-all">
      <button onClick={() => setLiked(l=>l==='up'?null:'up')} className="p-1.5 rounded-lg transition-all" style={{ color: liked==='up'?'#34d399':'var(--muted)' }} title="Good response"><ThumbsUp size={11}/></button>
      <button onClick={() => setLiked(l=>l==='down'?null:'down')} className="p-1.5 rounded-lg transition-all" style={{ color: liked==='down'?'#f87171':'var(--muted)' }} title="Bad response"><ThumbsDown size={11}/></button>
      <div className="w-px h-3 mx-0.5" style={{ background: 'var(--border)' }}/>
      <button onClick={() => { navigator.clipboard.writeText(content); setCopied(true); setTimeout(()=>setCopied(false),2000); }} className="p-1.5 rounded-lg" style={{ color: copied?'#34d399':'var(--muted)' }}>{copied?<Check size={11}/>:<Copy size={11}/>}</button>
      <ReadAloud content={content} />
      {onRegenerate&&<button onClick={onRegenerate} className="p-1.5 rounded-lg" style={{ color: 'var(--muted)' }} title="Regenerate"><RefreshCw size={11}/></button>}
      <button onClick={() => { onSaveMemory?.(); setSaved(true); setTimeout(()=>setSaved(false),2000); }} className="p-1.5 rounded-lg" style={{ color: saved?'#818cf8':'var(--muted)' }} title="Save to memory"><BookmarkPlus size={11}/></button>
    </div>
  );
}

function EditableUserMessage({ content, onEdit }: { content: string; onEdit: (newContent: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(content);
  if (editing) return (
    <div className="max-w-[78%]">
      <textarea value={draft} onChange={e => setDraft(e.target.value)} rows={3} autoFocus
        className="w-full text-sm rounded-2xl px-4 py-3 outline-none resize-none"
        style={{ background: 'var(--elevated)', border: '1px solid var(--accent)', color: 'var(--text)', minWidth: '260px' }}
        onKeyDown={e => { if (e.key==='Enter'&&!e.shiftKey) { e.preventDefault(); onEdit(draft); setEditing(false); } if (e.key==='Escape') setEditing(false); }}
      />
      <div className="flex gap-2 mt-1.5 justify-end">
        <button onClick={() => setEditing(false)} className="text-[10px] px-3 py-1 rounded-lg" style={{ background: 'var(--elevated)', color: 'var(--muted)' }}>Cancel</button>
        <button onClick={() => { onEdit(draft); setEditing(false); }} className="text-[10px] px-3 py-1 rounded-lg text-white" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>Resend</button>
      </div>
    </div>
  );
  return (
    <div className="group relative max-w-[78%]">
      <div className="rounded-2xl rounded-br-sm px-5 py-3.5 text-sm leading-relaxed" style={{ background: 'var(--elevated)', border: '1px solid var(--border-med)', color: 'var(--text)' }}>{content}</div>
      <button onClick={() => setEditing(true)} className="absolute -bottom-5 right-0 text-[10px] opacity-0 group-hover:opacity-100 transition-all" style={{ color: 'var(--muted)' }}>Edit</button>
    </div>
  );
}

const SUGGESTIONS = [
  { icon: Sparkles, text: 'Explain quantum entanglement simply', color: '#fbbf24' },
  { icon: Brain, text: 'Help me debug my code', color: '#a78bfa' },
  { icon: Globe, text: 'Search the web for latest AI news', color: '#60a5fa' },
  { icon: Bot, text: 'Write a creative short story', color: '#34d399' },
];

interface Props { messages: Message[]; isStreaming: boolean; onRegenerate: () => void; compactMode?: boolean; }

export default function ChatWindow({ messages, isStreaming, onRegenerate, compactMode }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const isLight = typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'light';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, messages[messages.length - 1]?.content?.length]);

  if (messages.length === 0) return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
      <div className="relative mb-5 float">
        <div className="w-16 h-16 rounded-2xl bg-gradient-accent flex items-center justify-center" style={{ boxShadow: 'var(--glow-md)' }}>
          <Bot size={28} className="text-white" />
        </div>
      </div>
      <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text)' }}>NeuralChat</h1>
      <p className="text-sm mb-8" style={{ color: 'var(--text-dim)' }}>Your private local AI. All models, all private.</p>
      <div className="grid grid-cols-2 gap-2 max-w-sm w-full">
        {SUGGESTIONS.map((s, i) => (
          <div key={i} className="p-4 rounded-2xl cursor-pointer transition-all text-left" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(99,102,241,0.3)'; e.currentTarget.style.background='var(--elevated)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.background='var(--surface)'; }}>
            <s.icon size={16} style={{ color: s.color, marginBottom: '10px' }} />
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-dim)' }}>{s.text}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const spacing = compactMode ? 'space-y-4' : 'space-y-8';
  const maxW = compactMode ? 'max-w-3xl' : 'max-w-2xl';

  return (
    <div className="flex-1 overflow-y-auto">
      <div className={`${maxW} mx-auto px-4 py-8 ${spacing}`}>
        {messages.map((msg, i) => {
          const isLast = i === messages.length - 1;
          const streaming = isLast && isStreaming;
          return (
            <div key={msg.id} className="msg-animate group">
              {msg.role === 'user' ? (
                <div className="flex justify-end gap-3">
                  <EditableUserMessage content={msg.content} onEdit={newContent => {
                    // Editing a user message triggers a resend — handled by parent via callback if wired up
                    console.log('edit:', newContent);
                  }} />
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'var(--elevated)', border: '1px solid var(--border-med)' }}>
                    <User size={13} style={{ color: 'var(--muted-light)' }} />
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-accent flex items-center justify-center flex-shrink-0 mt-0.5" style={{ boxShadow: 'var(--glow-sm)' }}>
                    <Bot size={14} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {msg.sources && msg.sources.length > 0 && <SourcesBlock sources={msg.sources}/>}
                    {msg.thinking && <ThinkingBlock thinking={msg.thinking} isStreaming={streaming && msg.content === ''} />}
                    {msg.content === '' && !msg.thinking && streaming
                      ? <div className="flex gap-1.5 py-2">{[0,1,2].map(j=><span key={j} className={`w-1.5 h-1.5 rounded-full dot-${j+1}`} style={{background:'var(--accent)'}}/>)}</div>
                      : (
                        <div className={`prose text-sm ${streaming && msg.content !== '' ? 'streaming-cursor' : ''}`}>
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm, remarkMath]}
                            rehypePlugins={[rehypeKatex]}
                            components={{
                              text({ children }: any) {
                                const str = String(children);
                                const parts = str.split(/(\[\d+\])/);
                                if (parts.length === 1) return <>{str}</>;
                                return <>{parts.map((p,j) => {
                                  const m = p.match(/^\[(\d+)\]$/);
                                  if (m && msg.sources) { const idx = parseInt(m[1])-1; const src = msg.sources[idx]; return src ? <a key={j} href={src.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold mx-0.5 no-underline align-super" style={{background:'rgba(59,130,246,0.2)',border:'1px solid rgba(59,130,246,0.3)',color:'#93c5fd'}}>{m[1]}</a> : <span key={j}>{p}</span>; }
                                  return <span key={j}>{p}</span>;
                                })}</>;
                              },
                              code({ className, children, ...props }: any) {
                                const match = /language-(\w+)/.exec(className || '');
                                const code = String(children).replace(/\n$/,'');
                                return match ? (
                                  <div className="rounded-2xl overflow-hidden my-4" style={{ border: '1px solid var(--border-med)' }}>
                                    <div className="flex items-center justify-between px-4 py-2.5" style={{ background: isLight ? '#f0f0f8' : '#080812', borderBottom: '1px solid var(--border)' }}>
                                      <div className="flex items-center gap-2">
                                        <div className="flex gap-1.5"><div className="w-2.5 h-2.5 rounded-full" style={{background:'rgba(239,68,68,0.6)'}}/><div className="w-2.5 h-2.5 rounded-full" style={{background:'rgba(234,179,8,0.6)'}}/><div className="w-2.5 h-2.5 rounded-full" style={{background:'rgba(34,197,94,0.6)'}}/></div>
                                        <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: 'var(--accent-light)', opacity: 0.7 }}>{match[1]}</span>
                                      </div>
                                      <CopyBtn text={code} />
                                    </div>
                                    <SyntaxHighlighter style={isLight ? oneLight : nightOwl} language={match[1]} PreTag="div"
                                      customStyle={{ margin:0, background: isLight ? '#f8f8fc' : '#06060f', padding:'16px 18px', fontSize:'0.78rem', lineHeight:'1.7' }}
                                    >{code}</SyntaxHighlighter>
                                  </div>
                                ) : <code className="px-1.5 py-0.5 rounded-md text-[0.8em] font-mono" style={{background:'rgba(99,102,241,0.1)',border:'1px solid rgba(99,102,241,0.15)',color:'var(--accent-light)'}} {...props}>{children}</code>;
                              },
                              img: ({src,alt}) => <img src={src} alt={alt} className="rounded-2xl max-w-full mt-3" style={{border:'1px solid var(--border)'}} />,
                              a: ({href,children}) => <a href={href} target="_blank" rel="noopener noreferrer" style={{color:'var(--accent-light)',textDecoration:'underline',textUnderlineOffset:'3px'}}>{children}</a>,
                            }}
                          >{msg.content}</ReactMarkdown>
                        </div>
                      )
                    }
                    <MessageActions
                      content={msg.content}
                      onRegenerate={isLast ? onRegenerate : undefined}
                      onSaveMemory={() => fetch('/api/memory',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({content:msg.content.slice(0,300)})}).catch(()=>{})}
                    />
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
