import { Router } from "express";
import { searchGoogleFlights } from "../services/serpapi.js";
import { searchSkyscanner } from "../services/skyscanner.js";
import { fetchPromos } from "../services/promos.js";
import { getExchangeRates } from "../services/exchangeRates.js";
import { getWeather } from "../services/weather.js";
import { getCountryInfo } from "../services/countryInfo.js";
import { getCheapestPrice, tpConfigured } from "../services/travelpayouts.js";
import { searchDuffelFlights, duffelConfigured } from "../services/duffel.js";

const router = Router();

// Flight results cache — 12h
const CACHE_TTL = 12 * 60 * 60 * 1000;
const apiCache = new Map();

function getCached(key) {
  const entry = apiCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) { apiCache.delete(key); return null; }
  return entry.data;
}
function setCache(key, data) {
  apiCache.set(key, { data, ts: Date.now() });
  if (apiCache.size > 500) apiCache.delete(apiCache.keys().next().value);
}

const IATA_RE = /^[A-Z]{3}$/;

function validateParams(req, res) {
  const { origin, dest, depDate, passengers } = req.query;
  if (!origin || !dest) return res.status(400).json({ error: "Paramètres origin et dest requis" });
  if (!IATA_RE.test(origin) || !IATA_RE.test(dest)) return res.status(400).json({ error: "Code IATA invalide (3 lettres majuscules)" });
  if (origin === dest) return res.status(400).json({ error: "Origin et destination doivent être différents" });
  if (!depDate || !/^\d{4}-\d{2}-\d{2}$/.test(depDate)) return res.status(400).json({ error: "Format depDate invalide (YYYY-MM-DD)" });
  if (passengers && (isNaN(passengers) || passengers < 1 || passengers > 9)) return res.status(400).json({ error: "Passengers doit être entre 1 et 9" });
  return null;
}

router.get("/google-flights", async (req, res) => {
  const err = validateParams(req, res);
  if (err) return;
  const cacheKey = `gf:${JSON.stringify(req.query)}`;
  const cached = getCached(cacheKey);
  if (cached) return res.json({ ...cached, _cached: true });
  try {
    const data = await searchGoogleFlights(req.query);
    setCache(cacheKey, data);
    res.json(data);
  } catch (e) {
    console.error("[google-flights]", e.message, e.stack?.split('\n')[1]);
    const userMsg = e.message.includes("not configured") || e.message.includes("SERPAPI")
      ? "SERPAPI_KEY non configurée — Google Flights désactivé"
      : e.message.includes("introuvable")
      ? e.message
      : `Service Google Flights indisponible: ${e.message}`;
    res.status(503).json({ error: userMsg, code: "GOOGLE_FLIGHTS_UNAVAILABLE" });
  }
});

router.get("/skyscanner", async (req, res) => {
  const err = validateParams(req, res);
  if (err) return;
  const cacheKey = `sky:${JSON.stringify(req.query)}`;
  const cached = getCached(cacheKey);
  if (cached) return res.json({ ...cached, _cached: true });
  try {
    const data = await searchSkyscanner(req.query);
    setCache(cacheKey, data);
    res.json(data);
  } catch (e) {
    console.error("[skyscanner]", e.message, e.stack?.split('\n')[1]);
    // Pass the full message for quota/subscription/config errors — already localised in skyscanner.js
    const userMsg = e.message.includes("Quota") || e.message.includes("quota") || e.message.includes("exceeded") || e.message.includes("429") || e.message.includes("MONTHLY")
      ? e.message
      : e.message.includes("Abonnement") || e.message.includes("not subscribed")
      ? e.message
      : e.message.includes("RAPIDAPI_KEY")
      ? "Clé RapidAPI non configurée (RAPIDAPI_KEY manquante dans les variables d'environnement)"
      : e.message.includes("introuvable")
      ? e.message
      : `Service Skyscanner indisponible: ${e.message.slice(0, 120)}`;
    res.status(503).json({ error: userMsg, code: "SKYSCANNER_UNAVAILABLE" });
  }
});

