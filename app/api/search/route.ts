import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { query } = await req.json();
  const host = process.env.SEARXNG_HOST || 'http://searxng:8080';

  try {
    const url = `${host}/search?q=${encodeURIComponent(query)}&format=json&engines=google,bing,duckduckgo&language=en&safesearch=0`;
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'NeuralChat/1.0',
      },
    });

    if (!res.ok) {
      return NextResponse.json({ results: [], error: `SearXNG returned ${res.status}` });
    }

    const data = await res.json();
    const results = (data.results || []).slice(0, 6).map((r: any) => ({
      title: r.title || '',
      url: r.url || '',
      snippet: r.content || r.snippet || '',
    }));

    return NextResponse.json({ results });
  } catch (e) {
    return NextResponse.json({ results: [], error: String(e) });
  }
}
