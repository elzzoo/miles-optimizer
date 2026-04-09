import { Helmet } from "react-helmet-async";
import { useState } from "react";
import { useAnalytics } from "../hooks/useAnalytics";

const PLANS = [
  {
    id: "free",
    name: "Gratuit",
    price: "0€",
    period: "",
    cta: "Continuer",
    ctaHref: "/",
    highlight: false,
    features: [
      { text: "5 recherches par jour",        ok: true },
      { text: "6 meilleurs deals",             ok: true },
      { text: "8 destinations explorées",      ok: true },
      { text: "Calculateur miles",             ok: true },
      { text: "Alertes prix",                  ok: false },
      { text: "Deals illimités",               ok: false },
      { text: "Filtres avancés",               ok: false },
      { text: "Export résultats",              ok: false },
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: "9,90€",
    period: "/mois",
    cta: "Commencer — 9,90€/mois",
    ctaHref: "#waitlist",
    highlight: true,
    badge: "Le plus populaire",
    features: [
      { text: "Recherches illimitées",         ok: true },
      { text: "Tous les deals (30+)",          ok: true },
      { text: "Destinations illimitées",       ok: true },
      { text: "Calculateur miles",             ok: true },
      { text: "10 alertes prix par email",     ok: true },
      { text: "Filtres avancés",               ok: true },
      { text: "Priorité support",              ok: true },
      { text: "Sans engagement",               ok: true },
    ],
  },
];

const FAQ = [
  { q: "Comment fonctionne le paiement ?", a: "Les paiements sont traités de manière sécurisée via Stripe. Vous pouvez annuler à tout moment depuis votre espace." },
  { q: "Puis-je annuler à tout moment ?", a: "Oui, sans frais ni préavis. Votre accès reste actif jusqu'à la fin de la période payée." },
  { q: "Les données sont-elles mises à jour en temps réel ?", a: "Les prix cash sont récupérés via Google Flights et Skyscanner. Les calculs miles sont mis à jour toutes les 12h." },
  { q: "Qu'est-ce qu'une alerte prix ?", a: "Une alerte vous envoie un email dès qu'un deal miles correspondant à votre route atteint un bon ratio valeur/mile." },
];

export default function Premium() {
  const { trackUpgradeClick } = useAnalytics();
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlisted, setWaitlisted] = useState(false);
  const [open, setOpen] = useState<number | null>(null);

  function handleWaitlist(e: React.FormEvent) {
    e.preventDefault();
    trackUpgradeClick();
    // TODO: save to Supabase waitlist table
    setWaitlisted(true);
  }

  return (
    <>
      <Helmet>
        <title>Premium — Miles Optimizer</title>
        <meta name="description" content="Débloquez Miles Optimizer Premium : alertes prix, deals illimités, filtres avancés. 9,90€/mois sans engagement." />
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 py-14">

        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-xs font-bold text-primary uppercase tracking-widest mb-3">⭐ Premium</p>
          <h1 className="text-4xl font-black text-slate-900 mb-4">
            Le plein potentiel de<br />Miles Optimizer
          </h1>
          <p className="text-slate-500 text-lg max-w-lg mx-auto">
            Recherches illimitées, alertes prix, tous les deals. Sans engagement.
          </p>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-3xl border p-8 relative ${
                plan.highlight
                  ? "border-primary bg-primary/3 shadow-[0_0_0_1px_#2563EB22,0_8px_32px_rgba(37,99,235,.12)]"
                  : "border-slate-200 bg-white"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-white text-xs font-bold px-4 py-1 rounded-full shadow-sm">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-base font-bold text-slate-700 mb-1">{plan.name}</h3>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-black text-slate-900">{plan.price}</span>
                  {plan.period && <span className="text-slate-400 text-sm mb-1">{plan.period}</span>}
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li key={f.text} className={`flex items-center gap-2.5 text-sm ${f.ok ? "text-slate-700" : "text-slate-400"}`}>
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold ${
                      f.ok ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-400"
                    }`}>
                      {f.ok ? "✓" : "✕"}
                    </span>
                    {f.text}
                  </li>
                ))}
              </ul>

              <a
                href={plan.ctaHref}
                onClick={() => plan.highlight && trackUpgradeClick()}
                className={`block w-full text-center py-3.5 rounded-xl font-bold text-sm transition-all ${
                  plan.highlight
                    ? "bg-primary text-white hover:bg-[#1D4ED8] shadow-sm"
                    : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>

        {/* Waitlist */}
        <div id="waitlist" className="bg-slate-50 rounded-3xl p-8 mb-14 text-center">
          <h3 className="font-bold text-slate-900 mb-2">🚀 Paiement bientôt disponible</h3>
          <p className="text-slate-500 text-sm mb-6">Laissez votre email pour être notifié en premier et recevoir -20% de réduction au lancement.</p>

          {waitlisted ? (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
              <p className="text-green-700 font-semibold">✓ Vous êtes sur la liste d'attente !</p>
              <p className="text-green-600 text-sm mt-1">On vous contacte dès le lancement.</p>
            </div>
          ) : (
            <form onSubmit={handleWaitlist} className="flex gap-3 max-w-sm mx-auto">
              <input
                type="email"
                value={waitlistEmail}
                onChange={e => setWaitlistEmail(e.target.value)}
                placeholder="vous@email.com"
                required
                className="flex-1 px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button type="submit" className="bg-primary text-white font-semibold px-5 py-3 rounded-xl hover:bg-[#1D4ED8] transition-colors text-sm">
                M'inscrire
              </button>
            </form>
          )}
        </div>

        {/* FAQ */}
        <div>
          <h3 className="text-xl font-bold text-slate-900 mb-6 text-center">Questions fréquentes</h3>
          <div className="space-y-2">
            {FAQ.map((item, i) => (
              <div key={i} className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className="font-semibold text-slate-800 text-sm">{item.q}</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${open === i ? "rotate-180" : ""}`}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>
                {open === i && (
                  <div className="px-5 pb-5 text-sm text-slate-500 leading-relaxed">{item.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
