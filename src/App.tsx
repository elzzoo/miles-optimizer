import { useState, useMemo, useEffect, useCallback } from "react";
import AirportPicker from "./components/AirportPicker.jsx";
import FlightCard from "./components/FlightCard.jsx";
import MilesCard from "./components/MilesCard.jsx";
import Skeleton from "./components/Skeleton.jsx";
import PriceCalendar from "./components/PriceCalendar.jsx";
import PromoBanner from "./components/PromoBanner.jsx";
import DestinationCard from "./components/DestinationCard.jsx";
import { useFlights } from "./hooks/useFlights.js";
import { useMilesCalculator } from "./hooks/useMilesCalculator.js";
import { useRates } from "./hooks/useRates.js";
import { useTranslation } from "./i18n/index.js";
import { useCurrency } from "./hooks/useCurrency.js";
import { useSearchState, saveSearch, getSearchHistory } from "./hooks/useSearchState.js";
import { useFlightFilters } from "./hooks/useFlightFilters.js";
import FlightFilters from "./components/FlightFilters.jsx";
import { airportsMap } from "./data/airports.js";
import { today, addDays } from "./utils/dates.js";
import { fmt, estimateCash, convert, formatAmount } from "./utils/currency.js";
import { haversine } from "./utils/distance.js";

const POPULAR_ROUTES = [
  { from: "DSS", to: "CDG", label: "Dakar → Paris" },
  { from: "LOS", to: "DXB", label: "Lagos → Dubaï" },
  { from: "ABJ", to: "IST", label: "Abidjan → Istanbul" },
  { from: "CMN", to: "JFK", label: "Casablanca → New York" },
  { from: "ACC", to: "LHR", label: "Accra → Londres" },
  { from: "NBO", to: "CDG", label: "Nairobi → Paris" },
];

