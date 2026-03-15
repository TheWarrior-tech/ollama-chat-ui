'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, Volume2, X, Cpu } from 'lucide-react';

interface Props {
  selectedModel: string;
  onClose: () => void;
}

type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking';

// Strip everything that would be read out literally by the speech synth
function cleanForSpeech(text: string): string {
  return text
    // Remove markdown headers
    .replace(/#{1,6}\s+/g, '')
    // Remove bold/italic markers
    .replace(/\*{1,3}(.*?)\*{1,3}/g, '$1')
    .replace(/_{1,2}(.*?)_{1,2}/g, '$1')
    // Remove inline code and code blocks
    .replace(/```[\s\S]*?```/g, 'code block omitted')
    .replace(/`([^`]+)`/g, '$1')
    // Remove all emoji characters (unicode ranges)
    .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')
    .replace(/[\u{2600}-\u{27BF}]/gu, '')
    .replace(/[\u{FE00}-\u{FE0F}]/gu, '')
    .replace(/[\u{1F900}-\u{1F9FF}]/gu, '')
    .replace(/[\u{1FA00}-\u{1FA9F}]/gu, '')
    // Remove bullet points and dashes used as list markers
    .replace(/^\s*[-*•]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    // Remove URLs
    .replace(/https?:\/\/\S+/g, '')
    // Remove citation markers like [1] [2]
    .replace(/\[\d+\]/g, '')
    // Remove parenthetical asides that look robotic
    .replace(/\([^)]{0,30}\)/g, '')
    // Collapse multiple newlines into a pause
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, ' ')
    // Collapse multiple spaces
    .replace(/\s{2,}/g, ' ')
    // Remove trailing/leading whitespace
    .trim();
}

const SYSTEM_PROMPT = `You are a voice assistant having a natural spoken conversation. Respond exactly as a knowledgeable human friend would speak out loud — not as a text chatbot.

Rules you must follow without exception:
- Write only plain spoken English sentences. No markdown whatsoever.
- Never use bullet points, numbered lists, headers, or dashes.
- Never use asterisks, underscores, backticks, or any formatting symbols.
- Never use emojis or any special characters.
- Keep answers to two or three sentences maximum. Be concise and direct.
- Do not start with phrases like "Certainly!", "Great question!", "Of course!" or "Sure!". Just answer naturally.
- Do not refer to yourself as an AI or language model. Speak in first person as a knowledgeable person.
- Use contractions naturally: it's, you're, I've, that's, don't, can't.
- If you don't know something, say so simply and directly.`;

export default function VoiceMode({ selectedModel, onClose }: Props) {
  const [state, setState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [lastResponse, setLastResponse] = useState('');
  const [history, setHistory] = useState<{ role: string; content: string }[]>([]);
  const recognitionRef = useRef<any>(null);
  const abortRef = useRef<AbortController | null>(null);
  const startListeningRef = useRef<() => void>(() => {});

  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const cleaned = cleanForSpeech(text);
    if (!cleaned) { startListeningRef.current(); return; }

    const utter = new SpeechSynthesisUtterance(cleaned);
    // Slightly slower than default — more natural, less robotic
    utter.rate = 0.95;
    utter.pitch = 1.0;
    utter.volume = 1;

    const setVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      // Preference order: natural-sounding voices first
      const preferred = voices.find(v =>
        v.name === 'Google UK English Female' ||
        v.name === 'Samantha' ||
        v.name === 'Karen' ||
        v.name === 'Moira' ||
        v.name === 'Tessa' ||
        v.name === 'Google US English' ||
        (v.lang.startsWith('en') && !v.name.includes('Male'))
      );
      if (preferred) utter.voice = preferred;
    };

    if (window.speechSynthesis.getVoices().length > 0) {
      setVoice();
    } else {
      window.speechSynthesis.onvoiceschanged = () => { setVoice(); window.speechSynthesis.onvoiceschanged = null; };
    }

    utter.onstart = () => setState('speaking');
    utter.onend = () => {
      setState('listening');
      // Small pause before listening again so the mic doesn't pick up the tail
      setTimeout(() => startListeningRef.current(), 400);
    };
    utter.onerror = () => {
      setState('listening');
      setTimeout(() => startListeningRef.current(), 400);
    };

    window.speechSynthesis.speak(utter);
  }, []);

  const sendToModel = useCallback(async (text: string) => {
    setState('thinking');
    abortRef.current = new AbortController();

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history,
      { role: 'user', content: text },
    ];

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        const chunk = leftover + decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        leftover = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const j = JSON.parse(line);
            // Skip thinking tokens entirely for voice
            if (j.content) full += j.content;
          } catch {}
        }
      }

      // Strip any <think>...</think> blocks before speaking
      const withoutThinking = full.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
      setLastResponse(withoutThinking);
      setHistory(h => [...h, { role: 'user', content: text }, { role: 'assistant', content: withoutThinking }]);
      speak(withoutThinking);
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        setState('listening');
        setTimeout(() => startListeningRef.current(), 400);
      }
    }
  }, [history, selectedModel, speak]);

  const startListening = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    recognitionRef.current?.stop();
    const r = new SR();
    recognitionRef.current = r;
    r.continuous = false;
    r.interimResults = true;
    r.lang = 'en-GB';

    r.onresult = (e: any) => {
      let final = '', interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      if (interim) setTranscript(interim);
      if (final) { setTranscript(final); sendToModel(final); }
    };
    r.onstart = () => setState('listening');
    r.onerror = (e: any) => { if (e.error !== 'no-speech') setState('idle'); };
    r.onend = () => {};
    r.start();
  }, [sendToModel]);

  // Keep the ref up to date so speak() can call latest version
  useEffect(() => { startListeningRef.current = startListening; }, [startListening]);

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

  const stateColor = { idle: '#6366f1', listening: '#22c55e', thinking: '#f59e0b', speaking: '#06b6d4' }[state];
  const stateLabel = { idle: 'Tap to speak', listening: 'Listening', thinking: 'Thinking', speaking: 'Speaking' }[state];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(24px)' }}>
      <div className="relative flex flex-col items-center gap-8 px-10 py-14 rounded-3xl max-w-sm w-full mx-4 scale-in"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)', opacity: 0 }}>

        <button onClick={() => { stop(); onClose(); }}
          className="absolute top-4 right-4 p-2 rounded-xl transition-all"
          style={{ color: 'var(--muted)', background: 'var(--elevated)' }}>
          <X size={14} />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-gradient-accent flex items-center justify-center">
            <Cpu size={14} className="text-white" />
          </div>
          <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>Voice Mode</span>
        </div>

        {/* Orb */}
        <div className="relative flex items-center justify-center">
          {(state === 'listening' || state === 'speaking') && (
            <>
              <div className="absolute w-36 h-36 rounded-full pulse-ring" style={{ background: stateColor, opacity: 0.12 }} />
              <div className="absolute w-28 h-28 rounded-full pulse-ring" style={{ background: stateColor, opacity: 0.08, animationDelay: '0.6s' }} />
            </>
          )}
          <button
            onClick={state === 'idle' ? startListening : stop}
            className="w-20 h-20 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
            style={{
              background: `radial-gradient(circle, ${stateColor}30, ${stateColor}0a)`,
              border: `2px solid ${stateColor}`,
              boxShadow: `0 0 32px ${stateColor}40`,
            }}>
            {state === 'speaking'
              ? <Volume2 size={28} style={{ color: stateColor }} />
              : state === 'thinking'
              ? <div className="flex gap-1">{[0,1,2].map(i => <div key={i} className={`w-1.5 h-1.5 rounded-full dot-${i+1}`} style={{ background: stateColor }} />)}</div>
              : <Mic size={28} style={{ color: stateColor }} />}
          </button>
        </div>

        {/* Waveform while speaking */}
        {state === 'speaking' && (
          <div className="flex gap-1 items-center h-8">
            {Array.from({ length: 14 }).map((_, i) => (
              <div key={i} className="w-[3px] rounded-full"
                style={{
                  background: `linear-gradient(to top, #06b6d4, #6366f1)`,
                  animation: `wave ${0.45 + (i % 3) * 0.15}s ease-in-out ${i * 0.04}s infinite alternate`,
                  minHeight: '3px',
                  height: `${6 + (i % 5) * 5}px`,
                }} />
            ))}
          </div>
        )}

        <div className="text-center space-y-2.5">
          <p className="text-sm font-semibold tracking-wide" style={{ color: stateColor }}>{stateLabel}</p>
          {transcript && (
            <p className="text-xs px-4 py-2.5 rounded-xl leading-relaxed"
              style={{ color: 'var(--text-dim)', background: 'var(--elevated)', fontStyle: 'italic' }}>
              {transcript}
            </p>
          )}
          {lastResponse && state === 'idle' && (
            <p className="text-[11px] leading-relaxed max-w-[240px]" style={{ color: 'var(--muted)' }}>
              {cleanForSpeech(lastResponse).slice(0, 100)}{lastResponse.length > 100 ? '...' : ''}
            </p>
          )}
        </div>

        <p className="text-[10px]" style={{ color: 'var(--muted)', opacity: 0.6 }}>
          {selectedModel} · en-GB · tap orb to {state === 'idle' ? 'start' : 'stop'}
        </p>
      </div>
    </div>
  );
}
