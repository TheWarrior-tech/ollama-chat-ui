'use client';
import { useState, useEffect, useCallback } from 'react';
import { Home, Lightbulb, Thermometer, Wifi, WifiOff, RefreshCw, Loader2, Power, ChevronDown, X, ToggleLeft, ToggleRight, Wind } from 'lucide-react';

interface Entity {
  entity_id: string;
  state: string;
  attributes: Record<string, any>;
  last_changed: string;
}

const DOMAIN_ICONS: Record<string, any> = {
  light: Lightbulb,
  switch: Power,
  climate: Thermometer,
  sensor: Wind,
  media_player: Wind,
};

const DOMAIN_LABELS: Record<string, string> = {
  light: 'Lights',
  switch: 'Switches',
  climate: 'Climate',
  sensor: 'Sensors',
  media_player: 'Media',
};

const VISIBLE_DOMAINS = ['light', 'switch', 'climate', 'sensor', 'media_player'];

function EntityCard({ entity, onToggle }: { entity: Entity; onToggle: (e: Entity) => void }) {
  const domain = entity.entity_id.split('.')[0];
  const name = entity.attributes.friendly_name || entity.entity_id.replace(/_/g, ' ').replace(/^[a-z]+\./, '');
  const isOn = ['on', 'open', 'home', 'playing', 'heat', 'cool', 'auto'].includes(entity.state);
  const unit = entity.attributes.unit_of_measurement || '';
  const Icon = DOMAIN_ICONS[domain] || Home;
  const canToggle = ['light', 'switch'].includes(domain);

  const brightness = entity.attributes.brightness
    ? Math.round(entity.attributes.brightness / 255 * 100) + '%'
    : null;
  const temp = entity.attributes.current_temperature
    ? `${entity.attributes.current_temperature}°`
    : null;
  const sub = temp || (unit ? `${entity.state}${unit}` : null);

  return (
    <div
      className="flex items-center justify-between p-3 rounded-2xl transition-all"
      style={{
        background: isOn ? 'rgba(99,102,241,0.08)' : 'var(--elevated)',
        border: `1px solid ${isOn ? 'rgba(99,102,241,0.2)' : 'var(--border)'}`,
      }}
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: isOn ? 'var(--gradient-accent)' : 'var(--card)', boxShadow: isOn ? 'var(--glow-xs)' : 'none' }}>
          <Icon size={15} style={{ color: isOn ? 'white' : 'var(--muted-light)' }} />
        </div>
        <div>
          <p className="text-[13px] font-semibold truncate max-w-[140px]" style={{ color: 'var(--text)' }}>{name}</p>
          <p className="text-[11px]" style={{ color: 'var(--muted-light)' }}>
            {sub || (isOn ? 'On' : entity.state.charAt(0).toUpperCase() + entity.state.slice(1))}
            {brightness && <span className="ml-1 opacity-60">{brightness}</span>}
          </p>
        </div>
      </div>
      {canToggle && (
        <button onClick={() => onToggle(entity)} className="flex-shrink-0 transition-all"
          style={{ color: isOn ? 'var(--accent-light)' : 'var(--muted)' }}>
          {isOn ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
        </button>
      )}
    </div>
  );
}

