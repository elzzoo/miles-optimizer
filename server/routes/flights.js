import { Router } from "express";
import { searchGoogleFlights }              from "../services/serpapi.js";
import { searchDuffelFlights, duffelConfigured } from "../services/duffel.js";
import { getPricesForDates, getCheapestPrice, buildAffiliateLink, tpConfigured } from "../services/travelpayouts.js";
import { fetchPromos }      from "../services/promos.js";
import { getExchangeRates } from "../services/exchangeRates.js";
import { getWeather }       from "../services/weather.js";
import { getCountryInfo }   from "../services/countryInfo.js";
import { cacheGet, cacheSet } from "../services/redis.js";

const router = Router();

// ── In-process short-term cache (fallback when Redis not configured) ──────────
const CACHE_TTL = 30 * 60 * 1000; // 30 min
const apiCache  = new Map();

function getCached(key) {
  const e = apiCache.get(key);
  if (!e) return null;
  if (Date.now() - e.ts > CACHE_TTL) { apiCache.delete(key); return null; }
  return e.data;
}
function setCache(key, data) {
  apiCache.set(key, { data, ts: Date.now() });
  if (apiCache.size > 500) apiCache.delete(apiCache.keys().next().value);
}

const IATA_RE = /^[A-Z]{3}$/;

function validateParams(req, res) {
  const { origin, dest, depDate, passengers } = req.query;
  if (!origin || !dest)
    return res.status(400).json({ error: "Paramètres origin et dest requis" });
  if (!IATA_RE.test(origin) || !IATA_RE.test(dest))
    return res.status(400).json({ error: "Code IATA invalide (3 lettres majuscules)" });
  if (origin === dest)
    return res.status(400).json({ error: "Origin et destination doivent être différents" });
  if (!depDate || !/^\d{4}-\d{2}-\d{2}$/.test(depDate))
    return res.status(400).json({ error: "Format depDate invalide (YYYY-MM-DD)" });
  if (passengers && (isNaN(passengers) || passengers < 1 || passengers > 9))
    return res.status(400).json({ error: "Passengers doit être entre 1 et 9" });
  return null;
}

// ── /api/flights — cascading search (Duffel → TravelPayouts → SerpAPI) ────────
router.get("/flights", async (req, res) => {
  const err = validateParams(req, res);
  if (err) return;

  const { origin, dest, depDate, retDate, cabin, passengers } = req.query;
  const cacheKey = `flights:${origin}:${dest}:${depDate}:${retDate || ""}:${cabin || "0"}:${passengers || "1"}`;

  // 1. Redis cache
  const redisHit = await cacheGet(cacheKey);
  if (redisHit) return res.json({ ...redisHit, _cached: true, _cacheSource: "redis" });

  // 2. In-process cache
  const memHit = getCached(cacheKey);
  if (memHit) return res.json({ ...memHit, _cached: true, _cacheSource: "memory" });

  let result = null;
  const errors = [];

  // 3. Duffel (primary)
  if (duffelConfigured()) {
    try {
      const { flights, source } = await searchDuffelFlights({ origin, dest, depDate, retDate, cabin, passengers });
      if (flights.length > 0) {
        result = { flights, source, origin, dest, depDate, retDate };
      }
    } catch (e) {
      console.warn("[flights] Duffel failed:", e.message);
      errors.push(`Duffel: ${e.message}`);
    }
  }

  // 4. TravelPayouts (fallback)
  if (!result && tpConfigured()) {
    try {
      const flights = await getPricesForDates({ origin, dest, depDate, retDate, cabin, passengers });
      if (flights.length > 0) {
        result = { flights, source: "travelpayouts", origin, dest, depDate, retDate };
      }
    } catch (e) {
      console.warn("[flights] TravelPayouts failed:", e.message);
      errors.push(`TravelPayouts: ${e.message}`);
    }
  }

  // 5. SerpAPI (last resort)
  if (!result) {
    try {
      const data = await searchGoogleFlights({ origin, dest, depDate, retDate, cabin, passengers });
      const all  = [...(data.best_flights || []), ...(data.other_flights || [])];
      if (all.length > 0) {
        const flights = all.map(f => ({
          price:    f.price,
          airline:  f.flights?.[0]?.airline || "—",
          direct:   (f.flights?.length || 1) === 1 && (f.layovers?.length || 0) === 0,
          stops:    f.layovers?.length || 0,
          duration: f.total_duration,
          depTime:  f.flights?.[0]?.departure_airport?.time,
          source:   "serpapi",
        })).filter(f => f.price).sort((a, b) => a.price - b.price).slice(0, 8);
        result = { flights, source: "serpapi", origin, dest, depDate, retDate };
      }
    } catch (e) {
      console.warn("[flights] SerpAPI failed:", e.message);
      errors.push(`SerpAPI: ${e.message}`);
    }
  }

  // 6. All failed
  if (!result) {
    return res.status(503).json({
      flights: [],
      source:  "none",
      error:   "Prix indisponibles momentanément",
      errors,
      origin, dest, depDate, retDate,
    });
  }

  // 7. Store in cache
  setCache(cacheKey, result);
  cacheSet(cacheKey, result, 1800).catch(() => {});

  res.json(result);
});

