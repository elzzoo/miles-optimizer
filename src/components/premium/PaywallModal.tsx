import { ReactNode } from "react";
import Button from "../../design/components/Button";

interface Props {
  onClose: () => void;
  feature?: string;
  title?: string;
  description?: string;
}

const FEATURES = [
  "Recherches illimitées",
  "10 alertes prix par email",
  "Accès à tous les meilleurs deals",
  "Filtres avancés (escales, compagnies)",
  "Destinations illimitées",
];

export default function PaywallModal({
  onClose,
  feature,
  title = "Fonctionnalité Premium",
  description = "Débloquez l'accès complet à Miles Optimizer pour ne jamais rater un bon deal.",
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-cyan-500 p-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-2xl mb-2">⭐</div>
              <h3 className="text-lg font-bold">{title}</h3>
              <p className="text-white/80 text-sm mt-1">{description}</p>
            </div>
            <button onClick={onClose} className="text-white/60 hover:text-white transition-colors ml-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Features */}
          <ul className="space-y-2.5 mb-6">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-slate-700">
                <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0 text-xs">✓</span>
                {f}
              </li>
            ))}
          </ul>

          {/* Price */}
          <div className="bg-slate-50 rounded-2xl p-4 mb-5 text-center">
            <div className="text-3xl font-black text-slate-900">9,90€</div>
            <div className="text-slate-500 text-sm">/mois · Sans engagement</div>
          </div>

          <Button fullWidth size="lg" onClick={() => window.location.href = "/premium"}>
            Passer Premium →
          </Button>
          <button onClick={onClose} className="w-full text-center text-xs text-slate-400 mt-3 hover:text-slate-600 transition-colors">
            Continuer en gratuit
          </button>
        </div>
      </div>
    </div>
  );
}
