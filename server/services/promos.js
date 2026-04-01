const SERPAPI_KEY = process.env.SERPAPI_KEY;

// All known programs + generic airline miles keywords for broad search
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

// High-value promo keywords for scoring
const PROMO_SIGNALS = [
  { words: ["100%", "double", "triple", "triple miles"], score: 5 },
  { words: ["80%", "50%", "bonus miles", "miles bonus"], score: 4 },
  { words: ["promo", "promotion", "offre", "deal", "offer"], score: 3 },
  { words: ["30%", "40%", "remise", "discount", "sale"], score: 2 },
  { words: ["miles", "points", "avios", "award"], score: 1 },
];

function scorePromo(text) {
  const lower = text.toLowerCase();
  return PROMO_SIGNALS.reduce((total, sig) => {
    return total + (sig.words.some(w => lower.includes(w)) ? sig.score : 0);
  }, 0);
}

function detectProgram(text) {
  const lower = text.toLowerCase();
  for (const p of PROGRAM_MAP) {
    if (p.keywords.some(k => lower.includes(k))) return { id: p.id, short: p.short };
  }
  return null;
}

async function fetchNews(query) {
  const params = new URLSearchParams({
    engine: "google_news",
    q: query,
    hl: "en",
    gl: "us",
    api_key: SERPAPI_KEY,
  });
  const r = await fetch(`https://serpapi.com/search.json?${params}`);
  if (!r.ok) throw new Error(`SerpAPI news ${r.status}`);
  const data = await r.json();
  return data.news_results || [];
}

export async function fetchPromos() {
  if (!SERPAPI_KEY) {
    return { promos: [], fetchedAt: new Date().toISOString(), error: "SERPAPI_KEY not configured" };
  }

  // Two parallel queries: one broad for all airlines, one targeted for big bonuses
  const [broadResults, bonusResults] = await Promise.allSettled([
    fetchNews("airline miles points bonus promo 2025 2026 (Aeroplan OR LifeMiles OR \"Flying Blue\" OR MileagePlus OR Avios OR AAdvantage OR \"Miles Smiles\")"),
    fetchNews("miles bonus 50% 80% 100% double triple points airline loyalty 2026"),
  ]);

  const allNews = [
    ...(broadResults.status === "fulfilled" ? broadResults.value : []),
    ...(bonusResults.status === "fulfilled" ? bonusResults.value : []),
  ];

  // Deduplicate by title
  const seen = new Set();
  const unique = allNews.filter(item => {
    if (!item.title || seen.has(item.title)) return false;
    seen.add(item.title);
    return true;
  });

  // Score and sort
  const scored = unique.map(item => {
    const fullText = (item.title || "") + " " + (item.snippet || "");
    const program = detectProgram(fullText);
    const score = scorePromo(fullText);
    return {
      title: item.title,
      snippet: item.snippet || "",
      source: item.source?.name || (typeof item.source === "string" ? item.source : ""),
      date: item.date || "",
      link: item.link || "",
      programId: program?.id || null,
      programShort: program?.short || null,
      score,
    };
  });

  // Sort by score desc, take top 5
  const promos = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return { promos, fetchedAt: new Date().toISOString() };
}
