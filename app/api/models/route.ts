import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const ollamaHost = process.env.OLLAMA_HOST || 'http://host.docker.internal:11434';
    const res = await fetch(`${ollamaHost}/api/tags`);
    const data = await res.json();
    const models = (data.models || []).map((m: any) => m.name);
    return NextResponse.json({ models });
  } catch {
    return NextResponse.json({ models: [], error: 'Could not reach Ollama' }, { status: 500 });
  }
}
