const SERPAPI_KEY = process.env.SERPAPI_KEY;

const PROGRAM_MAP = [
  { id: "aeroplan",    keywords: ["aeroplan", "air canada"] },
  { id: "lifemiles",   keywords: ["lifemiles", "avianca"] },
  { id: "flyingblue",  keywords: ["flying blue", "air france", "klm"] },
  { id: "united",      keywords: ["mileageplus", "united miles"] },
  { id: "turkish",     keywords: ["miles smiles", "turkish miles"] },
  { id: "qatar",       keywords: ["qatar avios"] },
  { id: "ba",          keywords: ["british airways avios", "ba avios"] },
  { id: "aadvantage",  keywords: ["aadvantage", "american airlines miles"] },
];

function detectProgram(text) {
  const lower = text.toLowerCase();
  for (const p of PROGRAM_MAP) {
    if (p.keywords.some(k => lower.includes(k))) return p.id;
  }
  return null;
}

export async function fetchPromos() {
  if (!SERPAPI_KEY) {
    return { promos: [], fetchedAt: new Date().toISOString(), error: "SERPAPI_KEY not configured" };
  }

  const params = new URLSearchParams({
    engine: "google_news",
    q: "miles bonus promo 2026 (Aeroplan OR LifeMiles OR \"Flying Blue\" OR MileagePlus OR \"Miles Smiles\" OR Avios OR AAdvantage)",
    hl: "fr",
    gl: "fr",
    api_key: SERPAPI_KEY,
  });

  const r = await fetch(`https://serpapi.com/search.json?${params}`);
  if (!r.ok) throw new Error(`SerpAPI news: ${r.status}`);
  const data = await r.json();

  const news = data.news_results || [];
  const promos = news.slice(0, 8).map(item => ({
    title: item.title,
    snippet: item.snippet || "",
    source: item.source?.name || item.source || "",
    date: item.date || "",
    link: item.link,
    programId: detectProgram((item.title || "") + " " + (item.snippet || "")),
  }));

  return { promos, fetchedAt: new Date().toISOString() };
}
