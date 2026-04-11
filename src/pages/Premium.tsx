import { Helmet } from "react-helmet-async";
import { useState } from "react";

const TESTIMONIALS = [
  {
    initials: "M.D.",
    color: "bg-blue-500",
    name: "M.D.",
    city: "Dakar",
    quote: "J'ai économisé 340$ sur mon vol vers Paris grâce à LifeMiles. Jamais je n'aurais trouvé ça seul.",
    savings: "340$",
  },
  {
    initials: "A.K.",
    color: "bg-emerald-500",
    name: "A.K.",
    city: "Abidjan",
    quote: "Le comparateur m'a montré que mes miles Aeroplan valaient 2,4¢ pour Dubai. J'ai réservé immédiatement.",
    savings: "280$",
  },
  {
    initials: "F.T.",
    color: "bg-violet-500",
    name: "F.T.",
    city: "Casablanca",
    quote: "Avant Miles Optimizer, je prenais juste le vol le moins cher. Maintenant je voyage en Business pour moins cher qu'en éco.",
    savings: "520$",
  },
];

const FAQ = [
  { q: "Comment fonctionne le paiement ?", a: "Les paiements sont traités de manière sécurisée via Stripe. Vous pouvez annuler à tout moment depuis votre espace." },
  { q: "Puis-je annuler à tout moment ?", a: "Oui, sans frais ni préavis. Votre accès reste actif jusqu'à la fin de la période payée." },
  { q: "Les données sont-elles mises à jour en temps réel ?", a: "Les prix cash sont récupérés via Duffel, Aviasales et Google Flights. Les calculs miles sont mis à jour toutes les 12h." },
  { q: "Qu'est-ce qu'une alerte prix ?", a: "Une alerte vous envoie un email dès qu'un deal miles correspondant à votre route atteint un bon ratio valeur/mile." },
];

