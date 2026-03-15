import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { model, messages, systemPrompt } = await req.json();
  const ollamaHost = process.env.OLLAMA_HOST || 'http://host.docker.internal:11434';

  // Build final messages — inject custom system prompt if provided, else use passed system message
  const finalMessages = systemPrompt
    ? [{ role: 'system', content: systemPrompt }, ...messages.filter((m: any) => m.role !== 'system')]
    : messages;

  try {
    const res = await fetch(`${ollamaHost}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages: finalMessages, stream: true }),
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Ollama error: ${res.status}` }, { status: res.status });
    }

    const stream = new ReadableStream({
      async start(controller) {
        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';
            for (const line of lines) {
              if (!line.trim()) continue;
              try {
                const json = JSON.parse(line);
                const content = json.message?.content || '';
                // Detect <think> blocks for reasoning models
                const thinkMatch = content.match(/<think>([\s\S]*?)<\/think>/);
                if (thinkMatch) {
                  controller.enqueue(new TextEncoder().encode(JSON.stringify({ thinking: thinkMatch[1] }) + '\n'));
                  controller.enqueue(new TextEncoder().encode(JSON.stringify({ content: content.replace(/<think>[\s\S]*?<\/think>/g, '') }) + '\n'));
                } else {
                  controller.enqueue(new TextEncoder().encode(JSON.stringify({ content }) + '\n'));
                }
              } catch {}
            }
          }
        } finally {
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Transfer-Encoding': 'chunked' },
    });
  } catch (e) {
    return NextResponse.json({ error: 'Cannot connect to Ollama' }, { status: 503 });
  }
}
