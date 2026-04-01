const TTL = 3 * 60 * 60 * 1000; // 3h
const cache = new Map();

const WMO = {
  0:  { label: "Ciel dégagé",           icon: "☀️" },
  1:  { label: "Peu nuageux",            icon: "🌤️" },
  2:  { label: "Partiellement nuageux",  icon: "⛅" },
  3:  { label: "Couvert",                icon: "☁️" },
  45: { label: "Brouillard",             icon: "🌫️" },
  48: { label: "Brouillard givrant",     icon: "🌫️" },
  51: { label: "Bruine légère",          icon: "🌦️" },
  53: { label: "Bruine modérée",         icon: "🌦️" },
  55: { label: "Bruine forte",           icon: "🌧️" },
  61: { label: "Pluie légère",           icon: "🌧️" },
  63: { label: "Pluie modérée",          icon: "🌧️" },
  65: { label: "Pluie forte",            icon: "🌧️" },
  71: { label: "Neige légère",           icon: "🌨️" },
  73: { label: "Neige modérée",          icon: "❄️" },
  75: { label: "Neige forte",            icon: "❄️" },
  80: { label: "Averses",                icon: "🌦️" },
  81: { label: "Averses modérées",       icon: "🌧️" },
  82: { label: "Averses violentes",      icon: "⛈️" },
  95: { label: "Orage",                  icon: "⛈️" },
  96: { label: "Orage avec grêle",       icon: "⛈️" },
  99: { label: "Orage violent",          icon: "⛈️" },
};

export async function getWeather(lat, lon) {
  const key = `${lat},${lon}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.ts < TTL) return hit.data;

  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m` +
    `&timezone=auto&forecast_days=1`;

  const r = await fetch(url);
  if (!r.ok) throw new Error(`Open-Meteo: ${r.status}`);
  const json = await r.json();
  const c = json.current;
  const wmo = WMO[c.weather_code] || { label: "Inconnu", icon: "🌡️" };

  const data = {
    temp: Math.round(c.temperature_2m),
    humidity: c.relative_humidity_2m,
    wind: Math.round(c.wind_speed_10m),
    label: wmo.label,
    icon: wmo.icon,
    tz: json.timezone_abbreviation || "",
    utcOffset: json.utc_offset_seconds != null ? Math.round(json.utc_offset_seconds / 3600) : null,
  };

  cache.set(key, { data, ts: Date.now() });
  if (cache.size > 200) cache.delete(cache.keys().next().value);
  return data;
}
