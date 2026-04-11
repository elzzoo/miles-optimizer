/**
 * Upstash Redis REST client — graceful no-op if not configured.
 * Uses the REST API directly (no SDK dependency).
 */
const URL   = process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

const configured = () => !!(URL && TOKEN);

async function redisCmd(...args) {
  if (!configured()) return null;
  try {
    const r = await fetch(`${URL}`, {
      method:  "POST",
      headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
      body:    JSON.stringify(args),
      signal:  AbortSignal.timeout(3000),
    });
    const json = await r.json();
    return json.result ?? null;
  } catch {
    return null;
  }
}

/**
 * Get a cached value. Returns parsed JSON or null.
 */
export async function cacheGet(key) {
  const raw = await redisCmd("GET", key);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

/**
 * Set a value with TTL in seconds. Fire-and-forget (no await needed).
 */
export async function cacheSet(key, value, ttlSeconds = 1800) {
  await redisCmd("SET", key, JSON.stringify(value), "EX", String(ttlSeconds));
}

export { configured as redisConfigured };
