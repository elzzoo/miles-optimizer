import { fetchRssPromos } from "./rssFeeds.js";

function fetchWithTimeout(url, options = {}, ms = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timer));
}

const SERPAPI_KEY = process.env.SERPAPI_KEY;

const PROGRAM_MAP = [
  { id: "aeroplan",   short: "Aeroplan",    keywords: ["aeroplan", "air canada aeroplan"] },
  { id: "lifemiles",  short: "LifeMiles",   keywords: ["lifemiles", "avianca lifemiles"] },
  { id: "flyingblue", short: "Flying Blue", keywords: ["flying blue", "flying blue promo"] },
  { id: "united",     short: "MileagePlus", keywords: ["mileageplus", "united mileageplus"] },
  { id: "turkish",    short: "Miles&Smiles",keywords: ["miles&smiles", "turkish miles", "miles smiles"] },
  { id: "qatar",      short: "Qatar Avios", keywords: ["qatar avios", "privilege club"] },
  { id: "ba",         short: "BA Avios",    keywords: ["ba avios", "british airways avios", "executive club"] },
  { id: "aadvantage", short: "AAdvantage",  keywords: ["aadvantage", "american aadvantage"] },
];

const PROMO_SIGNALS = [
  { words: ["100%", "double", "triple", "triple miles"], score: 5 },
  { words: ["80%", "50%", "bonus miles", "miles bonus"], score: 4 },
  { words: ["promo", "promotion", "offre", "deal", "offer"], score: 3 },
  { words: ["30%", "40%", "remise", "discount", "sale"], score: 2 },
  { words: ["miles", "points", "avios", "award"], score: 1 },
];

function scorePromo(text) {
  const lower = text.toLowerCase();
  return PROMO_SIGNALS.reduce((total, sig) =>
    total + (sig.words.some(w => lower.includes(w)) ? sig.score : 0), 0);
}

function detectProgram(text) {
  const lower = text.toLowerCase();
  for (const p of PROGRAM_MAP) {
    if (p.keywords.some(k => lower.includes(k))) return { id: p.id, short: p.short };
  }
  return null;
}

function isValidUrl(str) {
  if (!str) return false;
  const s = str.trim();
  return s.startsWith("http://") || s.startsWith("https://");
}

// Canonical URL: strip query params (UTM etc), lowercase hostname+path, no trailing slash
function canonicalUrl(urlStr) {
  try {
    const u = new URL(urlStr);
    return (u.hostname + u.pathname).toLowerCase().replace(/\/$/, "");
  } catch {
    return urlStr.toLowerCase().trim();
  }
}

// Parse SerpAPI relative date string to timestamp (ms). Returns null if unparseable.
function parseSerpDate(dateStr) {
  if (!dateStr) return null;
  const s = dateStr.toLowerCase().trim();
  const now = Date.now();

  const hourMatch = s.match(/(\d+)\s*hour/);
  if (hourMatch) return now - parseInt(hourMatch[1]) * 3600000;

  const dayMatch = s.match(/(\d+)\s*day/);
  if (dayMatch) return now - parseInt(dayMatch[1]) * 86400000;

  const weekMatch = s.match(/(\d+)\s*week/);
  if (weekMatch) return now - parseInt(weekMatch[1]) * 7 * 86400000;

  const monthMatch = s.match(/(\d+)\s*month/);
  if (monthMatch) return now - parseInt(monthMatch[1]) * 30 * 86400000;

  // Try direct date parse as last resort
  const ts = Date.parse(dateStr);
  return isNaN(ts) ? null : ts;
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

async function fetchSerpApiNews(query) {
  if (!SERPAPI_KEY) return [];
  try {
    const params = new URLSearchParams({
      engine: "google_news",
      q: query,
      hl: "en",
      gl: "us",
      api_key: SERPAPI_KEY,
    });
    const r = await fetchWithTimeout(`https://serpapi.com/search.json?${params}`, {}, 8000);
    if (!r.ok) return [];
    const data = await r.json();
    return (data.news_results || []).map(item => ({
      title: item.title || "",
      snippet: item.snippet || "",
      source: item.source?.name || (typeof item.source === "string" ? item.source : ""),
      date: item.date || "",
      dateTs: parseSerpDate(item.date || ""),
      link: item.link || "",
    }));
  } catch {
    return [];
  }
}

export async function fetchPromos() {
  const now = Date.now();

  // Run SerpAPI (2 queries) and RSS feeds in parallel
  const [broad, bonus, rssResult] = await Promise.allSettled([
    fetchSerpApiNews("airline miles points bonus promo 2025 2026 (Aeroplan OR LifeMiles OR \"Flying Blue\" OR MileagePlus OR Avios OR AAdvantage OR \"Miles Smiles\")"),
    fetchSerpApiNews("miles bonus 50% 80% 100% double triple points airline loyalty 2026"),
    fetchRssPromos(),
  ]);

  const serpItems = [
    ...(broad.status === "fulfilled" ? broad.value : []),
    ...(bonus.status === "fulfilled" ? bonus.value : []),
  ];
  const rss = rssResult.status === "fulfilled" ? rssResult.value : [];

  // Merge all items
  const merged = [...serpItems, ...rss];

  // Normalize a title for dedup: lowercase, strip punctuation, collapse spaces, first 60 chars
  function normTitle(t) {
    return t.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim().slice(0, 60);
  }

  // Deduplicate: canonical URL first, then normalized title (source-independent)
  const seenUrls = new Set();
  const seenTitles = new Set();
  const deduped = merged.filter(item => {
    if (!item.title) return false;

    // URL dedup — only for proper http(s) URLs; Google redirect URLs are excluded
    // (they're unique per-request so can't reliably dedup by URL across queries)
    if (item.link && isValidUrl(item.link)) {
      const canon = canonicalUrl(item.link);
      // Only use URL dedup for non-Google-redirect URLs
      const isGoogleRedirect = canon.includes("news.google.com") || canon.includes("google.com/url");
      if (!isGoogleRedirect) {
        if (seenUrls.has(canon)) return false;
        seenUrls.add(canon);
      }
    }

    // Title dedup (source-independent) — catches same article across SerpAPI queries and RSS
    const nt = normTitle(item.title);
    if (!nt) return false;
    if (seenTitles.has(nt)) return false;
    seenTitles.add(nt);

    return true;
  });

  // Filter expired (older than 30 days)
  const fresh = deduped.filter(item => {
    if (item.dateTs && now - item.dateTs > THIRTY_DAYS_MS) return false;
    return true;
  });

  const scored = fresh.map(item => {
    const fullText = (item.title || "") + " " + (item.snippet || "");
    const program = detectProgram(fullText);
    const score = item.score ?? scorePromo(fullText);
    return {
      title: item.title,
      snippet: item.snippet || "",
      source: item.source || "",
      date: item.date || "",
      dateTs: item.dateTs || null,
      // Only include link if it's a valid URL
      link: isValidUrl(item.link) ? item.link.trim() : "",
      programId: item.programId ?? program?.id ?? null,
      programShort: item.programShort ?? program?.short ?? null,
      score,
    };
  });

  // Sort: date desc (freshest first), then score desc
  const promos = scored
    .sort((a, b) => {
      const dateDiff = (b.dateTs || 0) - (a.dateTs || 0);
      if (dateDiff !== 0) return dateDiff;
      return b.score - a.score;
    })
    .slice(0, 10);

  return { promos, fetchedAt: new Date().toISOString() };
}
