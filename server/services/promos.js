import { fetchRssPromos } from "./rssFeeds.js";

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
    const r = await fetch(`https://serpapi.com/search.json?${params}`);
    if (!r.ok) return [];
    const data = await r.json();
    return (data.news_results || []).map(item => ({
      title: item.title || "",
      snippet: item.snippet || "",
      source: item.source?.name || (typeof item.source === "string" ? item.source : ""),
      date: item.date || "",
      link: item.link || "",
    }));
  } catch {
    return [];
  }
}

export async function fetchPromos() {
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

  // Merge, deduplicate by title
  const seen = new Set();
  const all = [...serpItems, ...rss].filter(item => {
    if (!item.title || seen.has(item.title)) return false;
    seen.add(item.title);
    return true;
  });

  const scored = all.map(item => {
    const fullText = (item.title || "") + " " + (item.snippet || "");
    const program = detectProgram(fullText);
    const score = item.score ?? scorePromo(fullText);
    return {
      title: item.title,
      snippet: item.snippet || "",
      source: item.source || "",
      date: item.date || "",
      link: item.link || "",
      programId: item.programId ?? program?.id ?? null,
      programShort: item.programShort ?? program?.short ?? null,
      score,
    };
  });

  const promos = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 7);

  return { promos, fetchedAt: new Date().toISOString() };
}
