// Parses a chat message for HA intent, executes it, returns a spoken reply
import { NextRequest, NextResponse } from 'next/server';
import { parseHAIntent, formatEntityState } from '@/lib/ha-intent';
import { haGetStates, haGetState, haCallService, isConfigured } from '@/lib/homeassistant';

export async function POST(req: NextRequest) {
  if (!isConfigured()) {
    return NextResponse.json({ handled: false });
  }

  const { message } = await req.json();
  if (!message) return NextResponse.json({ handled: false });

  // Get entity list for fuzzy matching
  let allEntities: any[] = [];
  try { allEntities = await haGetStates(); } catch { return NextResponse.json({ handled: false }); }

  const entityIds = allEntities.map((e: any) => e.entity_id);
  const intent = parseHAIntent(message, entityIds);
  if (!intent) return NextResponse.json({ handled: false });

  try {
    switch (intent.type) {
      case 'turn_on': {
        await haCallService({ domain: intent.domain, service: 'turn_on', data: { entity_id: intent.entity_id } });
        const state = await haGetState(intent.entity_id);
        return NextResponse.json({
          handled: true,
          reply: `✅ Done! ${formatEntityState(state)}`,
          action: intent,
        });
      }
      case 'turn_off': {
        await haCallService({ domain: intent.domain, service: 'turn_off', data: { entity_id: intent.entity_id } });
        return NextResponse.json({
          handled: true,
          reply: `✅ Turned off **${intent.entity_id.replace(/_/g, ' ').replace(/^[a-z]+\./, '')}**.`,
          action: intent,
        });
      }
      case 'toggle': {
        await haCallService({ domain: intent.domain, service: 'toggle', data: { entity_id: intent.entity_id } });
        const state = await haGetState(intent.entity_id);
        return NextResponse.json({
          handled: true,
          reply: `🔄 Toggled! ${formatEntityState(state)}`,
          action: intent,
        });
      }
      case 'set_brightness': {
        await haCallService({ domain: 'light', service: 'turn_on', data: { entity_id: intent.entity_id, brightness: intent.brightness } });
        return NextResponse.json({
          handled: true,
          reply: `💡 Brightness set to ${Math.round(intent.brightness / 255 * 100)}% on **${intent.entity_id.replace(/_/g, ' ').replace(/^light\./, '')}**.`,
          action: intent,
        });
      }
      case 'set_temperature': {
        await haCallService({ domain: 'climate', service: 'set_temperature', data: { entity_id: intent.entity_id, temperature: intent.temperature } });
        return NextResponse.json({
          handled: true,
          reply: `🌡️ Temperature set to **${intent.temperature}°** on **${intent.entity_id.replace(/_/g, ' ').replace(/^climate\./, '')}**.`,
          action: intent,
        });
      }
      case 'get_state': {
        const state = await haGetState(intent.entity_id);
        return NextResponse.json({
          handled: true,
          reply: formatEntityState(state),
          action: intent,
        });
      }
      case 'list_devices': {
        const filtered = intent.domain
          ? allEntities.filter((e: any) => e.entity_id.startsWith(intent.domain + '.'))
          : allEntities.filter((e: any) => ['light', 'switch', 'climate', 'sensor', 'media_player'].some(d => e.entity_id.startsWith(d + '.')));
        const lines = filtered.map((e: any) => {
          const name = e.attributes?.friendly_name || e.entity_id;
          const unit = e.attributes?.unit_of_measurement || '';
          return `- **${name}** — ${e.state}${unit}`;
        });
        return NextResponse.json({
          handled: true,
          reply: lines.length
            ? `Here are your devices:\n\n${lines.join('\n')}`
            : 'No devices found in that category.',
          action: intent,
        });
      }
    }
  } catch (err: any) {
    return NextResponse.json({
      handled: true,
      reply: `❌ Home Assistant error: ${err.message}`,
      action: intent,
    });
  }

  return NextResponse.json({ handled: false });
}
