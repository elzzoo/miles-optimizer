const TOKEN  = process.env.TRAVELPAYOUTS_TOKEN;
const MARKER = process.env.TRAVELPAYOUTS_MARKER;
const BASE   = "https://api.travelpayouts.com";

const cache = new Map();
const TTL   = 6 * 3600 * 1000; // 6h

function getCached(key) {
  const e = cache.get(key);
  if (e && Date.now() - e.ts < TTL) return e.data;
  return undefined;
}

/**
 * Get cheapest one-way price for a route in a given month.
 * @param {string} origin  IATA origin
 * @param {string} dest    IATA destination
 * @param {string} [month] YYYY-MM — defaults to next calendar month
 * @returns {Promise<number|null>}
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
      cache.set(key, { data: null, ts: Date.now() });
      return null;
    }

    // data is keyed by destination IATA, then by transfer count "0","1",...
    const destData = json.data[dest] ?? json.data[dest.toUpperCase()] ?? {};
    let minPrice = null;
    for (const entry of Object.values(destData)) {
      const p = entry?.price;
      if (p && (minPrice === null || p < minPrice)) minPrice = p;
    }

    cache.set(key, { data: minPrice, ts: Date.now() });
    return minPrice;
  } catch (e) {
    console.warn("[travelpayouts] getCheapestPrice:", e.message);
    return null;
  }
}

/**
 * Build an Aviasales affiliate deep-link.
 * Date format in URL: DDMM (e.g. 1505 = May 15)
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

export const tpConfigured = () => !!(TOKEN && MARKER);
