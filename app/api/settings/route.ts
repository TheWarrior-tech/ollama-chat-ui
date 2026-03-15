import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Keys that are allowed to be saved via this endpoint
const ALLOWED_KEYS = [
  'ha_host',
  'ha_token',
  'ha_enabled',
];

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await prisma.setting.findMany({
    where: { key: { in: ALLOWED_KEYS } },
  });

  const result: Record<string, string> = {};
  for (const r of rows) result[r.key] = r.value;

  // Mask the token — never send the real value to the browser
  if (result.ha_token && result.ha_token.length > 8) {
    result.ha_token = result.ha_token.slice(0, 4) + '•'.repeat(20) + result.ha_token.slice(-4);
  }

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();

  for (const key of ALLOWED_KEYS) {
    if (key in body) {
      const value = String(body[key] ?? '').trim();
      // Skip masked token (user didn't change it)
      if (key === 'ha_token' && value.includes('•')) continue;
      await prisma.setting.upsert({
        where: { key },
        create: { key, value },
        update: { value, updatedAt: new Date() },
      });
    }
  }

  return NextResponse.json({ ok: true });
}
