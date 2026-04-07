import { useState, useCallback } from "react";
import type { TripType, Cabin } from "../types.js";

// --- URL param + localStorage helpers ---
const _p = () => new URLSearchParams(window.location.search);
const _ls = (k, d) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } };

export function saveSearch(origin, dest, cabin, tripType) {
  const qs = new URLSearchParams({ from: origin, to: dest, cabin: String(cabin), type: tripType });
  history.replaceState(null, "", "?" + qs.toString());
  try {
    localStorage.setItem("mo-origin", origin);
    localStorage.setItem("mo-dest", dest);
    localStorage.setItem("mo-cabin", String(cabin));
    localStorage.setItem("mo-type", tripType);
  } catch { /* storage full */ }
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
  const [passengers, setPassengers] = useState(1);

  const handleSwap = useCallback(() => {
    setOrigin(dest);
    setDest(origin);
  }, [origin, dest]);

  return { origin, setOrigin, dest, setDest, tripType, setTripType, cabin, setCabin, passengers, setPassengers, handleSwap };
}
