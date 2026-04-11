import { Helmet } from "react-helmet-async";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import SearchForm from "../components/search/SearchForm";
import Skeleton from "../design/components/Skeleton";
import FlightCard from "../components/FlightCard";
import { useFlights } from "../hooks/useFlights";
import { useMilesCalculator } from "../hooks/useMilesCalculator";
import { useRates } from "../hooks/useRates";
import { useCurrency } from "../hooks/useCurrency";
import { useFlightFilters } from "../hooks/useFlightFilters";
import { airportsMap } from "../data/airports";
import { today, addDays } from "../utils/dates";
import { estimateCash, convert, formatAmount } from "../utils/currency";
import { haversine } from "../utils/distance";
import DealScore from "../components/miles/DealScore";
import { scoreDeal } from "../utils/scoring";
import { useAnalytics } from "../hooks/useAnalytics";
import { useSearchQuota } from "../hooks/useSearchQuota";
import PaywallBanner from "../components/search/PaywallBanner";

function Spinner() {
  return (
    <svg className="animate-spin w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function buildGoogleFlightsUrl(origin: string, dest: string, depDate: string, retDate?: string, cabin?: number) {
  const dep = depDate.replace(/-/g, "").slice(2);
  const ret = retDate ? retDate.replace(/-/g, "").slice(2) : null;
  const cl  = cabin === 1 ? "c" : "";
  return `https://www.google.com/flights#search;f=${origin};t=${dest};d=${dep}${ret ? `;r=${ret}` : ""}${cl ? `;sc=${cl}` : ""}`;
}

function buildAviasalesUrl(origin: string, dest: string, depDate: string, retDate?: string) {
  const dep = new Date(depDate);
  const dd  = String(dep.getDate()).padStart(2, "0");
  const mm  = String(dep.getMonth() + 1).padStart(2, "0");
  if (retDate) {
    const ret = new Date(retDate);
    const rdd = String(ret.getDate()).padStart(2, "0");
    const rmm = String(ret.getMonth() + 1).padStart(2, "0");
    return `https://www.aviasales.com/search/${origin}${dd}${mm}${dest}${rdd}${rmm}?marker=714947`;
  }
  return `https://www.aviasales.com/search/${origin}${dd}${mm}${dest}1?marker=714947`;
}

const SOURCE_LABEL: Record<string, string> = {
  duffel:        "Duffel",
  travelpayouts: "Aviasales",
  serpapi:       "Google Flights",
  google:        "Google Flights",
};

export default function Search() {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();
  const { trackSearch, trackBooking } = useAnalytics();

  // Bug 2: redirect if missing origin or dest
  const rawOrigin = searchParams.get("origin");
  const rawDest   = searchParams.get("dest");

  // Inject default dates if missing (Bug 2 + Bug 3)
  const urlOrigin = rawOrigin || "DSS";
  const urlDest   = rawDest   || "";
  const urlDep    = searchParams.get("depDate") || addDays(today, 30);
  const urlRet    = searchParams.get("retDate") || "";
  const urlCabin  = Number(searchParams.get("cabin") ?? "0") as 0 | 1;

  const rates        = useRates();
  const { currency } = useCurrency();
  const { flights: allFlights, loading, error, source, bestApiPrice: apiBestPrice, search, reset } = useFlights();
  const { filteredFlights } = useFlightFilters(allFlights, false);

  const origA     = airportsMap[urlOrigin];
  const destA     = airportsMap[urlDest];
  const distMiles = origA && destA ? haversine(origA.lat, origA.lon, destA.lat, destA.lon) : 0;

  const milesResults = useMilesCalculator({
    origin: urlOrigin, dest: urlDest, cabin: urlCabin,
    distMiles, isOneWay: !urlRet, passengers: 1, rates, milesOwned: false,
  });

  const [searched,     setSearched]     = useState(false);
  const [selectedIdx,  setSelectedIdx]  = useState<number | null>(null);
  const quota = useSearchQuota();

  // Redirect to home if no destination
  useEffect(() => {
    if (!rawDest) {
      navigate("/", { replace: true });
    }
  }, [rawDest, navigate]);

  useEffect(() => {
    if (rawDest && urlDep) {
      // Build params with injected defaults
      const p = new URLSearchParams(searchParams);
      if (!p.get("depDate")) p.set("depDate", urlDep);
      reset();
      search(p);
      setSearched(true);
      quota.increment();
      trackSearch(urlOrigin, urlDest, urlCabin);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = useCallback((params: URLSearchParams) => {
    if (quota.exhausted) return;
    navigate(`/search?${params.toString()}`);
    reset();
    search(params);
    setSearched(true);
    setSelectedIdx(null);
    quota.increment();
  }, [navigate, search, reset, quota.exhausted]);

  const [estEco, estBus] = estimateCash(distMiles, !urlRet);
  const estPrice    = urlCabin === 1 ? estBus : estEco;
  const bestApiPrice = filteredFlights.length > 0 ? Math.min(...filteredFlights.map(f => f.price).filter(Boolean)) : null;
  const cashUSD     = bestApiPrice ?? estPrice;
  const isReal      = !!bestApiPrice;

  const allFailed = !loading && searched && allFlights.length === 0 && !!error;
  const sourceLabel = source ? (SOURCE_LABEL[source] || source) : null;

  if (!rawDest) return null; // redirecting

  return (
    <>
      <Helmet>
        <title>
          {urlDest ? `Vols ${urlOrigin} → ${urlDest} | Miles Optimizer` : "Recherche de vols | Miles Optimizer"}
        </title>
      </Helmet>

      {/* Compact search bar */}
      <div className="bg-white border-b border-slate-100 py-4 px-4">
        <div className="max-w-3xl mx-auto">
          <SearchForm onSearch={handleSearch} variant="compact" defaultOrigin={urlOrigin} defaultDest={urlDest} />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Route header */}
        {urlDest && (
          <div className="flex items-center gap-3 mb-6">
            <h1 className="text-2xl font-bold text-slate-900">
              {origA?.flag} {origA ? (origA.city || urlOrigin) : urlOrigin}
              {" → "}
              {destA?.flag} {destA ? (destA.city || urlDest) : urlDest}
            </h1>
            {distMiles > 0 && (
              <span className="text-sm text-slate-400">{distMiles.toLocaleString()} mi</span>
            )}
          </div>
        )}

        <div className="lg:grid lg:grid-cols-[1fr_340px] lg:gap-8">

          {/* LEFT: Flights */}
          <div>
            {/* Source trust bar */}
            {searched && (
              <div className="flex items-center gap-3 flex-wrap text-xs mb-4">
                {loading && (
                  <span className="flex items-center gap-1.5 font-medium px-2.5 py-1 rounded-full border bg-blue-50 text-blue-600 border-blue-100">
                    <Spinner /> Recherche en cours…
                  </span>
                )}
                {!loading && sourceLabel && (
                  <span className="flex items-center gap-1.5 font-medium px-2.5 py-1 rounded-full border bg-green-50 text-green-600 border-green-100">
                    ✓ {sourceLabel}
                  </span>
                )}
                {!loading && error && !allFailed && (
                  <span className="flex items-center gap-1.5 font-medium px-2.5 py-1 rounded-full border bg-red-50 text-red-500 border-red-100">
                    ✕ Erreur partielle
                  </span>
                )}
                {filteredFlights.length > 0 && !loading && (
                  <span className="text-slate-400 ml-auto">
                    {filteredFlights.length} vol{filteredFlights.length > 1 ? "s" : ""} trouvé{filteredFlights.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>
            )}

            {/* Freemium quota */}
            <PaywallBanner remaining={quota.remaining} limit={quota.limit} />

            {/* Loading skeletons */}
            {!quota.exhausted && loading && <Skeleton variant="card" count={3} />}

            {/* All failed */}
            {!quota.exhausted && allFailed && urlDest && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-6">
                <div className="flex items-start gap-3 mb-4">
                  <span className="text-2xl flex-shrink-0">🔍</span>
                  <div>
                    <p className="font-semibold text-slate-800 mb-1">
                      Prix indisponibles momentanément, vérifiez les programmes miles ci-contre
                    </p>
                    <p className="text-slate-500 text-sm">Recherchez directement sur ces plateformes pour le prix cash :</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <a
                    href={buildGoogleFlightsUrl(urlOrigin, urlDest, urlDep, urlRet || undefined, urlCabin)}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 hover:border-blue-300 hover:bg-blue-50 transition-all"
                  >
                    Google Flights ↗
                  </a>
                  <a
                    href={buildAviasalesUrl(urlOrigin, urlDest, urlDep, urlRet || undefined)}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 hover:border-orange-300 hover:bg-orange-50 transition-all"
                  >
                    Aviasales ↗
                  </a>
                </div>
                <p className="text-center">
                  <button
                    onClick={() => { reset(); search(new URLSearchParams(searchParams)); }}
                    className="text-xs text-slate-500 hover:text-slate-700 underline"
                  >
                    Réessayer
                  </button>
                </p>
              </div>
            )}

            {/* Flight results */}
            <div className="space-y-3">
              {!quota.exhausted && filteredFlights.map((f, i) => (
                <FlightCard
                  key={i}
                  flight={f}
                  idx={i}
                  selectedIdx={selectedIdx}
                  onSelect={setSelectedIdx}
                  rates={rates}
                  currency={currency}
                />
              ))}
            </div>

            {/* No results */}
            {!quota.exhausted && !loading && searched && allFlights.length === 0 && !allFailed && (
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 text-center">
                <p className="text-3xl mb-3">✈️</p>
                <p className="font-semibold text-slate-700 mb-2">Aucun vol trouvé</p>
                <p className="text-slate-500 text-sm">Essayez d'autres dates ou une autre destination.</p>
              </div>
            )}
          </div>

          {/* RIGHT: Miles programs */}
          <div className="mt-6 lg:mt-0">
            {/* Price reference card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-4">
              <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">
                {isReal ? "Meilleur prix trouvé" : "Prix estimé"}
              </p>
              <div className="text-3xl font-black text-slate-900">
                {formatAmount(convert(cashUSD, currency, rates), currency)}
              </div>
              {!isReal ? (
                <p className="text-xs text-amber-500 mt-1 flex items-center gap-1">
                  <span>⚠</span><span>Estimation — les vrais prix varient</span>
                </p>
              ) : (
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <span>✓</span><span>Prix réel · {sourceLabel}</span>
                </p>
              )}
            </div>

            {/* Miles programs */}
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
              {milesResults.length} programmes comparés
            </p>
            <div className="space-y-2">
              {milesResults.slice(0, 8).map(({ program, result }, i) => {
                const s = scoreDeal({ program, milesNeeded: result?.milesUsed ?? 0, taxesUSD: program.taxUSD, cashPriceUSD: cashUSD });
                return (
                  <div key={program.id} className={`bg-white rounded-xl border p-4 ${i === 0 ? "border-green-200 bg-green-50/30" : "border-slate-100"}`}>
                    {i === 0 && (
                      <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider mb-2">Meilleure option</p>
                    )}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <span className="text-xl flex-shrink-0">{program.emoji}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{program.short}</p>
                          {result && <DealScore score={s} size="sm" />}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {result && (
                          <>
                            <p className="text-sm font-bold text-slate-900 tabular-nums">
                              {result.milesUsed.toLocaleString()}
                            </p>
                            <p className="text-[10px] text-slate-400">miles + {program.taxUSD}$</p>
                          </>
                        )}
                        <a
                          href={program.bookingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => {
                            trackBooking(program.id);
                            fetch(`/api/go?program=${encodeURIComponent(program.id)}&origin=${urlOrigin}&dest=${urlDest}&cabin=${urlCabin}`).catch(() => {});
                          }}
                          className="text-xs text-primary font-semibold hover:text-blue-700 transition-colors"
                        >
                          Réserver ↗
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-[10px] text-slate-400 mt-3 text-center">
              Miles calculés sur base des grilles tarifaires publiées. Taxes et surcarburant non inclus.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
