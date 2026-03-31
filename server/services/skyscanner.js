import * as airportCache from "../cache/airportCache.js";

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = "sky-scrapper.p.rapidapi.com";

async function getEntity(iata) {
  const cached = airportCache.get(iata);
  if (cached) return cached;

  if (!RAPIDAPI_KEY) throw new Error("RAPIDAPI_KEY not configured");

  const r = await fetch(
    `https://${RAPIDAPI_HOST}/api/v1/flights/searchAirport?query=${iata}&locale=en-US`,
    { headers: { "x-rapidapi-key": RAPIDAPI_KEY, "x-rapidapi-host": RAPIDAPI_HOST } }
  );
  if (!r.ok) throw new Error(`Airport lookup returned ${r.status}`);

  const j = await r.json();
  const match = j.data?.find(a => a.navigation?.relevantFlightParams?.skyId === iata);
  const p = match?.navigation?.relevantFlightParams || null;
  if (p) airportCache.set(iata, p);
  return p;
}

export async function searchSkyscanner({ origin, dest, depDate, retDate, cabin, passengers }) {
  if (!RAPIDAPI_KEY) throw new Error("RAPIDAPI_KEY not configured");

  const [origE, destE] = await Promise.all([getEntity(origin), getEntity(dest)]);
  if (!origE || !destE) throw new Error("Aéroport introuvable");

  const params = new URLSearchParams({
    originSkyId: origE.skyId,
    destinationSkyId: destE.skyId,
    originEntityId: origE.entityId,
    destinationEntityId: destE.entityId,
    date: depDate,
    cabinClass: cabin === "1" ? "business" : "economy",
    adults: passengers || "1",
    currency: "USD",
    market: "US",
    locale: "en-US",
  });
  if (retDate) params.set("returnDate", retDate);

  const r = await fetch(
    `https://${RAPIDAPI_HOST}/api/v2/flights/searchFlights?${params}`,
    { headers: { "x-rapidapi-key": RAPIDAPI_KEY, "x-rapidapi-host": RAPIDAPI_HOST } }
  );
  if (!r.ok) throw new Error(`Skyscanner returned ${r.status}`);
  return r.json();
}
