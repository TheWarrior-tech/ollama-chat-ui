'use client';
import { useState } from 'react';
import { ThumbsUp, ThumbsDown, Copy, Check, RefreshCw, Share2, BookmarkPlus } from 'lucide-react';

interface Props {
  content: string;
  onRegenerate?: () => void;
  onSave?: () => void;
}

export default function MessageReactions({ content, onRegenerate, onSave }: Props) {
  const [liked, setLiked] = useState<'up'|'down'|null>(null);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const save = () => {
    onSave?.();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const btn = "p-1.5 rounded-lg transition-all flex items-center gap-1 text-[10px] font-medium";
  const style = { color: 'var(--muted)' };

  return (
    <div className="flex items-center gap-0.5 mt-3 opacity-0 group-hover:opacity-100 transition-all">
      <button onClick={() => setLiked(liked === 'up' ? null : 'up')} className={btn}
        style={{ ...style, color: liked === 'up' ? '#34d399' : 'var(--muted)' }}
        title="Good response">
        <ThumbsUp size={12} />
      </button>
      <button onClick={() => setLiked(liked === 'down' ? null : 'down')} className={btn}
        style={{ ...style, color: liked === 'down' ? '#f87171' : 'var(--muted)' }}
        title="Bad response">
        <ThumbsDown size={12} />
      </button>
      <div className="w-px h-3 mx-1" style={{ background: 'var(--border)' }} />
      <button onClick={copy} className={btn} style={{ color: copied ? '#34d399' : 'var(--muted)' }} title="Copy">
        {copied ? <Check size={12} /> : <Copy size={12} />}
      </button>
      {onRegenerate && (
        <button onClick={onRegenerate} className={btn} style={style} title="Regenerate">
          <RefreshCw size={12} />
        </button>
      )}
      <button onClick={save} className={btn} style={{ color: saved ? '#818cf8' : 'var(--muted)' }} title="Save to memory">
        {saved ? <Check size={12} /> : <BookmarkPlus size={12} />}
      </button>
    </div>
  );
}
