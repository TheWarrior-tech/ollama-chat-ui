import { NextRequest, NextResponse } from 'next/server';

const TOPICS = [
  { id: 'ai', label: '🤖 AI & Tech', query: 'artificial intelligence latest news 2026' },
  { id: 'science', label: '🔬 Science', query: 'science discovery breakthrough 2026' },
  { id: 'world', label: '🌍 World News', query: 'world news today 2026' },
  { id: 'finance', label: '📈 Finance', query: 'stock market finance news today' },
  { id: 'health', label: '🧠 Health', query: 'health wellness research 2026' },
  { id: 'space', label: '🚀 Space', query: 'space exploration NASA SpaceX 2026' },
];

export async function GET(req: NextRequest) {
  const topic = req.nextUrl.searchParams.get('topic') || 'ai';
  const found = TOPICS.find(t => t.id === topic) || TOPICS[0];
  const host = process.env.SEARXNG_HOST || 'http://searxng:8080';

  try {
    const url = new URL(`${host}/search`);
    url.searchParams.set('q', found.query);
    url.searchParams.set('format', 'json');
    url.searchParams.set('engines', 'google,bing,brave');
    url.searchParams.set('time_range', 'day');
    url.searchParams.set('safesearch', '0');

    const res = await fetch(url.toString(), {
      headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(10000),
    });
    const data = await res.json();
    const articles = (data.results || []).slice(0, 12).map((r: any) => ({
      title: r.title || '',
      url: r.url || '',
      snippet: r.content || '',
      source: (() => { try { return new URL(r.url).hostname.replace('www.',''); } catch { return ''; } })(),
    }));
    return NextResponse.json({ topic, topics: TOPICS.map(t => ({ id: t.id, label: t.label })), articles });
  } catch {
    return NextResponse.json({ topic, topics: TOPICS.map(t => ({ id: t.id, label: t.label })), articles: [] });
  }
}
