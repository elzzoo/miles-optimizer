import { useState, useCallback, useEffect } from "react";
import AirportPicker from "../AirportPicker";
import DateInput from "../DateInput";
import { today, addDays } from "../../utils/dates";
import { useAnalytics } from "../../hooks/useAnalytics";

interface Props {
  onSearch: (params: URLSearchParams) => void;
  variant?: "hero" | "compact";
  defaultOrigin?: string;
  defaultDest?: string;
  onOriginChange?: (iata: string) => void;
}

type TripType = "round" | "oneway";
type Cabin    = 0 | 1;

export default function SearchForm({ onSearch, variant = "hero", defaultOrigin = "DSS", defaultDest = "", onOriginChange }: Props) {
  const [origin, setOrigin]       = useState(defaultOrigin);
  const [dest, setDest]           = useState(defaultDest);
  const [tripType, setTripType]   = useState<TripType>("round");
  const [cabin, setCabin]         = useState<Cabin>(0);
  const [passengers, setPassengers] = useState(1);
  const [depDate, setDepDate]     = useState(() => addDays(today, 30));
  const [retDate, setRetDate]     = useState(() => addDays(today, 40));
  const [lang] = useState("fr");

  const { trackSearch } = useAnalytics();

  const isOneWay   = tripType === "oneway";
  const canSearch  = !!origin && !!dest && origin !== dest;

  useEffect(() => {
    if (retDate <= depDate) setRetDate(addDays(depDate, 7));
  }, [depDate]);

  const handleOriginChange = (v: string) => {
    setOrigin(v);
    onOriginChange?.(v);
  };

  const handleSearch = useCallback(() => {
    if (!canSearch) return;
    const params = new URLSearchParams({
      origin, dest, depDate, cabin: String(cabin), passengers: String(passengers),
    });
    if (!isOneWay) params.set("retDate", retDate);
    trackSearch(origin, dest, cabin);
    onSearch(params);
  }, [origin, dest, depDate, retDate, cabin, passengers, isOneWay, canSearch]);

  const handleSwap = () => {
    const tmp = origin;
    setOrigin(dest);
    setDest(tmp);
  };

  if (variant === "compact") {
    const fmtCompact = (d: string) =>
      d ? new Date(d + "T12:00:00").toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }) : "—";

    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-2 flex flex-wrap items-center gap-1.5">
        {/* Origin */}
        <div className="flex-1 min-w-[90px]">
          <AirportPicker label="Depuis" value={origin} onChange={handleOriginChange} exclude={dest} lang={lang} compact />
        </div>

        <button onClick={handleSwap} aria-label="Inverser" className="w-7 h-7 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-primary text-slate-400 flex items-center justify-center flex-shrink-0 transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
          </svg>
        </button>

        {/* Dest */}
        <div className="flex-1 min-w-[90px]">
          <AirportPicker label="Vers" value={dest} onChange={setDest} exclude={origin} lang={lang} compact />
        </div>

        {/* Dates */}
        <button onClick={() => (document.getElementById("compact-dep") as HTMLInputElement)?.showPicker?.()}
          className="flex items-center gap-1 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 hover:border-primary/40 transition-colors flex-shrink-0 relative"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 text-slate-400">
            <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span>{fmtCompact(depDate)}{!isOneWay ? ` – ${fmtCompact(retDate)}` : ""}</span>
          <input id="compact-dep" type="date" value={depDate} min={addDays(today, 0)} onChange={e => setDepDate(e.target.value)} className="sr-only" tabIndex={-1} />
        </button>

        <button
          onClick={handleSearch}
          disabled={!canSearch}
          className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-40 hover:bg-[#1D4ED8] transition-colors flex-shrink-0 shadow-sm"
        >
          Chercher
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,.10)] border border-slate-100 p-5 md:p-6">

      {/* Trip type toggle */}
      <div className="flex gap-1 bg-slate-100 rounded-2xl p-1 mb-5">
        {([
          { val: "round" as const, label: "Aller-retour" },
          { val: "oneway" as const, label: "Aller simple" },
        ] as const).map(({ val, label }) => (
          <button
            key={val}
            onClick={() => setTripType(val)}
            aria-pressed={tripType === val}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
              tripType === val
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Origin / Dest */}
      <div className="flex items-end gap-2 mb-4">
        <div className="flex-1 min-w-0">
          <AirportPicker label="Départ" value={origin} onChange={handleOriginChange} exclude={dest} lang={lang} />
        </div>
        <button
          onClick={handleSwap}
          aria-label="Inverser"
          className="mb-1 w-9 h-9 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-primary text-slate-500 flex items-center justify-center transition-all flex-shrink-0"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <AirportPicker label="Destination" value={dest} onChange={setDest} exclude={origin} lang={lang} />
        </div>
      </div>

      {/* Dates */}
      <div className={`grid gap-3 mb-4 ${isOneWay ? "grid-cols-1" : "grid-cols-2"}`}>
        <DateInput
          label="Départ"
          value={depDate}
          min={addDays(today, 0)}
          onChange={v => { setDepDate(v); }}
          quickOptions={[
            { label: "2 sem", value: addDays(today, 14) },
            { label: "1 mois", value: addDays(today, 30) },
            { label: "2 mois", value: addDays(today, 60) },
            { label: "3 mois", value: addDays(today, 90) },
          ]}
        />
        {!isOneWay && (
          <DateInput
            label="Retour"
            value={retDate}
            min={addDays(depDate, 1)}
            onChange={setRetDate}
            quickOptions={[
              { label: "3j",   value: addDays(new Date(depDate + "T12:00:00"), 3)  },
              { label: "1 sem", value: addDays(new Date(depDate + "T12:00:00"), 7)  },
              { label: "2 sem", value: addDays(new Date(depDate + "T12:00:00"), 14) },
            ]}
          />
        )}
      </div>

      {/* Cabin + Passengers */}
      <div className="flex gap-3 mb-5">
        <div className="flex-1">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Classe</p>
          <div className="flex gap-2">
            {([{ val: 0 as const, label: "Éco" }, { val: 1 as const, label: "Business" }] as const).map(({ val, label }) => (
              <button key={val} onClick={() => setCabin(val)} aria-pressed={cabin === val}
                className={`flex-1 py-2.5 rounded-xl font-semibold text-sm border transition-all ${
                  cabin === val
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="w-28">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Passagers</p>
          <select
            value={passengers}
            onChange={e => setPassengers(Number(e.target.value))}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm px-3 py-2.5 cursor-pointer outline-none focus:ring-2 focus:ring-primary/30"
          >
            {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n} {n > 1 ? "adultes" : "adulte"}</option>)}
          </select>
        </div>
      </div>

      {/* Search button */}
      <button
        onClick={handleSearch}
        disabled={!canSearch}
        aria-label="Rechercher les vols"
        className="w-full py-4 rounded-2xl bg-primary text-white font-bold text-base hover:bg-[#1D4ED8] shadow-[0_4px_20px_rgba(37,99,235,.35)] disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed transition-all duration-150"
      >
        🔍 Rechercher les vols
      </button>
    </div>
  );
}
