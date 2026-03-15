'use client';
import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Cpu, ArrowRight, Loader2 } from 'lucide-react';

export default function AuthPage() {
  const [mode, setMode] = useState<'login'|'register'>('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [animKey, setAnimKey] = useState(0);
  const router = useRouter();

  useEffect(() => { setAnimKey(k => k+1); setError(''); }, [mode]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      if (mode === 'register') {
        const res = await fetch('/api/auth/register', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, name, password }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error || 'Registration failed'); return; }
      }
      const result = await signIn('credentials', { email, password, redirect: false });
      if (result?.error) { setError('Invalid email or password'); return; }
      router.push('/');
    } finally { setLoading(false); }
  };

  const features = [
    { emoji: '🧠', label: 'Persistent memory across chats' },
    { emoji: '🔍', label: 'Web search powered by SearXNG' },
    { emoji: '🎙️', label: 'Voice input & live voice mode' },
    { emoji: '📎', label: 'File & image attachments' },
    { emoji: '🔗', label: 'Shareable chat URLs' },
    { emoji: '🌙', label: 'Dark, light & system themes' },
  ];

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <div className="ambient-bg" />

      {/* LEFT PANEL */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 px-16 py-12 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full opacity-20 blur-[120px] pointer-events-none"
          style={{ background: 'radial-gradient(circle, #6366f1, transparent)', transform: 'translate(-30%,-30%)' }} />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full opacity-15 blur-[100px] pointer-events-none"
          style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)', transform: 'translate(30%,30%)' }} />

        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10 slide-up">
          <div className="w-10 h-10 rounded-2xl bg-gradient-accent flex items-center justify-center shadow-glow-md">
            <Cpu size={20} className="text-white" />
          </div>
          <div>
            <p className="text-lg font-bold" style={{ color: 'var(--text)' }}>NeuralChat</p>
            <p className="text-xs tracking-widest uppercase" style={{ color: 'var(--muted)' }}>Local AI Assistant</p>
          </div>
        </div>

        {/* Hero */}
        <div className="relative z-10">
          <div className="float inline-block mb-8">
            <div className="w-20 h-20 rounded-3xl bg-gradient-accent flex items-center justify-center shadow-glow-md">
              <Cpu size={36} className="text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold leading-tight mb-4" style={{ color: 'var(--text)' }}
            dangerouslySetInnerHTML={{ __html: 'Your private,<br/>intelligent AI.' }} />
          <p className="text-base mb-8 leading-relaxed" style={{ color: 'var(--text-dim)' }}>
            Powered by Ollama, running entirely on your machine. No data leaves your device.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl scale-in"
                style={{ background: 'var(--elevated)', border: '1px solid var(--border)', animationDelay: `${i * 0.08}s`, opacity: 0 }}>
                <span className="text-lg">{f.emoji}</span>
                <span className="text-xs" style={{ color: 'var(--text-dim)' }}>{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs relative z-10" style={{ color: 'var(--muted)' }}>© 2026 NeuralChat · Private by design</p>
      </div>

      {/* RIGHT PANEL — Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative z-10">
        <div key={animKey} className="w-full max-w-md scale-in" style={{ opacity: 0 }}>
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 justify-center mb-8">
            <div className="w-10 h-10 rounded-2xl bg-gradient-accent flex items-center justify-center shadow-glow-md">
              <Cpu size={20} className="text-white" />
            </div>
            <p className="text-xl font-bold" style={{ color: 'var(--text)' }}>NeuralChat</p>
          </div>

          <div className="rounded-3xl p-8" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
            {/* Toggle */}
            <div className="flex gap-1 p-1 rounded-2xl mb-8" style={{ background: 'var(--elevated)' }}>
              {(['login','register'] as const).map(m => (
                <button key={m} onClick={() => setMode(m)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300"
                  style={{
                    background: mode === m ? 'var(--bg)' : 'transparent',
                    color: mode === m ? 'var(--text)' : 'var(--muted)',
                    boxShadow: mode === m ? 'var(--shadow)' : 'none',
                    border: mode === m ? '1px solid var(--border-med)' : '1px solid transparent',
                  }}>
                  {m === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              ))}
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--text)' }}>
                {mode === 'login' ? 'Welcome back' : 'Get started'}
              </h2>
              <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
                {mode === 'login' ? 'Sign in to continue to NeuralChat' : 'Create your private AI account'}
              </p>
            </div>

            <form onSubmit={submit} className="space-y-4">
              {mode === 'register' && (
                <div className="slide-up" style={{ opacity: 0 }}>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-dim)' }}>Display Name</label>
                  <input value={name} onChange={e => setName(e.target.value)}
                    placeholder="Finley Thompson"
                    className="w-full text-sm rounded-xl px-4 py-3 outline-none transition-all"
                    style={{ background: 'var(--elevated)', border: '1px solid var(--border-med)', color: 'var(--text)' }}
                    onFocus={e => e.currentTarget.style.borderColor='var(--accent)'}
                    onBlur={e => e.currentTarget.style.borderColor='var(--border-med)'}
                  />
                </div>
              )}
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-dim)' }}>Email address</label>
                <input value={email} onChange={e => setEmail(e.target.value)} type="email" required
                  placeholder="you@example.com"
                  className="w-full text-sm rounded-xl px-4 py-3 outline-none transition-all"
                  style={{ background: 'var(--elevated)', border: '1px solid var(--border-med)', color: 'var(--text)' }}
                  onFocus={e => e.currentTarget.style.borderColor='var(--accent)'}
                  onBlur={e => e.currentTarget.style.borderColor='var(--border-med)'}
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-dim)' }}>Password</label>
                <div className="relative">
                  <input value={password} onChange={e => setPassword(e.target.value)}
                    type={showPw ? 'text' : 'password'} required
                    placeholder={mode === 'register' ? 'Min 6 characters' : 'Your password'}
                    className="w-full text-sm rounded-xl px-4 py-3 pr-12 outline-none transition-all"
                    style={{ background: 'var(--elevated)', border: '1px solid var(--border-med)', color: 'var(--text)' }}
                    onFocus={e => e.currentTarget.style.borderColor='var(--accent)'}
                    onBlur={e => e.currentTarget.style.borderColor='var(--border-med)'}
                  />
                  <button type="button" onClick={() => setShowPw(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 transition-opacity hover:opacity-80"
                    style={{ color: 'var(--muted)' }}>
                    {showPw ? <EyeOff size={15}/> : <Eye size={15}/>}
                  </button>
                </div>
              </div>

              {error && (
                <div className="text-xs px-4 py-3 rounded-xl scale-in" style={{ opacity:0, background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', color:'#f87171' }}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow:'var(--glow-md)', marginTop:'8px' }}>
                {loading ? <Loader2 size={16} className="animate-spin" /> : <>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                  <ArrowRight size={15} />
                </>}
              </button>
            </form>

            <p className="text-center text-xs mt-6" style={{ color: 'var(--muted)' }}>
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button onClick={() => setMode(m => m==='login'?'register':'login')}
                className="font-semibold hover:underline transition-all" style={{ color: 'var(--accent-light)' }}>
                {mode === 'login' ? 'Sign up free' : 'Sign in'}
              </button>
            </p>
          </div>
          <p className="text-center text-xs mt-4" style={{ color: 'var(--muted)', opacity: 0.5 }}>100% private · No cloud · All data stays on your device</p>
        </div>
      </div>
    </div>
  );
}
