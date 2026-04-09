import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import SearchForm from "../../components/search/SearchForm";

const SEO_ROUTES: Record<string, { from: string; to: string; title: string; desc: string }> = {
  "dakar-paris":       { from: "DSS", to: "CDG", title: "Vols Dakar → Paris cash ou miles",       desc: "Comparez les prix cash et miles pour votre vol Dakar-Paris (DSS-CDG). Trouvez le meilleur programme." },
  "dakar-new-york":    { from: "DSS", to: "JFK", title: "Vols Dakar → New York cash ou miles",    desc: "Meilleur tarif Dakar-New York (DSS-JFK) : cash ou miles ? Calculez et comparez." },
  "abidjan-paris":     { from: "ABJ", to: "CDG", title: "Vols Abidjan → Paris cash ou miles",     desc: "Comparez cash et miles pour votre vol Abidjan-Paris (ABJ-CDG)." },
  "casablanca-paris":  { from: "CMN", to: "CDG", title: "Vols Casablanca → Paris cash ou miles",  desc: "Trouvez le meilleur prix pour votre vol Casablanca-Paris (CMN-CDG)." },
  "lagos-london":      { from: "LOS", to: "LHR", title: "Vols Lagos → Londres cash ou miles",     desc: "Comparez cash et miles pour votre vol Lagos-Londres (LOS-LHR)." },
  "nairobi-paris":     { from: "NBO", to: "CDG", title: "Vols Nairobi → Paris cash ou miles",     desc: "Meilleur tarif Nairobi-Paris (NBO-CDG) : cash ou miles ?" },
  "dakar-istanbul":    { from: "DSS", to: "IST", title: "Vols Dakar → Istanbul cash ou miles",    desc: "Comparez les prix Dakar-Istanbul (DSS-IST). Miles&Smiles est-il rentable ?" },
  "accra-amsterdam":   { from: "ACC", to: "AMS", title: "Vols Accra → Amsterdam cash ou miles",   desc: "Trouvez le meilleur prix Accra-Amsterdam (ACC-AMS)." },
};

const SEO_PROGRAMS: Record<string, { id: string; title: string; desc: string }> = {
  "flying-blue-guide":    { id: "flyingblue", title: "Guide Flying Blue : comment maximiser vos miles",    desc: "Tout savoir sur Flying Blue : barème, promos, partenaires. Comment obtenir le meilleur ratio ¢/mile." },
  "flying-aeroplan-guide":{ id: "aeroplan",   title: "Guide Aeroplan : les secrets pour voyager moins cher", desc: "Aeroplan, le programme Canadian le plus avantageux ? Barème, partenaires, astuces." },
  "flying-lifemiles-guide":{ id: "lifemiles", title: "Guide LifeMiles : profitez des promos bonus miles",  desc: "LifeMiles et ses promos 50-150% bonus miles. Comment en profiter." },
  "flying-turkish-guide": { id: "turkish",    title: "Guide Miles&Smiles : le meilleur programme Star Alliance ?", desc: "Turkish Miles&Smiles, le programme qui offre les meilleurs tarifs sur Star Alliance." },
};

const CHEAP_FLIGHTS: Record<string, { city: string; title: string; desc: string }> = {
  "cheap-flights-paris":    { city: "Paris",    title: "Vols pas chers Paris en miles",    desc: "Trouvez les vols les moins chers vers Paris en utilisant vos miles." },
  "cheap-flights-london":   { city: "London",   title: "Vols pas chers Londres en miles",  desc: "Les meilleures offres en miles pour voler vers Londres." },
  "cheap-flights-new-york": { city: "New York", title: "Vols pas chers New York en miles", desc: "Voyagez vers New York pour moins cher en utilisant vos miles." },
};

export default function RouteGuide() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();

  const routeData   = SEO_ROUTES[slug];
  const programData = SEO_PROGRAMS[slug];
  const cheapData   = CHEAP_FLIGHTS[slug];

  const handleSearch = (params: URLSearchParams) => {
    navigate(`/search?${params.toString()}`);
  };

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
          <p className="text-slate-500 mb-8">{routeData.desc}</p>
          <SearchForm onSearch={handleSearch} variant="hero" defaultOrigin={routeData.from} defaultDest={routeData.to} />
          <div className="mt-10 prose prose-slate max-w-none">
            <h2>Cash ou miles : que choisir pour cette route ?</h2>
            <p>
              Pour la route <strong>{routeData.from} → {routeData.to}</strong>, le choix entre payer en cash
              ou utiliser des miles dépend du ratio ¢/mile obtenu.
              Un bon deal commence à partir de <strong>1,2¢/mile</strong>.
            </p>
            <p>
              Utilisez notre calculateur pour entrer le prix cash du vol que vous avez trouvé
              et voir instantanément quel programme de fidélité vous offre la meilleure valeur.
            </p>
          </div>
        </div>
      </>
    );
  }

  if (programData) {
    return (
      <>
        <Helmet>
          <title>{programData.title} | Miles Optimizer</title>
          <meta name="description" content={programData.desc} />
        </Helmet>
        <div className="max-w-3xl mx-auto px-4 py-12">
          <p className="text-xs font-bold text-primary uppercase tracking-widest mb-3">Guide programme</p>
          <h1 className="text-3xl font-black text-slate-900 mb-3">{programData.title}</h1>
          <p className="text-slate-500 mb-8">{programData.desc}</p>
          <SearchForm onSearch={handleSearch} variant="hero" />
        </div>
      </>
    );
  }

  if (cheapData) {
    return (
      <>
        <Helmet>
          <title>{cheapData.title} | Miles Optimizer</title>
          <meta name="description" content={cheapData.desc} />
        </Helmet>
        <div className="max-w-3xl mx-auto px-4 py-12">
          <h1 className="text-3xl font-black text-slate-900 mb-3">{cheapData.title}</h1>
          <p className="text-slate-500 mb-8">{cheapData.desc}</p>
          <SearchForm onSearch={handleSearch} variant="hero" defaultDest={cheapData.city} />
        </div>
      </>
    );
  }

  // 404
  return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center">
      <div className="text-4xl mb-4">✈️</div>
      <h1 className="text-2xl font-bold text-slate-900 mb-3">Page introuvable</h1>
      <p className="text-slate-500 mb-6">Cette page n'existe pas ou a été déplacée.</p>
      <a href="/" className="bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#1D4ED8] transition-colors inline-block">
        Retour à l'accueil →
      </a>
    </div>
  );
}
