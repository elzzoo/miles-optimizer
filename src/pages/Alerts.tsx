import { Helmet } from "react-helmet-async";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useAlerts } from "../hooks/useAlerts";
import AlertForm from "../components/alerts/AlertForm";

export default function Alerts() {
  const [searchParams] = useSearchParams();
  const { user, isPremium, signIn, token } = useAuth();
  const { alerts, loading, createAlert, deleteAlert, toggleAlert } = useAlerts(token);
  const prefillOrigin = searchParams.get("origin") || undefined;
  const prefillDest   = searchParams.get("dest")   || undefined;
  const [email, setEmail]     = useState("");
  const [sent, setSent]       = useState(false);
  const [sending, setSending] = useState(false);
  const [signInError, setSignInError] = useState("");

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setSignInError("");
    const { error } = await signIn(email);
    setSending(false);
    if (error) {
      setSignInError(error.message || "Une erreur est survenue. Réessayez.");
    } else {
      setEmail("");
      setSent(true);
    }
  }

  if (!user) {
    return (
      <>
        <Helmet><title>Alertes prix | Miles Optimizer</title></Helmet>
        <div className="max-w-md mx-auto px-4 py-20 text-center">
          <div className="text-4xl mb-4">🔔</div>
          <h1 className="text-2xl font-bold text-slate-900 mb-3">Alertes prix miles</h1>
          <p className="text-slate-500 mb-8">
            Connectez-vous pour créer des alertes et être notifié par email quand un deal correspond à votre route.
          </p>

          {sent ? (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
              <div className="text-3xl mb-3">✉️</div>
              <h3 className="font-bold text-green-800 mb-2">Email envoyé !</h3>
              <p className="text-green-700 text-sm">Vérifiez votre boîte mail et cliquez sur le lien de connexion.</p>
            </div>
          ) : (
            <form onSubmit={handleSignIn} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2 text-left">
                Votre email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="vous@email.com"
                required
                className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary mb-4"
              />
              <button
                type="submit"
                disabled={sending}
                className="w-full bg-primary text-white font-semibold py-3 rounded-xl hover:bg-[#1D4ED8] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {sending ? (
                  <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Envoi en cours…</>
                ) : "Recevoir le lien de connexion →"}
              </button>
              {signInError && (
                <div className="mt-3 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                  ❌ {signInError}
                </div>
              )}
              <p className="text-xs text-slate-400 mt-3">Sans mot de passe · Lien valable 1h</p>
            </form>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet><title>Mes alertes | Miles Optimizer</title></Helmet>
      <div className="max-w-3xl mx-auto px-4 py-10">

        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-slate-900">Mes alertes prix</h1>
            {isPremium && (
              <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">⭐ Premium</span>
            )}
          </div>
          <p className="text-slate-500 text-sm">
            {isPremium
              ? `${alerts.length}/10 alertes actives · Notifications par email`
              : "Alertes disponibles en Premium"}
          </p>
        </div>

        <div className="grid md:grid-cols-[1fr_340px] gap-6">
          {/* Alert list */}
          <div className="space-y-3">
            {loading && (
              Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 h-24 animate-pulse" />
              ))
            )}

            {!loading && alerts.length === 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
                <div className="text-3xl mb-3">🔔</div>
                <p className="text-slate-500 text-sm">Aucune alerte pour l'instant</p>
                {!isPremium && (
                  <a href="/premium" className="text-primary text-sm font-medium hover:underline mt-2 block">
                    Passer Premium pour créer des alertes →
                  </a>
                )}
              </div>
            )}

            {alerts.map((alert) => (
              <div key={alert.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-bold text-slate-800 text-sm">
                        {alert.origin} → {alert.destination}
                      </span>
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${alert.is_active ? "bg-green-400" : "bg-slate-300"}`} />
                    </div>
                    <p className="text-xs text-slate-500">
                      Max {alert.max_miles.toLocaleString()} miles ·
                      {alert.cabin === 1 ? " Business" : " Éco"} ·
                      {alert.last_checked
                        ? ` Vérifié ${new Date(alert.last_checked).toLocaleDateString("fr-FR")}`
                        : " Pas encore vérifié"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleAlert(alert.id, !alert.is_active)}
                      className={`relative w-10 h-5 rounded-full transition-colors ${alert.is_active ? "bg-primary" : "bg-slate-200"}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${alert.is_active ? "translate-x-5" : "translate-x-0.5"}`} />
                    </button>
                    <button
                      onClick={() => deleteAlert(alert.id)}
                      className="text-slate-400 hover:text-red-500 transition-colors p-1"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Form */}
          <div>
            <AlertForm
              onSubmit={createAlert}
              isPremium={isPremium}
              defaultOrigin={prefillOrigin}
              defaultDest={prefillDest}
            />
          </div>
        </div>
      </div>
    </>
  );
}
