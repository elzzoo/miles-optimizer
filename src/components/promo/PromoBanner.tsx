import { useState, useEffect, useRef } from "react";

interface Promo {
  title: string;
  url: string;
  source?: string;
  program?: string;
  score?: number;
}

function dedupePromos(items: Promo[]): Promo[] {
  const seen = new Set<string>();
  return items.filter(item => {
    const key = (item.title || "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 50);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function PromoBanner() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [canLeft,  setCanLeft]  = useState(false);
  const [canRight, setCanRight] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/promos")
      .then(r => r.json())
      .then(d => setPromos(dedupePromos(d.promos ?? [])))
      .catch(() => {});
  }, []);

  function updateArrows() {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateArrows();
    el.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
    return () => { el.removeEventListener("scroll", updateArrows); window.removeEventListener("resize", updateArrows); };
  }, [promos]);

  function scroll(dir: 1 | -1) {
    scrollRef.current?.scrollBy({ left: dir * 300, behavior: "smooth" });
  }

  if (!promos.length) return null;

  return (
    <div className="relative">
      {/* Left arrow */}
      {canLeft && (
        <button
          onClick={() => scroll(-1)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white border border-slate-200 rounded-full shadow-md flex items-center justify-center hover:bg-slate-50 transition-colors -ml-4"
          aria-label="Précédent"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-slate-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="m15 19-7-7 7-7" />
          </svg>
        </button>
      )}

      <div ref={scrollRef} className="flex gap-3 overflow-x-auto scrollbar-none pb-1">
        {promos.map((promo, i) => (
          <a
            key={i}
            href={promo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 w-[260px] bg-white border border-slate-200 rounded-xl px-4 py-3 hover:border-primary hover:shadow-sm transition-all group"
          >
            {promo.program && (
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest block mb-1">
                {promo.program}
              </span>
            )}
            <p className="text-slate-700 text-xs font-medium leading-snug line-clamp-2 group-hover:text-primary transition-colors">
              {promo.title}
            </p>
            {promo.source && (
              <p className="text-slate-400 text-[10px] mt-1.5">{promo.source}</p>
            )}
          </a>
        ))}
      </div>

      {/* Right arrow */}
      {canRight && (
        <button
          onClick={() => scroll(1)}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white border border-slate-200 rounded-full shadow-md flex items-center justify-center hover:bg-slate-50 transition-colors -mr-4"
          aria-label="Suivant"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-slate-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="m9 5 7 7-7 7" />
          </svg>
        </button>
      )}
    </div>
  );
}
