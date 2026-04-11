import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";

export default function AuthButton() {
  const { user, isPremium, loading, signOut } = useAuth();
  const [open, setOpen]     = useState(false);
  const [email, setEmail]   = useState("");
  const [sent, setSent]     = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError]   = useState("");
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function handleSend(e: React.FormEvent) {
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
      setSent(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  }

  if (loading) return null;

  // ── Connecté ──────────────────────────────────────────────────────────────
  if (user) {
    return (
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen(!open)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-medium transition-colors ${
            isPremium
              ? "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
              : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
          }`}
        >
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
            isPremium ? "bg-amber-500" : "bg-slate-400"
          }`}>
            {user.email[0].toUpperCase()}
          </span>
          {isPremium && <span className="hidden sm:inline">⭐</span>}
          <span className="hidden sm:inline max-w-[120px] truncate">{user.email.split("@")[0]}</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 flex-shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl border border-slate-200 shadow-lg py-2 z-50">
            <div className="px-4 py-2 border-b border-slate-100 mb-1">
              <p className="text-xs font-semibold text-slate-500 truncate">{user.email}</p>
              <p className={`text-xs font-bold mt-0.5 ${isPremium ? "text-amber-600" : "text-slate-400"}`}>
                {isPremium ? "⭐ Compte Premium" : "Compte gratuit"}
              </p>
            </div>
            <a href="/alerts" onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-slate-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
              </svg>
              Mes alertes
            </a>
            <button
              onClick={() => { signOut(); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
              </svg>
              Se déconnecter
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Non connecté ──────────────────────────────────────────────────────────
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen(!open); setSent(false); setError(""); setEmail(""); }}
        className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
        </svg>
        <span className="hidden sm:inline">Se connecter</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl border border-slate-200 shadow-xl p-4 z-50">
          {sent ? (
            <div className="text-center py-2">
              <div className="text-3xl mb-3">✉️</div>
              <p className="font-bold text-slate-800 mb-1">Lien envoyé !</p>
              <p className="text-sm text-slate-500">Vérifiez votre boîte mail et cliquez sur le lien.</p>
              <button onClick={() => { setSent(false); setEmail(""); }}
                className="mt-3 text-xs text-primary hover:underline">
                Utiliser un autre email
              </button>
            </div>
          ) : (
            <>
              <p className="font-semibold text-slate-800 text-sm mb-1">Connexion sans mot de passe</p>
              <p className="text-xs text-slate-400 mb-3">Recevez un lien magique par email</p>
              <form onSubmit={handleSend} className="space-y-2">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="vous@email.com"
                  required
                  autoFocus
                  className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full bg-primary text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-[#1D4ED8] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {sending ? (
                    <><svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Envoi…</>
                  ) : "Recevoir le lien →"}
                </button>
                {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              </form>
              <p className="text-[11px] text-slate-400 text-center mt-2">Lien valable 1h · Sans mot de passe</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
