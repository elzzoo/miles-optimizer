import { useState, useMemo, useCallback } from "react";
import type { Flight } from "../types.js";

/** Map any source's flight array to our internal Flight type */
function mapFlights(raw: unknown): Flight[] {
  if (!Array.isArray(raw)) return [];
  return (raw as any[])
    .map(f => ({
      price:    Number(f.price),
      airline:  f.airline || "—",
      direct:   f.direct ?? (f.stops === 0),
      stops:    f.stops ?? 0,
      duration: f.duration,
      depTime:  f.depTime,
      source:   (f.source || "duffel") as Flight["source"],
    }))
    .filter(f => f.price > 0)
    .sort((a, b) => a.price - b.price);
}

export function useFlights() {
  const [flights,  setFlights]  = useState<Flight[]>([]);
  const [source,   setSource]   = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const search = useCallback(async (params: URLSearchParams) => {
    setFlights([]);
    setSource(null);
    setError(null);
    setLoading(true);

    try {
      const r = await fetch(`/api/flights?${params}`);
      const d = await r.json();

      if (!r.ok || d.error) {
        setError(d.error || `HTTP ${r.status}`);
        setFlights([]);
      } else {
        setFlights(mapFlights(d.flights));
        setSource(d.source || null);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setFlights([]);
    setSource(null);
    setError(null);
    setLoading(false);
  }, []);

  const bestApiPrice = useMemo(() => {
    const prices = flights.map(f => f.price).filter(Boolean);
    return prices.length > 0 ? Math.min(...prices) : null;
  }, [flights]);

  return {
    flights,
    allFlights: flights,   // alias kept for Search.tsx compatibility
    source,
    loading,
    error,
    bestApiPrice,
    search,
    reset,
    // Legacy aliases — kept so Search.tsx compiles without full rewrite
    gLoading: loading,
    gError:   error,
    sLoading: false,
    sError:   null,
    dLoading: false,
    dError:   null,
  };
}
