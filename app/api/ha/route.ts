// Server-side Home Assistant proxy — keeps HA_TOKEN out of the browser
import { NextRequest, NextResponse } from 'next/server';
import { haGetStates, haGetState, haCallService, isConfigured, HAServiceCall } from '@/lib/homeassistant';

export async function GET(req: NextRequest) {
  if (!isConfigured()) {
    return NextResponse.json({ error: 'Home Assistant not configured. Add HA_HOST and HA_TOKEN to your .env' }, { status: 503 });
  }

  const entity_id = req.nextUrl.searchParams.get('entity_id');
  try {
    if (entity_id) {
      const state = await haGetState(entity_id);
      return NextResponse.json(state);
    }
    const states = await haGetStates();
    // Return only useful fields to keep payload small
    const slim = states.map(e => ({
      entity_id: e.entity_id,
      state: e.state,
      attributes: {
        friendly_name: e.attributes.friendly_name,
        unit_of_measurement: e.attributes.unit_of_measurement,
        device_class: e.attributes.device_class,
        brightness: e.attributes.brightness,
        temperature: e.attributes.temperature,
        current_temperature: e.attributes.current_temperature,
        humidity: e.attributes.humidity,
        media_title: e.attributes.media_title,
        is_volume_muted: e.attributes.is_volume_muted,
      },
      last_changed: e.last_changed,
    }));
    return NextResponse.json(slim);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isConfigured()) {
    return NextResponse.json({ error: 'Home Assistant not configured.' }, { status: 503 });
  }
  try {
    const body = await req.json() as HAServiceCall;
    const result = await haCallService(body);
    return NextResponse.json({ ok: true, result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
