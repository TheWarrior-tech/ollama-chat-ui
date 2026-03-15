// Home Assistant REST API client
// All calls go through the server-side proxy to keep the HA token secret.

export interface HAEntity {
  entity_id: string;
  state: string;
  attributes: Record<string, any>;
  last_changed: string;
  last_updated: string;
}

export interface HAServiceCall {
  domain: string;
  service: string;
  data: Record<string, any>;
}

const HA_HOST = process.env.HA_HOST || '';
const HA_TOKEN = process.env.HA_TOKEN || '';

function haHeaders() {
  return {
    Authorization: `Bearer ${HA_TOKEN}`,
    'Content-Type': 'application/json',
  };
}

export async function haGetStates(): Promise<HAEntity[]> {
  const res = await fetch(`${HA_HOST}/api/states`, {
    headers: haHeaders(),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`HA states: ${res.status}`);
  return res.json();
}

export async function haGetState(entity_id: string): Promise<HAEntity> {
  const res = await fetch(`${HA_HOST}/api/states/${entity_id}`, {
    headers: haHeaders(),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`HA state ${entity_id}: ${res.status}`);
  return res.json();
}

export async function haCallService(call: HAServiceCall): Promise<any> {
  const res = await fetch(`${HA_HOST}/api/services/${call.domain}/${call.service}`, {
    method: 'POST',
    headers: haHeaders(),
    body: JSON.stringify(call.data),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`HA service ${call.domain}.${call.service}: ${res.status}`);
  return res.json();
}

export function isConfigured(): boolean {
  return Boolean(HA_HOST && HA_TOKEN);
}
