import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const { model, messages } = await req.json();
  const host = process.env.OLLAMA_HOST || 'http://host.docker.internal:11434';

  const upstream = await fetch(`${host}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, stream: true }),
  });

  if (!upstream.ok || !upstream.body) {
    return new Response(JSON.stringify({ error: 'Ollama unreachable' }), { status: 502 });
  }

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      const reader = upstream.body!.getReader();
      const decoder = new TextDecoder();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter(Boolean);
          for (const line of lines) {
            try {
              const json = JSON.parse(line);
              const thinking = json?.message?.thinking;
              const content = json?.message?.content;
              if (thinking !== undefined || content !== undefined) {
                controller.enqueue(encoder.encode(JSON.stringify({ thinking: thinking ?? null, content: content ?? null }) + '\n'));
              }
            } catch {}
          }
        }
      } finally {
        controller.close();
        reader.releaseLock();
      }
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  });
}
