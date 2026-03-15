'use client';
import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Lock, Trash2, Brain, BarChart2, Save, Loader2, AlertTriangle, Plus, X } from 'lucide-react';

type Tab = 'profile' | 'memory' | 'stats' | 'danger';

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('profile');
  const [userData, setUserData] = useState<any>(null);
  const [memories, setMemories] = useState<{ id: string; content: string; createdAt: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [newMemory, setNewMemory] = useState('');

  // Profile form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth');
  }, [status]);

  useEffect(() => {
    fetch('/api/user').then(r => r.json()).then(d => {
      setUserData(d);
      setName(d.name || '');
      setEmail(d.email || '');
    });
    fetch('/api/memory').then(r => r.json()).then(d => setMemories(d.memories || []));
  }, []);

  const saveProfile = async () => {
    setLoading(true); setError(''); setSaved(false);
    const res = await fetch('/api/user', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, currentPassword: currentPassword || undefined, newPassword: newPassword || undefined }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || 'Failed to save'); return; }
    setSaved(true); setCurrentPassword(''); setNewPassword('');
    setTimeout(() => setSaved(false), 3000);
  };

  const deleteMemory = async (id: string) => {
    await fetch('/api/memory', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    setMemories(m => m.filter(x => x.id !== id));
  };

  const clearAllMemory = async () => {
    if (!confirm('Delete all memories? This cannot be undone.')) return;
    await fetch('/api/memory', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ all: true }) });
    setMemories([]);
  };

  const addMemory = async () => {
    if (!newMemory.trim()) return;
    const res = await fetch('/api/memory', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: newMemory }) });
    const mem = await res.json();
    setMemories(m => [{ id: mem.id, content: newMemory, createdAt: mem.createdAt }, ...m]);
    setNewMemory('');
  };

  const deleteAccount = async () => {
    if (!confirm('Permanently delete your account and all data? This CANNOT be undone.')) return;
    await fetch('/api/user', { method: 'DELETE' });
    signOut({ callbackUrl: '/auth' });
  };

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'memory', label: 'Memory', icon: Brain },
    { id: 'stats', label: 'Stats', icon: BarChart2 },
    { id: 'danger', label: 'Danger Zone', icon: AlertTriangle },
  ];

  if (status === 'loading') return <div className="min-h-screen bg-bg flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-bg text-text">
      <div className="ambient-bg" />
      <div className="max-w-2xl mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.push('/')} className="p-2 rounded-xl hover:bg-elevated border border-border text-muted hover:text-text transition-all">
            <ArrowLeft size={15} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-white">Account Settings</h1>
            <p className="text-xs text-muted">{session?.user?.email}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-surface border border-border rounded-2xl p-1">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-all ${
                tab === t.id ? 'bg-elevated border border-border-med text-white shadow-card' : 'text-muted hover:text-text-dim'
              } ${t.id === 'danger' ? (tab === t.id ? 'text-red-400' : 'hover:text-red-400') : ''}`}>
              <t.icon size={12} />{t.label}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {tab === 'profile' && (
          <div className="space-y-4">
            <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
              <h2 className="text-sm font-semibold text-white">Personal Info</h2>
              <div>
                <label className="text-xs text-muted mb-1.5 block">Display Name</label>
                <input value={name} onChange={e => setName(e.target.value)}
                  className="w-full bg-elevated border border-border text-text text-sm rounded-xl px-4 py-2.5 outline-none focus:border-accent/50 transition-all" />
              </div>
              <div>
                <label className="text-xs text-muted mb-1.5 block">Email</label>
                <input value={email} onChange={e => setEmail(e.target.value)} type="email"
                  className="w-full bg-elevated border border-border text-text text-sm rounded-xl px-4 py-2.5 outline-none focus:border-accent/50 transition-all" />
              </div>
            </div>
            <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2"><Lock size={13} />Change Password</h2>
              <div>
                <label className="text-xs text-muted mb-1.5 block">Current Password</label>
                <input value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} type="password" placeholder="Leave blank to keep current"
                  className="w-full bg-elevated border border-border text-text text-sm rounded-xl px-4 py-2.5 outline-none focus:border-accent/50 transition-all placeholder-muted" />
              </div>
              <div>
                <label className="text-xs text-muted mb-1.5 block">New Password</label>
                <input value={newPassword} onChange={e => setNewPassword(e.target.value)} type="password" placeholder="Min 6 characters"
                  className="w-full bg-elevated border border-border text-text text-sm rounded-xl px-4 py-2.5 outline-none focus:border-accent/50 transition-all placeholder-muted" />
              </div>
            </div>
            {error && <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">{error}</p>}
            <button onClick={saveProfile} disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-accent text-white text-sm font-semibold shadow-glow-md hover:shadow-glow-lg transition-all disabled:opacity-60">
              {loading ? <Loader2 size={15} className="animate-spin" /> : saved ? '✓ Saved!' : <><Save size={14} /> Save Changes</>}
            </button>
          </div>
        )}

        {/* Memory Tab */}
        {tab === 'memory' && (
          <div className="space-y-4">
            <div className="bg-surface border border-border rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-white">Saved Memories</h2>
                {memories.length > 0 && (
                  <button onClick={clearAllMemory} className="text-[10px] text-red-400/70 hover:text-red-400 transition-colors">Clear all</button>
                )}
              </div>
              {/* Add memory */}
              <div className="flex gap-2 mb-4">
                <input value={newMemory} onChange={e => setNewMemory(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addMemory()}
                  placeholder="Add a memory (e.g. I prefer Python)"
                  className="flex-1 bg-elevated border border-border text-text text-xs rounded-xl px-3 py-2.5 outline-none focus:border-accent/50 transition-all placeholder-muted" />
                <button onClick={addMemory} className="px-3 py-2.5 rounded-xl bg-gradient-subtle border border-accent/20 text-accent-light hover:border-accent/40 transition-all">
                  <Plus size={13} />
                </button>
              </div>
              {memories.length === 0 ? (
                <div className="text-center py-8">
                  <Brain size={24} className="text-muted/30 mx-auto mb-2" />
                  <p className="text-xs text-muted">No memories yet. The AI saves facts about you automatically.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {memories.map(m => (
                    <div key={m.id} className="flex items-start justify-between gap-3 px-3 py-2.5 rounded-xl bg-elevated border border-border group">
                      <p className="text-xs text-text-dim flex-1 leading-relaxed">{m.content}</p>
                      <button onClick={() => deleteMemory(m.id)} className="text-muted opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all flex-shrink-0 mt-0.5">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stats Tab */}
        {tab === 'stats' && userData && (
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Total Conversations', value: userData.convoCount ?? 0, color: 'text-accent-light' },
              { label: 'Total Messages', value: userData.msgCount ?? 0, color: 'text-violet-400' },
              { label: 'Saved Memories', value: userData.memCount ?? 0, color: 'text-emerald-400' },
              { label: 'Member Since', value: userData.createdAt ? new Date(userData.createdAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : '-', color: 'text-yellow-400' },
            ].map((s, i) => (
              <div key={i} className="bg-surface border border-border rounded-2xl p-5">
                <p className={`text-2xl font-bold ${s.color} mb-1`}>{s.value}</p>
                <p className="text-xs text-muted">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Danger Zone */}
        {tab === 'danger' && (
          <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={15} className="text-red-400" />
              <h2 className="text-sm font-semibold text-red-300">Danger Zone</h2>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-red-500/10">
              <div>
                <p className="text-sm font-medium text-text">Delete all conversations</p>
                <p className="text-xs text-muted mt-0.5">Permanently removes all chat history</p>
              </div>
              <button onClick={async () => {
                if (!confirm('Delete all conversations?')) return;
                await fetch('/api/conversations', { method: 'DELETE' }).catch(() => {});
              }} className="px-3 py-1.5 rounded-xl border border-red-500/30 text-red-400 text-xs font-medium hover:bg-red-500/10 transition-all">
                Delete All
              </button>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-text">Delete account</p>
                <p className="text-xs text-muted mt-0.5">Permanently deletes your account and all data</p>
              </div>
              <button onClick={deleteAccount} className="px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-all">
                Delete Account
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
