import { fmt, FALLBACK_RATES } from "../utils/currency.js";

export default function FlightCard({ flight, idx, selectedIdx, onSelect, source, rates }) {
  const USD_XOF = rates?.USD_XOF || FALLBACK_RATES.USD_XOF;
  const isSelected = selectedIdx === idx;
  const depTime = flight.depTime ? String(flight.depTime).slice(11, 16) : null;

  return (
    <div
      onClick={() => onSelect(isSelected ? null : idx)}
      className={`cursor-pointer rounded-xl border-2 p-3 transition-all ${isSelected ? "border-indigo-500 bg-indigo-50 shadow-md" : "border-gray-100 bg-white hover:border-indigo-200 hover:shadow-sm"}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${source === "google" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"}`}>
              {source === "google" ? "🔵 Google" : "🔶 Sky"}
            </span>
            <span className="font-bold text-gray-900 text-sm truncate">{flight.airline}</span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            {flight.direct
              ? <span className="text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">✅ Direct</span>
              : <span className="text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">{flight.stops} escale(s)</span>}
            {flight.duration && <span className="text-gray-400">⏱ {Math.floor(flight.duration / 60)}h{String(flight.duration % 60).padStart(2, "0")}</span>}
            {depTime && <span className="text-gray-400">🕐 {depTime}</span>}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-lg font-black text-gray-900">{fmt.usd(flight.price)}</div>
          <div className="text-xs text-gray-400">{fmt.xof(flight.price * USD_XOF)}</div>
          {isSelected && <div className="text-xs text-indigo-600 font-bold mt-0.5">✓ Sélectionné</div>}
        </div>
      </div>
    </div>
  );
}
