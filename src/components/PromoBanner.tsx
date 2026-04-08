// @ts-nocheck
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
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-yellow-400 flex-shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z" />
          </svg>
          <span className="text-yellow-400 text-xs font-bold uppercase tracking-widest">Actualités promos miles</span>
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
        <p className="text-yellow-400 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 flex-shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z" />
          </svg>
          Actualités promos miles
        </p>
        <p className="text-indigo-400 text-xs">Aucune actualité promo trouvée pour le moment.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-yellow-300 text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 flex-shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z" />
          </svg>
          Actualités promos miles
        </p>
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
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              {item.programId && PROGRAM_EMOJI[item.programId] ? (
                <span className="text-sm">{PROGRAM_EMOJI[item.programId]}</span>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-indigo-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                </svg>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white text-xs font-semibold leading-snug line-clamp-2 group-hover:text-yellow-200 transition-colors">
                {item.title}
              </p>
              {item.snippet && (
                <p className="text-indigo-400 text-xs mt-0.5 line-clamp-1">{item.snippet}</p>
              )}
              <div className="flex items-center gap-2 mt-1">
                {(item.programShort || (item.programId && PROGRAM_SHORT[item.programId])) && (
                  <span className="text-xs text-emerald-400 font-semibold">
                    {item.programShort || PROGRAM_SHORT[item.programId]}
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
