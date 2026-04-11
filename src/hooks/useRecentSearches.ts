const KEY = "mo_recent_searches";
const MAX = 3;

export interface RecentSearch {
  origin: string;
  dest: string;
  depDate: string;
  label: string; // "DSS → CDG · 10 mai"
  params: string; // URLSearchParams string
}

function load(): RecentSearch[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(searches: RecentSearch[]) {
  try { localStorage.setItem(KEY, JSON.stringify(searches)); } catch {}
}

export function saveRecentSearch(params: URLSearchParams) {
  const origin  = params.get("origin") || "";
  const dest    = params.get("dest")   || "";
  const depDate = params.get("depDate") || "";
  if (!origin || !dest) return;

  const dateLabel = depDate
    ? new Date(depDate + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
    : "";

  const entry: RecentSearch = {
    origin,
    dest,
    depDate,
    label: `${origin} → ${dest}${dateLabel ? ` · ${dateLabel}` : ""}`,
    params: params.toString(),
  };

  const existing = load().filter(s => !(s.origin === origin && s.dest === dest));
  save([entry, ...existing].slice(0, MAX));
}

export function useRecentSearches(): RecentSearch[] {
  return load();
}
