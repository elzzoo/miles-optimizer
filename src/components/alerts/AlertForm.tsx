import { useState } from "react";
import Button from "../../design/components/Button";

interface Props {
  onSubmit: (data: { origin: string; destination: string; max_miles: number; cabin: number }) => Promise<void>;
  isPremium: boolean;
}

export default function AlertForm({ onSubmit, isPremium }: Props) {
  const [origin, setOrigin]           = useState("DSS");
  const [destination, setDestination] = useState("");
  const [maxMiles, setMaxMiles]       = useState("50000");
  const [cabin, setCabin]             = useState(0);
  const [loading, setLoading]         = useState(false);
  const [success, setSuccess]         = useState(false);
  const [error, setError]             = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!destination || !maxMiles) return;

    setLoading(true);
    setError(null);
    try {
      await onSubmit({
        origin:      origin.toUpperCase().slice(0, 3),
        destination: destination.toUpperCase().slice(0, 3),
        max_miles:   Number(maxMiles),
        cabin,
      });
      setSuccess(true);
      setDestination("");
      setTimeout(() => setSuccess(false), 3000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">🔔</span>
        <h3 className="font-semibold text-slate-800">Nouvelle alerte</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
            Départ
          </label>
          <input
            value={origin}
            onChange={e => setOrigin(e.target.value.toUpperCase().slice(0, 3))}
            placeholder="DSS"
            maxLength={3}
            required
            className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary uppercase tracking-widest font-mono"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
            Destination
          </label>
          <input
            value={destination}
            onChange={e => setDestination(e.target.value.toUpperCase().slice(0, 3))}
            placeholder="CDG"
            maxLength={3}
            required
            className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary uppercase tracking-widest font-mono"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
          Max miles acceptés
        </label>
        <div className="relative">
          <input
            type="number"
            value={maxMiles}
            onChange={e => setMaxMiles(e.target.value)}
            min="5000"
            max="500000"
            step="5000"
            required
            className="w-full px-3 py-2.5 pr-16 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">miles</span>
        </div>
        <div className="flex gap-2 mt-2">
          {[25000, 50000, 80000, 120000].map(v => (
            <button key={v} type="button"
              onClick={() => setMaxMiles(String(v))}
              className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                Number(maxMiles) === v
                  ? "bg-primary/10 border-primary/30 text-primary"
                  : "border-slate-200 text-slate-500 hover:border-slate-300"
              }`}
            >
              {(v/1000).toFixed(0)}k
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Classe</label>
        <div className="flex gap-2">
          {[{ val: 0, label: "Éco" }, { val: 1, label: "Business" }].map(({ val, label }) => (
            <button key={val} type="button"
              onClick={() => setCabin(val)}
              className={`flex-1 py-2 text-sm rounded-xl border transition-all ${
                cabin === val
                  ? "bg-primary/10 border-primary/30 text-primary font-semibold"
                  : "border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      {success && <p className="text-xs text-green-600 bg-green-50 rounded-lg px-3 py-2">✓ Alerte créée ! Vous serez notifié par email.</p>}

      <Button type="submit" loading={loading} fullWidth>
        {isPremium ? "Créer l'alerte" : "🔒 Réservé Premium"}
      </Button>

      {!isPremium && (
        <p className="text-center text-xs text-slate-400">
          <a href="/premium" className="text-primary hover:underline">Passer Premium</a> pour activer les alertes
        </p>
      )}
    </form>
  );
}
