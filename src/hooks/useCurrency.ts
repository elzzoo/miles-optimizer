import { useState, useCallback } from "react";
import type { Currency } from "../types.js";
import { CURRENCIES } from "../utils/currency.js";

const LS_KEY = "miles-optimizer-currency";

function detectCurrency() {
  const saved = localStorage.getItem(LS_KEY);
  if (saved && CURRENCIES.includes(saved)) return saved;
  // Default international = USD
  return "USD";
}

export function useCurrency(): { currency: Currency; setCurrency: (c: Currency) => void; currencies: Currency[] } {
  const [currency, setCurrencyState] = useState<Currency>(detectCurrency as () => Currency);

  const setCurrency = useCallback((c) => {
    if (CURRENCIES.includes(c)) {
      localStorage.setItem(LS_KEY, c);
      setCurrencyState(c);
    }
  }, []);

  return { currency, setCurrency, currencies: CURRENCIES };
}
