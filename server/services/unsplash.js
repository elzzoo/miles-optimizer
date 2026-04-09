const KEY   = process.env.UNSPLASH_ACCESS_KEY;
const BASE  = "https://api.unsplash.com";
const cache = new Map();
const TTL   = 24 * 3600 * 1000;

// Fallback images by city name (avoid rate limits)
const FALLBACKS = {
  "Paris":       "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80",
  "Londres":     "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&q=80",
  "New York":    "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80",
  "Dubaï":       "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80",
  "Istanbul":    "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&q=80",
  "Casablanca":  "https://images.unsplash.com/photo-1538230881653-c9eca6f86e12?w=800&q=80",
  "Nairobi":     "https://images.unsplash.com/photo-1611348524140-53c9a25263d6?w=800&q=80",
  "Accra":       "https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=800&q=80",
  "Amsterdam":   "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800&q=80",
  "Miami":       "https://images.unsplash.com/photo-1533106497176-45ae19e68ba2?w=800&q=80",
  "Genève":      "https://images.unsplash.com/photo-1573108037329-37aa135a142e?w=800&q=80",
  "Bangkok":     "https://images.unsplash.com/photo-1508009603885-50cf7c8dd9d5?w=800&q=80",
  "Singapour":   "https://images.unsplash.com/photo-1508964942454-1a56651d54ac?w=800&q=80",
  "Montréal":    "https://images.unsplash.com/photo-1519178614-68673b201f36?w=800&q=80",
  "Barcelone":   "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&q=80",
  "Lagos":       "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=800&q=80",
  "Abidjan":     "https://images.unsplash.com/photo-1604059803894-6c8a2d4c7f0e?w=800&q=80",
  "Addis-Abeba": "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80",
  "Le Cap":      "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=800&q=80",
  "Marseille":   "https://images.unsplash.com/photo-1555992828-ca4dbe41d294?w=800&q=80",
};

export async function getPhoto(cityName) {
  // Use fallback first (no rate limit risk)
  if (FALLBACKS[cityName]) return FALLBACKS[cityName];

  const cacheKey = `photo_${cityName}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < TTL) return cached.data;

  try {
    const url = `${BASE}/search/photos?query=${encodeURIComponent(cityName + " city")}&per_page=1&orientation=landscape`;
    const r = await fetch(url, {
      headers: { "Authorization": `Client-ID ${KEY}` },
      signal: AbortSignal.timeout(5000),
    });
    if (!r.ok) throw new Error(`Unsplash ${r.status}`);
    const json = await r.json();
    const photo = json.results?.[0]?.urls?.regular ?? null;
    cache.set(cacheKey, { data: photo, ts: Date.now() });
    return photo;
  } catch {
    return null;
  }
}
