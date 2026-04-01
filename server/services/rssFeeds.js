// RSS feeds for miles & points deals — no API key, no npm package
// Uses native fetch + lightweight XML regex parsing

const FEEDS = [
  { url: "https://thepointsguy.com/feed/",            source: "The Points Guy" },
  { url: "https://onemileatatime.com/feed/",           source: "One Mile at a Time" },
  { url: "https://www.frequentflyerbonuses.com/feed/", source: "FrequentFlyerBonuses" },
  { url: "https://theflightdeal.com/feed/",            source: "The Flight Deal" },
];

const PROGRAM_MAP = [
  { id: "aeroplan",   short: "Aeroplan",    keywords: ["aeroplan", "air canada"] },
  { id: "lifemiles",  short: "LifeMiles",   keywords: ["lifemiles", "avianca"] },
  { id: "flyingblue", short: "Flying Blue", keywords: ["flying blue"] },
  { id: "united",     short: "MileagePlus", keywords: ["mileageplus", "united miles"] },
  { id: "turkish",    short: "Miles&Smiles",keywords: ["miles&smiles", "turkish miles", "miles smiles"] },
  { id: "qatar",      short: "Qatar Avios", keywords: ["qatar avios", "privilege club"] },
  { id: "ba",         short: "BA Avios",    keywords: ["ba avios", "british airways avios", "executive club"] },
  { id: "aadvantage", short: "AAdvantage",  keywords: ["aadvantage", "american airlines"] },
];

const SCORE_SIGNALS = [
  { words: ["100%", "double miles", "triple miles", "double points"], score: 5 },
  { words: ["80%", "50%", "bonus miles", "miles bonus"],              score: 4 },
  { words: ["promo", "promotion", "deal", "offer", "sale"],           score: 3 },
  { words: ["30%", "40%", "discount", "reward"],                      score: 2 },
  { words: ["miles", "points", "avios", "award"],                     score: 1 },
];

function extractTag(xml, tag) {
  const m = xml.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, "i"));
  return m ? m[1].trim() : "";
}

function parseRss(xml, sourceName) {
  const items = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/gi;
  let m;
  while ((m = itemRe.exec(xml)) !== null && items.length < 15) {
    const block = m[1];
    const title = extractTag(block, "title");
    const link = extractTag(block, "link") || extractTag(block, "guid");
    const pubDate = extractTag(block, "pubDate");
    const raw = extractTag(block, "description");
    const snippet = raw.replace(/<[^>]+>/g, "").slice(0, 120).trim();
    if (title) items.push({ title, link, date: pubDate, snippet, source: sourceName });
  }
  return items;
}

function detectProgram(text) {
  const lower = text.toLowerCase();
  for (const p of PROGRAM_MAP) {
    if (p.keywords.some(k => lower.includes(k))) return { id: p.id, short: p.short };
  }
  return null;
}

function scoreText(text) {
  const lower = text.toLowerCase();
  return SCORE_SIGNALS.reduce((t, s) => t + (s.words.some(w => lower.includes(w)) ? s.score : 0), 0);
}

async function fetchFeed(feed) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const r = await fetch(feed.url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!r.ok) return [];
    const xml = await r.text();
    return parseRss(xml, feed.source);
  } catch {
    return [];
  }
}

export async function fetchRssPromos() {
  const results = await Promise.allSettled(FEEDS.map(fetchFeed));
  const all = results.flatMap(r => r.status === "fulfilled" ? r.value : []);

  const seen = new Set();
  return all
    .filter(item => {
      if (!item.title || seen.has(item.title)) return false;
      seen.add(item.title);
      return true;
    })
    .map(item => {
      const text = item.title + " " + item.snippet;
      const program = detectProgram(text);
      return {
        ...item,
        programId: program?.id || null,
        programShort: program?.short || null,
        score: scoreText(text),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}
