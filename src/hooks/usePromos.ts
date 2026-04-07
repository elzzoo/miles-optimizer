import { useState, useEffect } from "react";

export function usePromos() {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchedAt, setFetchedAt] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/promos")
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(data => {
        setPromos(data.promos || []);
        setFetchedAt(data.fetchedAt || null);
        setLoading(false);
      })
      .catch(e => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  return { promos, loading, fetchedAt, error };
}
