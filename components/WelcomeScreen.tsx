'use client';
import { Cpu, Zap, Globe, Brain, Paperclip, Mic, Share2, Moon } from 'lucide-react';

const suggestions = [
  { icon: '💡', text: 'Explain quantum computing simply' },
  { icon: '💻', text: 'Review my Python code' },
  { icon: '✍️', text: 'Help me write a cover letter' },
  { icon: '🔍', text: 'Search the web for latest AI news' },
  { icon: '📊', text: 'Create a markdown table of top JS frameworks' },
  { icon: '🧪', text: 'Generate a unit test for a React component' },
];

export default function WelcomeScreen({ userName, onSuggestion }: { userName: string; onSuggestion: (s: string) => void }) {
  const first = userName?.split(' ')[0] || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 overflow-y-auto">
      {/* Animated orb */}
      <div className="relative mb-6 float">
        <div className="absolute inset-0 rounded-full blur-2xl" style={{ background:'radial-gradient(circle, rgba(99,102,241,0.3), transparent)', transform:'scale(1.5)' }} />
        <div className="relative w-16 h-16 rounded-2xl bg-gradient-accent flex items-center justify-center shadow-glow-md">
          <Cpu size={28} className="text-white" />
        </div>
      </div>

      <h1 className="text-3xl font-bold mb-2 slide-up" style={{ color:'var(--text)', opacity:0 }}>
        {greeting}, <span style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>{first}</span>
      </h1>
      <p className="text-sm mb-10 slide-up" style={{ color:'var(--text-dim)', opacity:0, animationDelay:'0.1s' }}>How can I help you today?</p>

      {/* Suggestion chips */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-xl">
        {suggestions.map((s, i) => (
          <button key={i} onClick={() => onSuggestion(s.text)}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl text-left text-sm transition-all hover:scale-[1.02] active:scale-[0.98] slide-up"
            style={{
              background:'var(--surface)', border:'1px solid var(--border)',
              color:'var(--text-dim)', opacity:0, animationDelay:`${0.15 + i * 0.06}s`,
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(99,102,241,0.3)'; e.currentTarget.style.color='var(--text)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--text-dim)'; }}
          >
            <span className="text-base flex-shrink-0">{s.icon}</span>
            <span>{s.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
