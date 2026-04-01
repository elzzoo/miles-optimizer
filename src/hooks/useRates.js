import { useState, useEffect } from "react";

const FALLBACK = { USD_EUR: 0.92, USD_XOF: 568, USD_GBP: 0.79, updatedAt: null };

export function useRates() {
  const [rates, setRates] = useState(FALLBACK);

  useEffect(() => {
    fetch("/api/rates")
      .then(r => r.json())
      .then(data => { if (data.USD_EUR && data.USD_XOF) setRates(data); })
      .catch(() => {});
  }, []);

  return rates;
}
