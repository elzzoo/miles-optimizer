import { Router } from "express";
import { searchGoogleFlights } from "../services/serpapi.js";
import { searchSkyscanner } from "../services/skyscanner.js";
import { fetchPromos } from "../services/promos.js";
import { getExchangeRates } from "../services/exchangeRates.js";
import { getWeather } from "../services/weather.js";
import { getCountryInfo } from "../services/countryInfo.js";

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
    const userMsg = e.message.includes("introuvable")
      ? e.message
      : `Service Google Flights temporairement indisponible: ${e.message}`;
    res.status(500).json({ error: userMsg });
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
    const userMsg = e.message.includes("Abonnement") || e.message.includes("not subscribed")
      ? "Abonnement RapidAPI expiré — vérifiez sky-scrapper sur rapidapi.com"
      : e.message.includes("RAPIDAPI_KEY")
      ? "Clé RapidAPI non configurée (RAPIDAPI_KEY)"
      : e.message.includes("introuvable")
      ? e.message
      : "Service Skyscanner temporairement indisponible";
    res.status(500).json({ error: userMsg });
  }
});

// Promos — cached 4h
const PROMOS_TTL = 4 * 60 * 60 * 1000;
let promosCache = null;

router.get("/promos", async (req, res) => {
  if (promosCache && Date.now() - promosCache.ts < PROMOS_TTL) {
    return res.json({ ...promosCache.data, _cached: true });
  }
  try {
    const data = await fetchPromos();
    promosCache = { data, ts: Date.now() };
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

export default router;
