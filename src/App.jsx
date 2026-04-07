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
import { useTranslation } from "./i18n/index.js";
import { useCurrency } from "./hooks/useCurrency.js";
import { airportsMap } from "./data/airports.js";
import { today, addDays } from "./utils/dates.js";
import { fmt, estimateCash, convert, formatAmount } from "./utils/currency.js";
import { haversine } from "./utils/distance.js";

// --- URL param + localStorage helpers ---
const _p = () => new URLSearchParams(window.location.search);
const _ls = (k, d) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } };

function saveSearch(origin, dest, cabin, tripType) {
  const qs = new URLSearchParams({ from: origin, to: dest, cabin: String(cabin), type: tripType });
  history.replaceState(null, "", "?" + qs.toString());
  try {
    localStorage.setItem("mo-origin", origin);
    localStorage.setItem("mo-dest", dest);
    localStorage.setItem("mo-cabin", String(cabin));
    localStorage.setItem("mo-type", tripType);
  } catch { /* storage full — ignore */ }
}

export default function App() {
  const [origin, setOrigin] = useState(() => _p().get("from") || _ls("mo-origin", "DSS"));
  const [dest, setDest] = useState(() => _p().get("to") || _ls("mo-dest", "IST"));
  const [tripType, setTripType] = useState(() => _p().get("type") || _ls("mo-type", "round"));
  const [depDate, setDepDate] = useState(addDays(today, 30));
  const [retDate, setRetDate] = useState(addDays(today, 40));
  const [cabin, setCabin] = useState(() => {
    const p = _p();
    const raw = p.has("cabin") ? Number(p.get("cabin")) : Number(_ls("mo-cabin", 1));
    return Number.isFinite(raw) ? raw : 1;
  });
  const [passengers, setPassengers] = useState(1);
  const [searched, setSearched] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [isWarm, setIsWarm] = useState(false);
  const [copied, setCopied] = useState(false);

  const { t, lang, setLang } = useTranslation();
  const { currency, setCurrency } = useCurrency();
  const rates = useRates();
  const isOneWay = tripType === "oneway";
  const origA = airportsMap[origin];
  const destA = airportsMap[dest];
  const distMiles = useMemo(() => origA && destA ? haversine(origA.lat, origA.lon, destA.lat, destA.lon) : 0, [origA, destA]);
  const distKm = Math.round(distMiles * 1.60934);

  const { googleFlights, skyFlights, gLoading, sLoading, gError, sError, loading, allFlights, bestApiPrice, search, reset } = useFlights();
  const milesResults = useMilesCalculator({ origin, dest, cabin, distMiles, isOneWay, passengers, rates });

  useEffect(() => {
    fetch("/api/health").then(() => setIsWarm(true)).catch(() => setIsWarm(true));
  }, []);

  useEffect(() => {
    if (retDate <= depDate) setRetDate(addDays(depDate, 7));
  }, [depDate]);

  const selectedFlightPrice = selectedIdx !== null ? allFlights[selectedIdx]?.price : null;
  const [estEco, estBus] = useMemo(() => estimateCash(distMiles, isOneWay), [distMiles, isOneWay]);
  const estPrice = cabin === 1 ? estBus : estEco;
  const cashUSD = selectedFlightPrice ?? bestApiPrice ?? estPrice;
  const isRealPrice = !!(selectedFlightPrice || bestApiPrice);

  const cashDisplay = formatAmount(convert(cashUSD, currency, rates), currency);
  const cashSecondary = currency !== "XOF" ? fmt.xof(cashUSD * rates.USD_XOF) : fmt.usd(cashUSD);

  const handleSearch = useCallback(() => {
    if (!origin || !dest || origin === dest) return;
    setSearched(true);
    setSelectedIdx(null);
    reset();
    saveSearch(origin, dest, cabin, tripType);
    const params = new URLSearchParams({ origin, dest, depDate, cabin: String(cabin), passengers: String(passengers) });
    if (!isOneWay) params.set("retDate", retDate);
    search(params);
  }, [origin, dest, depDate, retDate, cabin, passengers, tripType, isOneWay, search, reset]);

  const handleSwap = useCallback(() => {
    setOrigin(dest);
    setDest(origin);
    setSearched(false);
    setSelectedIdx(null);
  }, [origin, dest]);

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  const bestMiles = milesResults[0];
  const milesSavings = bestMiles?.result ? cashUSD - bestMiles.result.totalUSD : null;
  const bothFailed = !loading && searched && allFlights.length === 0 && gError && sError;
  const oneFailed = !loading && searched && (gError || sError) && allFlights.length > 0;

  const cityName = (a) => a ? (lang === "en" ? (a.cityEn || a.city) : a.city) : "";

  return (
    <div className="min-h-screen pb-12" style={{ background: "linear-gradient(135deg,#0f172a 0%,#1e3a5f 50%,#0f172a 100%)" }}>
      <div className="max-w-lg mx-auto px-4">

        {/* HEADER */}
        <div className="text-center pt-8 pb-5">
          <div className="text-5xl mb-2">🧳</div>
          <h1 className="text-3xl font-black text-white tracking-tight">Miles Optimizer</h1>
          <p className="text-blue-300 text-sm mt-1">{t.tagline}</p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <button
              onClick={() => setLang(lang === "fr" ? "en" : "fr")}
              className="text-xs font-bold px-2.5 py-1 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              aria-label="Toggle language">
              {t.langToggle}
            </button>
            <select
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              className="text-xs font-bold px-2.5 py-1 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors border-0 outline-none cursor-pointer"
              aria-label={t.currencyLabel}>
              <option value="USD">{t.currencyUSD}</option>
              <option value="EUR">{t.currencyEUR}</option>
              <option value="XOF">{t.currencyXOF}</option>
              <option value="GBP">{t.currencyGBP}</option>
            </select>
          </div>
        </div>

        {/* WARM-UP BANNER */}
        {!isWarm && (
          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 mb-4 flex items-center gap-3">
            <span className="animate-spin text-lg">⏳</span>
            <p className="text-blue-300 text-xs">{t.warmupMsg}</p>
          </div>
        )}

        {/* PROMO BANNER */}
        <PromoBanner />

        {/* SEARCH FORM */}
        <div className="bg-white rounded-3xl shadow-2xl p-5 mb-5">
          <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 mb-4">
            {[{ val: "round", label: t.roundTrip }, { val: "oneway", label: t.oneWay }].map(({ val, label }) => (
              <button key={val}
                onClick={() => { setTripType(val); setSearched(false); }}
                aria-pressed={tripType === val}
                className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${tripType === val ? "bg-white text-indigo-700 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}>
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-end gap-2 mb-3">
            <AirportPicker label={t.labelDeparture} value={origin} onChange={v => { setOrigin(v); setSearched(false); }} exclude={dest} lang={lang} />
            <button onClick={handleSwap} aria-label={t.btnSwap}
              className="mb-1 w-10 h-10 rounded-full bg-gray-100 hover:bg-indigo-100 text-gray-600 flex items-center justify-center text-lg transition-all flex-shrink-0 hover:scale-110">
              ⇄
            </button>
            <AirportPicker label={t.labelDestination} value={dest} onChange={v => { setDest(v); setSearched(false); }} exclude={origin} lang={lang} />
          </div>

          {distMiles > 0 && (
            <div className="flex justify-center mb-3">
              <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                📏 {distMiles.toLocaleString()} mi · {distKm.toLocaleString()} km
              </span>
            </div>
          )}

          <div className={`grid gap-3 mb-4 ${isOneWay ? "grid-cols-1" : "grid-cols-2"}`}>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">{t.labelDepart}</p>
              <input type="date" value={depDate} min={addDays(today, 0)}
                onChange={e => setDepDate(e.target.value)}
                className="w-full p-2.5 rounded-xl border-2 border-gray-100 bg-gray-50 text-sm focus:border-indigo-400 outline-none" />
            </div>
            {!isOneWay && (
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">{t.labelReturn}</p>
                <input type="date" value={retDate} min={addDays(depDate, 1)}
                  onChange={e => setRetDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border-2 border-gray-100 bg-gray-50 text-sm focus:border-indigo-400 outline-none" />
              </div>
            )}
          </div>

          <div className="flex gap-3 mb-5">
            <div className="flex-1">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{t.labelCabin}</p>
              <div className="flex gap-2">
                {[{ val: 1, icon: "💼", label: t.cabinBusiness }, { val: 0, icon: "🪑", label: t.cabinEco }].map(({ val, icon, label }) => (
                  <button key={val} onClick={() => setCabin(val)} aria-pressed={cabin === val}
                    className={`flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl font-bold text-sm transition-all ${cabin === val ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                    {icon} {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="w-28">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{t.labelPassengers}</p>
              <select value={passengers} onChange={e => setPassengers(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border-2 border-gray-100 bg-gray-50 text-sm focus:border-indigo-400 outline-none h-[42px]">
                {[1, 2, 3, 4, 5, 6].map(n => (
                  <option key={n} value={n}>{n} {n > 1 ? t.adultPlural : t.adultSingular}</option>
                ))}
              </select>
            </div>
          </div>

          <button onClick={handleSearch}
            disabled={!origin || !dest || origin === dest || loading}
            aria-label={t.btnSearch}
            className={`w-full py-4 rounded-2xl text-white font-black text-base transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed ${loading ? "bg-indigo-400" : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 hover:shadow-xl hover:-translate-y-0.5"}`}>
            {loading
              ? <span className="flex items-center justify-center gap-2"><span className="inline-block animate-spin">✈️</span>{t.btnSearching}</span>
              : t.btnSearch}
          </button>
        </div>

        {/* DESTINATION CARD */}
        {destA && <DestinationCard airport={destA} lang={lang} t={t} />}

        {/* RESULTS */}
        {searched && (
          <>
            <div className="flex justify-center mb-5">
              <div className="flex items-center gap-2 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-full px-4 py-2 text-white text-sm flex-wrap justify-center">
                <span>{origA?.flag} {cityName(origA)}</span>
                <span className="text-indigo-300">{isOneWay ? "→" : "⇄"}</span>
                <span>{destA?.flag} {cityName(destA)}</span>
                <span className="text-indigo-400">·</span>
                <span className="text-indigo-200">{distMiles.toLocaleString()} mi · {distKm.toLocaleString()} km</span>
                <span className="text-indigo-400">·</span>
                <span className="text-indigo-200">{cabin === 1 ? t.cabinBusiness : t.cabinEco}</span>
                <span className="text-indigo-400">·</span>
                <span className="text-indigo-200">{isOneWay ? t.oneWayLabel : t.roundTripLabel}</span>
                {passengers > 1 && <><span className="text-indigo-400">·</span><span className="text-indigo-200">{passengers} pax</span></>}
              </div>
            </div>

            {/* Copy link button */}
            <div className="flex justify-center mb-4">
              <button
                onClick={handleCopyLink}
                className="text-xs font-bold px-3 py-1.5 rounded-full bg-white/10 text-indigo-200 hover:bg-white/20 transition-colors border border-white/10"
              >
                {copied ? t.linkCopied : t.btnCopyLink}
              </button>
            </div>

            <div className="mb-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-white font-bold text-sm">{t.availableFlights}</p>
                <div className="flex items-center gap-3 text-xs">
                  <span className={`${gLoading ? "text-blue-300 animate-pulse" : googleFlights ? "text-emerald-400" : gError ? "text-red-400" : ""}`}>
                    {gLoading ? t.sourceGoogle : googleFlights ? t.sourceGoogleDone : gError ? t.sourceGoogleFail : ""}
                  </span>
                  <span className={`${sLoading ? "text-orange-300 animate-pulse" : skyFlights ? "text-emerald-400" : sError ? "text-red-400" : ""}`}>
                    {sLoading ? t.sourceSky : skyFlights ? t.sourceSkyDone : sError ? t.sourceSkyFail : ""}
                  </span>
                </div>
              </div>
              {loading && allFlights.length === 0 && <Skeleton />}
              {allFlights.length > 0 && (
                <div className="space-y-2">
                  {allFlights.map((f, i) => (
                    <FlightCard key={i} flight={f} idx={i} source={f.source} selectedIdx={selectedIdx} onSelect={setSelectedIdx} rates={rates} currency={currency} t={t} />
                  ))}
                  {selectedIdx !== null && <p className="text-center text-indigo-400 text-xs py-1">{t.selectedNote}</p>}
                  {oneFailed && <p className="text-center text-yellow-500 text-xs py-1">{t.partialResults(gError ? "Google Flights" : "Skyscanner")}</p>}
                </div>
              )}
              {bothFailed && (
                <div className="bg-white bg-opacity-5 border border-white border-opacity-10 rounded-2xl p-4 text-center">
                  <p className="text-red-300 text-sm font-bold">{t.bothFailedTitle}</p>
                  <p className="text-indigo-400 text-xs mt-1">{t.bothFailedSub}</p>
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-white bg-opacity-10 border border-white border-opacity-20 px-4 py-3 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-bold text-sm">
                    {isRealPrice ? (selectedFlightPrice ? t.priceSelected : t.priceBest) : t.priceEstimate}
                  </p>
                  <p className="text-indigo-300 text-xs">
                    {isRealPrice
                      ? t.priceSourceReal(isOneWay ? t.oneWayLabel : t.roundTripLabel)
                      : t.priceSourceEst(isOneWay ? t.oneWayLabel : t.roundTripLabel, cabin === 1 ? t.cabinBusiness : t.cabinEco)}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-white font-black text-2xl">{cashDisplay}</div>
                  <div className="text-indigo-300 text-xs">{cashSecondary}</div>
                </div>
              </div>
            </div>

            {bestMiles && milesSavings !== null && (
              <div className={`rounded-2xl px-4 py-4 mb-5 ${milesSavings > 0 ? "bg-emerald-500 bg-opacity-20 border border-emerald-400 border-opacity-40" : "bg-slate-500 bg-opacity-20 border border-slate-400 border-opacity-30"}`}>
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{milesSavings > 0 ? "💡" : "💳"}</span>
                  <div>
                    {milesSavings > 0 ? (
                      <>
                        <p className="text-emerald-300 font-black text-base">{t.bestOptionMiles}</p>
                        <p className="text-white font-bold">
                          {t.viaProgram(bestMiles.program.short)} — <span className="text-emerald-300">{t.savingsText(fmt.usd(milesSavings), Math.round((milesSavings / cashUSD) * 100))}</span>
                        </p>
                        <p className="text-indigo-300 text-xs mt-1">{t.milesPlusTax(fmt.miles(bestMiles.result.milesUsed), fmt.usd(bestMiles.result.taxes))}</p>
                      </>
                    ) : (
                      <>
                        <p className="text-slate-300 font-black text-base">{t.bestOptionCash}</p>
                        <p className="text-white text-sm"><span className="text-orange-300 font-bold">{t.costMoreCash(fmt.usd(-milesSavings))}</span></p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            <p className="text-indigo-400 text-xs font-bold uppercase tracking-widest mb-3">
              {t.programsTitle(milesResults.length)}
            </p>
            <div className="space-y-3">
              {milesResults.map(({ program, result }, i) => (
                <MilesCard key={program.id} program={program} result={result} rank={i} cashUSD={cashUSD} isOneWay={isOneWay} rates={rates} currency={currency} t={t} lang={lang} />
              ))}
            </div>

            <div className="mt-6 rounded-2xl bg-white bg-opacity-5 border border-white border-opacity-10 p-4 text-indigo-400 text-xs leading-relaxed">
              <p className="font-bold text-indigo-300 mb-1">⚠️ {lang === "en" ? "Disclaimer" : "À savoir"}</p>
              <p>{t.disclaimer}</p>
            </div>
          </>
        )}

        {!searched && (
          <div className="text-center py-8 text-indigo-400">
            <div className="text-4xl mb-3">{t.emptyStateTitle}</div>
            <p className="text-sm">{t.emptyStateMsg}<br /><span className="text-indigo-300 font-bold">{t.emptyStateCta}</span></p>
          </div>
        )}

        <div className="text-center mt-8 text-indigo-400 text-xs space-y-0.5">
          <p>
            {t.footerRates(rates.USD_XOF.toFixed(0), rates.USD_EUR.toFixed(3))}
            {rates.updatedAt && <span className="text-indigo-500 ml-1">({t.footerLive})</span>}
          </p>
          <p>{t.footerBy}</p>
        </div>
      </div>
    </div>
  );
}
