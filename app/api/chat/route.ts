import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { model, messages } = await req.json();
  const ollamaHost = process.env.OLLAMA_HOST || 'http://host.docker.internal:11434';

  const upstream = await fetch(`${ollamaHost}/api/chat`, {
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
              // thinking content (deepseek-r1, qwq, etc)
              const thinking = json?.message?.thinking;
              const content = json?.message?.content;
              // Send as a structured SSE-like JSON token so client can separate thinking vs content
              if (thinking !== undefined || content !== undefined) {
                const payload = JSON.stringify({ thinking: thinking ?? null, content: content ?? null });
                controller.enqueue(encoder.encode(payload + '\n'));
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
