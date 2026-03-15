'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Cpu, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'register') {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error || 'Registration failed'); setLoading(false); return; }
      }
      const result = await signIn('credentials', { email, password, redirect: false });
      if (result?.error) { setError('Invalid email or password'); setLoading(false); return; }
      router.push('/');
    } catch { setError('Something went wrong'); setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 relative">
      <div className="ambient-bg" />
      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-accent flex items-center justify-center shadow-glow-md mb-4">
            <Cpu size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">NeuralChat</h1>
          <p className="text-text-dim text-sm mt-1">{mode === 'login' ? 'Welcome back' : 'Create your account'}</p>
        </div>

        {/* Card */}
        <div className="bg-surface border border-border rounded-2xl p-6 shadow-card">
          <form onSubmit={submit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="text-xs font-medium text-text-dim mb-1.5 block">Name</label>
                <div className="relative">
                  <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                  <input value={name} onChange={e => setName(e.target.value)}
                    placeholder="Your name" required
                    className="w-full bg-elevated border border-border text-text text-sm rounded-xl pl-10 pr-4 py-3 outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all placeholder-muted" />
                </div>
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-text-dim mb-1.5 block">Email</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input value={email} onChange={e => setEmail(e.target.value)}
                  type="email" placeholder="you@example.com" required
                  className="w-full bg-elevated border border-border text-text text-sm rounded-xl pl-10 pr-4 py-3 outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all placeholder-muted" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-text-dim mb-1.5 block">Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input value={password} onChange={e => setPassword(e.target.value)}
                  type="password" placeholder="••••••••" required minLength={6}
                  className="w-full bg-elevated border border-border text-text text-sm rounded-xl pl-10 pr-4 py-3 outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all placeholder-muted" />
              </div>
            </div>
            {error && <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-accent text-white text-sm font-semibold shadow-glow-md hover:shadow-glow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <>{mode === 'login' ? 'Sign In' : 'Create Account'}<ArrowRight size={14} /></>}
            </button>
          </form>
          <p className="text-center text-xs text-muted mt-4">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError(''); }}
              className="text-accent-light hover:text-white transition-colors font-medium">
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
        <p className="text-center text-[10px] text-muted/40 mt-4">All data stored locally on your machine</p>
      </div>
    </div>
  );
}
