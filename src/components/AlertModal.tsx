import { useState } from "react";
import { useAuth } from "../hooks/useAuth";

interface Props {
  origin: string;
  dest: string;
  onClose: () => void;
}

export default function AlertModal({ origin, dest, onClose }: Props) {
  const { user } = useAuth();
  const [email, setEmail]     = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur serveur");
      setEmail("");
      setSent(true);
    } catch (e: any) {
      setError(e.message || "Une erreur est survenue");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-3xl shadow-2xl p-7 w-full max-w-sm"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
          aria-label="Fermer"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-3xl mb-3 text-center">🔔</div>
        <h2 className="text-lg font-bold text-slate-900 text-center mb-1">Alerte prix miles</h2>
        <p className="text-sm text-slate-500 text-center mb-5">
          Soyez notifié dès qu'un bon deal miles apparaît sur la route{" "}
          <span className="font-semibold text-slate-700">{origin} → {dest}</span>.
        </p>

        {user ? (
          <div className="text-center">
            <p className="text-sm text-slate-600 mb-4">Vous êtes connecté en tant que <strong>{user.email}</strong>.</p>
            <a
              href={`/alerts?origin=${origin}&dest=${dest}`}
              className="block w-full text-center py-3 rounded-xl font-bold text-sm bg-primary text-white hover:bg-[#1D4ED8] transition-all"
            >
              Créer l'alerte →
            </a>
          </div>
        ) : sent ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
            <p className="text-green-700 font-semibold">✅ Lien envoyé !</p>
            <p className="text-green-600 text-sm mt-1">Vérifiez votre boîte mail et cliquez sur le lien de connexion.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">
              Votre email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="vous@email.com"
              required
              className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary mb-3"
            />
            {error && (
              <div className="mb-3 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                ❌ {error}
              </div>
            )}
            <button
              type="submit"
              disabled={sending}
              className="w-full bg-primary text-white font-semibold py-3 rounded-xl hover:bg-[#1D4ED8] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {sending ? (
                <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Envoi…</>
              ) : "M'alerter pour cette route →"}
            </button>
            <p className="text-xs text-slate-400 mt-3 text-center">Sans mot de passe · Lien valable 1h</p>
          </form>
        )}
      </div>
    </div>
  );
}
