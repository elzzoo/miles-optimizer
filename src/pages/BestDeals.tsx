import { Helmet } from "react-helmet-async";
import { useState } from "react";
import DealCard from "../components/deals/DealCard";
import Skeleton from "../design/components/Skeleton";
import { useBestDeals } from "../hooks/useBestDeals";
import { buildMeta } from "../utils/seo";

const ALLIANCES = ["Tous", "Star Alliance", "SkyTeam", "OneWorld", "Indépendant"];

const meta = buildMeta({
  title:       "Meilleurs deals miles",
  description: "Top deals cash vs miles du moment. Calculateur de valeur et classement par rentabilité.",
  canonicalUrl:"/best-deals",
});

export default function BestDeals() {
  const { deals, loading, updatedAt } = useBestDeals();
  const [allianceFilter, setAllianceFilter] = useState("Tous");
  const [sortBy, setSortBy]                 = useState<"score" | "savings" | "miles">("score");
  const FREE_LIMIT = 6;

  const filtered = (deals ?? [])
    .filter(d => allianceFilter === "Tous" || true) // programs don't have alliance in this context
    .sort((a, b) => {
      if (sortBy === "savings") return b.score.savingsUSD - a.score.savingsUSD;
      if (sortBy === "miles")   return a.milesNeeded - b.milesNeeded;
      return b.score.centsPerMile - a.score.centsPerMile;
    });

  const displayedDeals = filtered;
  const freeDeals    = displayedDeals.slice(0, FREE_LIMIT);
  const lockedDeals  = displayedDeals.slice(FREE_LIMIT);

  return (
    <>
      <Helmet>
        <title>{meta.title}</title>
        <meta name="description" content={meta.description} />
      </Helmet>

      <div className="max-w-5xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2">Calculé en temps réel</p>
          <h1 className="text-3xl font-black text-slate-900 mb-2">Meilleurs deals miles</h1>
          <p className="text-slate-500">
            Classés par rentabilité (¢/mile). Plus c'est élevé, meilleur est le deal.
          </p>
          {updatedAt && (
            <p className="text-xs text-slate-400 mt-2">
              Mis à jour {new Date(updatedAt).toLocaleString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6 items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            {["score", "savings", "miles"].map((s) => (
              <button key={s} onClick={() => setSortBy(s as any)}
                className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
                  sortBy === s
                    ? "bg-primary text-white border-primary"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                {s === "score" ? "↑ Meilleur ratio" : s === "savings" ? "↑ Plus d'économies" : "↓ Moins de miles"}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-400">{filtered.length} deals trouvés</p>
        </div>

        {/* Deals */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} variant="card" />)}
          </div>
        ) : (
          <div className="space-y-3">
            {/* Free deals */}
            {freeDeals.map((deal, i) => (
              <DealCard key={deal.id} deal={deal} rank={i} />
            ))}

            {/* Locked deals (Premium) */}
            {lockedDeals.length > 0 && (
              <>
                <div className="relative py-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-slate-50 px-4 py-2 rounded-full text-xs font-semibold text-slate-500 border border-slate-200 shadow-sm">
                      🔒 {lockedDeals.length} deals supplémentaires — Premium
                    </span>
                  </div>
                </div>
                {lockedDeals.slice(0, 3).map((deal, i) => (
                  <DealCard key={deal.id} deal={deal} rank={FREE_LIMIT + i} blurred />
                ))}
                <div className="text-center py-4">
                  <a href="/premium"
                    className="inline-flex items-center gap-2 bg-primary text-white font-bold px-6 py-3 rounded-xl hover:bg-[#1D4ED8] transition-colors shadow-sm"
                  >
                    ⭐ Débloquer tous les deals — 9,90€/mois
                  </a>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
