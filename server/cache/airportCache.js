// Simple TTL cache for airport entity IDs (1h)
const TTL = 60 * 60 * 1000;
const store = new Map();

export function get(iata) {
  const entry = store.get(iata);
  if (!entry) return null;
  if (Date.now() - entry.ts > TTL) { store.delete(iata); return null; }
  return entry.data;
}

export function set(iata, data) {
  store.set(iata, { data, ts: Date.now() });
}
