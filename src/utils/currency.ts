import type { Currency, ExchangeRates } from "../types.js";

export const FALLBACK_RATES: ExchangeRates = { USD_XOF: 568, USD_EUR: 0.92, USD_GBP: 0.79, updatedAt: null };

export const CURRENCIES: Currency[] = ["USD", "EUR", "XOF", "GBP"];

export function convert(amountUSD, currency, rates) {
  if (amountUSD == null) return null;
  const r = rates || FALLBACK_RATES;
  switch (currency) {
    case "EUR": return amountUSD * (r.USD_EUR || FALLBACK_RATES.USD_EUR);
    case "XOF": return amountUSD * (r.USD_XOF || FALLBACK_RATES.USD_XOF);
    case "GBP": return amountUSD * (r.USD_GBP || FALLBACK_RATES.USD_GBP);
    default: return amountUSD; // USD
  }
}

export function formatAmount(amount, currency) {
  if (amount == null) return "—";
  switch (currency) {
    case "EUR": return "€" + new Intl.NumberFormat("fr-FR").format(Math.round(amount));
    case "XOF": return new Intl.NumberFormat("fr-FR").format(Math.round(amount)) + " FCFA";
    case "GBP": return "£" + new Intl.NumberFormat("en-GB").format(Math.round(amount));
    default: return "$" + new Intl.NumberFormat("en-US").format(Math.round(amount));
  }
}

export const fmt = {
  xof: (n) => n == null ? "—" : new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " FCFA",
  usd: (n) => n == null ? "—" : "$" + new Intl.NumberFormat("en-US").format(Math.round(n)),
  eur: (n) => n == null ? "—" : "€" + new Intl.NumberFormat("fr-FR").format(Math.round(n)),
  gbp: (n) => n == null ? "—" : "£" + new Intl.NumberFormat("en-GB").format(Math.round(n)),
  miles: (n) => n == null ? "—" : new Intl.NumberFormat("fr-FR").format(n) + " miles",
};

export function estimateCash(distMiles, oneWay) {
  let [eco, bus] = distMiles < 800 ? [300, 900]
    : distMiles < 2000 ? [500, 1500]
    : distMiles < 4000 ? [800, 2500]
    : distMiles < 7000 ? [1200, 3500]
    : [1600, 5000];
  if (oneWay) { eco = Math.round(eco * 0.6); bus = Math.round(bus * 0.6); }
  return [eco, bus];
}
