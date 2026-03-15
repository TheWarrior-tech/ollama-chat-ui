import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { query } = await req.json();
  try {
    // Use DuckDuckGo instant answer + HTML scrape (no API key needed)
    const encoded = encodeURIComponent(query);
    const res = await fetch(
      `https://html.duckduckgo.com/html/?q=${encoded}`,
      { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NeuralChat/1.0)' } }
    );
    const html = await res.text();

    // Parse results from DDG HTML
    const results: { title: string; url: string; snippet: string }[] = [];
    const resultRegex = /<a class="result__a" href="([^"]+)"[^>]*>([^<]+)<\/a>[\s\S]*?<a class="result__snippet"[^>]*>([^<]*(?:<b>[^<]*<\/b>[^<]*)*)<\/a>/g;
    let match;
    while ((match = resultRegex.exec(html)) !== null && results.length < 6) {
      const url = decodeURIComponent(match[1].replace('/l/?uddg=', '').replace(/&rut=.*/, ''));
      const title = match[2].trim();
      const snippet = match[3].replace(/<[^>]+>/g, '').trim();
      if (url.startsWith('http') && title && snippet) {
        results.push({ title, url, snippet });
      }
    }

    // Fallback: try DDG API
    if (results.length === 0) {
      const apiRes = await fetch(`https://api.duckduckgo.com/?q=${encoded}&format=json&no_redirect=1&no_html=1&skip_disambig=1`);
      const data = await apiRes.json();
      if (data.RelatedTopics) {
        for (const t of data.RelatedTopics.slice(0, 6)) {
          if (t.FirstURL && t.Text) {
            results.push({ title: t.Text.slice(0, 60), url: t.FirstURL, snippet: t.Text });
          }
        }
      }
    }

    return NextResponse.json({ results });
  } catch (e) {
    return NextResponse.json({ results: [], error: String(e) });
  }
}
