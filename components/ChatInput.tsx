'use client';
import { useState, useRef, KeyboardEvent, useEffect } from 'react';
import { ArrowUp, Square, Globe, Paperclip, Mic, MicOff, X, FileText, Image as ImageIcon } from 'lucide-react';

interface Attachment {
  name: string;
  type: string;
  content: string; // base64 for images, plain text for docs
  preview?: string;
}

export default function ChatInput({ onSend, isStreaming, onStop, webSearch, onToggleWeb }: {
  onSend: (content: string, attachments?: Attachment[]) => void;
  isStreaming: boolean;
  onStop: () => void;
  webSearch: boolean;
  onToggleWeb: () => void;
}) {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [micSupported, setMicSupported] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) setMicSupported(true);
  }, []);

  const send = () => {
    const t = (input + (transcript ? ' ' + transcript : '')).trim();
    if (!t && attachments.length === 0) return;
    if (isStreaming) return;
    onSend(t, attachments.length > 0 ? attachments : undefined);
    setInput('');
    setTranscript('');
    setAttachments([]);
    if (ref.current) ref.current.style.height = 'auto';
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const onInputChange = () => {
    const el = ref.current;
    if (el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 200) + 'px'; }
  };

  // ─── FILE HANDLING ───
  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const newAttachments: Attachment[] = [];
    for (const file of Array.from(files)) {
      if (file.size > 10 * 1024 * 1024) { alert(`${file.name} is too large (max 10MB)`); continue; }
      const isImage = file.type.startsWith('image/');
      const isText = file.type.startsWith('text/') || /\.(md|json|csv|txt|py|js|ts|jsx|tsx|html|css|xml|yaml|yml)$/i.test(file.name);
      if (isImage) {
        const b64 = await readAsBase64(file);
        newAttachments.push({ name: file.name, type: file.type, content: b64, preview: b64 });
      } else if (isText) {
        const text = await readAsText(file);
        newAttachments.push({ name: file.name, type: file.type, content: text });
      } else {
        alert(`${file.name}: Only images and text/code files are supported.`);
      }
    }
    setAttachments(p => [...p, ...newAttachments]);
  };

  const readAsBase64 = (file: File): Promise<string> =>
    new Promise(resolve => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.readAsDataURL(file);
    });

  const readAsText = (file: File): Promise<string> =>
    new Promise(resolve => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.readAsText(file);
    });

  const removeAttachment = (i: number) => setAttachments(p => p.filter((_, idx) => idx !== i));

  // ─── VOICE INPUT ───
  const toggleMic = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-GB';
    let interim = '';
    recognition.onresult = (e: any) => {
      let final = '';
      interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      if (final) setInput(p => (p + ' ' + final).trim());
      setTranscript(interim);
    };
    recognition.onend = () => { setIsListening(false); setTranscript(''); };
    recognition.onerror = () => { setIsListening(false); setTranscript(''); };
    recognition.start();
    setIsListening(true);
  };

  const hasContent = (input + transcript).trim().length > 0 || attachments.length > 0;

  return (
    <div className="px-4 md:px-8 pb-6 pt-2 flex-shrink-0 relative z-10">
      <div className="max-w-2xl mx-auto">
        {/* Pill toolbar */}
        <div className="flex items-center gap-1.5 mb-2 px-1">
          <button
            onClick={onToggleWeb}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border"
            style={{
              background: webSearch ? 'rgba(59,130,246,0.1)' : 'var(--elevated)',
              borderColor: webSearch ? 'rgba(59,130,246,0.3)' : 'var(--border)',
              color: webSearch ? '#93c5fd' : 'var(--muted)',
            }}
          >
            <Globe size={11} />{webSearch ? 'Search On' : 'Search'}
          </button>
        </div>

        {/* Attachment previews */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2 px-1">
            {attachments.map((a, i) => (
              <div key={i} className="relative group flex items-center gap-2 px-3 py-2 rounded-xl text-xs max-w-[200px]"
                style={{ background: 'var(--elevated)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
                {a.preview
                  ? <img src={a.preview} className="w-6 h-6 rounded-md object-cover flex-shrink-0" alt="" />
                  : <FileText size={14} style={{ color: 'var(--accent-light)', flexShrink: 0 }} />
                }
                <span className="truncate max-w-[120px]">{a.name}</span>
                <button onClick={() => removeAttachment(i)}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                  style={{ background: '#ef4444', color: 'white' }}>
                  <X size={9} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input box */}
        <div
          className="relative rounded-2xl transition-all duration-200"
          style={{
            background: 'var(--surface)',
            border: isListening
              ? '1px solid rgba(239,68,68,0.4)'
              : webSearch
              ? '1px solid rgba(59,130,246,0.3)'
              : '1px solid var(--border-med)',
            boxShadow: isListening
              ? '0 0 20px rgba(239,68,68,0.1)'
              : webSearch
              ? '0 0 20px rgba(59,130,246,0.08)'
              : 'var(--shadow)',
          }}
        >
          {/* Listening indicator */}
          {isListening && (
            <div className="flex items-center gap-2 px-5 pt-3">
              <div className="flex gap-0.5 items-end h-4">
                {[0,1,2,3,4].map(j => (
                  <div key={j} className="w-0.5 rounded-full bg-red-400"
                    style={{ height: `${40 + Math.sin(Date.now() / 200 + j) * 60}%`, animation: `bounce-dot ${0.6 + j * 0.1}s ease infinite` }} />
                ))}
              </div>
              <span className="text-xs text-red-400 font-medium">Listening...</span>
              {transcript && <span className="text-xs italic" style={{ color: 'var(--text-dim)' }}>{transcript}</span>}
            </div>
          )}

          <textarea
            ref={ref}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKey}
            onInput={onInputChange}
            onPaste={e => {
              const items = e.clipboardData?.items;
              if (!items) return;
              const imageItem = Array.from(items).find(i => i.type.startsWith('image/'));
              if (imageItem) {
                e.preventDefault();
                const file = imageItem.getAsFile();
                if (file) handleFiles(Object.assign([file], { length: 1, item: () => file }) as any);
              }
            }}
            placeholder={isListening ? '' : webSearch ? 'Search the web and ask anything...' : 'Ask NeuralChat anything...'}
            rows={1}
            disabled={isStreaming}
            className="w-full bg-transparent text-sm placeholder-[color:var(--muted)] resize-none outline-none px-5 pt-4 pb-14 max-h-[200px] scrollbar-hide leading-relaxed disabled:opacity-50"
            style={{ color: 'var(--text)' }}
          />

          {/* Hidden file input */}
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/*,.txt,.md,.json,.csv,.py,.js,.ts,.jsx,.tsx,.html,.css,.xml,.yaml,.yml"
            className="hidden"
            onChange={e => handleFiles(e.target.files)}
          />

          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 pb-3.5">
            <div className="flex items-center gap-1">
              <button
                onClick={() => fileRef.current?.click()}
                className="p-1.5 rounded-lg transition-all hover:opacity-80"
                style={{ color: attachments.length > 0 ? 'var(--accent-light)' : 'var(--muted)' }}
                title="Attach image or text file"
              >
                <Paperclip size={14} />
              </button>
              {micSupported && (
                <button
                  onClick={toggleMic}
                  className="p-1.5 rounded-lg transition-all"
                  style={{ color: isListening ? '#f87171' : 'var(--muted)' }}
                  title={isListening ? 'Stop listening' : 'Voice input'}
                >
                  {isListening ? <MicOff size={14} /> : <Mic size={14} />}
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isStreaming ? (
                <button onClick={onStop}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all"
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}>
                  <Square size={10} fill="currentColor" /> Stop
                </button>
              ) : (
                <button onClick={send} disabled={!hasContent}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                    hasContent ? 'bg-gradient-accent text-white hover:scale-105 active:scale-95' : 'cursor-not-allowed opacity-40'
                  }`}
                  style={{
                    boxShadow: hasContent ? 'var(--glow-md)' : 'none',
                    background: hasContent ? undefined : 'var(--elevated)',
                    border: hasContent ? 'none' : '1px solid var(--border)',
                    color: hasContent ? 'white' : 'var(--muted)',
                  }}
                >
                  <ArrowUp size={15} />
                </button>
              )}
            </div>
          </div>
        </div>
        <p className="text-center text-[10px] mt-2.5 tracking-wide" style={{ color: 'var(--muted)', opacity: 0.5 }}>
          NeuralChat · Private & local · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