export default function Premium() {
  const [open, setOpen]                   = useState<number | null>(null);
  const [billing, setBilling]             = useState<"annual" | "monthly">("annual");
  const [showWaitlist, setShowWaitlist]        = useState(false);
  const [waitlistEmail, setWaitlistEmail]      = useState("");
  const [waitlisted, setWaitlisted]            = useState(false);
  const [waitlistSubmitting, setWaitlistSubmitting] = useState(false);

  const price    = billing === "annual" ? "6,58€" : "9,90€";
  const period   = billing === "annual" ? "/mois · facturé 79€/an" : "/mois";
  const savings  = billing === "annual" ? "Économisez 40%" : null;

  async function handleWaitlist(e: React.FormEvent) {
    e.preventDefault();
    setWaitlistSubmitting(true);
    try {
      await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: waitlistEmail, billing }),
      });
    } catch { /* best-effort */ }
    finally {
      setWaitlistSubmitting(false);
      setWaitlisted(true);
    }
  }

  return (
    <>
      <Helmet>
        <title>Premium — Miles Optimizer</title>
        <meta name="description" content="Débloquez Miles Optimizer Premium : alertes prix, deals illimités, filtres avancés. À partir de 6,58€/mois." />
        <link rel="canonical" href="https://miles-optimizer-next-3y3m.onrender.com/premium" />
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 py-14">

        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-xs font-bold text-primary uppercase tracking-widest mb-3">⭐ Premium</p>
          <h1 className="text-4xl font-black text-slate-900 mb-4">
            Le plein potentiel de<br />Miles Optimizer
          </h1>
          <p className="text-slate-500 text-lg max-w-lg mx-auto">
            Recherches illimitées, alertes prix, tous les deals. Sans engagement.
          </p>
        </div>

        {/* Billing toggle */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex bg-slate-100 rounded-2xl p-1 gap-1">
            <button
              onClick={() => setBilling("annual")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                billing === "annual"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Annuel
              <span className="text-[10px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">-40%</span>
            </button>
            <button
              onClick={() => setBilling("monthly")}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                billing === "monthly"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Mensuel
            </button>
          </div>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">

          {/* Free */}
          <div className="rounded-3xl border border-slate-200 bg-white p-8">
            <h3 className="text-base font-bold text-slate-700 mb-1">Gratuit</h3>
            <div className="flex items-end gap-1 mb-6">
              <span className="text-4xl font-black text-slate-900">0€</span>
            </div>
            <ul className="space-y-3 mb-8">
              {[
                { text: "5 recherches par jour",   ok: true },
                { text: "6 meilleurs deals",        ok: true },
                { text: "8 destinations explorées", ok: true },
                { text: "Calculateur miles",        ok: true },
                { text: "Alertes prix",             ok: false },
                { text: "Deals illimités",          ok: false },
                { text: "Filtres avancés",          ok: false },
                { text: "Export résultats",         ok: false },
              ].map(f => (
                <li key={f.text} className={`flex items-center gap-2.5 text-sm ${f.ok ? "text-slate-700" : "text-slate-400"}`}>
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold ${f.ok ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-400"}`}>
                    {f.ok ? "✓" : "✕"}
                  </span>
                  {f.text}
                </li>
              ))}
            </ul>
            <a href="/" className="block w-full text-center py-3.5 rounded-xl font-bold text-sm border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all">
              Continuer
            </a>
          </div>

          {/* Premium */}
          <div className="rounded-3xl border border-primary bg-primary/3 shadow-[0_0_0_1px_#2563EB22,0_8px_32px_rgba(37,99,235,.12)] p-8 relative">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <span className="bg-primary text-white text-xs font-bold px-4 py-1 rounded-full shadow-sm">
                Le plus populaire
              </span>
            </div>

            <h3 className="text-base font-bold text-slate-700 mb-1">Premium</h3>
            <div className="flex items-end gap-1 mb-1">
              <span className="text-4xl font-black text-slate-900">{price}</span>
              <span className="text-slate-400 text-sm mb-1">{period}</span>
            </div>
            {savings && (
              <p className="text-xs font-bold text-green-600 mb-5">{savings}</p>
            )}
            {!savings && <div className="mb-5" />}

            <ul className="space-y-3 mb-8">
              {[
                { text: "Recherches illimitées",     ok: true },
                { text: "Tous les deals (30+)",      ok: true },
                { text: "Destinations illimitées",   ok: true },
                { text: "Calculateur miles",         ok: true },
                { text: "10 alertes prix par email", ok: true },
                { text: "Filtres avancés",           ok: true },
                { text: "Priorité support",          ok: true },
                { text: "Sans engagement",           ok: true },
              ].map(f => (
                <li key={f.text} className="flex items-center gap-2.5 text-sm text-slate-700">
                  <span className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold bg-green-100 text-green-600">✓</span>
                  {f.text}
                </li>
              ))}
            </ul>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
              <p className="text-sm font-semibold text-slate-800 mb-1">💳 Paiement bientôt disponible</p>
              <a href="/alerts" className="text-sm text-primary font-medium hover:underline">
                Inscris-toi pour être notifié →
              </a>
            </div>
          </div>
        </div>

        {/* Social proof */}
        <div className="mb-14">
          <h3 className="text-lg font-bold text-slate-900 text-center mb-6">Ils ont économisé avec Miles Optimizer</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-9 h-9 rounded-full ${t.color} flex items-center justify-center flex-shrink-0`}>
                    <span className="text-white text-xs font-bold">{t.initials}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.city}</p>
                  </div>
                  <span className="ml-auto text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                    -{t.savings}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed italic">"{t.quote}"</p>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 text-center mt-3">Témoignages à titre illustratif — données réelles à venir</p>
        </div>

        {/* Waitlist (fallback when Stripe not configured) */}
        {showWaitlist && (
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
                <button
                  type="submit"
                  disabled={waitlistSubmitting}
                  className="bg-primary text-white font-semibold px-5 py-3 rounded-xl hover:bg-[#1D4ED8] transition-colors text-sm disabled:opacity-60"
                >
                  {waitlistSubmitting ? "..." : "M'inscrire"}
                </button>
              </form>
            )}
          </div>
        )}

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
