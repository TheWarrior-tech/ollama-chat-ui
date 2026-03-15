import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { query } = await req.json();
  const host = process.env.SEARXNG_HOST || 'http://searxng:8080';

  // Detect query type to pick best engines
  const q = query.toLowerCase();
  const isWeather = q.includes('weather') || q.includes('temperature') || q.includes('forecast') || q.includes('rain') || q.includes('snow') || q.includes('humid');
  const isNews = q.includes('news') || q.includes('latest') || q.includes('today') || q.includes('breaking');
  const isCode = q.includes('code') || q.includes('programming') || q.includes('error') || q.includes('github');

  let engines = 'google,bing,duckduckgo';
  if (isWeather) engines = 'google,bing,duckduckgo,brave';
  if (isNews) engines = 'google,bing,brave';
  if (isCode) engines = 'google,duckduckgo,brave';

  // For weather, append current conditions to query for better results
  const searchQuery = isWeather && !q.includes('forecast') ? `${query} current conditions today` : query;

  try {
    const url = new URL(`${host}/search`);
    url.searchParams.set('q', searchQuery);
    url.searchParams.set('format', 'json');
    url.searchParams.set('engines', engines);
    url.searchParams.set('language', 'en');
    url.searchParams.set('safesearch', '0');
    url.searchParams.set('time_range', isNews || isWeather ? 'day' : '');

    const res = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) {
      return NextResponse.json({ results: [], error: `SearXNG ${res.status}` });
    }

    const data = await res.json();
    const results = (data.results || []).slice(0, 8).map((r: any) => ({
      title: r.title || '',
      url: r.url || '',
      snippet: r.content || r.snippet || r.publishedDate || '',
    }));

    return NextResponse.json({ results });
  } catch (e) {
    return NextResponse.json({ results: [], error: String(e) });
  }
}
