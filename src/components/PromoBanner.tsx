// @ts-nocheck
import { usePromos } from "../hooks/usePromos.js";
import { PROGRAMS } from "../data/programs.js";

const PROGRAM_SHORT = Object.fromEntries(PROGRAMS.map(p => [p.id, p.short]));

function formatRelativeDate(dateTs: number | null, dateStr: string): string {
  if (!dateTs && !dateStr) return "";
  if (dateTs) {
    const diffMs = Date.now() - dateTs;
    const diffH = Math.floor(diffMs / 3600000);
    const diffD = Math.floor(diffMs / 86400000);
    if (diffH < 1) return "À l'instant";
    if (diffH < 24) return `Il y a ${diffH}h`;
    if (diffD === 1) return "Hier";
    if (diffD < 7) return `Il y a ${diffD}j`;
    if (diffD < 30) return `Il y a ${Math.floor(diffD / 7)} sem.`;
  }
  // Fallback to raw string (SerpAPI relative dates)
  if (dateStr) return dateStr;
  return "";
}

function PromoCard({ item }) {
  const hasLink = item.link && (item.link.startsWith("http://") || item.link.startsWith("https://"));
  const relDate = formatRelativeDate(item.dateTs ?? null, item.date ?? "");
  const programLabel = item.programShort || (item.programId && PROGRAM_SHORT[item.programId]) || null;

  const inner = (
    <>
      <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-amber-400">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z" />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-slate-200 text-xs font-semibold leading-snug line-clamp-2 transition-colors ${hasLink ? "group-hover:text-amber-200" : ""}`}>
          {item.title}
        </p>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {programLabel && (
            <span className="text-xs text-indigo-400 font-semibold bg-indigo-500/10 px-2 py-0.5 rounded-full">
              {programLabel}
            </span>
          )}
          {item.source && <span className="text-slate-600 text-xs truncate">{item.source}</span>}
          {relDate && <span className="text-slate-700 text-xs ml-auto">{relDate}</span>}
        </div>
      </div>
      {hasLink && (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5 text-slate-600 group-hover:text-amber-400 transition-colors flex-shrink-0 mt-0.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
        </svg>
      )}
    </>
  );

  const baseClass = "flex-shrink-0 w-72 flex items-start gap-3 mx-2 px-4 py-3 rounded-2xl bg-white/5 border border-white/8 transition-all group";

  if (hasLink) {
    return (
      <a
        href={item.link}
        target="_blank"
        rel="noopener noreferrer"
        className={`${baseClass} hover:bg-white/10 hover:border-indigo-500/30 cursor-pointer`}
      >
        {inner}
      </a>
    );
  }

  return (
    <div className={`${baseClass} cursor-default`} title="Article sans lien disponible">
      {inner}
    </div>
  );
}

// Client-side safety dedup — catches any duplicates that survive server-side processing
function dedupePromos(items) {
  const seen = new Set();
  return items.filter(item => {
    const key = (item.title || "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 50);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function PromoBanner() {
  const { promos: rawPromos, loading, fetchedAt, error } = usePromos();
  const promos = dedupePromos(rawPromos);

  return (
    <div className="mb-6">
      {/* Header */}
      <div className="max-w-2xl mx-auto px-4 flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-amber-400/80 text-xs font-bold uppercase tracking-widest">
            Promos miles en direct
          </span>
        </div>
        {fetchedAt && !loading && (
          <span className="text-slate-600 text-xs">Live</span>
        )}
      </div>

      {/* Marquee track */}
      <div className="marquee-root overflow-hidden py-1">
        {loading && (
          <div className="flex gap-3 px-4 max-w-2xl mx-auto animate-pulse">
            {[1,2,3].map(i => (
              <div key={i} className="flex-shrink-0 w-72 h-16 rounded-2xl bg-white/5 border border-white/8" />
            ))}
          </div>
        )}
        {!loading && promos.length === 0 && (
          <div className="max-w-2xl mx-auto px-4">
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/4 border border-white/8 text-slate-500 text-xs">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-amber-500/40 flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z" />
              </svg>
              Aucune promo miles disponible pour le moment
            </div>
          </div>
        )}
        {!loading && promos.length > 0 && (
          <div className="flex animate-marquee" style={{ width: `${promos.length * 2 * 304}px` }}>
            {[...promos, ...promos].map((item, i) => (
              <PromoCard key={i} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
