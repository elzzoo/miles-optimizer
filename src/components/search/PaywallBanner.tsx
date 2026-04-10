interface Props {
  remaining: number;
  limit: number;
}

export default function PaywallBanner({ remaining, limit }: Props) {
  if (remaining > 1) return null;

  if (remaining === 1) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm flex items-center justify-between gap-3 mb-4">
        <p className="text-amber-700">
          <span className="font-semibold">Plus qu'1 recherche gratuite</span> aujourd'hui sur {limit}.
        </p>
        <a href="/premium" className="text-xs font-bold text-primary hover:underline flex-shrink-0">
          Passer Premium →
        </a>
      </div>
    );
  }

  // remaining === 0
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center shadow-sm mb-6">
      <p className="text-3xl mb-3">🔒</p>
      <p className="font-bold text-slate-900 mb-1">Quota de recherches atteint</p>
      <p className="text-slate-500 text-sm mb-5">
        Vous avez utilisé vos {limit} recherches gratuites aujourd'hui.
        Revenez demain ou passez Premium pour des recherches illimitées.
      </p>
      <a
        href="/premium"
        className="inline-flex items-center gap-2 bg-primary text-white font-bold px-6 py-3 rounded-xl hover:bg-[#1D4ED8] transition-colors shadow-sm"
      >
        ⭐ Débloquer Premium — 9,90€/mois
      </a>
      <p className="text-xs text-slate-400 mt-3">Sans engagement · Annulation à tout moment</p>
    </div>
  );
}
