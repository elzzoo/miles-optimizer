import type { SortBy } from "../hooks/useFlightFilters.js";

interface FlightFiltersProps {
  airlines: string[];
  filters: {
    airline: string | null;
    directOnly: boolean;
    maxStops: number | null;
    sortBy: SortBy;
  };
  activeFiltersCount: number;
  setAirline: (v: string | null) => void;
  setMaxStops: (v: number | null) => void;
  setSortBy: (v: SortBy) => void;
  reset: () => void;
  totalFlights: number;
  filteredCount: number;
}

export default function FlightFilters({ airlines, filters, activeFiltersCount, setAirline, setMaxStops, setSortBy, reset, totalFlights, filteredCount }: FlightFiltersProps) {
  if (totalFlights === 0) return null;

  return (
    <div className="mb-4 space-y-3">
      {/* Header with reset */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5 text-slate-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
          </svg>
          <span className="text-slate-500 text-xs font-medium">
            {filteredCount}/{totalFlights} vol{totalFlights > 1 ? "s" : ""}
          </span>
        </div>
        {activeFiltersCount > 0 && (
          <button onClick={reset} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
            Réinitialiser
          </button>
        )}
      </div>

      {/* Stops filter */}
      <div>
        <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-2">Escales</p>
        <div className="flex gap-1.5 flex-wrap">
          {[
            { label: "Tous", value: null },
            { label: "Direct", value: 0 },
            { label: "≤ 1 escale", value: 1 },
            { label: "≤ 2 escales", value: 2 },
          ].map(({ label, value }) => {
            const isActive = value === null
              ? filters.maxStops === null && !filters.directOnly
              : value === 0 ? filters.directOnly : filters.maxStops === value;
            return (
              <button key={label}
                onClick={() => setMaxStops(value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                  isActive
                    ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-300"
                    : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-slate-200"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Airline filter — only show if 2+ airlines */}
      {airlines.length > 1 && (
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-2">Compagnie</p>
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setAirline(null)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                filters.airline === null
                  ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-300"
                  : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
              }`}
            >
              Toutes
            </button>
            {airlines.map(a => (
              <button key={a}
                onClick={() => setAirline(filters.airline === a ? null : a)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                  filters.airline === a
                    ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-300"
                    : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sort */}
      <div>
        <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-2">Trier par</p>
        <div className="flex gap-1.5">
          {([
            { label: "Prix", value: "price" as SortBy },
            { label: "Durée", value: "duration" as SortBy },
            { label: "Départ", value: "departure" as SortBy },
          ] as { label: string; value: SortBy }[]).map(({ label, value }) => (
            <button key={value}
              onClick={() => setSortBy(value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                filters.sortBy === value
                  ? "bg-violet-500/20 border-violet-500/50 text-violet-300"
                  : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
