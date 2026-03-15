'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Volume2, X, Cpu } from 'lucide-react';

interface Props {
  selectedModel: string;
  onClose: () => void;
  onTranscript?: (text: string) => void;
}

type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking';

export default function VoiceMode({ selectedModel, onClose, onTranscript }: Props) {
  const [state, setState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [history, setHistory] = useState<{role:string;content:string}[]>([]);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1.05;
    utter.pitch = 1;
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.name.includes('Samantha') || v.name.includes('Google UK English Female') || v.name.includes('Karen') || v.name.includes('Moira'));
    if (preferred) utter.voice = preferred;
    utter.onstart = () => setState('speaking');
    utter.onend = () => { setState('listening'); startListening(); };
    synthRef.current = utter;
    window.speechSynthesis.speak(utter);
  }, []);

  const sendToModel = useCallback(async (text: string) => {
    setState('thinking');
    abortRef.current = new AbortController();
    const messages = [
      { role:'system', content:'You are a helpful voice assistant. Give SHORT, conversational answers — 1-3 sentences max. No markdown, no lists, no bullet points. Just natural spoken sentences.' },
      ...history,
      { role:'user', content: text },
    ];
    try {
      const res = await fetch('/api/chat', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ model: selectedModel, messages }),
        signal: abortRef.current.signal,
      });
      if (!res.body) return;
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = '', leftover = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = leftover + decoder.decode(value, { stream:true });
        const lines = chunk.split('\n');
        leftover = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.trim()) continue;
          try { const j = JSON.parse(line); if (j.content) full += j.content; } catch {}
        }
      }
      setResponse(full);
      setHistory(h => [...h, { role:'user', content:text }, { role:'assistant', content:full }]);
      speak(full);
    } catch (e: any) {
      if (e?.name !== 'AbortError') { setState('listening'); startListening(); }
    }
  }, [history, selectedModel, speak]);

  const startListening = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR();
    recognitionRef.current = r;
    r.continuous = false;
    r.interimResults = true;
    r.lang = 'en-GB';
    let interim = '';
    r.onresult = (e: any) => {
      let final = '';
      interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      if (interim) setTranscript(interim);
      if (final) { setTranscript(final); sendToModel(final); }
    };
    r.onstart = () => setState('listening');
    r.onerror = () => setState('idle');
    r.onend = () => { if (state === 'listening') setState('idle'); };
    r.start();
  }, [sendToModel, state]);

  useEffect(() => {
    startListening();
    return () => {
      recognitionRef.current?.stop();
      window.speechSynthesis?.cancel();
      abortRef.current?.abort();
    };
  }, []);

  const stop = () => {
    recognitionRef.current?.stop();
    window.speechSynthesis?.cancel();
    abortRef.current?.abort();
    setState('idle');
  };

  const stateColor = { idle:'#6366f1', listening:'#22c55e', thinking:'#f59e0b', speaking:'#06b6d4' }[state];
  const stateLabel = { idle:'Tap to speak', listening:'Listening...', thinking:'Thinking...', speaking:'Speaking...' }[state];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background:'rgba(0,0,0,0.85)', backdropFilter:'blur(20px)' }}>
      <div className="relative flex flex-col items-center gap-8 px-8 py-12 rounded-3xl max-w-sm w-full mx-4 scale-in"
        style={{ background:'var(--surface)', border:'1px solid var(--border)', boxShadow:'var(--shadow)', opacity:0 }}>
        <button onClick={() => { stop(); onClose(); }}
          className="absolute top-4 right-4 p-2 rounded-xl transition-all"
          style={{ color:'var(--muted)', background:'var(--elevated)' }}>
          <X size={14} />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-gradient-accent flex items-center justify-center">
            <Cpu size={14} className="text-white" />
          </div>
          <span className="font-bold" style={{ color:'var(--text)' }}>Voice Mode</span>
        </div>

        {/* Animated orb */}
        <div className="relative flex items-center justify-center">
          {(state === 'listening' || state === 'speaking') && (
            <>
              <div className="absolute w-32 h-32 rounded-full pulse-ring" style={{ background: stateColor, opacity:0.15 }} />
              <div className="absolute w-24 h-24 rounded-full pulse-ring" style={{ background: stateColor, opacity:0.1, animationDelay:'0.5s' }} />
            </>
          )}
          <button
            onClick={state === 'idle' ? startListening : stop}
            className="w-20 h-20 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
            style={{ background:`radial-gradient(circle, ${stateColor}33, ${stateColor}11)`, border:`2px solid ${stateColor}`, boxShadow:`0 0 30px ${stateColor}44` }}>
            {state === 'speaking' ? <Volume2 size={28} style={{ color: stateColor }} /> :
             state === 'thinking' ? <div className="flex gap-1">{[0,1,2].map(i => <div key={i} className={`w-1.5 h-1.5 rounded-full dot-${i+1}`} style={{ background: stateColor }} />)}</div> :
             state === 'listening' ? <Mic size={28} style={{ color: stateColor }} /> :
             <Mic size={28} style={{ color: stateColor }} />}
          </button>
        </div>

        {/* Wave bars when speaking */}
        {state === 'speaking' && (
          <div className="flex gap-1 items-end h-8">
            {Array.from({length:12}).map((_,i) => (
              <div key={i} className="w-1 rounded-full" style={{
                background: `linear-gradient(to top, #06b6d4, #6366f1)`,
                animation: `wave ${0.5 + Math.random()*0.5}s ease-in-out ${i*0.05}s infinite alternate`,
                minHeight: '4px', maxHeight: '28px', height: `${8 + Math.random()*20}px`,
              }} />
            ))}
          </div>
        )}

        <div className="text-center space-y-2">
          <p className="text-sm font-semibold" style={{ color: stateColor }}>{stateLabel}</p>
          {transcript && <p className="text-xs px-4 py-2 rounded-xl" style={{ color:'var(--text-dim)', background:'var(--elevated)' }}>"{ transcript }"</p>}
          {response && state !== 'speaking' && <p className="text-xs" style={{ color:'var(--muted)' }}>Last: {response.slice(0,80)}{response.length > 80 ? '…' : ''}</p>}
        </div>

        <p className="text-[10px]" style={{ color:'var(--muted)' }}>Using {selectedModel} · en-GB voice</p>
      </div>
    </div>
  );
}
