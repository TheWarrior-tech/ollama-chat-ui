import { NextRequest, NextResponse } from 'next/server';

const SEARXNG = process.env.SEARXNG_HOST || 'http://searxng:8080';

// Exactly how Perplexica does it: parallel site: queries via bing news
// Each topic fans out into multiple trusted-domain queries, results are
// flattened + shuffled, then only items that have a thumbnail are kept.
const TOPIC_QUERIES: Record<string, { site: string; term: string }[]> = {
  ai: [
    { site: 'techcrunch.com',        term: 'AI' },
    { site: 'theverge.com',          term: 'artificial intelligence' },
    { site: 'wired.com',             term: 'AI' },
    { site: 'businessinsider.com',   term: 'AI' },
    { site: 'venturebeat.com',       term: 'AI' },
    { site: 'arstechnica.com',       term: 'AI' },
  ],
  science: [
    { site: 'newscientist.com',      term: 'science' },
    { site: 'sciencedaily.com',      term: 'discovery' },
    { site: 'nature.com',            term: 'research' },
    { site: 'scientificamerican.com',term: 'science' },
    { site: 'phys.org',              term: 'breakthrough' },
  ],
  world: [
    { site: 'bbc.com',               term: 'world news' },
    { site: 'reuters.com',           term: 'world' },
    { site: 'theguardian.com',       term: 'world' },
    { site: 'apnews.com',            term: 'news' },
    { site: 'aljazeera.com',         term: 'news' },
  ],
  finance: [
    { site: 'businessinsider.com',   term: 'finance' },
    { site: 'bloomberg.com',         term: 'markets' },
    { site: 'cnbc.com',              term: 'finance' },
    { site: 'ft.com',                term: 'economy' },
    { site: 'yahoo.com',             term: 'finance' },
  ],
  health: [
    { site: 'healthline.com',        term: 'health' },
    { site: 'webmd.com',             term: 'health' },
    { site: 'medicalnewstoday.com',  term: 'research' },
    { site: 'nih.gov',               term: 'health' },
    { site: 'bbc.com',               term: 'health' },
  ],
  space: [
    { site: 'spacenews.com',         term: 'space' },
    { site: 'space.com',             term: 'NASA' },
    { site: 'universetoday.com',     term: 'space' },
    { site: 'theverge.com',          term: 'SpaceX' },
    { site: 'arstechnica.com',       term: 'space' },
  ],
  sport: [
    { site: 'bbc.com',               term: 'sport' },
    { site: 'espn.com',              term: 'sport' },
    { site: 'theathletic.com',       term: 'sport' },
    { site: 'skysports.com',         term: 'football' },
    { site: 'formula1.com',          term: 'F1' },
  ],
  gaming: [
    { site: 'ign.com',               term: 'gaming' },
    { site: 'gamespot.com',          term: 'games' },
    { site: 'polygon.com',           term: 'gaming' },
    { site: 'eurogamer.net',         term: 'gaming' },
    { site: 'kotaku.com',            term: 'games' },
  ],
};

const TOPICS = Object.keys(TOPIC_QUERIES).map(id => ({
  id,
  label: { ai:'AI & Tech', science:'Science', world:'World', finance:'Finance', health:'Health', space:'Space', sport:'Sport', gaming:'Gaming' }[id] || id,
}));

async function searxngBingNews(query: string) {
  const url = new URL(`${SEARXNG}/search`);
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'json');
  url.searchParams.set('engines', 'bing news');
  url.searchParams.set('pageno', '1');
  url.searchParams.set('safesearch', '0');
  url.searchParams.set('language', 'en');

  try {
    const res = await fetch(url.toString(), {
      headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0 NeuralChat/1.0' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []) as any[];
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  const topicId = req.nextUrl.searchParams.get('topic') || 'ai';
  const queries = TOPIC_QUERIES[topicId] || TOPIC_QUERIES.ai;

  try {
    // Fan out all queries in parallel — exactly like Perplexica
    const allResults = (
      await Promise.all(
        queries.map(({ site, term }) =>
          searxngBingNews(`site:${site} ${term}`)
        )
      )
    )
      .flat()
      // Keep only items that have a thumbnail (same filter Perplexica applies)
      .filter((r: any) => r.thumbnail || r.img_src)
      // Shuffle — same as Perplexica's .sort(() => Math.random() - 0.5)
      .sort(() => Math.random() - 0.5)
      // Deduplicate by URL
      .filter((r: any, i: number, arr: any[]) => arr.findIndex(x => x.url === r.url) === i)
      .slice(0, 20);

    const articles = allResults.map((r: any) => ({
      title:         r.title || '',
      url:           r.url   || '',
      snippet:       (r.content || r.description || '').slice(0, 280),
      source:        (() => { try { return new URL(r.url).hostname.replace('www.', ''); } catch { return ''; } })(),
      publishedDate: r.publishedDate || r.pubDate || null,
      thumbnail:     r.thumbnail || r.img_src || '',
    }));

    return NextResponse.json({ topic: topicId, topics: TOPICS, articles });
  } catch (err: any) {
    return NextResponse.json({
      topic: topicId, topics: TOPICS, articles: [],
      error: `Search error: ${err?.message || 'Unknown'}. Is SearXNG running? (docker compose up)`,
    });
  }
}
