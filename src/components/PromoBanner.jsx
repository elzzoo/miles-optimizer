import { usePromos } from "../hooks/usePromos.js";
import { PROGRAMS } from "../data/programs.js";

const PROGRAM_EMOJI = Object.fromEntries(PROGRAMS.map(p => [p.id, p.emoji]));
const PROGRAM_SHORT = Object.fromEntries(PROGRAMS.map(p => [p.id, p.short]));

function timeAgo(isoDate) {
  if (!isoDate) return "";
  const diff = Math.round((Date.now() - new Date(isoDate)) / 60000);
  if (diff < 2) return "à l'instant";
  if (diff < 60) return `il y a ${diff} min`;
  const h = Math.round(diff / 60);
  if (h < 24) return `il y a ${h}h`;
  return `il y a ${Math.round(h / 24)}j`;
}

export default function PromoBanner() {
  const { promos, loading, fetchedAt, error } = usePromos();

  if (loading) {
    return (
      <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-yellow-400 text-xs font-bold uppercase tracking-widest">🔥 Actualités promos miles</span>
        </div>
        <div className="animate-pulse flex gap-2">
          {[1,2,3].map(i => <div key={i} className="h-16 flex-1 rounded-xl bg-white/5" />)}
        </div>
      </div>
    );
  }

  if (error || promos.length === 0) {
    return (
      <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-4 mb-4">
        <p className="text-yellow-400 text-xs font-bold uppercase tracking-widest mb-2">🔥 Actualités promos miles</p>
        <p className="text-indigo-400 text-xs">Aucune actualité promo trouvée pour le moment.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-yellow-300 text-xs font-bold uppercase tracking-widest">🔥 Actualités promos miles</p>
        {fetchedAt && (
          <span className="text-indigo-500 text-xs">Actualisé {timeAgo(fetchedAt)}</span>
        )}
      </div>
      <div className="space-y-2">
        {promos.map((item, i) => (
          <a
            key={i}
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5 cursor-pointer group"
          >
            <div className="text-xl flex-shrink-0 mt-0.5">
              {item.programId ? PROGRAM_EMOJI[item.programId] || "✈️" : "✈️"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white text-xs font-semibold leading-snug line-clamp-2 group-hover:text-yellow-200 transition-colors">
                {item.title}
              </p>
              {item.snippet && (
                <p className="text-indigo-400 text-xs mt-0.5 line-clamp-1">{item.snippet}</p>
              )}
              <div className="flex items-center gap-2 mt-1">
                {item.programId && (
                  <span className="text-xs text-emerald-400 font-semibold">
                    {PROGRAM_SHORT[item.programId]}
                  </span>
                )}
                {item.source && <span className="text-indigo-500 text-xs">{item.source}</span>}
                {item.date && <span className="text-indigo-600 text-xs">{item.date}</span>}
                <span className="text-indigo-500 text-xs ml-auto opacity-0 group-hover:opacity-100 transition-opacity">↗</span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