// Promos — cached 2h
// Version string: bump to invalidate stale in-memory cache on deploy
const PROMOS_CACHE_VERSION = "v3";
const PROMOS_TTL = 2 * 60 * 60 * 1000;
let promosCache = null;

router.get("/promos", async (req, res) => {
  // Invalidate cache if version changed (e.g. after a deploy that fixes dedup)
  if (promosCache && promosCache.version !== PROMOS_CACHE_VERSION) {
    promosCache = null;
  }
  if (promosCache && Date.now() - promosCache.ts < PROMOS_TTL) {
    return res.json({ ...promosCache.data, _cached: true });
  }
  try {
    const data = await fetchPromos();
    promosCache = { data, ts: Date.now(), version: PROMOS_CACHE_VERSION };
    res.json(data);
  } catch (e) {
    console.error("[api]", e.message);
    res.status(500).json({ error: "Service temporairement indisponible", promos: [] });
  }
});

// Live exchange rates — 6h cache inside service
router.get("/rates", async (req, res) => {
  try {
    const data = await getExchangeRates();
    res.json(data);
  } catch {
    res.json({ USD_EUR: 0.92, USD_XOF: 568, USD_GBP: 0.79, updatedAt: null, _fallback: true });
  }
});

// Destination weather via Open-Meteo — 3h cache inside service
router.get("/weather", async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lon = parseFloat(req.query.lon);
  if (isNaN(lat) || isNaN(lon)) return res.status(400).json({ error: "lat/lon requis" });
  try {
    const data = await getWeather(lat, lon);
    res.json(data);
  } catch (e) {
    console.error("[api]", e.message);
    res.status(500).json({ error: "Service temporairement indisponible" });
  }
});

// Country info via REST Countries — 24h cache inside service
router.get("/country", async (req, res) => {
  const iso2 = (req.query.iso2 || "").toUpperCase();
  if (!/^[A-Z]{2}$/.test(iso2)) return res.status(400).json({ error: "iso2 invalide" });
  try {
    const data = await getCountryInfo(iso2);
    res.json(data);
  } catch (e) {
    console.error("[api]", e.message);
    res.status(500).json({ error: "Service temporairement indisponible" });
  }
});

router.get("/health", (req, res) => {
  res.json({ ok: true, cacheSize: apiCache.size, ts: new Date().toISOString() });
});

// ── Travelpayouts: cheapest price for a route ────────────────────────────────
router.get("/tp-prices", async (req, res) => {
  if (!tpConfigured()) {
    return res.status(503).json({ error: "Travelpayouts non configuré", configured: false });
  }

  const { origin, dest, month } = req.query;
  if (!origin || !dest) return res.status(400).json({ error: "origin et dest requis" });

  const cacheKey = `tp:${origin}:${dest}:${month || "next"}`;
  const cached   = getCached(cacheKey);
  if (cached) return res.json({ ...cached, _cached: true });

  try {
    const price = await getCheapestPrice(origin, dest, month || null);
    const data  = { price, origin, dest, month: month || null, configured: true };
    setCache(cacheKey, data);
    res.json(data);
  } catch (e) {
    console.error("[tp-prices]", e.message);
    res.status(503).json({ error: e.message, configured: true });
  }
});

// ── Duffel: live flight offers ────────────────────────────────────────────────
router.get("/duffel-flights", async (req, res) => {
  if (!duffelConfigured()) {
    return res.status(503).json({
      error: "Duffel non configuré — DUFFEL_API_TOKEN manquant",
      code:  "DUFFEL_UNAVAILABLE",
    });
  }

  const err = validateParams(req, res);
  if (err) return;

  const cacheKey = `duffel:${JSON.stringify(req.query)}`;
  const cached   = getCached(cacheKey);
  if (cached) return res.json({ ...cached, _cached: true });

  try {
    const data = await searchDuffelFlights(req.query);
    setCache(cacheKey, data);
    res.json(data);
  } catch (e) {
    console.error("[duffel-flights]", e.message);
    res.status(503).json({ error: `Service Duffel indisponible: ${e.message}`, code: "DUFFEL_UNAVAILABLE" });
  }
});

export default router;
