import type { Flight, ExchangeRates, Currency } from "../types.js";
import { fmt, convert, formatAmount, FALLBACK_RATES } from "../utils/currency.js";

interface FlightCardProps {
  flight: Flight;
  idx: number;
  selectedIdx: number | null;
  onSelect: (idx: number | null) => void;
  source: "google" | "sky";
  rates: ExchangeRates | null;
  currency: Currency;
  t?: Record<string, string>;
}

export default function FlightCard({ flight, idx, selectedIdx, onSelect, source, rates, currency, t }: FlightCardProps) {
  const isSelected = selectedIdx === idx;
  const depTime = flight.depTime ? String(flight.depTime).slice(11, 16) : null;
  const priceDisplay = formatAmount(convert(flight.price, currency || "USD", rates), currency || "USD");
  const priceSecondary = (currency !== "XOF")
    ? fmt.xof(flight.price * (rates?.USD_XOF || FALLBACK_RATES.USD_XOF))
    : fmt.usd(flight.price);

  return (
    <div
      onClick={() => onSelect(isSelected ? null : idx)}
      className={`cursor-pointer rounded-2xl border p-4 transition-all duration-200 ${
        isSelected
          ? "border-indigo-500/60 bg-indigo-500/10 shadow-lg shadow-indigo-500/10"
          : "border-white/10 bg-white/5 hover:bg-white/8 hover:border-white/20"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
              source === "google"
                ? "bg-blue-500/20 text-blue-300 border border-blue-500/20"
                : "bg-orange-500/20 text-orange-300 border border-orange-500/20"
            }`}>
              {source === "google" ? "Google" : "Skyscanner"}
            </span>
            <span className="font-semibold text-slate-100 text-sm truncate">{flight.airline}</span>
          </div>
          <div className="flex items-center gap-3 text-xs flex-wrap">
            {flight.direct
              ? <span className="text-emerald-400 font-medium bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">Direct</span>
              : <span className="text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">{flight.stops} escale{flight.stops > 1 ? "s" : ""}</span>
            }
            {flight.duration && (
              <span className="text-slate-400">
                {Math.floor(flight.duration / 60)}h{String(flight.duration % 60).padStart(2, "0")}
              </span>
            )}
            {depTime && <span className="text-slate-400">{depTime}</span>}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-xl font-bold text-slate-50">{priceDisplay}</div>
          <div className="text-xs text-slate-500 mt-0.5">{priceSecondary}</div>
          {isSelected && <div className="text-xs text-indigo-400 font-medium mt-1">{t?.priceSelected?.replace("💵 ", "") || "Sélectionné"}</div>}
        </div>
      </div>
    </div>
  );
}
