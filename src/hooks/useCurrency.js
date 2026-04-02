import { useState, useCallback } from "react";
import { CURRENCIES } from "../utils/currency.js";

const LS_KEY = "miles-optimizer-currency";

function detectCurrency() {
  const saved = localStorage.getItem(LS_KEY);
  if (saved && CURRENCIES.includes(saved)) return saved;
  // Default international = USD
  return "USD";
}

export function useCurrency() {
  const [currency, setCurrencyState] = useState(detectCurrency);

  const setCurrency = useCallback((c) => {
    if (CURRENCIES.includes(c)) {
      localStorage.setItem(LS_KEY, c);
      setCurrencyState(c);
    }
  }, []);

  return { currency, setCurrency, currencies: CURRENCIES };
}
