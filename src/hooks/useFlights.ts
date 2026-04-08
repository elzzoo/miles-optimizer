import { useState, useMemo, useCallback } from "react";
import type { Flight } from "../types.js";

function parseGoogleFlights(data: unknown): Flight[] {
  if (!data) return [];
  const d = data as any;
  const all = [...(d.best_flights || []), ...(d.other_flights || [])];
  return all
    .map((f: any) => ({
      price: f.price,
      airline: f.flights?.[0]?.airline || "—",
      direct: (f.flights?.length || 1) === 1 && (f.layovers?.length || 0) === 0,
      stops: f.layovers?.length || 0,
      duration: f.total_duration,
      depTime: f.flights?.[0]?.departure_airport?.time,
      source: "google" as const,
    }))
    .filter(f => f.price)
    .sort((a, b) => a.price - b.price)
    .slice(0, 5);
}

function parseSkyFlights(data: unknown): Flight[] {
  if (!data) return [];
  // Support both response shapes: data.data.itineraries and data.itineraries
  const its = (data as any).data?.itineraries
    || (data as any).itineraries
    || (data as any).data?.results?.itineraries
    || [];
  return its
    .map((it: any) => ({
      price: it.price?.raw,
      airline: it.legs?.[0]?.carriers?.marketing?.[0]?.name || "—",
      direct: (it.legs?.[0]?.stopCount || 0) === 0,
      stops: it.legs?.[0]?.stopCount || 0,
      duration: it.legs?.[0]?.durationInMinutes,
      depTime: it.legs?.[0]?.departure,
      source: "sky" as const,
    }))
    .filter((f: any) => f.price)
    .sort((a: any, b: any) => a.price - b.price)
    .slice(0, 5);
}

export function useFlights() {
  const [googleFlights, setGoogleFlights] = useState(null);
  const [skyFlights, setSkyFlights] = useState(null);
  const [gLoading, setGLoading] = useState(false);
  const [sLoading, setSLoading] = useState(false);
  const [gError, setGError] = useState(null);
  const [sError, setSError] = useState(null);

  const search = useCallback(async (params) => {
    setGoogleFlights(null);
    setSkyFlights(null);
    setGError(null);
    setSError(null);
    setGLoading(true);
    setSLoading(true);

    fetch(`/api/google-flights?${params}`)
      .then(r => r.json().then(d => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (!ok) throw new Error(d.error || `HTTP ${d.status}`);
        setGoogleFlights(d); setGLoading(false);
      })
      .catch(e => { setGError(e.message); setGLoading(false); });

    fetch(`/api/skyscanner?${params}`)
      .then(r => r.json().then(d => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (!ok) throw new Error(d.error || `HTTP ${d.status}`);
        setSkyFlights(d); setSLoading(false);
      })
      .catch(e => { setSError(e.message); setSLoading(false); });
  }, []);

  const reset = useCallback(() => {
    setGoogleFlights(null);
    setSkyFlights(null);
    setGError(null);
    setSError(null);
  }, []);

  const googleList = useMemo(() => parseGoogleFlights(googleFlights), [googleFlights]);
  const skyList = useMemo(() => parseSkyFlights(skyFlights), [skyFlights]);

  const allFlights = useMemo(() =>
    [...googleList, ...skyList].sort((a, b) => a.price - b.price),
  [googleList, skyList]);

  const bestApiPrice = useMemo(() => {
    const prices = allFlights.map(f => f.price).filter(Boolean);
    return prices.length > 0 ? Math.min(...prices) : null;
  }, [allFlights]);

  return {
    googleFlights, skyFlights,
    gLoading, sLoading,
    gError, sError,
    loading: gLoading || sLoading,
    allFlights, bestApiPrice,
    search, reset,
  };
}
