/**
 * Freemium search quota — 5 searches/day for free users.
 * Stored in localStorage with a daily reset key (YYYY-MM-DD).
 */

const KEY = "mo-search-quota";
const FREE_LIMIT = 5;

function todayKey() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function getQuota(): { date: string; count: number } {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { date: todayKey(), count: 0 };
    const parsed = JSON.parse(raw);
    if (parsed.date !== todayKey()) return { date: todayKey(), count: 0 };
    return parsed;
  } catch {
    return { date: todayKey(), count: 0 };
  }
}

function saveQuota(quota: { date: string; count: number }) {
  try { localStorage.setItem(KEY, JSON.stringify(quota)); } catch {}
}

export function useSearchQuota() {
  const quota = getQuota();
  const remaining = Math.max(0, FREE_LIMIT - quota.count);
  const exhausted = quota.count >= FREE_LIMIT;

  function increment() {
    const q = getQuota();
    saveQuota({ date: q.date, count: q.count + 1 });
  }

  function reset() {
    saveQuota({ date: todayKey(), count: 0 });
  }

  return { remaining, exhausted, increment, reset, count: quota.count, limit: FREE_LIMIT };
}
