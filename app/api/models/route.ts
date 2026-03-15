import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

export async function GET() {
  const host = process.env.OLLAMA_HOST || 'http://host.docker.internal:11434';
  try {
    const res = await fetch(`${host}/api/tags`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      return NextResponse.json({ models: [], error: `Ollama returned ${res.status}`, host });
    }
    const data = await res.json();
    const models = (data.models || []).map((m: any) => m.name);
    return NextResponse.json({ models, host });
  } catch (e) {
    return NextResponse.json({ models: [], error: String(e), host });
  }
}
