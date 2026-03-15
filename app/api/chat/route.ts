import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const { model, messages } = await req.json();
  const hosts = [
    process.env.OLLAMA_HOST,
    'http://host.docker.internal:11434',
    'http://172.17.0.1:11434',
    'http://172.20.0.1:11434',
  ].filter(Boolean) as string[];

  let upstream: Response | null = null;
  for (const host of hosts) {
    try {
      const res = await fetch(`${host}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages,
          stream: true,
          options: {
            num_predict: -1,   // no token limit — let model finish fully
            temperature: 0.7,
          },
        }),
      });
      if (res.ok) { upstream = res; break; }
    } catch {}
  }

  if (!upstream?.body) {
    return new Response(JSON.stringify({ error: 'Ollama unreachable' }), { status: 502 });
  }

  const encoder = new TextEncoder();
  const body = upstream.body;
  const readable = new ReadableStream({
    async start(controller) {
      const reader = body.getReader();
      const decoder = new TextDecoder();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          for (const line of chunk.split('\n').filter(Boolean)) {
            try {
              const json = JSON.parse(line);
              const thinking = json?.message?.thinking;
              const content = json?.message?.content;
              if (thinking !== undefined || content !== undefined) {
                controller.enqueue(
                  encoder.encode(
                    JSON.stringify({ thinking: thinking ?? null, content: content ?? null }) + '\n'
                  )
                );
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
