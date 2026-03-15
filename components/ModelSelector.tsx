'use client';

import { ChevronDown } from 'lucide-react';

interface Props {
  models: string[];
  selected: string;
  onChange: (m: string) => void;
}

export default function ModelSelector({ models, selected, onChange }: Props) {
  if (models.length === 0) return <span className="text-muted text-sm">No models found — is Ollama running?</span>;
  return (
    <div className="relative">
      <select
        value={selected}
        onChange={e => onChange(e.target.value)}
        className="appearance-none bg-input border border-border text-white text-sm rounded-lg px-3 py-2 pr-8 outline-none cursor-pointer hover:border-accent transition"
      >
        {models.map(m => <option key={m} value={m}>{m}</option>)}
      </select>
      <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
    </div>
  );
}
