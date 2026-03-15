// Parses natural language messages and extracts Home Assistant intents.
// This runs BEFORE the Ollama call so HA actions are instant.

export type HAIntent =
  | { type: 'turn_on';  entity_id: string; domain: string }
  | { type: 'turn_off'; entity_id: string; domain: string }
  | { type: 'toggle';   entity_id: string; domain: string }
  | { type: 'set_brightness'; entity_id: string; brightness: number }
  | { type: 'set_temperature'; entity_id: string; temperature: number }
  | { type: 'get_state'; entity_id: string }
  | { type: 'list_devices'; domain?: string }
  | null;

// Simple keyword-based pattern matching — no LLM needed for common phrases
export function parseHAIntent(message: string, knownEntities: string[]): HAIntent {
  const m = message.toLowerCase().trim();

  // Helpers
  const findEntity = (text: string): string | null => {
    // Try to match against known entity friendly names / ids
    for (const eid of knownEntities) {
      const friendly = eid.replace(/_/g, ' ').replace(/^[a-z]+\./, '');
      if (text.includes(friendly) || text.includes(eid)) return eid;
    }
    // Fuzzy: pick longest matching word sequence
    for (const eid of knownEntities) {
      const parts = eid.split('.')[1]?.split('_') || [];
      if (parts.length >= 2 && parts.every(p => text.includes(p))) return eid;
    }
    return null;
  };

  const domainFromEntity = (eid: string) => eid.split('.')[0];

  // list devices
  if (/list (all )?(devices|lights|switches|sensors|entities)/i.test(m)) {
    const domainMatch = m.match(/list (?:all )?(?:the )?(light|switch|sensor|climate|media_player)/);
    return { type: 'list_devices', domain: domainMatch?.[1] };
  }

  // turn on
  const turnOnMatch = m.match(/turn on(?: the)?(.+)|switch on(?: the)?(.+)|enable(?: the)?(.+)|put on(?: the)?(.+)/);
  if (turnOnMatch) {
    const fragment = (turnOnMatch[1] || turnOnMatch[2] || turnOnMatch[3] || turnOnMatch[4] || '').trim();
    const eid = findEntity(fragment);
    if (eid) return { type: 'turn_on', entity_id: eid, domain: domainFromEntity(eid) };
  }

  // turn off
  const turnOffMatch = m.match(/turn off(?: the)?(.+)|switch off(?: the)?(.+)|disable(?: the)?(.+)/);
  if (turnOffMatch) {
    const fragment = (turnOffMatch[1] || turnOffMatch[2] || turnOffMatch[3] || '').trim();
    const eid = findEntity(fragment);
    if (eid) return { type: 'turn_off', entity_id: eid, domain: domainFromEntity(eid) };
  }

  // toggle
  const toggleMatch = m.match(/toggle(?: the)?(.+)/);
  if (toggleMatch) {
    const fragment = toggleMatch[1].trim();
    const eid = findEntity(fragment);
    if (eid) return { type: 'toggle', entity_id: eid, domain: domainFromEntity(eid) };
  }

  // set brightness
  const brightMatch = m.match(/set(?: the)? (.+?) (?:brightness|dim)(?: to)? (\d+)/);
  if (brightMatch) {
    const eid = findEntity(brightMatch[1]);
    if (eid) return { type: 'set_brightness', entity_id: eid, brightness: Math.round(parseInt(brightMatch[2]) / 100 * 255) };
  }

  // set temperature
  const tempSetMatch = m.match(/set(?: the)? (.+?) (?:temperature|temp)(?: to)? (\d+(?:\.\d+)?)/);
  if (tempSetMatch) {
    const eid = findEntity(tempSetMatch[1]);
    if (eid) return { type: 'set_temperature', entity_id: eid, temperature: parseFloat(tempSetMatch[2]) };
  }

  // query state — temperature / humidity / state questions
  const queryMatch = m.match(
    /(?:what(?:'s| is)(?: the)?|whats(?: the)?|check(?: the)?|get(?: the)?|show(?: me)?(?: the)?) (.+?)(?:\?|$)/
  );
  if (queryMatch) {
    const fragment = queryMatch[1].trim();
    const eid = findEntity(fragment);
    if (eid) return { type: 'get_state', entity_id: eid };
    // temperature/humidity without a specific entity name
    if (/temper|humidity|sensor/.test(fragment)) return { type: 'list_devices', domain: 'sensor' };
  }

  return null;
}

// Formats an HA entity state into a human-readable sentence
export function formatEntityState(entity: {
  entity_id: string;
  state: string;
  attributes: Record<string, any>;
}): string {
  const name = entity.attributes.friendly_name || entity.entity_id.replace(/_/g, ' ').replace(/^[a-z]+\./, '');
  const domain = entity.entity_id.split('.')[0];
  const s = entity.state;

  if (domain === 'sensor') {
    const unit = entity.attributes.unit_of_measurement || '';
    return `**${name}** is **${s}${unit}**`;
  }
  if (domain === 'light') {
    const brightness = entity.attributes.brightness
      ? ` (brightness ${Math.round(entity.attributes.brightness / 255 * 100)}%)`
      : '';
    return `**${name}** is **${s}**${brightness}`;
  }
  if (domain === 'climate') {
    const current = entity.attributes.current_temperature;
    const target  = entity.attributes.temperature;
    return `**${name}** — current ${current}°, target ${target}°, mode: ${s}`;
  }
  return `**${name}** is **${s}**`;
}
