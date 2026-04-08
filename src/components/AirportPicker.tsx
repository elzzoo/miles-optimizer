// @ts-nocheck
import { useState, useMemo, useRef, useEffect } from "react";
import { AIRPORTS, airportsMap } from "../data/airports.js";

export default function AirportPicker({ label, value, onChange, exclude, lang }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const ref = useRef(null);
  const selected = airportsMap[value];

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 150);
    return () => clearTimeout(t);
  }, [q]);

  const filtered = useMemo(() => {
    const lq = debouncedQ.toLowerCase();
    return AIRPORTS
      .filter(a => a.code !== exclude && (
        a.code.toLowerCase().includes(lq) ||
        a.city.toLowerCase().includes(lq) ||
        a.country.toLowerCase().includes(lq)
      ))
      .slice(0, 8);
  }, [debouncedQ, exclude]);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div className="relative flex-1" ref={ref}>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">{label}</p>
      <div
        className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${open ? "border-indigo-500/60 bg-indigo-500/8" : "border-white/10 bg-white/5 hover:border-white/20"}`}
        onClick={() => { setOpen(!open); setQ(""); }}
      >
        {selected ? (
          <>
            <span className="text-2xl">{selected.flag}</span>
            <div className="min-w-0">
              <div className="font-bold text-slate-50 text-lg leading-none">{selected.code}</div>
              <div className="text-xs text-slate-400 truncate">{lang === "en" ? (selected.cityEn || selected.city) : selected.city}, {lang === "en" ? (selected.countryEn || selected.country) : selected.country}</div>
            </div>
          </>
        ) : <span className="text-slate-500 text-sm">Sélectionner...</span>}
      </div>
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/60 border border-white/10 overflow-hidden animate-slide-down">
          <div className="p-2 border-b border-white/8">
            <div className="relative">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                autoFocus
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 text-slate-100 text-sm outline-none border border-white/10 focus:border-indigo-500/60 placeholder:text-slate-500 transition-colors"
                placeholder="Ville, pays ou code IATA..."
                value={q}
                onChange={e => setQ(e.target.value)}
              />
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto">
            {filtered.length === 0 && (
              <div className="text-center py-6">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-slate-600 mx-auto mb-2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
                <p className="text-slate-500 text-sm">Aucun résultat</p>
              </div>
            )}
            {filtered.map(a => (
              <div
                key={a.code}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-indigo-500/8 cursor-pointer transition-colors group"
                onClick={() => { onChange(a.code); setOpen(false); }}
              >
                <span className="text-xl flex-shrink-0">{a.flag}</span>
                <div className="min-w-0 flex-1">
                  <span className="font-bold text-sm text-slate-100 group-hover:text-indigo-300 transition-colors">{a.code}</span>
                  <span className="text-slate-400 text-sm"> — {lang === "en" ? (a.cityEn || a.city) : a.city}, {lang === "en" ? (a.countryEn || a.country) : a.country}</span>
                </div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
