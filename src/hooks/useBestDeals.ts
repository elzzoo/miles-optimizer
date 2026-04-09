import { useState, useEffect } from "react";

export interface BestDeal {
  id: string;
  route: { from: string; to: string; label: string };
  program: { id: string; name: string; short: string; emoji: string; bookingUrl: string };
  cashPriceUSD: number;
  milesNeeded: number;
  taxesUSD: number;
  score: {
    centsPerMile: number; label: string; color: string;
    savingsUSD: number; savingsPct: number; worthIt: boolean;
  };
  updatedAt: string;
}

export function useBestDeals() {
  const [deals, setDeals]   = useState<BestDeal[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/deals")
      .then(r => r.json())
      .then(d => {
        setDeals(d.deals ?? []);
        setUpdatedAt(d.updatedAt ?? null);
        setLoading(false);
      })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  return { deals, loading, error, updatedAt };
}
