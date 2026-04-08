import { useState, useMemo } from "react";

interface PriceCalendarProps {
  depDate: string;
  onSelect: (date: string) => void;
  estimateBase: number; // prix estimé de base en USD
  isOneWay: boolean;
}

const DAYS = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];
const MONTHS_FR = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function toYMD(d: Date) {
  return d.toISOString().slice(0, 10);
}

// Variation de prix déterministe par date (pas de hasard)
function priceMultiplier(dateStr: string): number {
  const d = new Date(dateStr + "T12:00:00");
  const dow = d.getDay(); // 0=dim, 6=sam
  const daysAhead = Math.max(0, (d.getTime() - Date.now()) / 86400000);

  let mult = 1.0;
  // Prime week-end
  if (dow === 0 || dow === 5) mult *= 1.14;      // dim/ven
  else if (dow === 6) mult *= 1.08;               // sam
  else if (dow === 1) mult *= 0.93;               // lun = moins cher
  // Réservation tardive
  if (daysAhead < 7) mult *= 1.28;
  else if (daysAhead < 14) mult *= 1.16;
  else if (daysAhead < 21) mult *= 1.07;
  // Réservation très à l'avance
  else if (daysAhead > 90) mult *= 0.91;
  else if (daysAhead > 60) mult *= 0.95;
  return mult;
}

export default function PriceCalendar({ depDate, onSelect, estimateBase, isOneWay }: PriceCalendarProps) {
  const [open, setOpen] = useState(false);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const selected = new Date(depDate + "T12:00:00");
  const [viewYear, setViewYear] = useState(selected.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected.getMonth());

  const days = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1);
    const last = new Date(viewYear, viewMonth + 1, 0);

    // Padding avant (lundi = 0)
    const startDow = (first.getDay() + 6) % 7; // 0=lundi
    const cells: Array<{ date: Date | null; dateStr: string | null; price: number | null; isPast: boolean }> = [];

    for (let i = 0; i < startDow; i++) cells.push({ date: null, dateStr: null, price: null, isPast: false });

    for (let d = 1; d <= last.getDate(); d++) {
      const date = new Date(viewYear, viewMonth, d);
      const dateStr = toYMD(date);
      const isPast = date < today;
      const price = isPast || estimateBase === 0 ? null : Math.round(estimateBase * priceMultiplier(dateStr));
      cells.push({ date, dateStr, price, isPast });
    }
    return cells;
  }, [viewYear, viewMonth, estimateBase]);

  // Calcul des quartiles pour coloration
  const prices = useMemo(() => days.filter(d => d.price !== null).map(d => d.price!).sort((a, b) => a - b), [days]);
  const q1 = prices[Math.floor(prices.length * 0.25)] ?? 0;
  const q3 = prices[Math.floor(prices.length * 0.75)] ?? 0;

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const canGoPrev = viewYear > today.getFullYear() || viewMonth > today.getMonth();

  function fmt(price: number) {
    if (price >= 1000) return `${(price / 1000).toFixed(1)}k`;
    return `$${price}`;
  }

  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-indigo-500/8 hover:border-indigo-500/25 transition-all group"
      >
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-indigo-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
          </svg>
          <span className="text-slate-300 text-sm font-medium">Calendrier des prix</span>
          <span className="text-slate-500 text-xs">estimés par date</span>
        </div>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className={`w-4 h-4 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <div className="mt-2 rounded-2xl border border-white/10 bg-slate-900/90 backdrop-blur-xl p-4 animate-slide-down">
          {/* Header navigation */}
          <div className="flex items-center justify-between mb-3">
            <button onClick={prevMonth} disabled={!canGoPrev}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 19.5-7.5-7.5 7.5-7.5" />
              </svg>
            </button>
            <span className="text-slate-200 font-semibold text-sm">
              {MONTHS_FR[viewMonth]} {viewYear}
            </span>
            <button onClick={nextMonth}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-white/10 transition-colors">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map(d => (
              <div key={d} className="text-center text-slate-600 text-xs font-bold py-1">{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {days.map((cell, i) => {
              if (!cell.date || !cell.dateStr) {
                return <div key={`pad-${i}`} />;
              }
              const isSelected = cell.dateStr === depDate;
              const isToday = cell.dateStr === toYMD(today);
              const isCheap = cell.price !== null && cell.price <= q1;
              const isExpensive = cell.price !== null && cell.price >= q3;

              return (
                <button
                  key={cell.dateStr}
                  disabled={cell.isPast}
                  onClick={() => { onSelect(cell.dateStr!); setOpen(false); }}
                  className={`flex flex-col items-center justify-center rounded-xl py-1.5 px-0.5 transition-all text-center
                    ${cell.isPast ? "opacity-25 cursor-not-allowed" : "hover:bg-white/10 cursor-pointer"}
                    ${isSelected ? "bg-indigo-500/30 border border-indigo-500/60 ring-1 ring-indigo-500/40" : "border border-transparent"}
                    ${!isSelected && !cell.isPast && isCheap ? "bg-emerald-500/8 hover:bg-emerald-500/15" : ""}
                    ${!isSelected && !cell.isPast && isExpensive ? "bg-red-500/8 hover:bg-red-500/12" : ""}
                  `}
                >
                  <span className={`text-xs font-semibold leading-none mb-0.5 ${isSelected ? "text-indigo-300" : isToday ? "text-indigo-400" : "text-slate-300"}`}>
                    {cell.date.getDate()}
                  </span>
                  {cell.price !== null && (
                    <span className={`text-[9px] leading-none font-medium ${
                      isCheap ? "text-emerald-400" : isExpensive ? "text-amber-400" : "text-slate-500"
                    }`}>
                      {fmt(cell.price)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/8">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-slate-500 text-xs">Moins cher</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-slate-500 text-xs">Plus cher</span>
            </div>
            <span className="text-slate-600 text-xs ml-auto italic">Estimations</span>
          </div>
        </div>
      )}
    </div>
  );
}
