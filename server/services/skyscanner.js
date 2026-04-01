import * as airportCache from "../cache/airportCache.js";

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = "sky-scrapper.p.rapidapi.com";
const RH = () => ({ "x-rapidapi-key": RAPIDAPI_KEY, "x-rapidapi-host": RAPIDAPI_HOST });

async function getEntity(iata) {
  const cached = airportCache.get(iata);
  if (cached) return cached;

  if (!RAPIDAPI_KEY) throw new Error("RAPIDAPI_KEY not configured");

  // Try exact IATA match first, then city name search as fallback
  for (const query of [iata, iata.toLowerCase()]) {
    const r = await fetch(
      `https://${RAPIDAPI_HOST}/api/v1/flights/searchAirport?query=${query}&locale=en-US`,
      { headers: RH() }
    );
    if (!r.ok) throw new Error(`Airport lookup returned ${r.status}`);

    const j = await r.json();
    if (!j.data?.length) continue;

    // Try exact skyId match first
    let match = j.data.find(a => a.navigation?.relevantFlightParams?.skyId === iata);
    // Fallback: first result that has a skyId
    if (!match) match = j.data.find(a => a.navigation?.relevantFlightParams?.skyId);

    const p = match?.navigation?.relevantFlightParams || null;
    if (p) {
      airportCache.set(iata, p);
      return p;
    }
  }
  return null;
}

async function pollFlights(params, headers, maxAttempts = 3) {
  let sessionId = null;
  let data = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const searchParams = new URLSearchParams(params);
    if (sessionId) searchParams.set("sessionId", sessionId);

    const r = await fetch(
      `https://${RAPIDAPI_HOST}/api/v2/flights/searchFlights?${searchParams}`,
      { headers }
    );

    if (!r.ok) {
      const body = await r.text();
      throw new Error(`Skyscanner returned ${r.status}: ${body.slice(0, 200)}`);
    }

    data = await r.json();

    // Extract sessionId for polling
    if (data.data?.context?.sessionId) sessionId = data.data.context.sessionId;
    if (data.sessionId) sessionId = data.sessionId;

    const status = data.data?.context?.status || data.status;

    // If complete or has itineraries, return
    if (status === "complete" || (data.data?.itineraries?.length > 0)) {
      return data;
    }

    // If incomplete and more attempts left, wait 1.5s then retry
    if (status === "incomplete" && attempt < maxAttempts - 1) {
      await new Promise(res => setTimeout(res, 1500));
    } else {
      break;
    }
  }

  return data;
}

export async function searchSkyscanner({ origin, dest, depDate, retDate, cabin, passengers }) {
  if (!RAPIDAPI_KEY) throw new Error("RAPIDAPI_KEY not configured");

  const [origE, destE] = await Promise.all([getEntity(origin), getEntity(dest)]);

  if (!origE) throw new Error(`Aéroport introuvable: ${origin}`);
  if (!destE) throw new Error(`Aéroport introuvable: ${dest}`);

  const params = {
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
    sortBy: "best",
  };
  if (retDate) params.returnDate = retDate;

  return pollFlights(params, RH());
}
