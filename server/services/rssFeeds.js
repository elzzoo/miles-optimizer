// RSS feeds for miles & points deals — no API key, no npm package
// Uses native fetch + lightweight XML regex parsing

function fetchWithTimeout(url, options = {}, ms = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timer));
}

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

// Extract text content of an XML tag, handling CDATA and attributes
function extractTag(xml, tag) {
  // Try CDATA and regular content
  const m = xml.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, "i"));
  if (m) return m[1].trim();
  return "";
}

// Extract link: tries <link>url</link>, then <link href="url"/>, then <guid>
function extractLink(block) {
  // Standard RSS <link>url</link>
  const textLink = extractTag(block, "link");
  if (textLink && isValidUrl(textLink)) return textLink;

  // Atom-style <link href="url" .../>
  const attrMatch = block.match(/<link[^>]+href=["']([^"']+)["'][^>]*\/>/i);
  if (attrMatch && isValidUrl(attrMatch[1])) return attrMatch[1];

  // Fallback: <guid isPermaLink="true">url</guid>
  const guid = extractTag(block, "guid");
  if (guid && isValidUrl(guid)) return guid;

  return "";
}

function isValidUrl(str) {
  if (!str) return false;
  const s = str.trim();
  return s.startsWith("http://") || s.startsWith("https://");
}

// Canonical URL: strip query params (UTM etc), lowercase hostname, no trailing slash
function canonicalUrl(urlStr) {
  try {
    const u = new URL(urlStr);
    return (u.hostname + u.pathname).toLowerCase().replace(/\/$/, "");
  } catch {
    return urlStr.toLowerCase().trim();
  }
}

// Parse RSS pubDate to timestamp (ms). Returns null if unparseable.
function parsePubDate(dateStr) {
  if (!dateStr) return null;
  const ts = Date.parse(dateStr);
  return isNaN(ts) ? null : ts;
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

function parseRss(xml, sourceName) {
  const items = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/gi;
  let m;
  while ((m = itemRe.exec(xml)) !== null && items.length < 15) {
    const block = m[1];
    const title = extractTag(block, "title");
    if (!title) continue;

    const link = extractLink(block);
    const pubDate = extractTag(block, "pubDate");
    const raw = extractTag(block, "description");
    const snippet = raw.replace(/<[^>]+>/g, "").slice(0, 120).trim();

    items.push({ title, link, date: pubDate, dateTs: parsePubDate(pubDate), snippet, source: sourceName });
  }
  return items;
}

async function fetchFeed(feed) {
  try {
    const r = await fetchWithTimeout(feed.url, {}, 8000);
    if (!r.ok) return [];
    const xml = await r.text();
    return parseRss(xml, feed.source);
  } catch {
    return [];
  }
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export async function fetchRssPromos() {
  const results = await Promise.allSettled(FEEDS.map(fetchFeed));
  const all = results.flatMap(r => r.status === "fulfilled" ? r.value : []);

  const now = Date.now();

  // Deduplicate by canonical URL first, then by title
  const seenUrls = new Set();
  const seenTitles = new Set();
  const deduped = all.filter(item => {
    if (!item.title) return false;
    const normTitle = item.title.toLowerCase().trim();
    // URL dedup (primary key)
    if (item.link) {
      const canon = canonicalUrl(item.link);
      if (seenUrls.has(canon)) return false;
      seenUrls.add(canon);
    }
    // Title dedup (fallback for items without link)
    if (seenTitles.has(normTitle)) return false;
    seenTitles.add(normTitle);
    return true;
  });

  return deduped
    .filter(item => {
      // Drop items older than 30 days
      if (item.dateTs && now - item.dateTs > THIRTY_DAYS_MS) return false;
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
    .sort((a, b) => {
      // Sort by date desc, then score desc
      const dateDiff = (b.dateTs || 0) - (a.dateTs || 0);
      if (dateDiff !== 0) return dateDiff;
      return b.score - a.score;
    })
    .slice(0, 12);
}
