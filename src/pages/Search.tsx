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

function Spinner() {
  return (
    <svg className="animate-spin w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export default function Search() {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();
  const { trackSearch, trackBooking } = useAnalytics();

  const urlOrigin = searchParams.get("origin") || "DSS";
  const urlDest   = searchParams.get("dest")   || "";
  const urlDep    = searchParams.get("depDate") || addDays(today, 30);
  const urlRet    = searchParams.get("retDate") || "";
  const urlCabin  = Number(searchParams.get("cabin") ?? "0") as 0 | 1;

  const rates            = useRates();
  const { currency }     = useCurrency();
  const { googleFlights, skyFlights, gLoading, sLoading, gError, sError, loading, allFlights, search, reset } = useFlights();
  const { filteredFlights } = useFlightFilters(allFlights, false);

  const origA = airportsMap[urlOrigin];
  const destA  = airportsMap[urlDest];
  const distMiles = origA && destA ? haversine(origA.lat, origA.lon, destA.lat, destA.lon) : 0;

  const milesResults = useMilesCalculator({
    origin: urlOrigin, dest: urlDest, cabin: urlCabin,
    distMiles, isOneWay: !urlRet, passengers: 1, rates, milesOwned: false,
  });

  const [searched, setSearched] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  useEffect(() => {
    if (urlOrigin && urlDest && urlDep) {
      reset();
      search(new URLSearchParams(searchParams));
      setSearched(true);
      trackSearch(urlOrigin, urlDest, urlCabin);
    }
  }, []);

  const handleSearch = useCallback((params: URLSearchParams) => {
    navigate(`/search?${params.toString()}`);
    reset();
    search(params);
    setSearched(true);
    setSelectedIdx(null);
  }, [navigate, search, reset]);

  const [estEco, estBus] = estimateCash(distMiles, !urlRet);
  const estPrice     = urlCabin === 1 ? estBus : estEco;
  const bestApiPrice = filteredFlights.length > 0 ? Math.min(...filteredFlights.map(f => f.price).filter(Boolean)) : null;
  const cashUSD  = bestApiPrice ?? estPrice;
  const isReal   = !!bestApiPrice;

  const bothFailed    = !loading && searched && allFlights.length === 0 && !!gError && !!sError;
  const partialFailed = !loading && searched && allFlights.length > 0 && (!!gError || !!sError);

  return (
    <>
      <Helmet>
        <title>
          {urlOrigin && urlDest ? `Vols ${urlOrigin} → ${urlDest} | Miles Optimizer` : "Recherche de vols | Miles Optimizer"}
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
        {urlOrigin && urlDest && (
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
              <div className="flex items-center gap-3 text-xs mb-4 flex-wrap">
                <span className={`flex items-center gap-1.5 font-medium px-2.5 py-1 rounded-full border ${
                  gLoading  ? "bg-blue-50 text-blue-600 border-blue-100"
                  : googleFlights ? "bg-green-50 text-green-600 border-green-100"
                  : gError  ? "bg-red-50 text-red-500 border-red-100"
                  : "hidden"
                }`}>
                  {gLoading && <Spinner />}
                  {!gLoading && googleFlights && <span>✓</span>}
                  {!gLoading && gError && <span>✕</span>}
                  Google Flights
                </span>
                <span className={`flex items-center gap-1.5 font-medium px-2.5 py-1 rounded-full border ${
                  sLoading  ? "bg-orange-50 text-orange-600 border-orange-100"
                  : skyFlights ? "bg-green-50 text-green-600 border-green-100"
                  : sError  ? "bg-red-50 text-red-500 border-red-100"
                  : "hidden"
                }`}>
                  {sLoading && <Spinner />}
                  {!sLoading && skyFlights && <span>✓</span>}
                  {!sLoading && sError && <span>✕</span>}
                  Skyscanner
                </span>
                {filteredFlights.length > 0 && !loading && (
                  <span className="text-slate-400 ml-auto">{filteredFlights.length} vol{filteredFlights.length > 1 ? "s" : ""} trouvé{filteredFlights.length > 1 ? "s" : ""}</span>
                )}
              </div>
            )}

            {/* Partial failure notice */}
            {partialFailed && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-xs text-amber-700 mb-4 flex items-center gap-2">
                <span>⚠</span>
                <span>
                  {gError ? "Google Flights" : "Skyscanner"} indisponible — résultats partiels affichés.
                </span>
              </div>
            )}

            {/* Loading skeletons */}
            {loading && allFlights.length === 0 && <Skeleton variant="card" count={3} />}

            {/* Both failed */}
            {bothFailed && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center mb-6">
                <p className="text-4xl mb-3">🔌</p>
                <p className="text-red-700 font-semibold mb-2">Sources de prix indisponibles</p>
                <p className="text-red-500 text-sm mb-4">Les deux agrégateurs de prix ne répondent pas. L'estimation miles reste disponible.</p>
                <button
                  onClick={() => { reset(); search(new URLSearchParams(searchParams)); }}
                  className="bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors"
                >
                  Réessayer
                </button>
              </div>
            )}

            {/* Flight results */}
            <div className="space-y-3">
              {filteredFlights.map((f, i) => (
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

            {/* No results (non-failure) */}
            {!loading && searched && allFlights.length === 0 && !bothFailed && (
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
              {!isReal && (
                <p className="text-xs text-amber-500 mt-1 flex items-center gap-1">
                  <span>⚠</span>
                  <span>Estimation — les vrais prix varient</span>
                </p>
              )}
              {isReal && (
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <span>✓</span>
                  <span>Prix réel mis à jour à l'instant</span>
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

            {/* Data freshness note */}
            <p className="text-[10px] text-slate-400 mt-3 text-center">
              Miles calculés sur base des grilles tarifaires publiées. Taxes et surcarburant non inclus dans les miles.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
