function fetchWithTimeout(url, options = {}, ms = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timer));
}

const RATES_URL = "https://open.er-api.com/v6/latest/USD";
const TTL = 6 * 60 * 60 * 1000; // 6h
let cache = null;

export async function getExchangeRates() {
  if (cache && Date.now() - cache.ts < TTL) return cache.data;
  const r = await fetchWithTimeout(RATES_URL, {}, 8000);
  if (!r.ok) throw new Error(`Exchange rates API: ${r.status}`);
  const json = await r.json();
  const data = {
    USD_EUR: json.rates.EUR,
    USD_XOF: json.rates.XOF,
    USD_GBP: json.rates.GBP,
    updatedAt: json.time_last_update_utc,
  };
  cache = { data, ts: Date.now() };
  return data;
}
