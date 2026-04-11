import { Helmet } from "react-helmet-async";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DestinationGrid from "../components/destinations/DestinationGrid";
import { today, addDays } from "../utils/dates";

export default function Explore() {
  const [from, setFrom]           = useState("DSS");
  const [inputFrom, setInputFrom] = useState("DSS");
  const [miles, setMiles]         = useState("");
  const [whereMode, setWhereMode] = useState(false);
  const [whereResults, setWhereResults] = useState<any[]>([]);
  const [whereLoading, setWhereLoading] = useState(false);
  const navigate = useNavigate();

  function handleSearch() {
    setFrom(inputFrom.toUpperCase().slice(0, 3));
    setWhereMode(false);
  }

  async function handleWhereCanIGo() {
    if (!miles) return;
    setWhereLoading(true);
    setWhereMode(true);
    const r = await fetch(`/api/destinations/where-can-i-go?from=${from}&miles=${miles}`);
    const json = await r.json();
    setWhereResults(json.destinations ?? []);
    setWhereLoading(false);
  }

  return (
    <>
      <Helmet>
        <title>Explorer les destinations | Miles Optimizer</title>
        <meta name="description" content="Explorez toutes les destinations accessibles en miles depuis votre aéroport. Où puis-je aller avec mes miles ?" />
        <link rel="canonical" href="https://miles-optimizer-next-3y3m.onrender.com/explore" />
      </Helmet>

      <div className="max-w-6xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 mb-2">Explorer des destinations</h1>
          <p className="text-slate-500">Découvrez où voyager depuis votre ville. Cliquez pour lancer une recherche.</p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-8 flex flex-col sm:flex-row gap-4">
          {/* Depuis */}
          <div className="flex-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
              Depuis (IATA)
            </label>
            <div className="flex gap-2">
              <input
                value={inputFrom}
                onChange={e => setInputFrom(e.target.value.toUpperCase().slice(0, 3))}
                placeholder="DSS"
                maxLength={3}
                className="w-28 px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 uppercase font-mono tracking-widest"
              />
              <button
                onClick={handleSearch}
                className="bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#1D4ED8] transition-colors"
              >
                Mettre à jour
              </button>
            </div>
          </div>

          {/* Séparateur */}
          <div className="hidden sm:flex items-center">
            <div className="h-12 w-px bg-slate-100" />
          </div>

          {/* Où puis-je aller */}
          <div className="flex-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
              Où puis-je aller ?
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  value={miles}
                  onChange={e => setMiles(e.target.value)}
                  placeholder="50000"
                  min="5000"
                  max="500000"
                  className="w-full px-3 py-2.5 pr-14 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">miles</span>
              </div>
              <button
                onClick={handleWhereCanIGo}
                disabled={!miles}
                className="bg-cyan-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-cyan-600 disabled:opacity-40 transition-colors whitespace-nowrap"
              >
                Trouver
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        {whereMode ? (
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-4">
              {whereLoading
                ? "Calcul en cours..."
                : `${whereResults.length} destinations avec ${Number(miles).toLocaleString()} miles`}
            </p>
            {whereLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="aspect-[4/3] animate-pulse bg-slate-200 rounded-2xl" />
                ))}
              </div>
            ) : (
              <DestinationGrid
                from={from}
                onSelect={(iata) => navigate(`/search?origin=${from}&dest=${iata}&depDate=${addDays(today, 30)}&retDate=${addDays(today, 37)}`)}
              />
            )}
          </div>
        ) : (
          <>
            <p className="text-sm text-slate-500 mb-5">Destinations depuis <strong>{from}</strong></p>
            <DestinationGrid
              from={from}
              onSelect={(iata) => navigate(`/search?origin=${from}&dest=${iata}&depDate=${addDays(today, 30)}&retDate=${addDays(today, 37)}`)}
            />
          </>
        )}
      </div>
    </>
  );
}
