import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { useState, useCallback } from "react";
import SearchForm from "../components/search/SearchForm";
import DestinationGrid from "../components/destinations/DestinationGrid";
import DealCard from "../components/deals/DealCard";
import PromoBanner from "../components/promo/PromoBanner";
import { useBestDeals } from "../hooks/useBestDeals";
import { defaultMeta } from "../utils/seo";

const POPULAR_ROUTES = [
  { from: "DSS", to: "CDG", label: "Dakar → Paris" },
  { from: "ABJ", to: "CDG", label: "Abidjan → Paris" },
  { from: "CMN", to: "JFK", label: "Casablanca → New York" },
  { from: "LOS", to: "DXB", label: "Lagos → Dubaï" },
  { from: "NBO", to: "LHR", label: "Nairobi → Londres" },
  { from: "DSS", to: "IST", label: "Dakar → Istanbul" },
];

const HOW_IT_WORKS = [
  { icon: "🗺️", step: "1", title: "Choisis ta route", desc: "Départ, arrivée, dates et classe cabin" },
  { icon: "⚡", step: "2", title: "On compare tout", desc: "Prix cash + 19 programmes miles en temps réel" },
  { icon: "💰", step: "3", title: "Tu économises", desc: "Jusqu'à 70% de réduction avec les bons miles" },
];

export default function Home() {
  const navigate   = useNavigate();
  const { deals }  = useBestDeals();
  const [origin, setOrigin] = useState("DSS");

  const handleSearch = useCallback((params: URLSearchParams) => {
    navigate(`/search?${params.toString()}`);
  }, [navigate]);

  const handleDestinationSelect = (iata: string, name: string) => {
    navigate(`/search?origin=${origin}&dest=${iata}`);
  };

  return (
    <>
      <Helmet>
        <title>{defaultMeta.title}</title>
        <meta name="description" content={defaultMeta.description} />
        <meta property="og:title"       content={defaultMeta.title} />
        <meta property="og:description" content={defaultMeta.description} />
        <meta property="og:type"        content="website" />
        <meta property="og:image"       content="/og-image.png" />
        <meta property="og:image:width"  content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card"        content="summary_large_image" />
        <meta name="twitter:image"       content="/og-image.png" />
      </Helmet>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-cyan-50 pt-12 pb-16 px-4">
        <div className="max-w-3xl mx-auto">

          {/* Trust bar */}
          <div className="flex items-center justify-center gap-6 mb-8 flex-wrap">
            {[
              { emoji: "✈️", label: "+20 000 recherches" },
              { emoji: "⭐", label: "19 programmes" },
              { emoji: "🆓", label: "100% gratuit" },
            ].map(({ emoji, label }) => (
              <span key={label} className="flex items-center gap-1.5 text-sm text-slate-500">
                <span>{emoji}</span> {label}
              </span>
            ))}
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-center text-slate-900 leading-tight mb-4">
            Trouvez les meilleurs vols<br />
            <span className="text-primary">cash ou miles</span>
          </h1>
          <p className="text-center text-slate-500 text-lg mb-10 max-w-xl mx-auto">
            Comparez prix cash et miles instantanément. Choisissez la meilleure option pour votre voyage.
          </p>

          <SearchForm onSearch={handleSearch} variant="hero" defaultOrigin={origin} onOriginChange={setOrigin} />

          {/* Popular routes */}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {POPULAR_ROUTES.map(r => (
              <button
                key={r.label}
                onClick={() => navigate(`/search?origin=${r.from}&dest=${r.to}`)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs text-slate-600 hover:border-primary hover:text-primary hover:bg-blue-50 transition-all shadow-sm"
              >
                <span>✈️</span> {r.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROMOS ───────────────────────────────────────────── */}
      <section className="py-8 bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <p className="text-sm font-semibold text-slate-600">Promos miles du moment</p>
          </div>
          <PromoBanner />
        </div>
      </section>

      {/* ── BEST DEALS ───────────────────────────────────────── */}
      <section className="py-14 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Mis à jour aujourd'hui</p>
              <h2 className="text-2xl font-bold text-slate-900">Meilleurs deals du moment</h2>
            </div>
            <a href="/best-deals" className="text-sm text-primary font-semibold hover:underline hidden sm:block">
              Voir tout →
            </a>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(deals ?? []).slice(0, 6).map((deal, i) => (
              <DealCard key={deal.id} deal={deal} rank={i} />
            ))}
            {(!deals || deals.length === 0) && (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse h-36" />
              ))
            )}
          </div>

          <a href="/best-deals" className="mt-6 flex items-center justify-center text-sm text-primary font-semibold sm:hidden">
            Voir tous les deals →
          </a>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section className="py-14 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-slate-900 mb-10">Comment ça marche</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map(({ icon, step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary/8 border border-primary/15 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">{icon}</span>
                </div>
                <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2">Étape {step}</p>
                <h3 className="font-bold text-slate-800 mb-2">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EXPLORE DESTINATIONS ─────────────────────────────── */}
      <section className="py-14 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Explorer des destinations</h2>
              <p className="text-slate-500 text-sm mt-1">Cliquez pour pré-remplir la recherche</p>
            </div>
            <a href="/explore" className="text-sm text-primary font-semibold hover:underline hidden sm:block">
              Explorer tout →
            </a>
          </div>
          <DestinationGrid from={origin} onSelect={handleDestinationSelect} />
        </div>
      </section>

      {/* ── ALERT CTA ────────────────────────────────────────── */}
      <section className="py-14 px-4 bg-primary">
        <div className="max-w-2xl mx-auto text-center">
          <div className="text-4xl mb-4">🔔</div>
          <h2 className="text-2xl font-bold text-white mb-3">Ne ratez plus jamais un bon deal</h2>
          <p className="text-blue-200 mb-8">
            Créez une alerte : on vous envoie un email dès qu'un deal miles correspondant à votre route est disponible.
          </p>
          <a
            href="/alerts"
            className="inline-flex items-center gap-2 bg-white text-primary font-bold px-8 py-3.5 rounded-xl hover:bg-blue-50 transition-colors shadow-lg"
          >
            Créer une alerte gratuite →
          </a>
        </div>
      </section>

      {/* ── PREMIUM CTA ──────────────────────────────────────── */}
      <section className="py-14 px-4 bg-slate-900">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-amber-400 text-sm font-bold uppercase tracking-widest mb-3">⭐ Premium</p>
          <h2 className="text-2xl font-bold text-white mb-4">Débloquez le plein potentiel</h2>
          <div className="grid grid-cols-2 gap-3 mb-8 text-left max-w-sm mx-auto">
            {[
              "Recherches illimitées",
              "10 alertes prix",
              "Tous les meilleurs deals",
              "Filtres avancés",
            ].map(f => (
              <div key={f} className="flex items-center gap-2 text-sm text-slate-300">
                <span className="text-green-400">✓</span> {f}
              </div>
            ))}
          </div>
          <a href="/premium"
            className="inline-flex items-center gap-2 bg-primary text-white font-bold px-8 py-3.5 rounded-xl hover:bg-[#1D4ED8] transition-colors"
          >
            Voir les plans — à partir de 9,90€/mois →
          </a>
        </div>
      </section>
    </>
  );
}
