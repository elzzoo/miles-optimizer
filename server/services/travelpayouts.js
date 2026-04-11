const TOKEN  = process.env.TRAVELPAYOUTS_TOKEN;
const MARKER = process.env.TRAVELPAYOUTS_MARKER || "714947";
const BASE   = "https://api.travelpayouts.com";

const priceCache = new Map();
const TTL        = 6 * 3600 * 1000; // 6h in-memory cache

function getCached(key) {
  const e = priceCache.get(key);
  if (e && Date.now() - e.ts < TTL) return e.data;
  return undefined;
}

/**
 * Search live prices for specific dates via Aviasales v3 API.
 * Returns array of flight offers mapped to internal format, or [] on failure.
 */
export async function getPricesForDates({ origin, dest, depDate, retDate, cabin = 0, passengers = 1 }) {
  if (!TOKEN) return [];

  const key = `dates_${origin}_${dest}_${depDate}_${retDate}_${cabin}`;
  const cached = getCached(key);
  if (cached !== undefined) return cached;

  try {
    const params = new URLSearchParams({
      origin:       origin,
      destination:  dest,
      departure_at: depDate,
      token:        TOKEN,
      currency:     "usd",
      limit:        "10",
    });
    if (retDate) params.set("return_at", retDate);
    if (cabin === 1 || cabin === "1") params.set("cabin_class", "business");

    const r = await fetch(`${BASE}/aviasales/v3/prices_for_dates?${params}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) throw new Error(`TravelPayouts ${r.status}`);

    const json = await r.json();
    if (!json.success || !Array.isArray(json.data)) return [];

    const mapped = json.data
      .filter(f => f.price)
      .map(f => ({
        price:    f.price,
        airline:  f.airline || "—",
        direct:   (f.transfers ?? 0) === 0,
        stops:    f.transfers ?? 0,
        duration: f.duration_to ? Math.round(f.duration_to / 60) : undefined,
        depTime:  f.departure_at || undefined,
        source:   "travelpayouts",
        bookUrl:  f.link ? `https://www.aviasales.com${f.link}?marker=${MARKER}` : null,
      }))
      .sort((a, b) => a.price - b.price)
      .slice(0, 8);

    priceCache.set(key, { data: mapped, ts: Date.now() });
    return mapped;
  } catch (e) {
    console.warn("[travelpayouts] getPricesForDates:", e.message);
    return [];
  }
}

/**
 * Get cheapest one-way price for a route in a given month (for /best-deals).
 */
export async function getCheapestPrice(origin, dest, month = null) {
  if (!TOKEN) return null;

  if (!month) {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    month = d.toISOString().slice(0, 7);
  }

  const key = `cheap_${origin}_${dest}_${month}`;
  const cached = getCached(key);
  if (cached !== undefined) return cached;

  try {
    const url =
      `${BASE}/v1/prices/cheap` +
      `?origin=${origin}&destination=${dest}` +
      `&depart_date=${month}&currency=usd&token=${TOKEN}`;

    const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!r.ok) throw new Error(`Travelpayouts ${r.status}`);

    const json = await r.json();
    if (!json.success || !json.data) {
      priceCache.set(key, { data: null, ts: Date.now() });
      return null;
    }

    const destData = json.data[dest] ?? json.data[dest.toUpperCase()] ?? {};
    let minPrice = null;
    for (const entry of Object.values(destData)) {
      const p = entry?.price;
      if (p && (minPrice === null || p < minPrice)) minPrice = p;
    }

    priceCache.set(key, { data: minPrice, ts: Date.now() });
    return minPrice;
  } catch (e) {
    console.warn("[travelpayouts] getCheapestPrice:", e.message);
    return null;
  }
}

/**
 * Build an Aviasales affiliate deep-link (date format: DDMM).
 */
export function buildAffiliateLink(origin, dest, depDate = null, retDate = null) {
  const marker = MARKER ? `?marker=${MARKER}` : "";

  if (!depDate) {
    return `https://www.aviasales.com/search/${origin}${dest}${marker}`;
  }

  const dep = new Date(depDate);
  const dd  = String(dep.getDate()).padStart(2, "0");
  const mm  = String(dep.getMonth() + 1).padStart(2, "0");

  if (retDate) {
    const ret = new Date(retDate);
    const rdd = String(ret.getDate()).padStart(2, "0");
    const rmm = String(ret.getMonth() + 1).padStart(2, "0");
    return `https://www.aviasales.com/search/${origin}${dd}${mm}${dest}${rdd}${rmm}${marker}`;
  }

  return `https://www.aviasales.com/search/${origin}${dd}${mm}${dest}1${marker}`;
}

export const tpConfigured = () => !!TOKEN;
