import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import SearchForm from "../../components/search/SearchForm";
import { Link } from "react-router-dom";

const SEO_ROUTES: Record<string, { from: string; to: string; title: string; desc: string; tips: string[] }> = {
  "dakar-paris": {
    from: "DSS", to: "CDG",
    title: "Vols Dakar → Paris cash ou miles",
    desc: "Comparez les prix cash et miles pour votre vol Dakar-Paris (DSS-CDG). Flying Blue, Aeroplan et LifeMiles sont les programmes les plus rentables sur cette route.",
    tips: ["Flying Blue propose souvent des promos «Promo Awards» sur Dakar-Paris.", "Aeroplan offre des taxes quasi nulles (~10$) sur vols Air Canada via Montréal.", "La distance DSS-CDG est ~4 100 km — catégorie «long-courrier» pour la plupart des barèmes."],
  },
  "dakar-new-york": {
    from: "DSS", to: "JFK",
    title: "Vols Dakar → New York cash ou miles",
    desc: "Meilleur tarif Dakar-New York (DSS-JFK) : cash ou miles ? Aeroplan et LifeMiles sont souvent les mieux placés sur cette route transatlantique.",
    tips: ["Aeroplan sur Ethiopian Airlines (via ADD) est souvent le moins cher en miles.", "LifeMiles pendant ses promos 50% bonus divise votre coût réel par deux.", "Cette route fait ~7 200 km — catégorie premium dans les barèmes distance."],
  },
  "abidjan-paris": {
    from: "ABJ", to: "CDG",
    title: "Vols Abidjan → Paris cash ou miles",
    desc: "Comparez cash et miles pour votre vol Abidjan-Paris (ABJ-CDG). Air France propose des vols directs, et Flying Blue est naturellement avantageux sur cette route SkyTeam.",
    tips: ["Flying Blue Promo Awards est régulièrement disponible sur ABJ-CDG.", "Comparez avec Brussels Airlines via BRU — souvent moins de miles nécessaires.", "Les taxes Air France long-courrier sont élevées (~350$) — intégrez-les dans votre calcul."],
  },
  "casablanca-paris": {
    from: "CMN", to: "CDG",
    title: "Vols Casablanca → Paris cash ou miles",
    desc: "Trouvez le meilleur prix pour votre vol Casablanca-Paris (CMN-CDG). British Airways Avios sur Iberia et Turkish Miles&Smiles offrent d'excellents ratios sur cette courte route.",
    tips: ["BA Avios sur Iberia : seulement ~22 000 miles pour l'aller simple en éco.", "Turkish Miles&Smiles propose cette route avec peu d'escales.", "Cette route est courte (~2 100 km) — idéale pour les barèmes distance."],
  },
  "lagos-london": {
    from: "LOS", to: "LHR",
    title: "Vols Lagos → Londres cash ou miles",
    desc: "Comparez cash et miles pour votre vol Lagos-Londres (LOS-LHR). British Airways, United et Aeroplan couvrent bien cette route.",
    tips: ["BA Avios sur British Airways direct Lagos-Londres.", "United MileagePlus : pas de surcharge carburant sur partenaires.", "Virgin Points via Virgin Atlantic peut être compétitif sur cette route."],
  },
  "nairobi-paris": {
    from: "NBO", to: "CDG",
    title: "Vols Nairobi → Paris cash ou miles",
    desc: "Meilleur tarif Nairobi-Paris (NBO-CDG) : cash ou miles ? Ethiopian ShebaMiles et Flying Blue sont vos meilleurs alliés sur cette route africaine.",
    tips: ["ShebaMiles (Ethiopian) : taxes ultra-faibles (~30$) sur vols Ethiopian.", "Kenya Airways Asante Miles pour relier Nairobi à Paris via SkyTeam.", "La route NBO-CDG fait ~6 300 km — longue distance dans tous les barèmes."],
  },
  "dakar-istanbul": {
    from: "DSS", to: "IST",
    title: "Vols Dakar → Istanbul cash ou miles",
    desc: "Comparez les prix Dakar-Istanbul (DSS-IST). Turkish Miles&Smiles est évidemment le programme à surveiller en priorité sur cette route.",
    tips: ["Miles&Smiles sur Turkish Airlines : vols directs DSS-IST en saison.", "Attendez une promo bonus Miles&Smiles pour maximiser la valeur.", "En période sans promo, LifeMiles sur Turkish peut être plus avantageux."],
  },
  "accra-amsterdam": {
    from: "ACC", to: "AMS",
    title: "Vols Accra → Amsterdam cash ou miles",
    desc: "Trouvez le meilleur prix Accra-Amsterdam (ACC-AMS). KLM Flying Blue est dominant sur cette route.",
    tips: ["Flying Blue sur KLM : vols réguliers ACC-AMS.", "Les promos Flying Blue Promo Awards couvrent souvent cette route.", "Comparez avec Brussels Airlines via BRU — parfois moins de miles nécessaires."],
  },
};

