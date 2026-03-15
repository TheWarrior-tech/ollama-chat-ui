import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { Bot, User, Globe } from 'lucide-react';

export default async function SharePage({ params }: { params: { id: string } }) {
  const convo = await prisma.conversation.findUnique({
    where: { id: params.id, shared: true },
    include: { messages: { orderBy: { createdAt: 'asc' } }, user: { select: { name: true } } },
  });
  if (!convo) notFound();

  return (
    <div className="min-h-screen bg-bg text-text">
      <div className="ambient-bg" />
      <div className="max-w-2xl mx-auto px-4 py-10 relative z-10">
        <div className="flex items-center gap-3 mb-8 pb-6 border-b border-border">
          <div className="w-9 h-9 rounded-xl bg-gradient-accent flex items-center justify-center shadow-glow-sm">
            <Bot size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white">{convo.title}</h1>
            <p className="text-xs text-muted">Shared by {convo.user.name || 'Anonymous'} · {convo.messages.length} messages</p>
          </div>
        </div>
        <div className="space-y-6">
          {convo.messages.map((msg: any) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-xl bg-gradient-accent flex items-center justify-center flex-shrink-0 mt-0.5 shadow-glow-sm">
                  <Bot size={13} className="text-white" />
                </div>
              )}
              <div className={`max-w-[80%] text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-elevated border border-border-med rounded-2xl rounded-br-md px-4 py-3'
                  : 'text-text'
              }`}>
                {msg.content}
              </div>
              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-xl bg-elevated border border-border-med flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User size={12} className="text-muted" />
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="mt-10 pt-6 border-t border-border text-center">
          <p className="text-xs text-muted">Shared via <span className="text-accent-light font-semibold">NeuralChat</span> · Local AI, zero cloud</p>
        </div>
      </div>
    </div>
  );
}
