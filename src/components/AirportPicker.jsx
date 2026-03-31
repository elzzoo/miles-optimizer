import { useState, useMemo, useRef, useEffect } from "react";
import { AIRPORTS, airportsMap } from "../data/airports.js";

export default function AirportPicker({ label, value, onChange, exclude }) {
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
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">{label}</p>
      <div
        className={`flex items-center gap-3 p-3 rounded-2xl border-2 cursor-pointer transition-all ${open ? "border-indigo-500 bg-indigo-50" : "border-gray-100 bg-gray-50 hover:border-gray-300"}`}
        onClick={() => { setOpen(!open); setQ(""); }}
      >
        {selected ? (
          <>
            <span className="text-2xl">{selected.flag}</span>
            <div className="min-w-0">
              <div className="font-black text-gray-900 text-lg leading-none">{selected.code}</div>
              <div className="text-xs text-gray-400 truncate">{selected.city}, {selected.country}</div>
            </div>
          </>
        ) : <span className="text-gray-400 text-sm">Sélectionner...</span>}
      </div>
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <input
              autoFocus
              className="w-full px-3 py-2 rounded-xl bg-gray-50 text-sm outline-none border border-gray-200 focus:border-indigo-400"
              placeholder="Ville, pays ou code IATA..."
              value={q}
              onChange={e => setQ(e.target.value)}
            />
          </div>
          <div className="max-h-56 overflow-y-auto">
            {filtered.length === 0 && <p className="text-center text-gray-400 text-sm py-4">Aucun résultat</p>}
            {filtered.map(a => (
              <div
                key={a.code}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-indigo-50 cursor-pointer transition-colors"
                onClick={() => { onChange(a.code); setOpen(false); }}
              >
                <span className="text-xl">{a.flag}</span>
                <div>
                  <span className="font-bold text-sm text-gray-900">{a.code}</span>
                  <span className="text-gray-400 text-sm"> — {a.city}, {a.country}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
