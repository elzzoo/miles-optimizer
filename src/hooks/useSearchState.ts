import { useState, useCallback } from "react";
import type { TripType, Cabin } from "../types.js";

// --- URL param + localStorage helpers ---
const _p = () => new URLSearchParams(window.location.search);
const _ls = (k, d) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } };

export function getSearchHistory(): Array<{ origin: string; dest: string; cabin: number; tripType: string }> {
  try {
    const raw = localStorage.getItem("miles-optimizer-history");
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveSearch(
  origin: string, dest: string, cabin: number, tripType: string,
  depDate?: string, retDate?: string, passengers?: number
) {
  const params: Record<string, string> = {
    from: origin, to: dest, cabin: String(cabin), type: tripType,
  };
  if (depDate) params.dep = depDate;
  if (retDate && tripType !== "oneway") params.ret = retDate;
  if (passengers && passengers > 1) params.pax = String(passengers);

  history.replaceState(null, "", "?" + new URLSearchParams(params).toString());

  try {
    localStorage.setItem("mo-origin", origin);
    localStorage.setItem("mo-dest", dest);
    localStorage.setItem("mo-cabin", String(cabin));
    localStorage.setItem("mo-type", tripType);
  } catch { /* storage full */ }
  try {
    const prev = getSearchHistory();
    const entry = { origin, dest, cabin, tripType };
    const filtered = prev.filter(e => !(e.origin === origin && e.dest === dest));
    localStorage.setItem("miles-optimizer-history", JSON.stringify([entry, ...filtered].slice(0, 5)));
  } catch {}
}

export function useSearchState() {
  const [origin, setOrigin] = useState(() => _p().get("from") || _ls("mo-origin", "DSS"));
  const [dest, setDest] = useState(() => _p().get("to") || _ls("mo-dest", "IST"));
  const [tripType, setTripType] = useState<TripType>(() => (_p().get("type") || _ls("mo-type", "round")) as TripType);
  const [cabin, setCabin] = useState<Cabin>(() => {
    const p = _p();
    const raw = p.has("cabin") ? Number(p.get("cabin")) : Number(_ls("mo-cabin", 1));
    return (Number.isFinite(raw) ? raw : 1) as Cabin;
  });
  const [passengers, setPassengers] = useState<number>(() => {
    const raw = Number(_p().get("pax") ?? 1);
    return Number.isFinite(raw) && raw >= 1 && raw <= 6 ? raw : 1;
  });

  // Expose initial URL dates so App.tsx can use them
  const urlDepDate = _p().get("dep") ?? null;
  const urlRetDate = _p().get("ret") ?? null;

  const handleSwap = useCallback(() => {
    setOrigin(dest);
    setDest(origin);
  }, [origin, dest]);

  return { origin, setOrigin, dest, setDest, tripType, setTripType, cabin, setCabin, passengers, setPassengers, handleSwap, urlDepDate, urlRetDate };
}