const SEO_PROGRAMS: Record<string, {
  id: string; title: string; desc: string;
  alliance: string; taxUSD: number; bestFor: string[];
  avoid: string; bookingUrl: string;
}> = {
  "flying-blue-guide": {
    id: "flyingblue", title: "Guide Flying Blue : comment maximiser vos miles",
    desc: "Flying Blue est le programme de fidélité Air France-KLM. Ses Promo Awards mensuels peuvent diviser le coût en miles par deux sur certaines routes.",
    alliance: "SkyTeam", taxUSD: 400,
    bestFor: ["Afrique de l'Ouest → Paris", "Afrique → Amsterdam", "Vols en période de Promo Awards"],
    avoid: "Les taxes élevées sur AF/KLM long-courrier (~400$) peuvent annuler l'avantage miles.",
    bookingUrl: "https://www.airfranceklm.com/flying-blue/miles/award-flights",
  },
  "flying-aeroplan-guide": {
    id: "aeroplan", title: "Guide Aeroplan : les secrets pour voyager moins cher",
    desc: "Aeroplan (Air Canada) est réputé pour ses taxes quasi nulles (~10$) sur les vols partenaires. Idéal pour voyager via Star Alliance avec un minimum de frais annexes.",
    alliance: "Star Alliance", taxUSD: 10,
    bestFor: ["Vols via Turkish Airlines", "Vols via Ethiopian Airlines", "Tout trajet où les taxes partenaires sont faibles"],
    avoid: "Air Canada direct : les taxes remontent. Priorisez les partenaires Star Alliance.",
    bookingUrl: "https://www.aircanada.com/aeroplan/redeem/flights",
  },
  "flying-lifemiles-guide": {
    id: "lifemiles", title: "Guide LifeMiles : profitez des promos bonus miles",
    desc: "LifeMiles (Avianca) est le programme le plus agressif sur les promotions. Des bonus de 50 à 150% permettent d'acheter des miles à prix cassé régulièrement.",
    alliance: "Star Alliance", taxUSD: 60,
    bestFor: ["Périodes de promo bonus (achat de miles)", "Vols Turkish Airlines sans surcharge carburant", "Tout trajet Star Alliance avec valeur ≥ 1.5¢/mile"],
    avoid: "Hors promo, le ratio achat/valeur est moins intéressant. Attendez les promos 100%+.",
    bookingUrl: "https://www.lifemiles.com/miles/redeem",
  },
  "flying-turkish-guide": {
    id: "turkish", title: "Guide Miles&Smiles : le meilleur programme Star Alliance ?",
    desc: "Turkish Airlines Miles&Smiles offre des tarifs compétitifs, notamment sur les vols directs Turkish. Les promos bonus permettent de réduire le coût d'accumulation.",
    alliance: "Star Alliance", taxUSD: 217,
    bestFor: ["Vols directs Turkish Airlines", "Routes Afrique → Istanbul → monde entier", "Voyageurs fréquents Turkish qui accumulent naturellement"],
    avoid: "Les taxes Miles&Smiles (~217$) sont élevées. À comparer systématiquement avec Aeroplan ou LifeMiles.",
    bookingUrl: "https://www.turkishairlines.com/en-int/miles-and-smiles/award-tickets/",
  },
};

