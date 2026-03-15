import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const host = process.env.OLLAMA_HOST || 'http://host.docker.internal:11434';
    const res = await fetch(`${host}/api/tags`);
    const data = await res.json();
    const models = (data.models || []).map((m: any) => m.name);
    return NextResponse.json({ models });
  } catch {
    return NextResponse.json({ models: [] });
  }
}
