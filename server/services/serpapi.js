function fetchWithTimeout(url, options = {}, ms = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timer));
}

const SERPAPI_KEY = process.env.SERPAPI_KEY;

export async function searchGoogleFlights({ origin, dest, depDate, retDate, cabin, passengers }) {
  if (!SERPAPI_KEY) throw new Error("SERPAPI_KEY not configured");

  const params = new URLSearchParams({
    engine: "google_flights",
    departure_id: origin,
    arrival_id: dest,
    outbound_date: depDate,
    currency: "USD",
    hl: "fr",
    travel_class: cabin === "1" ? "3" : "1",
    adults: passengers || "1",
    type: retDate ? "1" : "2",   // 1=round-trip (nécessite return_date), 2=one-way
    api_key: SERPAPI_KEY,
  });
  if (retDate) params.set("return_date", retDate);

  const r = await fetchWithTimeout(`https://serpapi.com/search.json?${params}`, {}, 12000);
  if (!r.ok) {
    const body = await r.text();
    let msg = `SerpAPI returned ${r.status}`;
    try { msg = JSON.parse(body).error || msg; } catch {}
    throw new Error(msg);
  }
  return r.json();
}