const CHEAP_FLIGHTS: Record<string, { iata: string; city: string; title: string; desc: string }> = {
  "cheap-flights-paris":    { iata: "CDG", city: "Paris",    title: "Vols pas chers vers Paris en miles",    desc: "Les meilleures offres en miles pour voler vers Paris (CDG). Flying Blue Promo Awards, Aeroplan et LifeMiles sont vos meilleurs alliés." },
  "cheap-flights-london":   { iata: "LHR", city: "Londres",  title: "Vols pas chers vers Londres en miles",  desc: "Voyagez vers Londres (LHR) pour moins cher en miles. British Airways Avios et United MileagePlus offrent les meilleurs ratios." },
  "cheap-flights-new-york": { iata: "JFK", city: "New York", title: "Vols pas chers vers New York en miles", desc: "New York (JFK) en miles : Aeroplan et LifeMiles sur vols transatlantiques partenaires sont souvent les moins chers." },
};

const RELATED_ROUTES = [
  { slug: "dakar-paris",      label: "Dakar → Paris" },
  { slug: "dakar-new-york",   label: "Dakar → New York" },
  { slug: "abidjan-paris",    label: "Abidjan → Paris" },
  { slug: "casablanca-paris", label: "Casablanca → Paris" },
  { slug: "lagos-london",     label: "Lagos → Londres" },
  { slug: "nairobi-paris",    label: "Nairobi → Paris" },
];

