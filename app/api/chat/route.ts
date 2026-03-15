import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const { model, messages } = await req.json();
  const ollamaHost = process.env.OLLAMA_HOST || 'http://host.docker.internal:11434';

  const upstream = await fetch(`${ollamaHost}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, stream: true })
  });

  return new Response(upstream.body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Transfer-Encoding': 'chunked', 'X-Accel-Buffering': 'no' }
  });
}
