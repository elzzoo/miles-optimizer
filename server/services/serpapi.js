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
    api_key: SERPAPI_KEY,
  });
  if (retDate) params.set("return_date", retDate);

  const r = await fetch(`https://serpapi.com/search.json?${params}`);
  if (!r.ok) throw new Error(`SerpAPI returned ${r.status}`);
  return r.json();
}
