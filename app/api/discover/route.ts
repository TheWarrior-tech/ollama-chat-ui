import { NextRequest, NextResponse } from 'next/server';

const TOPICS = [
  { id: 'ai',      label: 'AI & Tech',   query: 'artificial intelligence machine learning 2026' },
  { id: 'science', label: 'Science',     query: 'science discovery breakthrough research 2026' },
  { id: 'world',   label: 'World News',  query: 'world news breaking today 2026' },
  { id: 'finance', label: 'Finance',     query: 'stock market economy finance business 2026' },
  { id: 'health',  label: 'Health',      query: 'health medicine wellness research 2026' },
  { id: 'space',   label: 'Space',       query: 'space NASA SpaceX astronomy 2026' },
  { id: 'sport',   label: 'Sport',       query: 'sport football F1 athletics news today' },
  { id: 'gaming',  label: 'Gaming',      query: 'video games gaming news releases 2026' },
];

const SEARXNG = process.env.SEARXNG_HOST || 'http://searxng:8080';

async function searchSearxng(query: string, category: string, pageSize = 15) {
  const url = new URL(`${SEARXNG}/search`);
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'json');
  url.searchParams.set('categories', category);
  url.searchParams.set('time_range', 'day');
  url.searchParams.set('safesearch', '0');
  url.searchParams.set('language', 'en');

  const res = await fetch(url.toString(), {
    headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0 NeuralChat/1.0' },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`SearXNG ${res.status}`);
  const data = await res.json();
  return (data.results || []).slice(0, pageSize);
}

async function getImageForArticle(title: string): Promise<string> {
  try {
    const url = new URL(`${SEARXNG}/search`);
    url.searchParams.set('q', title.slice(0, 80));
    url.searchParams.set('format', 'json');
    url.searchParams.set('categories', 'images');
    url.searchParams.set('safesearch', '0');
    url.searchParams.set('pageno', '1');

    const res = await fetch(url.toString(), {
      headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0 NeuralChat/1.0' },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return '';
    const data = await res.json();
    const imgs = (data.results || []) as any[];
    // Prefer images with reasonable dimensions
    const pick = imgs.find(i => i.img_src && i.thumbnail_src) || imgs[0];
    return pick?.thumbnail_src || pick?.img_src || '';
  } catch {
    return '';
  }
}

export async function GET(req: NextRequest) {
  const topicId = req.nextUrl.searchParams.get('topic') || 'ai';
  const topic = TOPICS.find(t => t.id === topicId) || TOPICS[0];

  try {
    // Fetch news results and images in parallel
    const [newsResults] = await Promise.all([
      searchSearxng(topic.query, 'news,general', 15),
    ]);

    if (!newsResults.length) {
      return NextResponse.json({ topic: topicId, topics: TOPICS, articles: [], error: 'SearXNG returned no results for this topic.' });
    }

    // Fetch images for top 12 articles in parallel (batched)
    const top = newsResults.slice(0, 12);
    const images = await Promise.all(
      top.map((r: any) => getImageForArticle(r.title || r.url))
    );

    const articles = top.map((r: any, i: number) => ({
      title: r.title || '',
      url: r.url || '',
      snippet: (r.content || r.description || '').slice(0, 300),
      source: (() => { try { return new URL(r.url).hostname.replace('www.', ''); } catch { return ''; } })(),
      publishedDate: r.publishedDate || r.pubDate || null,
      image: images[i] || r.thumbnail || r.img_src || '',
    }));

    return NextResponse.json({ topic: topicId, topics: TOPICS, articles });
  } catch (err: any) {
    const msg = err?.message || 'Unknown error';
    const isSearxDown = msg.includes('fetch') || msg.includes('ECONNREFUSED') || msg.includes('SearXNG');
    return NextResponse.json({
      topic: topicId,
      topics: TOPICS,
      articles: [],
      error: isSearxDown
        ? 'SearXNG is not reachable. Make sure the searxng container is running (docker compose up).'
        : `Search error: ${msg}`,
    });
  }
}
