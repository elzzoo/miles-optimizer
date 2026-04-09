const store = new Map();
const MAX_ENTRIES = 1000;

/**
 * Express cache middleware
 * @param {number} ttlSeconds
 */
export function cacheMiddleware(ttlSeconds) {
  return (req, res, next) => {
    const key = req.originalUrl;
    const hit = store.get(key);

    if (hit && Date.now() - hit.ts < ttlSeconds * 1000) {
      res.setHeader("X-Cache", "HIT");
      return res.json({ ...hit.data, _cached: true, _cachedAt: hit.ts });
    }

    res.setHeader("X-Cache", "MISS");

    // Patch res.json to intercept response
    const origJson = res.json.bind(res);
    res.json = (data) => {
      if (res.statusCode === 200) {
        store.set(key, { data, ts: Date.now() });
        // LRU eviction
        if (store.size > MAX_ENTRIES) {
          const firstKey = store.keys().next().value;
          store.delete(firstKey);
        }
      }
      return origJson(data);
    };

    next();
  };
}

export function clearCache(pattern) {
  if (!pattern) { store.clear(); return; }
  for (const key of store.keys()) {
    if (key.includes(pattern)) store.delete(key);
  }
}
