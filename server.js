import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3001;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SERPAPI_KEY = process.env.SERPAPI_KEY || "e7bffc5ecd6f2cdea398e0dfd1489e4d8c8dac14636bb82f17d9434950567cab";
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || "7a33df2553msh195ddaf40ee376ep180429jsn506b3d5c2fcf";
const RAPIDAPI_HOST = "sky-scrapper.p.rapidapi.com";

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

// ── Google Flights via SerpAPI ──────────────────────────────────
app.get('/api/google-flights', async (req, res) => {
  try {
    const { origin, dest, depDate, retDate, cabin, passengers } = req.query;
    const travelClass = cabin === '1' ? 3 : 1;
    const params = new URLSearchParams({
      engine: 'google_flights',
      departure_id: origin,
      arrival_id: dest,
      outbound_date: depDate,
      currency: 'USD',
      hl: 'fr',
      travel_class: String(travelClass),
      adults: passengers || '1',
      api_key: SERPAPI_KEY,
    });
    if (retDate) params.set('return_date', retDate);
    const r = await fetch(`https://serpapi.com/search.json?${params}`);
    const data = await r.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Skyscanner via RapidAPI ─────────────────────────────────────
const entityCache = {};

async function getEntity(iata) {
  if (entityCache[iata]) return entityCache[iata];
  const r = await fetch(
    `https://${RAPIDAPI_HOST}/api/v1/flights/searchAirport?query=${iata}&locale=en-US`,
    { headers: { 'x-rapidapi-key': RAPIDAPI_KEY, 'x-rapidapi-host': RAPIDAPI_HOST } }
  );
  const j = await r.json();
  const match = j.data?.find(a => a.navigation?.relevantFlightParams?.skyId === iata);
  const p = match?.navigation?.relevantFlightParams || null;
  if (p) entityCache[iata] = p;
  return p;
}

app.get('/api/skyscanner', async (req, res) => {
  try {
    const { origin, dest, depDate, retDate, cabin, passengers } = req.query;
    const RH = { 'x-rapidapi-key': RAPIDAPI_KEY, 'x-rapidapi-host': RAPIDAPI_HOST };
    const [origE, destE] = await Promise.all([getEntity(origin), getEntity(dest)]);
    if (!origE || !destE) return res.status(400).json({ error: 'Aéroport introuvable' });
    const params = new URLSearchParams({
      originSkyId: origE.skyId,
      destinationSkyId: destE.skyId,
      originEntityId: origE.entityId,
      destinationEntityId: destE.entityId,
      date: depDate,
      cabinClass: cabin === '1' ? 'business' : 'economy',
      adults: passengers || '1',
      currency: 'USD',
      market: 'US',
      locale: 'en-US',
    });
    if (retDate) params.set('returnDate', retDate);
    const r = await fetch(
      `https://${RAPIDAPI_HOST}/api/v2/flights/searchFlights?${params}`,
      { headers: RH }
    );
    const data = await r.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Serve React app ─────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

app.listen(PORT, () => console.log(`Miles Optimizer running on port ${PORT}`));
