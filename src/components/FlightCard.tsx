import type { Flight, ExchangeRates, Currency } from "../types.js";
import { fmt, convert, formatAmount, FALLBACK_RATES } from "../utils/currency.js";

interface FlightCardProps {
  flight: Flight;
  idx: number;
  selectedIdx: number | null;
  onSelect: (idx: number | null) => void;
  rates: ExchangeRates | null;
  currency: Currency;
}

export default function FlightCard({ flight, idx, selectedIdx, onSelect, rates, currency }: FlightCardProps) {
  const isSelected = selectedIdx === idx;
  const depTime = flight.depTime ? String(flight.depTime).slice(11, 16) : null;
  const priceDisplay = formatAmount(convert(flight.price, currency || "USD", rates), currency || "USD");
  const priceSecondary = currency !== "XOF"
    ? fmt.xof(flight.price * (rates?.USD_XOF || FALLBACK_RATES.USD_XOF))
    : fmt.usd(flight.price);

  return (
    <div
      onClick={() => onSelect(isSelected ? null : idx)}
      className={`cursor-pointer rounded-2xl border p-4 transition-all duration-200 ${
        isSelected
          ? "border-primary/40 bg-primary/5 shadow-md"
          : "border-slate-100 bg-white hover:shadow-md hover:border-slate-200"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 border ${
              flight.source === "google"
                ? "bg-blue-50 text-blue-600 border-blue-100"
                : flight.source === "duffel"
                ? "bg-purple-50 text-purple-600 border-purple-100"
                : "bg-orange-50 text-orange-600 border-orange-100"
            }`}>
              {flight.source === "google" ? "Google Flights" : flight.source === "duffel" ? "Duffel" : "Skyscanner"}
            </span>
            <span className="font-semibold text-slate-800 text-sm truncate">{flight.airline}</span>
          </div>
          <div className="flex items-center gap-3 text-xs flex-wrap">
            {(flight.direct || flight.stops === 0)
              ? <span className="text-green-600 font-medium bg-green-50 border border-green-100 px-2 py-0.5 rounded-full">Direct</span>
              : <span className="text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">{flight.stops ?? 1} escale{(flight.stops ?? 1) > 1 ? "s" : ""}</span>
            }
            {flight.duration && (
              <span className="text-slate-500">
                {Math.floor(flight.duration / 60)}h{String(flight.duration % 60).padStart(2, "0")}
              </span>
            )}
            {depTime && <span className="text-slate-400">{depTime}</span>}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-2xl font-black text-slate-900 tabular-nums">{priceDisplay}</div>
          <div className="text-xs text-slate-400 mt-0.5">{priceSecondary}</div>
          {isSelected && <div className="text-xs text-primary font-semibold mt-1">Sélectionné ✓</div>}
        </div>
      </div>
    </div>
  );
}
