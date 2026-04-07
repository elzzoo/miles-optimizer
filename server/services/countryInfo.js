function fetchWithTimeout(url, options = {}, ms = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timer));
}

const TTL = 24 * 60 * 60 * 1000; // 24h — country data rarely changes
const cache = new Map();

export async function getCountryInfo(iso2) {
  const key = iso2.toUpperCase();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.ts < TTL) return hit.data;

  const url = `https://restcountries.com/v3.1/alpha/${key}?fields=name,capital,currencies,timezones,region,population`;
  const r = await fetchWithTimeout(url, {}, 8000);
  if (!r.ok) throw new Error(`REST Countries ${r.status}`);
  const json = await r.json();

  const currencyEntries = Object.entries(json.currencies || {});
  const currency = currencyEntries.length > 0
    ? {
        code: currencyEntries[0][0],
        name: currencyEntries[0][1].name,
        symbol: currencyEntries[0][1].symbol || "",
      }
    : null;

  const data = {
    name: json.name?.common || key,
    capital: (json.capital || [])[0] || null,
    currency,
    timezone: (json.timezones || [])[0] || null,
    region: json.region || null,
    population: json.population || null,
  };

  cache.set(key, { data, ts: Date.now() });
  return data;
}