export default function HAPanel({ onClose }: { onClose: () => void }) {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDomain, setActiveDomain] = useState('light');
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/ha');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setEntities(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, []);

  const handleToggle = async (entity: Entity) => {
    const domain = entity.entity_id.split('.')[0];
    const service = ['on', 'playing'].includes(entity.state) ? 'turn_off' : 'turn_on';
    try {
      await fetch('/api/ha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain, service, data: { entity_id: entity.entity_id } }),
      });
      setActionMsg(`${service === 'turn_on' ? '✅ Turned on' : '⭕ Turned off'} ${entity.attributes.friendly_name || entity.entity_id}`);
      setTimeout(() => { setActionMsg(null); load(); }, 1500);
    } catch (e: any) {
      setActionMsg(`❌ Error: ${e.message}`);
      setTimeout(() => setActionMsg(null), 3000);
    }
  };

  const visible = entities.filter(e => VISIBLE_DOMAINS.some(d => e.entity_id.startsWith(d + '.')));
  const domains = VISIBLE_DOMAINS.filter(d => visible.some(e => e.entity_id.startsWith(d + '.')));
  const filtered = visible.filter(e => e.entity_id.startsWith(activeDomain + '.'));

  return (
    <div className="fixed inset-0 z-40 flex flex-col" style={{ background: 'var(--bg)' }}>
      <div className="ambient-bg" />

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 flex-shrink-0 relative z-10 glass"
        style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl flex items-center justify-center"
            style={{ background: 'var(--gradient-accent)', boxShadow: 'var(--glow-sm)' }}>
            <Home size={16} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-base" style={{ color: 'var(--text)', letterSpacing: '-0.02em' }}>Home Assistant</p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>Smart home control · {entities.length} devices</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {error
            ? <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--rose)' }}><WifiOff size={12} />Disconnected</span>
            : <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--emerald)' }}><Wifi size={12} />Connected</span>
          }
          <button onClick={load} disabled={loading} className="header-pill">
            {loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
          </button>
          <button onClick={onClose} className="header-pill"><X size={12} />Close</button>
        </div>
      </div>

      {/* Domain tabs */}
      <div className="flex gap-2 px-6 py-3 overflow-x-auto scrollbar-hide flex-shrink-0 relative z-10"
        style={{ borderBottom: '1px solid var(--border)' }}>
        {domains.map(d => {
          const Icon = DOMAIN_ICONS[d] || Home;
          const count = visible.filter(e => e.entity_id.startsWith(d + '.')).length;
          return (
            <button key={d} onClick={() => setActiveDomain(d)}
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all"
              style={{
                background: activeDomain === d ? 'var(--gradient-accent)' : 'var(--elevated)',
                border: '1px solid ' + (activeDomain === d ? 'transparent' : 'var(--border-med)'),
                color: activeDomain === d ? 'white' : 'var(--text-dim)',
                boxShadow: activeDomain === d ? 'var(--glow-sm)' : 'none',
              }}>
              <Icon size={13} />{DOMAIN_LABELS[d]}
              <span className="text-[11px] opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 relative z-10">
        {actionMsg && (
          <div className="mb-4 px-4 py-3 rounded-2xl text-sm font-medium msg-animate"
            style={{ background: 'var(--elevated)', border: '1px solid var(--border-med)', color: 'var(--text)' }}>
            {actionMsg}
          </div>
        )}
        {error ? (
          <div className="flex flex-col items-center justify-center min-h-[55vh] text-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}>
              <WifiOff size={24} style={{ color: 'var(--rose)' }} />
            </div>
            <p className="font-semibold" style={{ color: 'var(--text)' }}>Can't reach Home Assistant</p>
            <p className="text-sm max-w-sm leading-relaxed" style={{ color: 'var(--muted-light)' }}>{error}<br /><br />Add <code className="text-xs" style={{ background: 'var(--elevated)', padding: '2px 6px', borderRadius: '5px' }}>HA_HOST</code> and <code className="text-xs" style={{ background: 'var(--elevated)', padding: '2px 6px', borderRadius: '5px' }}>HA_TOKEN</code> to your <code>.env</code> file.</p>
            <button onClick={load} className="btn-primary flex items-center gap-2"><RefreshCw size={13} />Retry</button>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 rounded-2xl shimmer" style={{ border: '1px solid var(--border)' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
            <Home size={36} style={{ color: 'var(--muted)', opacity: 0.25 }} />
            <p className="text-sm" style={{ color: 'var(--muted-light)' }}>No {DOMAIN_LABELS[activeDomain]?.toLowerCase()} found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map(e => <EntityCard key={e.entity_id} entity={e} onToggle={handleToggle} />)}
          </div>
        )}
      </div>
    </div>
  );
}
