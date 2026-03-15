'use client';

import { useEffect, useRef } from 'react';
import { Message } from '@/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Bot, User, Copy, Check } from 'lucide-react';
import { useState } from 'react';

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="absolute top-2 right-2 p-1.5 rounded bg-input hover:bg-border transition text-muted hover:text-white">
      {copied ? <Check size={13} /> : <Copy size={13} />}
    </button>
  );
}

function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-1 py-2">
      {[0, 1, 2].map(i => (
        <span key={i} className="thinking-dot w-2 h-2 bg-muted rounded-full inline-block" />
      ))}
    </div>
  );
}

interface Props {
  messages: Message[];
  isStreaming: boolean;
}

export default function ChatWindow({ messages, isStreaming }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
        <Bot size={48} className="text-accent mb-4" />
        <h1 className="text-2xl font-semibold text-white mb-2">Ollama Chat</h1>
        <p className="text-muted text-sm max-w-md">Chat with your local AI models or generate images using Stable Diffusion. Start typing below.</p>
        <div className="grid grid-cols-2 gap-3 mt-8 max-w-lg w-full">
          {['Explain quantum computing', 'Write a Python function', 'Generate an image of a forest', 'Summarise the news today'].map(s => (
            <div key={s} className="p-3 border border-border rounded-xl text-sm text-muted hover:border-accent hover:text-white cursor-pointer transition">{s}</div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto py-6 px-4 space-y-6">
      {messages.map(msg => (
        <div key={msg.id} className={`flex gap-4 max-w-3xl mx-auto ${ msg.role === 'user' ? 'justify-end' : 'justify-start w-full' }`}>
          {msg.role === 'assistant' && (
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0 mt-1">
              <Bot size={16} className="text-white" />
            </div>
          )}
          <div className={`${ msg.role === 'user' ? 'bg-input rounded-2xl rounded-tr-sm px-4 py-3 max-w-xl' : 'flex-1' } text-sm leading-relaxed`}>
            {msg.role === 'assistant' && msg.content === '' && isStreaming ? (
              <ThinkingIndicator />
            ) : (
              <div className="prose-dark">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ node, className, children, ...props }: any) {
                      const match = /language-(\w+)/.exec(className || '');
                      const codeText = String(children).replace(/\n$/, '');
                      return match ? (
                        <div className="relative my-3">
                          <div className="flex items-center justify-between px-3 py-1.5 bg-[#1a1a2e] rounded-t-lg border border-border">
                            <span className="text-xs text-muted">{match[1]}</span>
                            <CopyButton text={codeText} />
                          </div>
                          <SyntaxHighlighter style={oneDark} language={match[1]} PreTag="div" customStyle={{ margin: 0, borderRadius: '0 0 8px 8px', border: '1px solid #383838', borderTop: 'none' }}>{codeText}</SyntaxHighlighter>
                        </div>
                      ) : (
                        <code className="bg-input px-1.5 py-0.5 rounded text-red-400 text-xs" {...props}>{children}</code>
                      );
                    },
                    p({ children }) { return <p className="mb-3 last:mb-0 text-[#ececec]">{children}</p>; },
                    h1({ children }) { return <h1 className="text-xl font-bold text-white mb-3">{children}</h1>; },
                    h2({ children }) { return <h2 className="text-lg font-semibold text-white mb-2">{children}</h2>; },
                    h3({ children }) { return <h3 className="text-base font-semibold text-white mb-2">{children}</h3>; },
                    ul({ children }) { return <ul className="list-disc list-inside space-y-1 mb-3 text-[#ececec]">{children}</ul>; },
                    ol({ children }) { return <ol className="list-decimal list-inside space-y-1 mb-3 text-[#ececec]">{children}</ol>; },
                    li({ children }) { return <li className="text-[#ececec]">{children}</li>; },
                    blockquote({ children }) { return <blockquote className="border-l-4 border-accent pl-4 italic text-muted my-3">{children}</blockquote>; },
                    table({ children }) { return <table className="w-full border-collapse my-3">{children}</table>; },
                    th({ children }) { return <th className="border border-border px-3 py-2 bg-input text-left text-sm font-semibold">{children}</th>; },
                    td({ children }) { return <td className="border border-border px-3 py-2 text-sm">{children}</td>; },
                    img({ src, alt }) { return <img src={src} alt={alt} className="rounded-xl max-w-full mt-3" />; }
                  }}
                >{msg.content}</ReactMarkdown>
              </div>
            )}
          </div>
          {msg.role === 'user' && (
            <div className="w-8 h-8 rounded-full bg-input border border-border flex items-center justify-center flex-shrink-0 mt-1">
              <User size={16} className="text-muted" />
            </div>
          )}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
