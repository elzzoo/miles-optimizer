import { useState, useMemo, useRef, useEffect } from "react";
import { AIRPORTS, airportsMap } from "../data/airports";

interface Props {
  label: string;
  value: string;
  onChange: (code: string) => void;
  exclude?: string;
  lang?: string;
  compact?: boolean;
}

export default function AirportPicker({ label, value, onChange, exclude, lang = "fr", compact = false }: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ]       = useState("");
  const [dq, setDq]     = useState("");
  const ref             = useRef<HTMLDivElement>(null);
  const inputRef        = useRef<HTMLInputElement>(null);
  const selected        = airportsMap[value];

  useEffect(() => {
    const t = setTimeout(() => setDq(q), 150);
    return () => clearTimeout(t);
  }, [q]);

  const filtered = useMemo(() => {
    const lq = dq.toLowerCase();
    return AIRPORTS
      .filter(a => a.code !== exclude && (
        a.code.toLowerCase().includes(lq) ||
        a.city.toLowerCase().includes(lq) ||
        a.country.toLowerCase().includes(lq)
      ))
      .slice(0, 8);
  }, [dq, exclude]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const openDropdown = () => { setOpen(true); setQ(""); setTimeout(() => inputRef.current?.focus(), 50); };

  if (compact) {
    return (
      <div className="relative" ref={ref}>
        <button
          type="button"
          onClick={openDropdown}
          className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:border-primary/40 hover:bg-white transition-colors text-left w-full min-w-[80px]"
        >
          {selected ? (
            <>
              <span className="text-base flex-shrink-0">{selected.flag}</span>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-500 leading-none">{label}</div>
                <div className="text-sm font-bold text-slate-900">{selected.code}</div>
              </div>
            </>
          ) : (
            <span className="text-sm text-slate-400">{label}…</span>
          )}
        </button>
        {open && <Dropdown ref={inputRef} filtered={filtered} q={q} setQ={setQ} lang={lang} onChange={v => { onChange(v); setOpen(false); }} onClose={() => setOpen(false)} />}
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">{label}</p>
      <div
        onClick={openDropdown}
        className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
          open
            ? "border-primary/50 bg-blue-50/40 shadow-sm"
            : "border-slate-200 bg-white hover:border-slate-300"
        }`}
      >
        {selected ? (
          <>
            <span className="text-2xl flex-shrink-0">{selected.flag}</span>
            <div className="min-w-0">
              <div className="font-bold text-slate-900 text-lg leading-none">{selected.code}</div>
              <div className="text-xs text-slate-500 truncate">
                {lang === "en" ? (selected.cityEn || selected.city) : selected.city},&nbsp;
                {lang === "en" ? (selected.countryEn || selected.country) : selected.country}
              </div>
            </div>
          </>
        ) : (
          <span className="text-slate-400 text-sm">Sélectionner…</span>
        )}
      </div>
      {open && <Dropdown ref={inputRef} filtered={filtered} q={q} setQ={setQ} lang={lang} onChange={v => { onChange(v); setOpen(false); }} onClose={() => setOpen(false)} />}
    </div>
  );
}

interface DropdownProps {
  filtered: typeof AIRPORTS;
  q: string;
  setQ: (v: string) => void;
  lang: string;
  onChange: (code: string) => void;
  onClose: () => void;
  ref: React.RefObject<HTMLInputElement | null>;
}

function Dropdown({ filtered, q, setQ, lang, onChange }: DropdownProps) {
  return (
    <div className="absolute z-50 top-full left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-xl shadow-slate-200/80 border border-slate-200 overflow-hidden">
      {/* Search input */}
      <div className="p-2 border-b border-slate-100">
        <div className="relative">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            autoFocus
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 text-slate-900 text-sm outline-none border border-slate-200 focus:border-primary/50 focus:bg-white placeholder:text-slate-400 transition-colors"
            placeholder="Ville, pays ou code IATA…"
            value={q}
            onChange={e => setQ(e.target.value)}
          />
        </div>
      </div>
      {/* Results */}
      <div className="max-h-56 overflow-y-auto">
        {filtered.length === 0 && (
          <div className="text-center py-6 text-slate-400 text-sm">Aucun résultat</div>
        )}
        {filtered.map(a => (
          <div
            key={a.code}
            className="flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 cursor-pointer transition-colors group"
            onClick={() => onChange(a.code)}
          >
            <span className="text-xl flex-shrink-0">{a.flag}</span>
            <div className="min-w-0 flex-1">
              <span className="font-bold text-sm text-slate-900 group-hover:text-primary transition-colors">{a.code}</span>
              <span className="text-slate-500 text-sm">
                {" — "}{lang === "en" ? (a.cityEn || a.city) : a.city}, {lang === "en" ? (a.countryEn || a.country) : a.country}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
