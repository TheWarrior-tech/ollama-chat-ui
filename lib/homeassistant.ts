// Home Assistant REST API client
// Reads config from DB (via /api/settings) at runtime — no restart needed.
// Falls back to process.env for Docker/bare-metal setups.

import { prisma } from '@/lib/prisma';

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

async function getConfig(): Promise<{ host: string; token: string; enabled: boolean }> {
  try {
    const rows = await prisma.setting.findMany({
      where: { key: { in: ['ha_host', 'ha_token', 'ha_enabled'] } },
    });
    const map: Record<string, string> = {};
    for (const r of rows) map[r.key] = r.value;

    return {
      host:    map.ha_host  || process.env.HA_HOST  || '',
      token:   map.ha_token || process.env.HA_TOKEN || '',
      enabled: (map.ha_enabled ?? 'true') !== 'false',
    };
  } catch {
    return {
      host:    process.env.HA_HOST  || '',
      token:   process.env.HA_TOKEN || '',
      enabled: true,
    };
  }
}

function haHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export async function haGetStates(): Promise<HAEntity[]> {
  const { host, token } = await getConfig();
  const res = await fetch(`${host}/api/states`, {
    headers: haHeaders(token),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`HA states: ${res.status}`);
  return res.json();
}

export async function haGetState(entity_id: string): Promise<HAEntity> {
  const { host, token } = await getConfig();
  const res = await fetch(`${host}/api/states/${entity_id}`, {
    headers: haHeaders(token),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`HA state ${entity_id}: ${res.status}`);
  return res.json();
}

export async function haCallService(call: HAServiceCall): Promise<any> {
  const { host, token } = await getConfig();
  const res = await fetch(`${host}/api/services/${call.domain}/${call.service}`, {
    method: 'POST',
    headers: haHeaders(token),
    body: JSON.stringify(call.data),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`HA service ${call.domain}.${call.service}: ${res.status}`);
  return res.json();
}

export async function isConfigured(): Promise<boolean> {
  const { host, token, enabled } = await getConfig();
  return enabled && Boolean(host && token);
}
