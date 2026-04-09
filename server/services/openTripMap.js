import { airportsData } from "../data/airportsData.js";

const BASE = "https://api.opentripmap.com/0.1/en";
const KEY   = process.env.OPENTRIPMAP_KEY;

const cache = new Map();
const TTL   = 24 * 3600 * 1000;

async function fetchOTM(path) {
  const url = `${BASE}${path}&apikey=${KEY}&lang=en&format=json`;
  const r = await fetch(url, { headers: { "Accept": "application/json" }, signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error(`OpenTripMap ${r.status}`);
  return r.json();
}

/**
 * Get interesting destinations reachable from an origin IATA
 * We use a predefined list of major airports mapped to coordinates
 */
export async function getDestinationsFrom(originIata, limit = 12) {
  const cacheKey = `dest_${originIata}_${limit}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < TTL) return cached.data;

  // Hard-coded curated destinations with coordinates + IATA
  const DESTINATIONS = [
    { iata: "CDG", name: "Paris",      country: "France",       lat: 48.8566, lon: 2.3522,  continent: "EU" },
    { iata: "LHR", name: "Londres",    country: "Royaume-Uni",  lat: 51.5074, lon: -0.1278, continent: "EU" },
    { iata: "JFK", name: "New York",   country: "États-Unis",   lat: 40.7128, lon: -74.0060, continent: "NA" },
    { iata: "DXB", name: "Dubaï",      country: "Émirats",      lat: 25.2048, lon: 55.2708, continent: "ME" },
    { iata: "IST", name: "Istanbul",   country: "Turquie",      lat: 41.0082, lon: 28.9784, continent: "EU" },
    { iata: "CMN", name: "Casablanca", country: "Maroc",        lat: 33.5731, lon: -7.5898, continent: "AF" },
    { iata: "NBO", name: "Nairobi",    country: "Kenya",        lat: -1.2921, lon: 36.8219, continent: "AF" },
    { iata: "ACC", name: "Accra",      country: "Ghana",        lat: 5.5600,  lon: -0.2057, continent: "AF" },
    { iata: "AMS", name: "Amsterdam",  country: "Pays-Bas",     lat: 52.3676, lon: 4.9041,  continent: "EU" },
    { iata: "MIA", name: "Miami",      country: "États-Unis",   lat: 25.7617, lon: -80.1918, continent: "NA" },
    { iata: "GVA", name: "Genève",     country: "Suisse",       lat: 46.2044, lon: 6.1432,  continent: "EU" },
    { iata: "BKK", name: "Bangkok",    country: "Thaïlande",    lat: 13.7563, lon: 100.5018, continent: "AS" },
    { iata: "SIN", name: "Singapour",  country: "Singapour",    lat: 1.3521,  lon: 103.8198, continent: "AS" },
    { iata: "YUL", name: "Montréal",   country: "Canada",       lat: 45.5017, lon: -73.5673, continent: "NA" },
    { iata: "BCN", name: "Barcelone",  country: "Espagne",      lat: 41.3851, lon: 2.1734,  continent: "EU" },
    { iata: "MRS", name: "Marseille",  country: "France",       lat: 43.2965, lon: 5.3698,  continent: "EU" },
    { iata: "LOS", name: "Lagos",      country: "Nigéria",      lat: 6.5244,  lon: 3.3792,  continent: "AF" },
    { iata: "ABJ", name: "Abidjan",    country: "Côte d\'Ivoire", lat: 5.3600, lon: -4.0083, continent: "AF" },
    { iata: "ADD", name: "Addis-Abeba",country: "Éthiopie",     lat: 9.0054,  lon: 38.7636, continent: "AF" },
    { iata: "CPT", name: "Le Cap",     country: "Afrique du Sud", lat: -33.9249, lon: 18.4241, continent: "AF" },
  ].filter(d => d.iata !== originIata);

  // Return up to limit destinations
  const data = DESTINATIONS.slice(0, limit);
  cache.set(cacheKey, { data, ts: Date.now() });
  return data;
}
