import { NextResponse } from 'next/server';

export async function GET() {
  // Try multiple host options in order
  const hosts = [
    process.env.OLLAMA_HOST,
    'http://host.docker.internal:11434',
    'http://172.17.0.1:11434',
    'http://172.20.0.1:11434',
  ].filter(Boolean) as string[];

  for (const host of hosts) {
    try {
      const res = await fetch(`${host}/api/tags`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const data = await res.json();
        const models = (data.models || []).map((m: any) => m.name);
        if (models.length > 0) {
          return NextResponse.json({ models, host });
        }
      }
    } catch {}
  }

  return NextResponse.json({ models: [], error: 'Could not reach Ollama on any host' });
}
