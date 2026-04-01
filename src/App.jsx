import { useState, useMemo, useEffect, useCallback } from "react";
import AirportPicker from "./components/AirportPicker.jsx";
import FlightCard from "./components/FlightCard.jsx";
import MilesCard from "./components/MilesCard.jsx";
import Skeleton from "./components/Skeleton.jsx";
import PromoBanner from "./components/PromoBanner.jsx";
import DestinationCard from "./components/DestinationCard.jsx";
import { useFlights } from "./hooks/useFlights.js";
import { useMilesCalculator } from "./hooks/useMilesCalculator.js";
import { useRates } from "./hooks/useRates.js";
import { airportsMap } from "./data/airports.js";
import { today, addDays } from "./utils/dates.js";
import { fmt, estimateCash } from "./utils/currency.js";
import { haversine } from "./utils/distance.js";

export default function App() {
  const [origin, setOrigin] = useState("DSS");
  const [dest, setDest] = useState("IST");
  const [tripType, setTripType] = useState("round");
  const [depDate, setDepDate] = useState(addDays(today, 30));
  const [retDate, setRetDate] = useState(addDays(today, 40));
  const [cabin, setCabin] = useState(1);
  const [passengers, setPassengers] = useState(1);
  const [searched, setSearched] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [isWarm, setIsWarm] = useState(false);

  const rates = useRates();
  const isOneWay = tripType === "oneway";
  const origA = airportsMap[origin];
  const destA = airportsMap[dest];
  const distMiles = useMemo(() => origA && destA ? haversine(origA.lat, origA.lon, destA.lat, destA.lon) : 0, [origA, destA]);
  const distKm = Math.round(distMiles * 1.60934);

  const { googleFlights, skyFlights, gLoading, sLoading, gError, sError, loading, allFlights, bestApiPrice, search, reset } = useFlights();
  const milesResults = useMilesCalculator({ origin, dest, cabin, distMiles, isOneWay, passengers, rates });

  // Warm-up ping
  useEffect(() => {
    fetch("/api/health").then(() => setIsWarm(true)).catch(() => setIsWarm(true));
  }, []);

  // Auto-fix return date if before departure
  useEffect(() => {
    if (retDate <= depDate) setRetDate(addDays(depDate, 7));
  }, [depDate]);

  const selectedFlightPrice = selectedIdx !== null ? allFlights[selectedIdx]?.price : null;
  const [estEco, estBus] = useMemo(() => estimateCash(distMiles, isOneWay), [distMiles, isOneWay]);
  const estPrice = cabin === 1 ? estBus : estEco;
  const cashUSD = selectedFlightPrice ?? bestApiPrice ?? estPrice;
  const isRealPrice = !!(selectedFlightPrice || bestApiPrice);

  const handleSearch = useCallback(() => {
    if (!origin || !dest || origin === dest) return;
    setSearched(true);
    setSelectedIdx(null);
    reset();
    const params = new URLSearchParams({ origin, dest, depDate, cabin: String(cabin), passengers: String(passengers) });
    if (!isOneWay) params.set("retDate", retDate);
    search(params);
  }, [origin, dest, depDate, retDate, cabin, passengers, isOneWay, search, reset]);

  const handleSwap = useCallback(() => {
    setOrigin(dest);
    setDest(origin);
    setSearched(false);
    setSelectedIdx(null);
  }, [origin, dest]);

  const bestMiles = milesResults[0];
  const milesSavings = bestMiles?.result ? cashUSD - bestMiles.result.totalUSD : null;
  const bothFailed = !loading && searched && allFlights.length === 0 && gError && sError;
  const oneFailed = !loading && searched && (gError || sError) && allFlights.length > 0;

  return (
    <div className="min-h-screen pb-12" style={{ background: "linear-gradient(135deg,#0f172a 0%,#1e3a5f 50%,#0f172a 100%)" }}>
      <div className="max-w-lg mx-auto px-4">

        {/* HEADER */}
        <div className="text-center pt-8 pb-5">
          <div className="text-5xl mb-2">🧳</div>
          <h1 className="text-3xl font-black text-white tracking-tight">Miles Optimizer</h1>
          <p className="text-blue-300 text-sm mt-1">Comparez cash vs miles — trouvez le moins cher</p>
        </div>

        {/* WARM-UP BANNER */}
        {!isWarm && (
          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 mb-4 flex items-center gap-3">
            <span className="animate-spin text-lg">⏳</span>
            <p className="text-blue-300 text-xs">Démarrage du serveur en cours (15-30s)…</p>
          </div>
        )}

        {/* PROMO BANNER */}
        <PromoBanner />

        {/* SEARCH FORM */}
        <div className="bg-white rounded-3xl shadow-2xl p-5 mb-5">

          {/* Trip type */}
          <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 mb-4">
            {[{ val: "round", label: "↔ Aller-retour" }, { val: "oneway", label: "→ Aller simple" }].map(({ val, label }) => (
              <button key={val}
                onClick={() => { setTripType(val); setSearched(false); }}
                aria-pressed={tripType === val}
                className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${tripType === val ? "bg-white text-indigo-700 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}>
                {label}
              </button>
            ))}
          </div>

          {/* Airports */}
          <div className="flex items-end gap-2 mb-3">
            <AirportPicker label="Départ" value={origin} onChange={v => { setOrigin(v); setSearched(false); }} exclude={dest} />
            <button
              onClick={handleSwap}
              aria-label="Inverser départ et destination"
              className="mb-1 w-10 h-10 rounded-full bg-gray-100 hover:bg-indigo-100 text-gray-600 flex items-center justify-center text-lg transition-all flex-shrink-0 hover:scale-110">
              ⇄
            </button>
            <AirportPicker label="Destination" value={dest} onChange={v => { setDest(v); setSearched(false); }} exclude={origin} />
          </div>

          {/* Distance badge */}
          {distMiles > 0 && (
            <div className="flex justify-center mb-3">
              <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                📏 {distMiles.toLocaleString()} mi · {distKm.toLocaleString()} km
              </span>
            </div>
          )}

          {/* Dates */}
          <div className={`grid gap-3 mb-4 ${isOneWay ? "grid-cols-1" : "grid-cols-2"}`}>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Départ</p>
              <input type="date" value={depDate} min={addDays(today, 0)}
                onChange={e => setDepDate(e.target.value)}
                className="w-full p-2.5 rounded-xl border-2 border-gray-100 bg-gray-50 text-sm focus:border-indigo-400 outline-none" />
            </div>
            {!isOneWay && (
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Retour</p>
                <input type="date" value={retDate} min={addDays(depDate, 1)}
                  onChange={e => setRetDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border-2 border-gray-100 bg-gray-50 text-sm focus:border-indigo-400 outline-none" />
              </div>
            )}
          </div>

          {/* Cabin + Passengers */}
          <div className="flex gap-3 mb-5">
            <div className="flex-1">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Classe</p>
              <div className="flex gap-2">
                {[{ val: 1, icon: "💼", label: "Business" }, { val: 0, icon: "🪑", label: "Éco" }].map(({ val, icon, label }) => (
                  <button key={val}
                    onClick={() => setCabin(val)}
                    aria-pressed={cabin === val}
                    className={`flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl font-bold text-sm transition-all ${cabin === val ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                    {icon} {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="w-28">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Passagers</p>
              <select value={passengers} onChange={e => setPassengers(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border-2 border-gray-100 bg-gray-50 text-sm focus:border-indigo-400 outline-none h-[42px]">
                {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n} adulte{n > 1 ? "s" : ""}</option>)}
              </select>
            </div>
          </div>

          <button onClick={handleSearch}
            disabled={!origin || !dest || origin === dest || loading}
            aria-label="Lancer la recherche de vols"
            className={`w-full py-4 rounded-2xl text-white font-black text-base transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed ${loading ? "bg-indigo-400" : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 hover:shadow-xl hover:-translate-y-0.5"}`}>
            {loading
              ? <span className="flex items-center justify-center gap-2"><span className="inline-block animate-spin">✈️</span>Recherche en cours…</span>
              : "🔍 Rechercher les vols"}
          </button>
        </div>

        {/* DESTINATION INFO CARD — weather + country */}
        {destA && <DestinationCard airport={destA} />}

        {/* RESULTS */}
        {searched && (
          <>
            {/* Route summary */}
            <div className="flex justify-center mb-5">
              <div className="flex items-center gap-2 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-full px-4 py-2 text-white text-sm flex-wrap justify-center">
                <span>{origA?.flag} {origin}</span>
                <span className="text-indigo-300">{isOneWay ? "→" : "⇄"}</span>
                <span>{destA?.flag} {dest}</span>
                <span className="text-indigo-400">·</span>
                <span className="text-indigo-200">{distMiles.toLocaleString()} mi · {distKm.toLocaleString()} km</span>
                <span className="text-indigo-400">·</span>
                <span className="text-indigo-200">{cabin === 1 ? "Business" : "Éco"}</span>
                <span className="text-indigo-400">·</span>
                <span className="text-indigo-200">{isOneWay ? "Aller simple" : "Aller-retour"}</span>
                {passengers > 1 && <><span className="text-indigo-400">·</span><span className="text-indigo-200">{passengers} pax</span></>}
              </div>
            </div>

            {/* Flights */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-white font-bold text-sm">✈️ Vols disponibles</p>
                <div className="flex items-center gap-3 text-xs">
                  <span className={`${gLoading ? "text-blue-300 animate-pulse" : googleFlights ? "text-emerald-400" : gError ? "text-red-400" : ""}`}>
                    {gLoading ? "🔵 Google…" : googleFlights ? "✅ Google" : gError ? "❌ Google" : ""}
                  </span>
                  <span className={`${sLoading ? "text-orange-300 animate-pulse" : skyFlights ? "text-emerald-400" : sError ? "text-red-400" : ""}`}>
                    {sLoading ? "🔶 Sky…" : skyFlights ? "✅ Sky" : sError ? "❌ Sky" : ""}
                  </span>
                </div>
              </div>

              {loading && allFlights.length === 0 && <Skeleton />}

              {allFlights.length > 0 && (
                <div className="space-y-2">
                  {allFlights.map((f, i) => (
                    <FlightCard key={i} flight={f} idx={i} source={f.source} selectedIdx={selectedIdx} onSelect={setSelectedIdx} />
                  ))}
                  {selectedIdx !== null && (
                    <p className="text-center text-indigo-400 text-xs py-1">Prix sélectionné utilisé pour la comparaison miles ↓</p>
                  )}
                  {oneFailed && (
                    <p className="text-center text-yellow-500 text-xs py-1">
                      ⚠️ {gError ? "Google Flights" : "Skyscanner"} indisponible — résultats partiels
                    </p>
                  )}
                </div>
              )}

              {bothFailed && (
                <div className="bg-white bg-opacity-5 border border-white border-opacity-10 rounded-2xl p-4 text-center">
                  <p className="text-red-300 text-sm font-bold">⚠️ Recherche temps réel indisponible</p>
                  <p className="text-indigo-400 text-xs mt-1">Prix estimés utilisés pour la comparaison. Réessayez dans quelques instants.</p>
                </div>
              )}
            </div>

            {/* Cash reference */}
            <div className="rounded-2xl bg-white bg-opacity-10 border border-white border-opacity-20 px-4 py-3 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-bold text-sm">
                    {isRealPrice ? (selectedFlightPrice ? "💵 Prix sélectionné" : "💵 Meilleur prix trouvé") : "💵 Estimation marché"}
                  </p>
                  <p className="text-indigo-300 text-xs">
                    {isRealPrice
                      ? `${isOneWay ? "Aller simple" : "A/R"} — Google Flights / Skyscanner`
                      : `${isOneWay ? "Aller simple" : "A/R"} ${cabin === 1 ? "Business" : "Éco"} — prix indicatif`}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-white font-black text-2xl">{fmt.usd(cashUSD)}</div>
                  <div className="text-indigo-300 text-xs">
                    {fmt.xof(cashUSD * rates.USD_XOF)} · {fmt.eur(cashUSD * rates.USD_EUR)}
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendation */}
            {bestMiles && milesSavings !== null && (
              <div className={`rounded-2xl px-4 py-4 mb-5 ${milesSavings > 0 ? "bg-emerald-500 bg-opacity-20 border border-emerald-400 border-opacity-40" : "bg-slate-500 bg-opacity-20 border border-slate-400 border-opacity-30"}`}>
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{milesSavings > 0 ? "💡" : "💳"}</span>
                  <div>
                    {milesSavings > 0 ? (
                      <>
                        <p className="text-emerald-300 font-black text-base">Meilleure option : payer en miles</p>
                        <p className="text-white font-bold">Via {bestMiles.program.short} — économie de <span className="text-emerald-300">{fmt.usd(milesSavings)} ({Math.round((milesSavings / cashUSD) * 100)}%)</span></p>
                        <p className="text-indigo-300 text-xs mt-1">{fmt.miles(bestMiles.result.milesUsed)} + {fmt.usd(bestMiles.result.taxes)} de taxes</p>
                      </>
                    ) : (
                      <>
                        <p className="text-slate-300 font-black text-base">Meilleure option : payer en cash</p>
                        <p className="text-white text-sm">Les miles coûtent <span className="text-orange-300 font-bold">{fmt.usd(-milesSavings)}</span> de plus que le billet cash</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Miles programs */}
            <p className="text-indigo-400 text-xs font-bold uppercase tracking-widest mb-3">
              📊 {milesResults.length} programmes miles — par prix croissant
            </p>
            <div className="space-y-3">
              {milesResults.map(({ program, result }, i) => (
                <MilesCard key={program.id} program={program} result={result} rank={i} cashUSD={cashUSD} isOneWay={isOneWay} rates={rates} />
              ))}
            </div>

            <div className="mt-6 rounded-2xl bg-white bg-opacity-5 border border-white border-opacity-10 p-4 text-indigo-400 text-xs leading-relaxed">
              <p className="font-bold text-indigo-300 mb-1">⚠️ À savoir</p>
              <p>Prix des vols : Google Flights & Skyscanner en temps réel. Coûts en miles : barèmes officiels des programmes de fidélité. La disponibilité des sièges prime varie — vérifiez sur le site du programme avant d'acheter des miles.</p>
            </div>
          </>
        )}

        {!searched && (
          <div className="text-center py-8 text-indigo-400">
            <div className="text-4xl mb-3">🌍</div>
            <p className="text-sm">Renseignez votre trajet et cliquez sur<br /><span className="text-indigo-300 font-bold">Rechercher les vols</span></p>
          </div>
        )}

        {/* Footer with live rates */}
        <div className="text-center mt-8 text-indigo-600 text-xs space-y-0.5">
          <p>
            1 USD = {rates.USD_XOF.toFixed(0)} FCFA · 1 USD = {rates.USD_EUR.toFixed(3)}€
            {rates.updatedAt && <span className="text-indigo-700 ml-1">(taux en direct)</span>}
          </p>
          <p>Miles Optimizer · Par Saloum</p>
        </div>
      </div>
    </div>
  );
}
