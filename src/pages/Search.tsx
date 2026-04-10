import { Helmet } from "react-helmet-async";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import SearchForm from "../components/search/SearchForm";
import Skeleton from "../design/components/Skeleton";
import { useFlights } from "../hooks/useFlights";
import { useMilesCalculator } from "../hooks/useMilesCalculator";
import { useRates } from "../hooks/useRates";
import { useCurrency } from "../hooks/useCurrency";
import { useFlightFilters } from "../hooks/useFlightFilters";
import { airportsMap } from "../data/airports";
import { today, addDays } from "../utils/dates";
import { fmt, estimateCash, convert, formatAmount } from "../utils/currency";
import { haversine } from "../utils/distance";
import DealScore from "../components/miles/DealScore";
import { scoreDeal } from "../utils/scoring";
import { useAnalytics } from "../hooks/useAnalytics";

export default function Search() {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();
  const { trackSearch, trackBooking } = useAnalytics();

  const urlOrigin = searchParams.get("origin") || "DSS";
  const urlDest   = searchParams.get("dest")   || "";
  const urlDep    = searchParams.get("depDate") || addDays(today, 30);
  const urlRet    = searchParams.get("retDate") || "";
  const urlCabin  = Number(searchParams.get("cabin") ?? "0") as 0 | 1;

  const rates                         = useRates();
  const { currency }                 = useCurrency();
  const { googleFlights, skyFlights, gLoading, sLoading, gError, sError, loading, allFlights, search, reset } = useFlights();
  const { filteredFlights, reset: resetFilters } = useFlightFilters(allFlights, false);
  const origA = airportsMap[urlOrigin];
  const destA  = airportsMap[urlDest];
  const distMiles = origA && destA ? haversine(origA.lat, origA.lon, destA.lat, destA.lon) : 0;

  const milesResults = useMilesCalculator({
    origin: urlOrigin, dest: urlDest, cabin: urlCabin,
    distMiles, isOneWay: !urlRet, passengers: 1, rates, milesOwned: false,
  });

  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (urlOrigin && urlDest && urlDep) {
      const params = new URLSearchParams(searchParams);
      reset();
      search(params);
      setSearched(true);
      trackSearch(urlOrigin, urlDest, urlCabin);
    }
  }, []);

  const handleSearch = useCallback((params: URLSearchParams) => {
    navigate(`/search?${params.toString()}`);
    reset();
    search(params);
    setSearched(true);
  }, [navigate, search, reset]);

  const [estEco, estBus] = estimateCash(distMiles, !urlRet);
  const estPrice    = urlCabin === 1 ? estBus : estEco;
  const bestApiPrice = filteredFlights.length > 0 ? Math.min(...filteredFlights.map(f => f.price).filter(Boolean)) : null;
  const cashUSD = bestApiPrice ?? estPrice;
  const isReal  = !!bestApiPrice;

  const bothFailed = !loading && searched && allFlights.length === 0 && gError && sError;

  return (
    <>
      <Helmet>
        <title>
          {urlOrigin && urlDest ? `Vols ${urlOrigin} → ${urlDest} | Miles Optimizer` : "Recherche de vols | Miles Optimizer"}
        </title>
      </Helmet>

      {/* Search bar sticky */}
      <div className="bg-white border-b border-slate-100 py-4 px-4">
        <div className="max-w-3xl mx-auto">
          <SearchForm onSearch={handleSearch} variant="compact" defaultOrigin={urlOrigin} defaultDest={urlDest} />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Route header */}
        {urlOrigin && urlDest && (
          <div className="flex items-center gap-3 mb-8">
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
            {/* API Status */}
            <div className="flex items-center gap-4 text-xs mb-4">
              <span className={`flex items-center gap-1 ${gLoading ? "text-blue-500" : googleFlights ? "text-green-500" : gError ? "text-red-400" : "text-slate-400"}`}>
                {gLoading && <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
                {gLoading ? "Google Flights…" : googleFlights ? "✓ Google Flights" : gError ? "✕ Google Flights" : ""}
              </span>
              <span className={`flex items-center gap-1 ${sLoading ? "text-orange-400" : skyFlights ? "text-green-500" : sError ? "text-red-400" : "text-slate-400"}`}>
                {sLoading && <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
                {sLoading ? "Skyscanner…" : skyFlights ? "✓ Skyscanner" : sError ? "✕ Skyscanner" : ""}
              </span>
            </div>

            {/* Loading */}
            {loading && allFlights.length === 0 && <Skeleton variant="card" />}

            {/* Both failed */}
            {bothFailed && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center mb-6">
                <p className="text-red-700 font-semibold mb-2">Recherche indisponible</p>
                <p className="text-red-600 text-sm mb-4">Les deux sources de prix sont indisponibles. Réessayez dans quelques instants.</p>
                <button onClick={() => { reset(); search(searchParams); }}
                  className="bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors">
                  Réessayer
                </button>
              </div>
            )}

            {/* Flight results */}
            {filteredFlights.map((f, i) => (
              <div key={i} className="mb-3 bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-800">{f.airline || "Vol"}</p>
                    <p className="text-xs text-slate-400">{f.stops === 0 ? "Direct" : `${f.stops} escale${f.stops > 1 ? "s" : ""}`} · {f.duration}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-slate-900">{formatAmount(convert(f.price, currency, rates), currency)}</p>
                    <p className="text-xs text-slate-400">
                      {f.source === "google" ? "Google Flights" : "Skyscanner"}
                    </p>
                  </div>
                </div>
              </div>
            ))}

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
            {/* Price reference */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-4">
              <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">
                {isReal ? "Meilleur prix trouvé" : "Prix estimé"}
              </p>
              <div className="text-3xl font-black text-slate-900">
                {formatAmount(convert(cashUSD, currency, rates), currency)}
              </div>
              {!isReal && <p className="text-xs text-amber-500 mt-1">⚠ Estimation — les vrais prix peuvent varier</p>}
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
                          onClick={() => { trackBooking(program.id); fetch(`/api/go?program=${program.id}`).catch(() => {}); }}
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
          </div>
        </div>
      </div>
    </>
  );
}
