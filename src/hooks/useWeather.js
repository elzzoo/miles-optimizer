import { useState, useEffect } from "react";

export function useWeather(lat, lon) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (lat == null || lon == null) return;
    setLoading(true);
    setWeather(null);
    fetch(`/api/weather?lat=${lat}&lon=${lon}`)
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(data => { setWeather(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [lat, lon]);

  return { weather, loading };
}
