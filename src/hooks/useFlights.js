import { useState, useMemo, useCallback } from "react";

function parseGoogleFlights(data) {
  if (!data) return [];
  const all = [...(data.best_flights || []), ...(data.other_flights || [])];
  return all
    .map(f => ({
      price: f.price,
      airline: f.flights?.[0]?.airline || "—",
      direct: (f.flights?.length || 1) === 1 && (f.layovers?.length || 0) === 0,
      stops: f.layovers?.length || 0,
      duration: f.total_duration,
      depTime: f.flights?.[0]?.departure_airport?.time,
      source: "google",
    }))
    .filter(f => f.price)
    .sort((a, b) => a.price - b.price)
    .slice(0, 5);
}

function parseSkyFlights(data) {
  if (!data) return [];
  const its = data.data?.itineraries || [];
  return its
    .map(it => ({
      price: it.price?.raw,
      airline: it.legs?.[0]?.carriers?.marketing?.[0]?.name || "—",
      direct: (it.legs?.[0]?.stopCount || 0) === 0,
      stops: it.legs?.[0]?.stopCount || 0,
      duration: it.legs?.[0]?.durationInMinutes,
      depTime: it.legs?.[0]?.departure,
      source: "sky",
    }))
    .filter(f => f.price)
    .sort((a, b) => a.price - b.price)
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
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(d => { setGoogleFlights(d); setGLoading(false); })
      .catch(e => { setGError(e.message); setGLoading(false); });

    fetch(`/api/skyscanner?${params}`)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(d => { setSkyFlights(d); setSLoading(false); })
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
