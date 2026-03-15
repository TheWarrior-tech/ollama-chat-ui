import { NextRequest, NextResponse } from 'next/server';

const TOPICS = [
  { id: 'ai',      label: 'AI & Tech'  },
  { id: 'science', label: 'Science'    },
  { id: 'world',   label: 'World News' },
  { id: 'finance', label: 'Finance'    },
  { id: 'health',  label: 'Health'     },
  { id: 'space',   label: 'Space'      },
];

// Parse RSS XML into articles
function parseRSS(xml: string, maxItems = 15) {
  const items: { title: string; url: string; snippet: string; source: string }[] = [];
  const itemRegex = /<item[\s\S]*?<\/item>/gi;
  const matches = xml.match(itemRegex) || [];
  for (const item of matches.slice(0, maxItems)) {
    const get = (tag: string) => {
      const m = item.match(new RegExp(`<${tag}(?:[^>]*)><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\/${tag}>`, 'i'))
        || item.match(new RegExp(`<${tag}(?:[^>]*)>([^<]*)<\/${tag}>`, 'i'));
      return m ? m[1].trim() : '';
    };
    const linkM = item.match(/<link>([^<]+)<\/link>/) || item.match(/<link[^>]+href="([^"]+)"/);
    const title = get('title');
    const url = linkM ? linkM[1].trim() : '';
    const snippet = get('description').replace(/<[^>]+>/g, '').slice(0, 200);
    let source = '';
    try { source = new URL(url).hostname.replace('www.', ''); } catch {}
    if (title && url) items.push({ title, url, snippet, source });
  }
  return items;
}

async function fetchRSS(feedUrl: string, max = 12) {
  const res = await fetch(feedUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NeuralChat/1.0)' },
    signal: AbortSignal.timeout(8000),
    next: { revalidate: 300 }, // cache 5 min
  });
  const xml = await res.text();
  return parseRSS(xml, max);
}

// Topic → ordered list of RSS feeds to try (first one that returns results wins)
const FEEDS: Record<string, string[]> = {
  ai: [
    'https://hnrss.org/frontpage',                          // Hacker News front page
    'https://feeds.feedburner.com/venturebeat/SZYF',        // VentureBeat AI
    'https://www.wired.com/feed/tag/artificial-intelligence/latest/rss',
    'https://techcrunch.com/feed/',
  ],
  science: [
    'https://rss.nytimes.com/services/xml/rss/nyt/Science.xml',
    'https://www.sciencedaily.com/rss/top/science.xml',
    'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml',
    'https://www.newscientist.com/feed/home/',
  ],
  world: [
    'https://feeds.bbci.co.uk/news/world/rss.xml',
    'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
    'https://feeds.reuters.com/reuters/worldNews',
    'https://www.theguardian.com/world/rss',
  ],
  finance: [
    'https://feeds.bbci.co.uk/news/business/rss.xml',
    'https://rss.nytimes.com/services/xml/rss/nyt/Business.xml',
    'https://www.ft.com/?format=rss',
    'https://feeds.reuters.com/reuters/businessNews',
  ],
  health: [
    'https://feeds.bbci.co.uk/news/health/rss.xml',
    'https://rss.nytimes.com/services/xml/rss/nyt/Health.xml',
    'https://www.sciencedaily.com/rss/top/health_medicine.xml',
    'https://feeds.webmd.com/rss/rss.aspx?RSSSource=RSS_PUBLIC',
  ],
  space: [
    'https://www.nasa.gov/feeds/iotd-feed/',
    'https://spacenews.com/feed/',
    'https://www.universetoday.com/feed',
    'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml',
  ],
};

export async function GET(req: NextRequest) {
  const topicId = req.nextUrl.searchParams.get('topic') || 'ai';
  const feeds = FEEDS[topicId] || FEEDS.ai;

  // Try each feed in order, return first non-empty result
  for (const feedUrl of feeds) {
    try {
      const articles = await fetchRSS(feedUrl, 12);
      if (articles.length > 0) {
        return NextResponse.json({
          topic: topicId,
          topics: TOPICS,
          articles,
          source: feedUrl,
        });
      }
    } catch {
      // try next feed
    }
  }

  // All feeds failed — return a helpful empty response rather than an error
  return NextResponse.json({
    topic: topicId,
    topics: TOPICS,
    articles: [],
    error: 'Could not reach any news feeds. Check your internet connection.',
  });
}
