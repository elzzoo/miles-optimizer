import { Router } from "express";
import { searchGoogleFlights } from "../services/serpapi.js";
import { searchSkyscanner } from "../services/skyscanner.js";

const router = Router();

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

function validateParams(req, res) {
  const { origin, dest, depDate, passengers } = req.query;
  if (!origin || !dest) return res.status(400).json({ error: "Paramètres origin et dest requis" });
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
    res.status(500).json({ error: e.message });
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
    res.status(500).json({ error: e.message });
  }
});

router.get("/health", (req, res) => {
  res.json({ ok: true, cacheSize: apiCache.size, ts: new Date().toISOString() });
});

export default router;
