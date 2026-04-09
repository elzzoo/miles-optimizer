import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 mt-20">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">

          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                </svg>
              </div>
              <span className="font-bold text-white text-sm">Miles Optimizer</span>
            </div>
            <p className="text-xs leading-relaxed">
              Comparez cash et miles pour trouver les meilleurs vols. Gratuit, instantané, sans inscription.
            </p>
          </div>

          <div>
            <h4 className="text-white text-sm font-semibold mb-3">Produit</h4>
            <ul className="space-y-2 text-xs">
              {[
                { to: "/", label: "Recherche de vols" },
                { to: "/best-deals", label: "Meilleurs deals" },
                { to: "/explore", label: "Explorer destinations" },
                { to: "/calculator", label: "Calculateur" },
                { to: "/alerts", label: "Alertes prix" },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="hover:text-white transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white text-sm font-semibold mb-3">Programmes</h4>
            <ul className="space-y-2 text-xs">
              {[
                { to: "/flying-blue-guide",    label: "Flying Blue" },
                { to: "/flying-aeroplan-guide", label: "Aeroplan" },
                { to: "/flying-lifemiles-guide", label: "LifeMiles" },
                { to: "/flying-turkish-guide",  label: "Miles&Smiles" },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="hover:text-white transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white text-sm font-semibold mb-3">Routes populaires</h4>
            <ul className="space-y-2 text-xs">
              {[
                { to: "/dakar-paris",       label: "Dakar → Paris" },
                { to: "/abidjan-paris",     label: "Abidjan → Paris" },
                { to: "/casablanca-paris",  label: "Casablanca → Paris" },
                { to: "/lagos-london",      label: "Lagos → Londres" },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="hover:text-white transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          <p>© 2026 Miles Optimizer. Comparateur de vols cash vs miles.</p>
          <div className="flex items-center gap-4">
            <Link to="/premium" className="text-primary hover:text-blue-400 transition-colors font-medium">⭐ Premium</Link>
            <span className="text-slate-700">·</span>
            <span>Données non contractuelles</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
