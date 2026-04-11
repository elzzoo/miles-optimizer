// @ts-nocheck
import { useState, useRef, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import { fr } from "date-fns/locale";
import "react-day-picker/style.css";

interface DatePickerProps {
  label: string;
  value: string;           // YYYY-MM-DD
  min?: string;            // YYYY-MM-DD
  onChange: (v: string) => void;
  quickOptions?: { label: string; value: string }[];
}

export default function DatePicker({ label, value, min, onChange, quickOptions = [] }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selectedDate = value ? new Date(value + "T12:00:00") : undefined;
  const minDate = min ? new Date(min + "T12:00:00") : new Date();
  minDate.setHours(0, 0, 0, 0);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const formatted = value
    ? new Date(value + "T12:00:00").toLocaleDateString("fr-FR", {
        weekday: "short", day: "2-digit", month: "short", year: "numeric",
      })
    : "—";

  function handleDaySelect(date: Date | undefined) {
    if (!date) return;
    const yyyy = date.getFullYear();
    const mm   = String(date.getMonth() + 1).padStart(2, "0");
    const dd   = String(date.getDate()).padStart(2, "0");
    onChange(`${yyyy}-${mm}-${dd}`);
    setOpen(false);
  }

  return (
    <div className="relative" ref={ref}>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">{label}</p>

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm px-3 py-2.5 hover:border-primary/50 hover:bg-white transition-colors text-left"
      >
        <span className="flex items-center gap-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-primary/60 flex-shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
          </svg>
          <span>{formatted}</span>
        </span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={`w-3.5 h-3.5 text-slate-400 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {/* Calendar popover */}
      {open && (
        <div className="absolute z-50 top-full left-0 mt-1.5 bg-white rounded-2xl shadow-xl shadow-slate-200/80 border border-slate-200 overflow-hidden rdp-custom">
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={handleDaySelect}
            disabled={{ before: minDate }}
            defaultMonth={selectedDate ?? minDate}
            locale={fr}
          />
        </div>
      )}

      {/* Quick-select chips */}
      {quickOptions.length > 0 && (
        <div className="flex gap-1.5 mt-2 flex-wrap">
          {quickOptions.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`text-[10px] px-2.5 py-1 rounded-full border transition-all whitespace-nowrap ${
                value === opt.value
                  ? "bg-primary/10 border-primary/30 text-primary font-semibold"
                  : "border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300 bg-white"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