export default function App() {
  const { origin, setOrigin, dest, setDest, tripType, setTripType, cabin, setCabin, passengers, setPassengers, handleSwap, urlDepDate, urlRetDate } = useSearchState();
  const [depDate, setDepDate] = useState(() => urlDepDate || addDays(today, 30));
  const [retDate, setRetDate] = useState(() => urlRetDate || addDays(today, 40));
  const [milesOwned, setMilesOwned] = useState(false);
  const [directOnly, setDirectOnly] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [isWarm, setIsWarm] = useState(false);
  const [copied, setCopied] = useState(false);
  const [searchHistory] = useState(() => getSearchHistory());

  const { t, lang, setLang } = useTranslation();
  const { currency, setCurrency } = useCurrency();
  const rates = useRates();
  const isOneWay = tripType === "oneway";
  const origA = airportsMap[origin];
  const destA = airportsMap[dest];
  const distMiles = useMemo(() => origA && destA ? haversine(origA.lat, origA.lon, destA.lat, destA.lon) : 0, [origA, destA]);
  const distKm = Math.round(distMiles * 1.60934);

  const { googleFlights, skyFlights, gLoading, sLoading, gError, sError, loading, allFlights, bestApiPrice, search, reset } = useFlights();
  const { filters, filteredFlights, airlines, activeFiltersCount, setDirectOnly: syncDirectOnly, setAirline, setMaxStops, setSortBy, reset: resetFilters } = useFlightFilters(allFlights, directOnly);
  const milesResults = useMilesCalculator({ origin, dest, cabin, distMiles, isOneWay, passengers, rates, milesOwned });

  useEffect(() => {
    fetch("/api/health").then(() => setIsWarm(true)).catch(() => setIsWarm(true));
  }, []);

  useEffect(() => { syncDirectOnly(directOnly); }, [directOnly, syncDirectOnly]);

  useEffect(() => {
    if (retDate <= depDate) setRetDate(addDays(depDate, 7));
  }, [depDate]);

  // Reset selectedIdx si le vol sélectionné est filtré
  useEffect(() => {
    if (selectedIdx !== null) {
      const stillVisible = filteredFlights.some((_, i) => i === selectedIdx) ||
        filteredFlights.find(f => f === allFlights[selectedIdx]);
      if (!stillVisible) setSelectedIdx(null);
    }
  }, [filteredFlights]);

  const selectedFlightPrice = selectedIdx !== null ? allFlights[selectedIdx]?.price : null;

  // Meilleur prix parmi les vols FILTRÉS (pas tous les vols)
  const filteredBestPrice = useMemo(() => {
    const prices = filteredFlights.map(f => f.price).filter(Boolean);
    return prices.length > 0 ? Math.min(...prices) : null;
  }, [filteredFlights]);

  const [estEco, estBus] = useMemo(() => estimateCash(distMiles, isOneWay), [distMiles, isOneWay]);
  const estPrice = cabin === 1 ? estBus : estEco;
  // Priorité : vol sélectionné > meilleur filtré > estimation
  const cashUSD = selectedFlightPrice ?? filteredBestPrice ?? estPrice;
  const isRealPrice = !!(selectedFlightPrice || filteredBestPrice);

  const cashDisplay = formatAmount(convert(cashUSD, currency, rates), currency);
  const cashSecondary = currency !== "XOF" ? fmt.xof(cashUSD * rates.USD_XOF) : fmt.usd(cashUSD);

  const handleSearch = useCallback(() => {
    if (!origin || !dest || origin === dest) return;
    setSearched(true);
    setSelectedIdx(null);
    reset();
    resetFilters();
    saveSearch(origin, dest, cabin, tripType, depDate, isOneWay ? undefined : retDate, passengers);
    const params = new URLSearchParams({ origin, dest, depDate, cabin: String(cabin), passengers: String(passengers) });
    if (!isOneWay) params.set("retDate", retDate);
    search(params);
  }, [origin, dest, depDate, retDate, cabin, passengers, tripType, isOneWay, search, reset, resetFilters]);

  const handleSwapAndReset = useCallback(() => {
    handleSwap();
    setSearched(false);
    setSelectedIdx(null);
  }, [handleSwap]);

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  const handlePopularRoute = useCallback((from: string, to: string) => {
    setOrigin(from);
    setDest(to);
    setSearched(false);
    setSelectedIdx(null);
  }, [setOrigin, setDest]);

  const bestMiles = milesResults[0];
  const milesSavings = bestMiles?.result ? cashUSD - bestMiles.result.totalUSD : null;
  const bothFailed = !loading && searched && allFlights.length === 0 && gError && sError;
  const oneFailed = !loading && searched && (gError || sError) && allFlights.length > 0;

  const cityName = (a) => a ? (lang === "en" ? (a.cityEn || a.city) : a.city) : "";

  return (
    <div className="aurora-bg min-h-screen">

      {/* ─── HERO HEADER ─────────────────────────────────────── */}
      <header className="hero-section text-center pt-10 pb-8 px-4">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7 text-indigo-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
          </svg>
        </div>
        <h1 className="text-4xl lg:text-5xl font-bold tracking-tight gradient-text mb-2">Miles Optimizer</h1>
        <p className="text-slate-400 text-sm lg:text-base max-w-sm mx-auto">{t.tagline}</p>

        {/* Stats strip */}
        <div className="flex items-center justify-center gap-6 mt-5 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5 text-indigo-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z" />
            </svg>
            17 programmes
          </span>
          <span className="w-px h-3 bg-white/10" />
          <span className="flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5 text-indigo-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
            </svg>
            2 sources de prix
          </span>
          <span className="w-px h-3 bg-white/10" />
          <span className="flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5 text-emerald-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            Gratuit
          </span>
        </div>

        {/* Lang + currency */}
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setLang(lang === "fr" ? "en" : "fr")}
            className="bg-white/8 border border-white/10 hover:bg-white/15 text-slate-300 text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors"
            aria-label="Toggle language">
            {t.langToggle}
          </button>
          <select
            value={currency}
            onChange={e => setCurrency(e.target.value as import("./types.js").Currency)}
            className="bg-white/8 border border-white/10 text-slate-300 text-xs rounded-xl px-3 py-1.5 cursor-pointer outline-none"
            aria-label={t.currencyLabel}>
            <option value="USD">{t.currencyUSD}</option>
            <option value="EUR">{t.currencyEUR}</option>
            <option value="XOF">{t.currencyXOF}</option>
            <option value="GBP">{t.currencyGBP}</option>
          </select>
        </div>
      </header>

      {/* ─── SEARCH FORM ─────────────────────────────────────── */}
      <section className="px-4 mb-6">
        <div className="max-w-2xl mx-auto">

          {/* Warm-up banner */}
          {!isWarm && (
            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 mb-4 flex items-center gap-3">
              <svg className="animate-spin w-4 h-4 text-indigo-400 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              <p className="text-indigo-400 text-xs">{t.warmupMsg}</p>
            </div>
          )}

          <div className="glass rounded-3xl p-5">
            {/* Trip type */}
            <div className="flex gap-1 bg-white/5 rounded-2xl p-1 mb-5">
              {([{ val: "round" as const, label: t.roundTrip }, { val: "oneway" as const, label: t.oneWay }]).map(({ val, label }) => (
                <button key={val}
                  onClick={() => { setTripType(val); setSearched(false); }}
                  aria-pressed={tripType === val}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${tripType === val ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" : "bg-transparent text-slate-400 hover:bg-white/8 hover:text-slate-200"}`}>
                  {label}
                </button>
              ))}
            </div>

            {/* Origin / Swap / Dest */}
            <div className="flex items-end gap-2 mb-4">
              <AirportPicker label={t.labelDeparture} value={origin} onChange={v => { setOrigin(v); setSearched(false); }} exclude={dest} lang={lang} />
              <button onClick={handleSwapAndReset} aria-label={t.btnSwap}
                className="mb-1 w-10 h-10 rounded-full bg-white/8 border border-white/10 hover:bg-indigo-500/20 hover:border-indigo-500/40 text-slate-300 flex items-center justify-center transition-all flex-shrink-0 hover:scale-110 cursor-pointer">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                </svg>
              </button>
              <AirportPicker label={t.labelDestination} value={dest} onChange={v => { setDest(v); setSearched(false); }} exclude={origin} lang={lang} />
            </div>

            {/* Distance badge */}
            {distMiles > 0 && (
              <div className="flex justify-center mb-4">
                <span className="inline-flex items-center gap-1.5 text-slate-400 text-xs bg-white/5 border border-white/8 px-3 py-1 rounded-full">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5 7.5 3m0 0L12 7.5M7.5 3v13.5m0 0L3 21m4.5-4.5H21" />
                  </svg>
                  {distMiles.toLocaleString()} mi · {distKm.toLocaleString()} km
                </span>
              </div>
            )}

            {/* Dates */}
            <div className={`grid gap-3 mb-4 ${isOneWay ? "grid-cols-1" : "grid-cols-2"}`}>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">{t.labelDepart}</p>
                <input type="date" value={depDate} min={addDays(today, 0)}
                  onChange={e => setDepDate(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl text-slate-200 text-sm px-3 py-2.5 w-full focus:border-indigo-500/60 focus:outline-none transition-colors" />
                {/* Quick date chips */}
                <div className="flex gap-1.5 mt-1.5 flex-wrap">
                  {[7, 14, 30, 60, 90].map(n => (
                    <button key={n} type="button"
                      onClick={() => { setDepDate(addDays(today, n)); setSearched(false); }}
                      className={`text-[10px] px-2 py-0.5 rounded-full border transition-all ${depDate === addDays(today, n) ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300" : "border-white/10 text-slate-500 hover:text-slate-300 hover:border-white/20"}`}>
                      +{n}j
                    </button>
                  ))}
                </div>
              </div>
              {!isOneWay && (
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">{t.labelReturn}</p>
                  <input type="date" value={retDate} min={addDays(depDate, 1)}
                    onChange={e => setRetDate(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-xl text-slate-200 text-sm px-3 py-2.5 w-full focus:border-indigo-500/60 focus:outline-none transition-colors" />
                  {/* Quick return chips relative to departure */}
                  <div className="flex gap-1.5 mt-1.5 flex-wrap">
                    {[3, 7, 10, 14, 21].map(n => (
                      <button key={n} type="button"
                        onClick={() => setRetDate(addDays(new Date(depDate + "T12:00:00"), n))}
                        className={`text-[10px] px-2 py-0.5 rounded-full border transition-all ${retDate === addDays(new Date(depDate + "T12:00:00"), n) ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300" : "border-white/10 text-slate-500 hover:text-slate-300 hover:border-white/20"}`}>
                        +{n}j
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Calendrier des prix */}
            {distMiles > 0 && (
              <PriceCalendar
                depDate={depDate}
                onSelect={date => { setDepDate(date); setSearched(false); }}
                estimateBase={cabin === 1 ? estBus : estEco}
                isOneWay={isOneWay}
              />
            )}

            {/* Cabin + Passengers */}
            <div className="flex gap-3 mb-4">
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{t.labelCabin}</p>
                <div className="flex gap-2">
                  {[
                    { val: 1 as const, label: t.cabinBusiness, icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z" /></svg> },
                    { val: 0 as const, label: t.cabinEco, icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5-3.9 19.5m-2.1-19.5-3.9 19.5" /></svg> },
                  ].map(({ val, icon, label }) => (
                    <button key={val} onClick={() => setCabin(val)} aria-pressed={cabin === val}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-sm transition-all border ${cabin === val ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-300" : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-slate-200"}`}>
                      {icon} {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="w-28">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{t.labelPassengers}</p>
                <select value={passengers} onChange={e => setPassengers(Number(e.target.value))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl text-slate-200 text-sm px-3 py-2.5 cursor-pointer outline-none h-[42px] transition-colors">
                  {[1, 2, 3, 4, 5, 6].map(n => (
                    <option key={n} value={n}>{n} {n > 1 ? t.adultPlural : t.adultSingular}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Direct only toggle */}
            <div className="flex items-center justify-between mb-4 px-1">
              <div>
                <span className="text-slate-300 text-sm font-medium">Vols directs uniquement</span>
                <p className="text-slate-500 text-xs mt-0.5">Exclure les vols avec escale</p>
              </div>
              <button
                type="button"
                onClick={() => setDirectOnly(v => !v)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none flex-shrink-0 ${directOnly ? "bg-indigo-500" : "bg-white/15"}`}
                aria-pressed={directOnly}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${directOnly ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>

            {/* Miles toggle */}
            <div className="flex items-center justify-between mb-5 px-1">
              <div>
                <span className="text-slate-300 text-sm font-medium">{t.milesOwnedLabel || "J'ai déjà des miles"}</span>
                <p className="text-slate-500 text-xs mt-0.5">Compare le coût d'achat vs tes miles</p>
              </div>
              <button
                type="button"
                onClick={() => setMilesOwned(v => !v)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none flex-shrink-0 ${milesOwned ? "bg-indigo-500" : "bg-white/15"}`}
                aria-pressed={milesOwned}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${milesOwned ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>

            {/* Search button */}
            <button onClick={handleSearch}
              disabled={!origin || !dest || origin === dest || loading}
              aria-label={t.btnSearch}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 text-white font-bold text-base btn-glow transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
              {loading
                ? <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    {t.btnSearching}
                  </span>
                : t.btnSearch}
            </button>
          </div>
        </div>
      </section>

      {/* ─── PROMOS MARQUEE ──────────────────────────────────── */}
      <PromoBanner />

      {/* ─── MAIN CONTENT ────────────────────────────────────── */}
      <main className="max-w-4xl mx-auto px-4 pb-16">

        {/* ── RESULTS ── */}
        {searched && (
          <div className="animate-fade-up">

            {/* Route summary bar */}
            <div className="flex items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-2 glass rounded-2xl px-4 py-2.5 text-sm flex-wrap flex-1 min-w-0">
                <span className="font-bold text-slate-100">{origA?.flag} {cityName(origA)}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-indigo-400 flex-shrink-0">
                  {isOneWay
                    ? <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    : <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                  }
                </svg>
                <span className="font-bold text-slate-100">{destA?.flag} {cityName(destA)}</span>
                <span className="text-indigo-500 mx-0.5">·</span>
                <span className="text-indigo-300 text-xs">{cabin === 1 ? t.cabinBusiness : t.cabinEco}</span>
                <span className="text-indigo-500">·</span>
                <span className="text-indigo-300 text-xs">{distMiles.toLocaleString()} mi</span>
                {passengers > 1 && <><span className="text-indigo-500">·</span><span className="text-indigo-300 text-xs">{passengers} pax</span></>}
              </div>
              <button
                onClick={handleCopyLink}
                title={copied ? t.linkCopied : t.btnCopyLink}
                className="flex-shrink-0 w-9 h-9 rounded-xl bg-white/5 border border-white/10 hover:bg-indigo-500/15 hover:border-indigo-500/30 transition-all flex items-center justify-center cursor-pointer"
              >
                {copied
                  ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-emerald-400"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                  : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-slate-400"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" /></svg>
                }
              </button>
            </div>

            {/* 2-col on large: flights left, destination right */}
            <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-6">

              {/* LEFT: Flights + Miles */}
              <div>
                {/* Flights section */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-indigo-400">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                      </svg>
                      <p className="text-slate-300 font-semibold text-sm uppercase tracking-widest">{t.availableFlights}</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className={`flex items-center gap-1 ${gLoading ? "text-blue-300" : googleFlights ? "text-emerald-400" : gError ? "text-red-400" : ""}`}>
                        {gLoading && <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
                        {gLoading ? t.sourceGoogle : googleFlights ? t.sourceGoogleDone : gError ? t.sourceGoogleFail : ""}
                      </span>
                      <span className={`flex items-center gap-1 ${sLoading ? "text-orange-300" : skyFlights ? "text-emerald-400" : sError ? "text-red-400" : ""}`}>
                        {sLoading && <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
                        {sLoading ? t.sourceSky : skyFlights ? t.sourceSkyDone : sError ? t.sourceSkyFail : ""}
                      </span>
                    </div>
                  </div>
                  {loading && allFlights.length === 0 && <Skeleton />}
                  {allFlights.length > 0 && (
                    <div className="space-y-2 stagger-children">
                      <FlightFilters
                        airlines={airlines}
                        filters={filters}
                        activeFiltersCount={activeFiltersCount}
                        setAirline={setAirline}
                        setMaxStops={setMaxStops}
                        setSortBy={setSortBy}
                        reset={resetFilters}
                        totalFlights={allFlights.length}
                        filteredCount={filteredFlights.length}
                      />
                      {filteredFlights.map((f, i) => (
                        <div key={i} className="animate-fade-up">
                          <FlightCard flight={f} idx={i} source={f.source} selectedIdx={selectedIdx} onSelect={setSelectedIdx} rates={rates} currency={currency} t={t} />
                        </div>
                      ))}
                      {selectedIdx !== null && <p className="text-center text-indigo-400 text-xs py-1">{t.selectedNote}</p>}
                      {oneFailed && <p className="text-center text-amber-500/80 text-xs py-1">{t.partialResults(gError ? "Google Flights" : "Skyscanner")}</p>}
                    </div>
                  )}
                  {bothFailed && (
                    <div className="glass rounded-2xl p-5 text-center">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-red-400/60 mx-auto mb-2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                      </svg>
                      <p className="text-red-300 text-sm font-bold">{t.bothFailedTitle}</p>
                      <p className="text-slate-400 text-xs mt-1">{t.bothFailedSub}</p>
                    </div>
                  )}
                </div>

                {/* Price reference */}
                <div className="glass rounded-2xl px-4 py-4 mb-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-xs uppercase tracking-widest font-semibold mb-0.5">
                        {isRealPrice ? (selectedFlightPrice ? t.priceSelected : t.priceBest) : t.priceEstimate}
                      </p>
                      <p className="text-indigo-300 text-xs">
                        {isRealPrice
                          ? t.priceSourceReal(isOneWay ? t.oneWayLabel : t.roundTripLabel)
                          : t.priceSourceEst(isOneWay ? t.oneWayLabel : t.roundTripLabel, cabin === 1 ? t.cabinBusiness : t.cabinEco)}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-black text-3xl tracking-tight">{cashDisplay}</div>
                      <div className="text-slate-500 text-xs mt-0.5">{cashSecondary}</div>
                    </div>
                  </div>
                </div>

                {/* Best option banner */}
                {bestMiles && milesSavings !== null && (
                  <div className={`rounded-2xl px-4 py-4 mb-5 ${milesSavings > 0 ? "bg-emerald-500/15 border border-emerald-500/25" : "bg-slate-800/60 border border-white/10"}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${milesSavings > 0 ? "bg-emerald-500/20 border border-emerald-500/30" : "bg-white/8 border border-white/10"}`}>
                        {milesSavings > 0 ? (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-emerald-400">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-slate-400">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
                          </svg>
                        )}
                      </div>
                      <div>
                        {milesSavings > 0 ? (
                          <>
                            <p className="text-emerald-300 font-bold text-sm">{t.bestOptionMiles}</p>
                            <p className="text-white font-semibold text-sm">
                              {t.viaProgram(bestMiles.program.short)} — <span className="text-emerald-300">{t.savingsText(fmt.usd(milesSavings), Math.round((milesSavings / cashUSD) * 100))}</span>
                            </p>
                            <p className="text-slate-400 text-xs mt-1">{t.milesPlusTax(fmt.miles(bestMiles.result.milesUsed), fmt.usd(bestMiles.result.taxes))}</p>
                          </>
                        ) : (
                          <>
                            <p className="text-slate-300 font-bold text-sm">{t.bestOptionCash}</p>
                            <p className="text-white text-sm"><span className="text-amber-300 font-semibold">{t.costMoreCash(fmt.usd(-milesSavings))}</span></p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Estimation notice — shown only when price is not from a live API call */}
                {!isRealPrice && (
                  <div className="flex items-start gap-2 mb-4 px-3 py-2.5 rounded-xl bg-amber-500/8 border border-amber-500/20">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-amber-400/70 flex-shrink-0 mt-0.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                    </svg>
                    <p className="text-amber-300/70 text-xs leading-relaxed">{t.estimateNotice}</p>
                  </div>
                )}

                {/* Programs */}
                <div className="flex items-center gap-2 mb-3">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-indigo-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z" />
                  </svg>
                  <p className="text-slate-300 font-semibold text-sm uppercase tracking-widest">{t.programsTitle(milesResults.length)}</p>
                </div>
                <div className="space-y-3">
                  {milesResults.map(({ program, result }, i) => (
                    <MilesCard key={program.id} program={program} result={result} rank={i} cashUSD={cashUSD} isOneWay={isOneWay} rates={rates} currency={currency} t={t} lang={lang} origin={origin} dest={dest} cabin={cabin} />
                  ))}
                </div>

                <div className="mt-6 rounded-2xl bg-white/4 border border-white/8 p-4 text-slate-500 text-xs leading-relaxed">
                  <p className="font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5 text-amber-500/70">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                    </svg>
                    {lang === "en" ? "Disclaimer" : "À savoir"}
                  </p>
                  <p>{t.disclaimer}</p>
                </div>
              </div>

              {/* RIGHT: Destination info */}
              <div className="mt-6 lg:mt-0">
                {destA && <DestinationCard airport={destA} lang={lang} t={t} />}
              </div>
            </div>
          </div>
        )}

        {/* ── EMPTY STATE ── */}
        {!searched && (
          <div className="animate-fade-up">

            {/* How it works */}
            <div className="grid grid-cols-3 gap-4 mb-10">
              {[
                { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-indigo-400"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>, title: "Choisis ta route", sub: "Départ, arrivée, dates" },
                { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-indigo-400"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>, title: "On compare tout", sub: "Prix cash vs 17 programmes" },
                { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-emerald-400"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" /></svg>, title: "Économise", sub: "Jusqu'à -70% avec les miles" },
              ].map(({ icon, title, sub }) => (
                <div key={title} className="text-center p-4 rounded-2xl bg-white/4 border border-white/8">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/15 flex items-center justify-center mx-auto mb-3">
                    {icon}
                  </div>
                  <p className="text-slate-200 font-semibold text-sm mb-1">{title}</p>
                  <p className="text-slate-500 text-xs">{sub}</p>
                </div>
              ))}
            </div>

            {/* Popular routes */}
            <div className="mb-8">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                </svg>
                Routes populaires
              </p>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                {POPULAR_ROUTES.map(route => (
                  <button
                    key={route.label}
                    onClick={() => handlePopularRoute(route.from, route.to)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/4 border border-white/8 hover:bg-indigo-500/10 hover:border-indigo-500/25 transition-all group text-left cursor-pointer"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5 text-indigo-500 group-hover:text-indigo-400 flex-shrink-0">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                    <span className="text-slate-300 text-xs font-medium group-hover:text-slate-100 transition-colors">{route.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Recent searches */}
            {searchHistory.length > 0 && (
              <div className="mb-6">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  Recherches récentes
                </p>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                  {searchHistory.map((entry, i) => {
                    const oA = airportsMap[entry.origin];
                    const dA = airportsMap[entry.dest];
                    if (!oA || !dA) return null;
                    return (
                      <button key={i}
                        onClick={() => { setOrigin(entry.origin); setDest(entry.dest); setCabin(entry.cabin as import("./types.js").Cabin); }}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/4 border border-white/8 hover:bg-indigo-500/10 hover:border-indigo-500/25 transition-all group text-left cursor-pointer"
                      >
                        <span className="text-sm">{oA.flag}</span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3 text-indigo-500 flex-shrink-0">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                        </svg>
                        <span className="text-sm">{dA.flag}</span>
                        <span className="text-slate-300 text-xs font-medium truncate">{entry.origin} → {entry.dest}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        )}

        {/* ── FOOTER ── */}
        <footer className="text-center mt-4 text-indigo-500 text-xs space-y-0.5 pb-4">
          <p>
            {t.footerRates(rates.USD_XOF.toFixed(0), rates.USD_EUR.toFixed(3))}
            {rates.updatedAt && <span className="text-indigo-600 ml-1">({t.footerLive})</span>}
          </p>
          <p className="text-slate-600">{t.footerBy}</p>
        </footer>

      </main>
    </div>
  );
}