export default function RouteGuide() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const handleSearch = (params: URLSearchParams) => navigate(`/search?${params.toString()}`);

  const routeData   = SEO_ROUTES[slug];
  const programData = SEO_PROGRAMS[slug];
  const cheapData   = CHEAP_FLIGHTS[slug];

  // ── ROUTE PAGE ──────────────────────────────────────────────────────────────
  if (routeData) {
    return (
      <>
        <Helmet>
          <title>{routeData.title} | Miles Optimizer</title>
          <meta name="description" content={routeData.desc} />
          <link rel="canonical" href={`https://miles-optimizer-next.onrender.com/${slug}`} />
        </Helmet>

        <div className="max-w-3xl mx-auto px-4 py-12">
          <p className="text-xs font-bold text-primary uppercase tracking-widest mb-3">Guide route</p>
          <h1 className="text-3xl font-black text-slate-900 mb-3">{routeData.title}</h1>
          <p className="text-slate-500 mb-8 text-lg leading-relaxed">{routeData.desc}</p>

          <SearchForm onSearch={handleSearch} variant="hero" defaultOrigin={routeData.from} defaultDest={routeData.to} />

          <div className="mt-10 space-y-8">
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">Cash ou miles : que choisir ?</h2>
              <p className="text-slate-600 leading-relaxed">
                Pour la route <strong>{routeData.from} → {routeData.to}</strong>, un bon deal en miles commence
                à partir de <strong>1,2¢/mile</strong>. En dessous, le cash est généralement plus avantageux.
                Notre calculateur compare instantanément les deux options pour vous.
              </p>
            </section>

            <section className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span>💡</span> Astuces pour cette route
              </h3>
              <ul className="space-y-3">
                {routeData.tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                    <span className="text-primary font-bold flex-shrink-0 mt-0.5">→</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">Programmes recommandés</h2>
              <div className="grid gap-3">
                {[
                  { slug: "flying-blue-guide",     label: "Flying Blue", emoji: "✈️" },
                  { slug: "flying-aeroplan-guide",  label: "Aeroplan",   emoji: "🍁" },
                  { slug: "flying-lifemiles-guide", label: "LifeMiles",  emoji: "🌿" },
                ].map(p => (
                  <Link key={p.slug} to={`/${p.slug}`}
                    className="flex items-center gap-3 p-4 bg-white border border-slate-100 rounded-xl hover:border-primary/30 hover:bg-blue-50/30 transition-all group">
                    <span className="text-2xl">{p.emoji}</span>
                    <span className="font-semibold text-slate-800 group-hover:text-primary transition-colors">{p.label}</span>
                    <span className="ml-auto text-slate-400 group-hover:text-primary transition-colors">→</span>
                  </Link>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">Autres routes populaires</h2>
              <div className="flex flex-wrap gap-2">
                {RELATED_ROUTES.filter(r => r.slug !== slug).map(r => (
                  <Link key={r.slug} to={`/${r.slug}`}
                    className="text-sm px-3 py-1.5 rounded-full border border-slate-200 text-slate-600 hover:border-primary hover:text-primary hover:bg-blue-50 transition-all">
                    ✈️ {r.label}
                  </Link>
                ))}
              </div>
            </section>
          </div>
        </div>
      </>
    );
  }

  // ── PROGRAM GUIDE PAGE ───────────────────────────────────────────────────────
  if (programData) {
    return (
      <>
        <Helmet>
          <title>{programData.title} | Miles Optimizer</title>
          <meta name="description" content={programData.desc} />
        </Helmet>

        <div className="max-w-3xl mx-auto px-4 py-12">
          <p className="text-xs font-bold text-primary uppercase tracking-widest mb-3">Guide programme · {programData.alliance}</p>
          <h1 className="text-3xl font-black text-slate-900 mb-3">{programData.title}</h1>
          <p className="text-slate-500 mb-8 text-lg leading-relaxed">{programData.desc}</p>

          <SearchForm onSearch={handleSearch} variant="hero" />

          <div className="mt-10 space-y-8">
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { label: "Alliance", value: programData.alliance },
                { label: "Taxes typiques", value: `~${programData.taxUSD}$` },
                { label: "Valeur cible", value: "≥ 1.2¢/mile" },
              ].map(({ label, value }) => (
                <div key={label} className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-center">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">{label}</p>
                  <p className="text-lg font-black text-slate-900">{value}</p>
                </div>
              ))}
            </div>

            <section className="bg-green-50 border border-green-100 rounded-2xl p-6">
              <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2"><span>✅</span> Idéal pour</h3>
              <ul className="space-y-2">
                {programData.bestFor.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="text-green-500 font-bold mt-0.5 flex-shrink-0">✓</span> {item}
                  </li>
                ))}
              </ul>
            </section>

            <section className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
              <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2"><span>⚠️</span> À surveiller</h3>
              <p className="text-sm text-slate-700">{programData.avoid}</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">Routes populaires</h2>
              <div className="flex flex-wrap gap-2">
                {RELATED_ROUTES.map(r => (
                  <Link key={r.slug} to={`/${r.slug}`}
                    className="text-sm px-3 py-1.5 rounded-full border border-slate-200 text-slate-600 hover:border-primary hover:text-primary hover:bg-blue-50 transition-all">
                    ✈️ {r.label}
                  </Link>
                ))}
              </div>
            </section>

            <div className="pt-4">
              <a href={programData.bookingUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-primary text-white font-bold px-6 py-3 rounded-xl hover:bg-[#1D4ED8] transition-colors shadow-sm">
                Réserver avec {programData.title.split(" ")[1]} ↗
              </a>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── CHEAP FLIGHTS PAGE ───────────────────────────────────────────────────────
  if (cheapData) {
    return (
      <>
        <Helmet>
          <title>{cheapData.title} | Miles Optimizer</title>
          <meta name="description" content={cheapData.desc} />
        </Helmet>
        <div className="max-w-3xl mx-auto px-4 py-12">
          <p className="text-xs font-bold text-primary uppercase tracking-widest mb-3">Vols en miles</p>
          <h1 className="text-3xl font-black text-slate-900 mb-3">{cheapData.title}</h1>
          <p className="text-slate-500 mb-8 text-lg leading-relaxed">{cheapData.desc}</p>
          <SearchForm onSearch={handleSearch} variant="hero" defaultDest={cheapData.iata} />
        </div>
      </>
    );
  }

  // ── 404 ──────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center">
      <div className="text-4xl mb-4">✈️</div>
      <h1 className="text-2xl font-bold text-slate-900 mb-3">Page introuvable</h1>
      <p className="text-slate-500 mb-6">Cette page n'existe pas ou a été déplacée.</p>
      <Link to="/" className="bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#1D4ED8] transition-colors inline-block">
        Retour à l'accueil →
      </Link>
    </div>
  );
}
