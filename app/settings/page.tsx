'use client';
import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Lock, Trash2, Brain, BarChart2, Save, Loader2, AlertTriangle, Plus, X, Palette, Settings2, MessageSquare, Home, Eye, EyeOff, Wifi, WifiOff, CheckCircle2 } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { Sun, Moon, Monitor } from 'lucide-react';

type Tab = 'profile' | 'appearance' | 'chat' | 'memory' | 'integrations' | 'stats' | 'danger';

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [tab, setTab] = useState<Tab>('profile');
  const [userData, setUserData] = useState<any>(null);
  const [memories, setMemories] = useState<{ id:string; content:string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [newMemory, setNewMemory] = useState('');

  // Profile
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Chat preferences
  const [systemPrompt, setSystemPrompt] = useState('');
  const [fontSize, setFontSize] = useState('md');
  const [sendOnEnter, setSendOnEnter] = useState(true);
  const [showThinking, setShowThinking] = useState(true);
  const [showTimestamps, setShowTimestamps] = useState(false);
  const [autoTitle, setAutoTitle] = useState(true);
  const [chatWidth, setChatWidth] = useState('2xl');

  // ── Home Assistant ──────────────────────────────────────────────
  const [haHost, setHaHost]         = useState('');
  const [haToken, setHaToken]       = useState('');
  const [haEnabled, setHaEnabled]   = useState(true);
  const [showToken, setShowToken]   = useState(false);
  const [haTesting, setHaTesting]   = useState(false);
  const [haTestResult, setHaTestResult] = useState<'ok'|'fail'|null>(null);
  const [haSaving, setHaSaving]     = useState(false);
  const [haSaved, setHaSaved]       = useState(false);
  // ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth');
  }, [status]);

  useEffect(() => {
    fetch('/api/user').then(r=>r.json()).then(d => { setUserData(d); setName(d.name||''); setEmail(d.email||''); });
    fetch('/api/memory').then(r=>r.json()).then(d => setMemories(d.memories||[]));
    const sp = localStorage.getItem('nc-system-prompt') || '';
    const fs = localStorage.getItem('nc-font-size') || 'md';
    const se = localStorage.getItem('nc-send-enter') !== 'false';
    const st = localStorage.getItem('nc-show-thinking') !== 'false';
    const ts = localStorage.getItem('nc-timestamps') === 'true';
    const at = localStorage.getItem('nc-auto-title') !== 'false';
    const cw = localStorage.getItem('nc-chat-width') || '2xl';
    setSystemPrompt(sp); setFontSize(fs); setSendOnEnter(se); setShowThinking(st); setShowTimestamps(ts); setAutoTitle(at); setChatWidth(cw);
    // Load HA settings (token is masked by server)
    fetch('/api/settings').then(r=>r.json()).then(d => {
      setHaHost(d.ha_host || '');
      setHaToken(d.ha_token || '');
      setHaEnabled(d.ha_enabled !== 'false');
    });
  }, []);

  const saveProfile = async () => {
    setLoading(true); setError(''); setSaved(false);
    const res = await fetch('/api/user', {
      method:'PATCH', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ name, email, currentPassword:currentPassword||undefined, newPassword:newPassword||undefined }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error||'Failed to save'); return; }
    setSaved(true); setCurrentPassword(''); setNewPassword('');
    setTimeout(() => setSaved(false), 3000);
  };

  const saveChatPrefs = () => {
    localStorage.setItem('nc-system-prompt', systemPrompt);
    localStorage.setItem('nc-font-size', fontSize);
    localStorage.setItem('nc-send-enter', String(sendOnEnter));
    localStorage.setItem('nc-show-thinking', String(showThinking));
    localStorage.setItem('nc-timestamps', String(showTimestamps));
    localStorage.setItem('nc-auto-title', String(autoTitle));
    localStorage.setItem('nc-chat-width', chatWidth);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const saveHA = async () => {
    setHaSaving(true); setHaSaved(false);
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ha_host: haHost, ha_token: haToken, ha_enabled: String(haEnabled) }),
    });
    setHaSaving(false); setHaSaved(true);
    setTimeout(() => setHaSaved(false), 3000);
  };

  const testHA = async () => {
    setHaTesting(true); setHaTestResult(null);
    // Save first so the server uses the latest values
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ha_host: haHost, ha_token: haToken, ha_enabled: 'true' }),
    });
    try {
      const res = await fetch('/api/ha');
      setHaTestResult(res.ok ? 'ok' : 'fail');
    } catch { setHaTestResult('fail'); }
    setHaTesting(false);
  };

  const deleteMemory = async (id: string) => {
    await fetch('/api/memory', { method:'DELETE', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id}) });
    setMemories(m => m.filter(x => x.id !== id));
  };

  const clearAllMemory = async () => {
    if (!confirm('Delete all memories?')) return;
    await fetch('/api/memory', { method:'DELETE', headers:{'Content-Type':'application/json'}, body:JSON.stringify({all:true}) });
    setMemories([]);
  };

  const addMemory = async () => {
    if (!newMemory.trim()) return;
    const res = await fetch('/api/memory', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({content:newMemory}) });
    const mem = await res.json();
    setMemories(m => [{id:mem.id, content:newMemory}, ...m]);
    setNewMemory('');
  };

  const tabs: { id:Tab; label:string; icon:any }[] = [
    {id:'profile',      label:'Profile',      icon:User},
    {id:'appearance',   label:'Appearance',   icon:Palette},
    {id:'chat',         label:'Chat',         icon:MessageSquare},
    {id:'memory',       label:'Memory',       icon:Brain},
    {id:'integrations', label:'Integrations', icon:Home},
    {id:'stats',        label:'Stats',        icon:BarChart2},
    {id:'danger',       label:'Danger',       icon:AlertTriangle},
  ];

  const inputStyle = { background:'var(--elevated)', border:'1px solid var(--border-med)', color:'var(--text)' };
  const labelStyle = { color:'var(--text-dim)' };
  const cardStyle  = { background:'var(--surface)', border:'1px solid var(--border)' };

  if (status === 'loading') return <div className="min-h-screen flex items-center justify-center" style={{background:'var(--bg)'}}><div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{borderColor:'var(--accent)',borderTopColor:'transparent'}} /></div>;

  return (
    <div className="min-h-screen" style={{ background:'var(--bg)', color:'var(--text)' }}>
      <div className="ambient-bg" />
      <div className="max-w-2xl mx-auto px-4 py-8 relative z-10">

        {/* Header */}
        <div className="flex items-center gap-4 mb-6 slide-up" style={{ opacity:0 }}>
          <button onClick={() => router.push('/')} className="p-2 rounded-xl transition-all" style={{ background:'var(--elevated)', border:'1px solid var(--border)', color:'var(--muted)' }}>
            <ArrowLeft size={15} />
          </button>
          <div>
            <h1 className="text-lg font-bold" style={{ color:'var(--text)' }}>Settings</h1>
            <p className="text-xs" style={{ color:'var(--muted)' }}>{session?.user?.email}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 rounded-2xl overflow-x-auto scrollbar-hide" style={{ background:'var(--surface)', border:'1px solid var(--border)' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex items-center gap-1.5 py-2 px-3 rounded-xl text-xs font-medium whitespace-nowrap transition-all"
              style={{
                background: tab===t.id ? 'var(--elevated)' : 'transparent',
                color: tab===t.id ? (t.id==='danger'?'#f87171':'var(--text)') : (t.id==='danger'?'rgba(248,113,113,0.6)':'var(--muted)'),
                border: tab===t.id ? '1px solid var(--border-med)' : '1px solid transparent',
              }}>
              <t.icon size={12} />{t.label}
            </button>
          ))}
        </div>

        {/* ── PROFILE ── */}
        {tab==='profile' && (
          <div className="space-y-4 fade-in">
            <div className="rounded-2xl p-5 space-y-4" style={cardStyle}>
              <h2 className="text-sm font-semibold" style={{color:'var(--text)'}}>Personal Info</h2>
              <div><label className="text-xs mb-1.5 block" style={labelStyle}>Display Name</label>
                <input value={name} onChange={e=>setName(e.target.value)} className="w-full text-sm rounded-xl px-4 py-2.5 outline-none transition-all" style={inputStyle} /></div>
              <div><label className="text-xs mb-1.5 block" style={labelStyle}>Email</label>
                <input value={email} onChange={e=>setEmail(e.target.value)} type="email" className="w-full text-sm rounded-xl px-4 py-2.5 outline-none transition-all" style={inputStyle} /></div>
            </div>
            <div className="rounded-2xl p-5 space-y-4" style={cardStyle}>
              <h2 className="text-sm font-semibold flex items-center gap-2" style={{color:'var(--text)'}}><Lock size={13}/>Change Password</h2>
              <div><label className="text-xs mb-1.5 block" style={labelStyle}>Current Password</label>
                <input value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} type="password" placeholder="Leave blank to keep" className="w-full text-sm rounded-xl px-4 py-2.5 outline-none transition-all" style={inputStyle} /></div>
              <div><label className="text-xs mb-1.5 block" style={labelStyle}>New Password</label>
                <input value={newPassword} onChange={e=>setNewPassword(e.target.value)} type="password" placeholder="Min 6 characters" className="w-full text-sm rounded-xl px-4 py-2.5 outline-none transition-all" style={inputStyle} /></div>
            </div>
            {error && <p className="text-xs px-4 py-2.5 rounded-xl" style={{color:'#f87171',background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)'}}>{error}</p>}
            <button onClick={saveProfile} disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white text-sm font-semibold transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
              style={{background:'linear-gradient(135deg,#6366f1,#8b5cf6)',boxShadow:'var(--glow-md)'}}>
              {loading?<Loader2 size={15} className="animate-spin"/>:saved?'✓ Saved!':<><Save size={14}/>Save Changes</>}
            </button>
          </div>
        )}

        {/* ── APPEARANCE ── */}
        {tab==='appearance' && (
          <div className="space-y-4 fade-in">
            <div className="rounded-2xl p-5 space-y-4" style={cardStyle}>
              <h2 className="text-sm font-semibold" style={{color:'var(--text)'}}>Theme</h2>
              <div className="grid grid-cols-3 gap-2">
                {([['dark','Dark',Moon],['light','Light',Sun],['system','System',Monitor]] as const).map(([v,l,Icon]) => (
                  <button key={v} onClick={()=>setTheme(v)}
                    className="flex flex-col items-center gap-2 py-4 rounded-2xl transition-all"
                    style={{ background:theme===v?'var(--elevated)':'transparent', border:theme===v?'1px solid var(--accent)':'1px solid var(--border)', color:theme===v?'var(--accent-light)':'var(--muted)' }}>
                    <Icon size={18}/><span className="text-xs font-medium">{l}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-2xl p-5 space-y-4" style={cardStyle}>
              <h2 className="text-sm font-semibold" style={{color:'var(--text)'}}>Chat Width</h2>
              <div className="grid grid-cols-3 gap-2">
                {([['xl','Narrow'],['2xl','Default'],['4xl','Wide']] as const).map(([v,l]) => (
                  <button key={v} onClick={()=>setChatWidth(v)}
                    className="py-2.5 rounded-xl text-xs font-medium transition-all"
                    style={{ background:chatWidth===v?'var(--elevated)':'transparent', border:chatWidth===v?'1px solid var(--accent)':'1px solid var(--border)', color:chatWidth===v?'var(--accent-light)':'var(--muted)' }}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-2xl p-5 space-y-4" style={cardStyle}>
              <h2 className="text-sm font-semibold" style={{color:'var(--text)'}}>Font Size</h2>
              <div className="grid grid-cols-3 gap-2">
                {([['sm','Small'],['md','Medium'],['lg','Large']] as const).map(([v,l]) => (
                  <button key={v} onClick={()=>setFontSize(v)}
                    className="py-2.5 rounded-xl text-xs font-medium transition-all"
                    style={{ background:fontSize===v?'var(--elevated)':'transparent', border:fontSize===v?'1px solid var(--accent)':'1px solid var(--border)', color:fontSize===v?'var(--accent-light)':'var(--muted)' }}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={saveChatPrefs}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white text-sm font-semibold transition-all"
              style={{background:'linear-gradient(135deg,#6366f1,#8b5cf6)',boxShadow:'var(--glow-md)'}}>
              {saved?'✓ Saved!':<><Save size={14}/>Save Appearance</>}
            </button>
          </div>
        )}

        {/* ── CHAT ── */}
        {tab==='chat' && (
          <div className="space-y-4 fade-in">
            <div className="rounded-2xl p-5 space-y-4" style={cardStyle}>
              <h2 className="text-sm font-semibold" style={{color:'var(--text)'}}>Custom System Prompt</h2>
              <p className="text-xs" style={{color:'var(--muted)'}}>Added to every conversation. Override the default AI persona.</p>
              <textarea value={systemPrompt} onChange={e=>setSystemPrompt(e.target.value)}
                rows={4} placeholder="e.g. Always respond in Scots English..."
                className="w-full text-sm rounded-xl px-4 py-3 outline-none resize-none transition-all"
                style={{...inputStyle, lineHeight:'1.6'}} />
            </div>
            <div className="rounded-2xl p-5 space-y-3" style={cardStyle}>
              <h2 className="text-sm font-semibold" style={{color:'var(--text)'}}>Behaviour</h2>
              {[
                [sendOnEnter,    setSendOnEnter,    'Send on Enter',         'Shift+Enter for new line'],
                [showThinking,   setShowThinking,   'Show thinking steps',   'Show <think> blocks from reasoning models'],
                [showTimestamps, setShowTimestamps, 'Show timestamps',       'Show time on each message'],
                [autoTitle,      setAutoTitle,      'Auto-title chats',      'Generate title from first message'],
              ].map(([val, setter, label, desc]: any) => (
                <div key={label} className="flex items-center justify-between py-2" style={{borderBottom:'1px solid var(--border)'}}>
                  <div><p className="text-sm" style={{color:'var(--text)'}}>{label}</p><p className="text-xs" style={{color:'var(--muted)'}}>{desc}</p></div>
                  <button onClick={() => setter((v:boolean)=>!v)}
                    style={{ background:val?'var(--accent)':'var(--elevated)', border:'1px solid var(--border-med)', width:'40px', height:'22px', position:'relative', borderRadius:'999px' }}>
                    <span className="absolute top-0.5 rounded-full w-4 h-4 transition-all" style={{ background:'white', left:val?'20px':'2px' }} />
                  </button>
                </div>
              ))}
            </div>
            <button onClick={saveChatPrefs}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white text-sm font-semibold transition-all"
              style={{background:'linear-gradient(135deg,#6366f1,#8b5cf6)',boxShadow:'var(--glow-md)'}}>
              {saved?'✓ Saved!':<><Save size={14}/>Save Chat Settings</>}
            </button>
          </div>
        )}

        {/* ── MEMORY ── */}
        {tab==='memory' && (
          <div className="space-y-4 fade-in">
            <div className="rounded-2xl p-5" style={cardStyle}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold" style={{color:'var(--text)'}}>Saved Memories ({memories.length})</h2>
                {memories.length>0&&<button onClick={clearAllMemory} className="text-[10px] hover:underline" style={{color:'#f87171'}}>Clear all</button>}
              </div>
              <div className="flex gap-2 mb-4">
                <input value={newMemory} onChange={e=>setNewMemory(e.target.value)}
                  onKeyDown={e=>e.key==='Enter'&&addMemory()}
                  placeholder="Add a memory..."
                  className="flex-1 text-xs rounded-xl px-3 py-2.5 outline-none transition-all" style={inputStyle} />
                <button onClick={addMemory} className="px-3 py-2.5 rounded-xl transition-all"
                  style={{background:'var(--elevated)',border:'1px solid var(--border-med)',color:'var(--accent-light)'}}><Plus size={13}/></button>
              </div>
              {memories.length===0
                ? <div className="text-center py-8"><Brain size={24} className="mx-auto mb-2" style={{color:'var(--muted)',opacity:0.3}}/><p className="text-xs" style={{color:'var(--muted)'}}>No memories yet.</p></div>
                : <div className="space-y-2">{memories.map(m=>(
                    <div key={m.id} className="flex items-start justify-between gap-3 px-3 py-2.5 rounded-xl group" style={{background:'var(--elevated)',border:'1px solid var(--border)'}}>
                      <p className="text-xs flex-1 leading-relaxed" style={{color:'var(--text-dim)'}}>{m.content}</p>
                      <button onClick={()=>deleteMemory(m.id)} className="opacity-0 group-hover:opacity-100 transition-all" style={{color:'var(--muted)'}}><X size={12}/></button>
                    </div>
                  ))}</div>
              }
            </div>
          </div>
        )}

        {/* ── INTEGRATIONS ── */}
        {tab==='integrations' && (
          <div className="space-y-4 fade-in">

            {/* HA Card */}
            <div className="rounded-2xl overflow-hidden" style={cardStyle}>
              {/* Header strip */}
              <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom:'1px solid var(--border)', background:'var(--elevated)' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background:'linear-gradient(135deg,#f59e0b,#ef4444)' }}>
                  <Home size={15} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold" style={{color:'var(--text)'}}>Home Assistant</p>
                  <p className="text-xs" style={{color:'var(--muted)'}}>Control your smart home through chat</p>
                </div>
                {/* Enabled toggle */}
                <button onClick={() => setHaEnabled(v=>!v)}
                  style={{ background:haEnabled?'var(--accent)':'var(--card)', border:'1px solid var(--border-med)', width:'40px', height:'22px', position:'relative', borderRadius:'999px', flexShrink:0 }}>
                  <span className="absolute top-0.5 rounded-full w-4 h-4 transition-all" style={{ background:'white', left:haEnabled?'20px':'2px' }} />
                </button>
              </div>

              {/* Fields */}
              <div className="px-5 py-4 space-y-4">
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={labelStyle}>
                    Home Assistant URL
                  </label>
                  <input
                    value={haHost}
                    onChange={e => setHaHost(e.target.value)}
                    placeholder="http://homeassistant.local:8123"
                    className="w-full text-sm rounded-xl px-4 py-2.5 outline-none font-mono transition-all"
                    style={inputStyle}
                    disabled={!haEnabled}
                  />
                  <p className="text-[11px] mt-1.5" style={{color:'var(--muted)'}}>The URL your browser can reach Home Assistant on. Use your local IP if needed (e.g. http://192.168.1.100:8123).</p>
                </div>

                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={labelStyle}>
                    Long-Lived Access Token
                  </label>
                  <div className="relative">
                    <input
                      value={haToken}
                      onChange={e => setHaToken(e.target.value)}
                      type={showToken ? 'text' : 'password'}
                      placeholder="eyJ0eXAiOi..."
                      className="w-full text-sm rounded-xl px-4 py-2.5 pr-10 outline-none font-mono transition-all"
                      style={inputStyle}
                      disabled={!haEnabled}
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken(v=>!v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{color:'var(--muted)'}}>
                      {showToken ? <EyeOff size={14}/> : <Eye size={14}/>}
                    </button>
                  </div>
                  <p className="text-[11px] mt-1.5" style={{color:'var(--muted)'}}>
                    Generate at: <span className="font-mono" style={{color:'var(--accent-light)'}}>HA → Profile → Security → Long-Lived Access Tokens</span>
                  </p>
                </div>

                {/* Test connection result */}
                {haTestResult === 'ok' && (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm" style={{background:'rgba(52,211,153,0.08)',border:'1px solid rgba(52,211,153,0.2)',color:'#34d399'}}>
                    <CheckCircle2 size={14}/> Connection successful! Home Assistant is reachable.
                  </div>
                )}
                {haTestResult === 'fail' && (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm" style={{background:'rgba(248,113,113,0.08)',border:'1px solid rgba(248,113,113,0.2)',color:'#f87171'}}>
                    <WifiOff size={14}/> Could not reach Home Assistant. Check the URL and token.
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-2 pt-1">
                  <button onClick={testHA} disabled={haTesting || !haHost || !haEnabled}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                    style={{background:'var(--elevated)',border:'1px solid var(--border-med)',color:'var(--text)'}}>
                    {haTesting ? <Loader2 size={13} className="animate-spin"/> : haTestResult==='ok' ? <Wifi size={13}/> : <WifiOff size={13}/>}
                    {haTesting ? 'Testing…' : 'Test Connection'}
                  </button>
                  <button onClick={saveHA} disabled={haSaving || !haEnabled}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-50"
                    style={{background:'linear-gradient(135deg,#6366f1,#8b5cf6)',boxShadow:'var(--glow-sm)'}}>
                    {haSaving ? <Loader2 size={13} className="animate-spin"/> : haSaved ? <CheckCircle2 size={13}/> : <Save size={13}/>}
                    {haSaved ? 'Saved!' : 'Save'}
                  </button>
                </div>
              </div>

              {/* Usage hints */}
              <div className="px-5 pb-5">
                <div className="rounded-xl p-4" style={{background:'var(--elevated)',border:'1px solid var(--border)'}}>
                  <p className="text-xs font-semibold mb-2" style={{color:'var(--text)'}}>💬 Try saying…</p>
                  <div className="space-y-1">
                    {[
                      'Turn on the living room light',
                      'What\'s the temperature in the bedroom?',
                      'Turn off all the lights',
                      'Set the thermostat to 21 degrees',
                      'List all my lights',
                      'Dim the kitchen light to 40%',
                    ].map(hint => (
                      <p key={hint} className="text-xs font-mono" style={{color:'var(--muted-light)'}}>&quot;{hint}&quot;</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ── STATS ── */}
        {tab==='stats' && userData && (
          <div className="grid grid-cols-2 gap-3 fade-in">
            {[
              {label:'Conversations', value:userData.convoCount??0, color:'var(--accent-light)'},
              {label:'Messages Sent', value:userData.msgCount??0,   color:'#a78bfa'},
              {label:'Saved Memories',value:userData.memCount??0,   color:'#34d399'},
              {label:'Member Since',  value:userData.createdAt?new Date(userData.createdAt).toLocaleDateString('en-GB',{month:'short',year:'numeric'}):'-', color:'#fbbf24'},
            ].map((s,i)=>(
              <div key={i} className="rounded-2xl p-5" style={cardStyle}>
                <p className="text-2xl font-bold mb-1" style={{color:s.color}}>{s.value}</p>
                <p className="text-xs" style={{color:'var(--muted)'}}>{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── DANGER ── */}
        {tab==='danger' && (
          <div className="rounded-2xl p-5 space-y-4 fade-in" style={{background:'rgba(239,68,68,0.04)',border:'1px solid rgba(239,68,68,0.15)'}}>
            <div className="flex items-center gap-2"><AlertTriangle size={15} style={{color:'#f87171'}}/><h2 className="text-sm font-semibold" style={{color:'#fca5a5'}}>Danger Zone</h2></div>
            {[
              {label:'Delete all conversations', desc:'Permanently removes all chat history', action:async()=>{ if(!confirm('Delete all conversations?'))return; await fetch('/api/conversations',{method:'DELETE'}).catch(()=>{}); }},
              {label:'Clear all memories',       desc:'Wipe everything the AI knows about you', action:clearAllMemory},
              {label:'Delete account',           desc:'Permanently deletes your account and all data', action:async()=>{ if(!confirm('Permanently delete account? This CANNOT be undone.'))return; await fetch('/api/user',{method:'DELETE'}); signOut({callbackUrl:'/auth'}); }},
            ].map((item,i)=>(
              <div key={i} className="flex items-center justify-between py-3" style={{borderBottom:i<2?'1px solid rgba(239,68,68,0.1)':'none'}}>
                <div><p className="text-sm" style={{color:'var(--text)'}}>{item.label}</p><p className="text-xs" style={{color:'var(--muted)'}}>{item.desc}</p></div>
                <button onClick={item.action} className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                  style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.25)',color:'#f87171'}}>Delete</button>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
