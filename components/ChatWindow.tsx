'use client';
import { useEffect, useRef, useState } from 'react';
import { Message } from '@/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { nightOwl } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Bot, User, Copy, Check, Zap } from 'lucide-react';

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] text-muted hover:text-text hover:bg-white/5 transition-all"
    >
      {copied ? <><Check size={10} className="text-green-400" /> Copied</> : <><Copy size={10} /> Copy</>}
    </button>
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
  const lastStreaming = messages[messages.length - 1]?.role === 'assistant' && isStreaming;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, lastStreaming]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
        <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-5">
          <Bot size={30} className="text-accent" />
        </div>
        <h1 className="text-2xl font-bold text-text mb-2 tracking-tight">What can I help with?</h1>
        <p className="text-muted-light text-sm max-w-sm leading-relaxed">Chat with your local Ollama models. Fast, private, and fully on-device.</p>
        <div className="grid grid-cols-2 gap-2.5 mt-8 max-w-md w-full">
          {[
            { icon: '⚡', text: 'Explain a concept simply' },
            { icon: '🐍', text: 'Write Python code' },
            { icon: '🔍', text: 'Debug my code' },
            { icon: '✍️', text: 'Help me write something' },
          ].map(s => (
            <div key={s.text} className="p-3.5 border border-border rounded-xl text-xs text-muted-light hover:border-accent/40 hover:bg-accent/5 hover:text-text cursor-pointer transition-all text-left">
              <span className="mr-1.5">{s.icon}</span>{s.text}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto py-6 space-y-1">
      {messages.map((msg, i) => (
        <div key={msg.id} className={`msg-animate px-4 md:px-8 py-3 ${ msg.role === 'user' ? 'flex justify-end' : '' }`}>
          {msg.role === 'user' ? (
            <div className="flex items-end gap-3 max-w-[75%]">
              <div className="bg-elevated border border-border-light rounded-2xl rounded-br-sm px-4 py-3 text-sm text-text leading-relaxed">{msg.content}</div>
              <div className="w-7 h-7 rounded-full bg-elevated border border-border flex items-center justify-center flex-shrink-0">
                <User size={13} className="text-muted" />
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 max-w-3xl">
              <div className="w-7 h-7 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot size={13} className="text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                {msg.content === '' && isStreaming ? (
                  <ThinkingDots />
                ) : (
                  <div className={`prose text-sm ${isStreaming && i === messages.length - 1 ? 'streaming-cursor' : ''}`}>
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({ className, children, ...props }: any) {
                          const match = /language-(\w+)/.exec(className || '');
                          const code = String(children).replace(/\n$/, '');
                          return match ? (
                            <div className="rounded-xl overflow-hidden border border-border my-3">
                              <div className="flex items-center justify-between px-4 py-2 bg-[#0d0d1a] border-b border-border">
                                <span className="text-[10px] text-accent font-mono uppercase tracking-widest">{match[1]}</span>
                                <CopyBtn text={code} />
                              </div>
                              <SyntaxHighlighter
                                style={nightOwl}
                                language={match[1]}
                                PreTag="div"
                                customStyle={{ margin: 0, background: '#0a0a14', padding: '14px 16px', fontSize: '0.8rem', lineHeight: '1.6' }}
                              >{code}</SyntaxHighlighter>
                            </div>
                          ) : <code className="bg-[#1e1e2e] text-purple-400 px-1.5 py-0.5 rounded text-[0.8em] font-mono" {...props}>{children}</code>;
                        },
                        img: ({ src, alt }) => <img src={src} alt={alt} className="rounded-xl max-w-full mt-2 border border-border" />,
                      }}
                    >{msg.content}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