// ── Legacy endpoints (kept for backward compat, not used by frontend) ─────────

router.get("/google-flights", async (req, res) => {
  const err = validateParams(req, res);
  if (err) return;
  try {
    const data = await searchGoogleFlights(req.query);
    res.json(data);
  } catch (e) {
    res.status(503).json({ error: e.message, code: "GOOGLE_FLIGHTS_UNAVAILABLE" });
  }
});

// ── Promos ────────────────────────────────────────────────────────────────────
const PROMOS_CACHE_VERSION = "v3";
const PROMOS_TTL = 2 * 60 * 60 * 1000;
let promosCache = null;

router.get("/promos", async (req, res) => {
  if (promosCache && promosCache.version !== PROMOS_CACHE_VERSION) promosCache = null;
  if (promosCache && Date.now() - promosCache.ts < PROMOS_TTL) {
    return res.json({ ...promosCache.data, _cached: true });
  }
  try {
    const data = await fetchPromos();
    promosCache = { data, ts: Date.now(), version: PROMOS_CACHE_VERSION };
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: "Service temporairement indisponible", promos: [] });
  }
});

// ── Exchange rates ────────────────────────────────────────────────────────────
router.get("/rates", async (req, res) => {
  try {
    res.json(await getExchangeRates());
  } catch {
    res.json({ USD_EUR: 0.92, USD_XOF: 568, USD_GBP: 0.79, updatedAt: null, _fallback: true });
  }
});

// ── Weather ───────────────────────────────────────────────────────────────────
router.get("/weather", async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lon = parseFloat(req.query.lon);
  if (isNaN(lat) || isNaN(lon)) return res.status(400).json({ error: "lat/lon requis" });
  try {
    res.json(await getWeather(lat, lon));
  } catch (e) {
    res.status(500).json({ error: "Service temporairement indisponible" });
  }
});

// ── Country info ──────────────────────────────────────────────────────────────
router.get("/country", async (req, res) => {
  const iso2 = (req.query.iso2 || "").toUpperCase();
  if (!/^[A-Z]{2}$/.test(iso2)) return res.status(400).json({ error: "iso2 invalide" });
  try {
    res.json(await getCountryInfo(iso2));
  } catch (e) {
    res.status(500).json({ error: "Service temporairement indisponible" });
  }
});

// ── Travelpayouts: cheapest price for deals ───────────────────────────────────
router.get("/tp-prices", async (req, res) => {
  if (!tpConfigured()) {
    return res.status(503).json({ error: "Travelpayouts non configuré", configured: false });
  }
  const { origin, dest, month } = req.query;
  if (!origin || !dest) return res.status(400).json({ error: "origin et dest requis" });

  try {
    const price = await getCheapestPrice(origin, dest, month || null);
    res.json({ price, origin, dest, month: month || null, configured: true });
  } catch (e) {
    res.status(503).json({ error: e.message, configured: true });
  }
});

// ── Health ────────────────────────────────────────────────────────────────────
router.get("/health", (req, res) => {
  res.json({ ok: true, cacheSize: apiCache.size, ts: new Date().toISOString() });
});

export default router;
