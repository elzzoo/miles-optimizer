import { useState, useEffect } from "react";

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

  useEffect(() => {
    fetch("/api/promos")
      .then(r => r.json())
      .then(d => setPromos(dedupePromos(d.promos ?? [])))
      .catch(() => {});
  }, []);

  if (!promos.length) return null;

  return (
    <div className="flex gap-3 overflow-x-auto scrollbar-none pb-1">
      {promos.map((promo, i) => (
        <a
          key={i}
          href={promo.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 max-w-[280px] bg-white border border-slate-200 rounded-xl px-4 py-3 hover:border-primary hover:shadow-sm transition-all group"
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
  );
}
