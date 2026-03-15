'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import ChatWindow from '@/components/ChatWindow';
import ChatInput from '@/components/ChatInput';
import WelcomeScreen from '@/components/WelcomeScreen';
import ShareToast, { useShareToast } from '@/components/ShareToast';
import VoiceMode from '@/components/VoiceMode';
import DiscoverPanel from '@/components/DiscoverPanel';
import SearchChats from '@/components/SearchChats';
import ExportMenu from '@/components/ExportMenu';
import ModelCompare from '@/components/ModelCompare';
import FocusMode from '@/components/FocusMode';
import { Message, Conversation } from '@/types';
import { slugify } from '@/lib/slug';
import { Mic, Compass, Search, Download, GitCompare, Maximize2, X } from 'lucide-react';

interface Attachment { name:string; type:string; content:string; preview?:string; }

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [models, setModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [discoverOpen, setDiscoverOpen] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [webSearch, setWebSearch] = useState(false);
  const [compactMode, setCompactMode] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const activeConvoRef = useRef<Conversation | null>(null);
  const shareToast = useShareToast();

  const getSystemPrompt = () => typeof window !== 'undefined' ? localStorage.getItem('nc-system-prompt') || '' : '';
  const getCompact = () => typeof window !== 'undefined' ? localStorage.getItem('nc-compact') === 'true' : false;

  const activeConvo = conversations.find(c => c.id === activeId) ?? null;
  activeConvoRef.current = activeConvo;

  useEffect(() => { if (status === 'unauthenticated') router.push('/auth'); }, [status]);
  useEffect(() => { setCompactMode(getCompact()); }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey||e.ctrlKey) && e.key==='k') { e.preventDefault(); setSearchOpen(o=>!o); }
      if ((e.metaKey||e.ctrlKey) && e.key==='n') { e.preventDefault(); newChat(); }
      if ((e.metaKey||e.ctrlKey) && e.key==='\\') { e.preventDefault(); setSidebarOpen(o=>!o); }
      if (e.key==='F11') { e.preventDefault(); setFocusMode(o=>!o); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  useEffect(() => {
    if (status !== 'authenticated') return;
    fetch('/api/models').then(r=>r.json()).then(d => { const l=d.models||[]; setModels(l); if (l.length) setSelectedModel(l[0]); }).catch(()=>{});
    fetch('/api/conversations').then(r=>r.json()).then(data => {
      if (Array.isArray(data)) {
        const convos: Conversation[] = data.map((c:any) => ({ id:c.id, title:c.title, slug:c.slug, model:selectedModel, shared:c.shared, pinned:c.pinned||false, messages:(c.messages||[]).map((m:any)=>({ id:m.id, role:m.role, content:m.content, thinking:m.thinking??undefined, sources:m.sources??undefined, timestamp:new Date(m.createdAt).getTime() })) }));
        setConversations(convos);
        const chatId = searchParams.get('chat');
        if (chatId && convos.find(c=>c.id===chatId)) setActiveId(chatId);
        else if (convos.length) setActiveId(convos[0].id);
      }
    }).catch(()=>{});
  }, [status]);

  const newChat = useCallback(async () => {
    const res = await fetch('/api/conversations', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({title:'New Chat'}) });
    const convo = await res.json();
    const c: Conversation = { id:convo.id, title:convo.title, slug:convo.slug, messages:[], model:selectedModel, shared:false, pinned:false };
    setConversations(p=>[c,...p]); setActiveId(c.id);
    window.history.pushState({}, '', `/${convo.slug||'new-chat'}/${convo.id}`);
  }, [selectedModel]);

  const selectChat = (id: string) => {
    setActiveId(id);
    const c = conversations.find(x=>x.id===id);
    if (c) window.history.pushState({}, '', `/${c.slug||slugify(c.title)}/${c.id}`);
  };

  const handleShare = async (id: string) => {
    const convo = conversations.find(c=>c.id===id);
    await fetch(`/api/conversations/${id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({shared:true}) });
    setConversations(p=>p.map(c=>c.id===id?{...c,shared:true}:c));
    const slug = convo?.slug||slugify(convo?.title||'chat');
    const url = `${window.location.origin}/${slug}/${id}`;
    await navigator.clipboard.writeText(url).catch(()=>{});
    shareToast.show(url);
  };

  const handlePin = async (id: string, pinned: boolean) => {
    await fetch(`/api/conversations/${id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({pinned}) });
    setConversations(p=>p.map(c=>c.id===id?{...c,pinned}:c));
  };

  const handleRegenerate = useCallback(async () => {
    if (!activeId || isStreaming) return;
    const convo = conversations.find(c=>c.id===activeId);
    if (!convo) return;
    const lastUser = [...convo.messages].reverse().find(m=>m.role==='user');
    if (!lastUser) return;
    // Remove last AI message and resend
    setConversations(p=>p.map(c=>c.id===activeId?{...c,messages:c.messages.filter(m=>m!==convo.messages[convo.messages.length-1])}:c));
    setTimeout(() => sendMessage(lastUser.content), 50);
  }, [activeId, isStreaming, conversations]);

  const sendMessage = useCallback(async (content: string, attachments?: Attachment[]) => {
    let targetId = activeId;
    if (!targetId) {
      const res = await fetch('/api/conversations', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({title:content.slice(0,45)||'New Chat'}) });
      const convo = await res.json();
      const c: Conversation = { id:convo.id, title:convo.title, slug:convo.slug, messages:[], model:selectedModel, shared:false, pinned:false };
      setConversations(p=>[c,...p]); setActiveId(convo.id);
      window.history.pushState({}, '', `/${convo.slug||'new-chat'}/${convo.id}`);
      targetId = convo.id;
    }
    if (isStreaming) return;
    const tempUserId = 'tu-'+Date.now(), tempAiId = 'ta-'+Date.now();
    let displayContent = content;
    if (attachments?.length) displayContent = content ? `${content}\n\n${attachments.map(a=>`📎 ${a.name}`).join('  ')}` : attachments.map(a=>`📎 ${a.name}`).join('  ');
    const currentConvo = conversations.find(c=>c.id===targetId)??activeConvoRef.current;
    const userMsg: Message = { id:tempUserId, role:'user', content:displayContent, timestamp:Date.now() };
    const aMsg: Message = { id:tempAiId, role:'assistant', content:'', timestamp:Date.now() };
    const newTitle = currentConvo?.title==='New Chat' ? (content||attachments?.[0]?.name||'Chat').slice(0,45) : currentConvo?.title;
    setConversations(p=>p.map(c=>c.id===targetId?{...c,messages:[...c.messages,userMsg,aMsg],title:newTitle||c.title}:c));
    if (currentConvo?.title==='New Chat'&&newTitle) {
      fetch(`/api/conversations/${targetId}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:newTitle})})
        .then(r=>r.json()).then(u=>{ if(u.slug){window.history.replaceState({},'',`/${u.slug}/${targetId}`);setConversations(p=>p.map(c=>c.id===targetId?{...c,slug:u.slug,title:u.title}:c));} }).catch(()=>{});
    }
    fetch(`/api/conversations/${targetId}/messages`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({role:'user',content:displayContent})}).catch(()=>{});
    setIsStreaming(true); abortRef.current = new AbortController();
    try {
      const memRes = await fetch('/api/memory'); const memData = await memRes.json();
      const memories: string[] = (memData.memories||[]).map((m:any)=>m.content??m);
      let sources: any[] = [];
      if (webSearch) {
        const sRes = await fetch('/api/search',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:content}),signal:abortRef.current.signal});
        const sData = await sRes.json(); sources = sData.results||[];
        if (sources.length) setConversations(p=>p.map(c=>c.id===targetId?{...c,messages:c.messages.map(m=>m.id===tempAiId?{...m,sources}:m)}:c));
      }
      const convoNow = conversations.find(c=>c.id===targetId)??activeConvoRef.current;
      const priorMessages = (convoNow?.messages.filter(m=>m.id!==tempAiId&&m.id!==tempUserId)||[]).map(m=>({role:m.role,content:m.content}));
      const systemParts = ['You are NeuralChat, a helpful and knowledgeable AI assistant.','Always give full, detailed, well-structured answers.'];
      if (memories.length) systemParts.push('','User memories:',...memories.map(m=>`- ${m}`));
      if (sources.length) systemParts.push('','Web results:',...sources.map((s:any,i:number)=>`[${i+1}] ${s.title}\n${s.snippet}\nURL: ${s.url}`));
      let userContent = content;
      if (attachments?.length) { const parts = attachments.map(a=>a.type.startsWith('image/')?`[Image: ${a.name}]`:`--- ${a.name} ---\n${a.content.slice(0,8000)}\n---`); userContent = parts.join('\n\n')+(content?'\n\n'+content:''); }
      const messages = [{role:'system',content:systemParts.join('\n')},...priorMessages,{role:'user',content:userContent||content}];
      const res = await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:selectedModel,messages,systemPrompt:getSystemPrompt()||undefined}),signal:abortRef.current.signal});
      if (!res.ok||!res.body) throw new Error('Chat failed');
      const reader = res.body.getReader(); const decoder = new TextDecoder();
      let fullContent='',fullThinking='',leftover='';
      while (true) {
        const {done,value} = await reader.read(); if (done) break;
        const text = leftover+decoder.decode(value,{stream:true}); const lines = text.split('\n'); leftover=lines.pop()??'';
        for (const line of lines) { if (!line.trim()) continue; try { const json=JSON.parse(line); if(json.thinking)fullThinking+=json.thinking; if(json.content)fullContent+=json.content; setConversations(p=>p.map(c=>c.id===targetId?{...c,messages:c.messages.map(m=>m.id===tempAiId?{...m,content:fullContent,thinking:fullThinking||undefined}:m)}:c)); } catch {} }
      }
      fetch(`/api/conversations/${targetId}/messages`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({role:'assistant',content:fullContent,thinking:fullThinking||undefined,sources:sources.length?sources:undefined})}).catch(()=>{});
      if (content.toLowerCase().match(/my name is|i am |i like |i prefer |i use |i work/)) fetch('/api/memory',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({content:content.slice(0,200)})}).catch(()=>{});
    } catch(e:any) {
      if(e?.name!=='AbortError') setConversations(p=>p.map(c=>c.id===targetId?{...c,messages:c.messages.map(m=>m.id===tempAiId&&m.content===''?{...m,content:'⚠️ Cannot reach Ollama. Run `ollama serve`.'}:m)}:c));
    } finally { setIsStreaming(false); }
  }, [activeId, isStreaming, selectedModel, webSearch, conversations]);

  if (status==='loading') return <div className="min-h-screen flex items-center justify-center" style={{background:'var(--bg)'}}><div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{borderColor:'var(--accent)',borderTopColor:'transparent'}}/></div>;
  if (status==='unauthenticated') return null;

  const showWelcome = !activeConvo||activeConvo.messages.length===0;

  if (focusMode && activeConvo) return <FocusMode messages={activeConvo.messages} isStreaming={isStreaming} title={activeConvo.title} selectedModel={selectedModel} webSearch={webSearch} onSend={sendMessage} onStop={()=>{abortRef.current?.abort();setIsStreaming(false);}} onToggleWeb={()=>setWebSearch(w=>!w)} onClose={()=>setFocusMode(false)} />;
  if (compareOpen) return <ModelCompare models={models} onClose={()=>setCompareOpen(false)} />;

  return (
    <div className="flex h-screen overflow-hidden" style={{background:'var(--bg)',color:'var(--text)'}}>
      <div className="ambient-bg"/>
      <Sidebar open={sidebarOpen} conversations={conversations} activeId={activeId} models={models} selectedModel={selectedModel} userName={(session?.user as any)?.name||session?.user?.email||''} onModelChange={setSelectedModel} onSelect={selectChat} onNew={newChat}
        onDelete={async id=>{ await fetch(`/api/conversations/${id}`,{method:'DELETE'}); setConversations(p=>p.filter(c=>c.id!==id)); if(activeId===id) setActiveId(conversations.find(c=>c.id!==id)?.id??null); }}
        onShare={handleShare} onPin={handlePin} onToggle={()=>setSidebarOpen(o=>!o)} onSignOut={()=>signOut({callbackUrl:'/auth'})}
      />
      <div className="flex flex-col flex-1 min-w-0 h-full relative z-10">
        <header className="flex items-center justify-between px-5 py-3 flex-shrink-0 glass" style={{borderBottom:'1px solid var(--border)'}}>
          <div className="flex items-center gap-3">
            {!sidebarOpen&&<button onClick={()=>setSidebarOpen(true)} className="p-2 rounded-xl" style={{color:'var(--muted)'}}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg></button>}
            <div className="flex items-center gap-2">
              <div className="relative"><div className="w-2 h-2 rounded-full bg-emerald-400"/><div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-60"/></div>
              <span className="text-xs font-medium" style={{color:'var(--text-dim)'}}>{selectedModel||'No model'}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button onClick={()=>setSearchOpen(true)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all" style={{background:'var(--elevated)',border:'1px solid var(--border)',color:'var(--text-dim)'}}>
              <Search size={11}/>Search<kbd className="hidden sm:inline text-[9px] px-1 py-0.5 rounded ml-1" style={{background:'var(--card)',color:'var(--muted)'}}>⌘K</kbd>
            </button>
            {activeConvo&&activeConvo.messages.length>0&&(
              <div className="relative">
                <button onClick={()=>setExportOpen(o=>!o)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all" style={{background:'var(--elevated)',border:'1px solid var(--border)',color:'var(--text-dim)'}}><Download size={11}/>Export</button>
                {exportOpen&&<ExportMenu messages={activeConvo.messages} title={activeConvo.title} onClose={()=>setExportOpen(false)}/>}
              </div>
            )}
            <button onClick={()=>setCompareOpen(true)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all" style={{background:'var(--elevated)',border:'1px solid var(--border)',color:'var(--text-dim)'}}><GitCompare size={11}/>Compare</button>
            <button onClick={()=>setFocusMode(true)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all" style={{background:'var(--elevated)',border:'1px solid var(--border)',color:'var(--text-dim)'}}><Maximize2 size={11}/>Focus</button>
            {activeId&&<button onClick={()=>handleShare(activeId)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all" style={{background:'var(--elevated)',border:'1px solid var(--border)',color:'var(--text-dim)'}}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>Share</button>}
            <button onClick={()=>setVoiceMode(true)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all" style={{background:'var(--elevated)',border:'1px solid var(--border)',color:'var(--text-dim)'}}><Mic size={11}/>Voice</button>
            <button onClick={()=>setDiscoverOpen(o=>!o)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all" style={{background:discoverOpen?'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.1))':'var(--elevated)',border:discoverOpen?'1px solid rgba(99,102,241,0.3)':'1px solid var(--border)',color:discoverOpen?'var(--accent-light)':'var(--text-dim)'}}>
              <Compass size={11}/>{discoverOpen?'Hide':'Discover'}
            </button>
          </div>
        </header>
        <div className="flex flex-1 min-h-0">
          <div className="flex flex-col flex-1 min-w-0">
            {showWelcome ? <WelcomeScreen userName={(session?.user as any)?.name||''} onSuggestion={s=>sendMessage(s)}/>
              : <ChatWindow messages={activeConvo?.messages??[]} isStreaming={isStreaming} onRegenerate={handleRegenerate} compactMode={compactMode}/>}
            <ChatInput onSend={sendMessage} isStreaming={isStreaming} onStop={()=>{abortRef.current?.abort();setIsStreaming(false);}} webSearch={webSearch} onToggleWeb={()=>setWebSearch(w=>!w)}/>
          </div>
          {discoverOpen&&(
            <div className="w-[340px] flex-shrink-0 h-full overflow-hidden" style={{borderLeft:'1px solid var(--border)'}}>
              <DiscoverPanel onAskAI={(p)=>{sendMessage(p);setDiscoverOpen(false);}} onClose={()=>setDiscoverOpen(false)}/>
            </div>
          )}
        </div>
      </div>
      <ShareToast url={shareToast.url} visible={shareToast.visible} onClose={shareToast.hide}/>
      {voiceMode&&<VoiceMode selectedModel={selectedModel} onClose={()=>setVoiceMode(false)}/>}
      {searchOpen&&<SearchChats conversations={conversations} onSelect={selectChat} onClose={()=>setSearchOpen(false)}/>}
    </div>
  );
}
