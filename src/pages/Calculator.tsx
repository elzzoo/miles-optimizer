import { Helmet } from "react-helmet-async";
import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { PROGRAMS } from "../data/programs";
import { scoreDeal } from "../utils/scoring";
import DealScore from "../components/miles/DealScore";
import Card from "../design/components/Card";

export default function Calculator() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [cashPrice, setCashPrice] = useState(searchParams.get("cash") || "800");
  const [miles, setMiles]         = useState(searchParams.get("miles") || "50000");
  const [taxes, setTaxes]     = useState(searchParams.get("taxes") || "60");
  const [programId, setProgramId] = useState(searchParams.get("program") || "aeroplan");
  const [copied, setCopied]   = useState(false);

  const program = useMemo(() => PROGRAMS.find(p => p.id === programId) ?? PROGRAMS[0], [programId]);

  const score = useMemo(() => scoreDeal({
    program,
    milesNeeded:  Number(miles),
    taxesUSD:     Number(taxes),
    cashPriceUSD: Number(cashPrice),
  }), [program, miles, taxes, cashPrice]);

  const allScores = useMemo(() =>
    PROGRAMS.map(p => ({
      program: p,
      score: scoreDeal({ program: p, milesNeeded: Number(miles), taxesUSD: p.taxUSD, cashPriceUSD: Number(cashPrice) }),
    })).sort((a, b) => b.score.centsPerMile - a.score.centsPerMile)
  , [miles, cashPrice]);

  // Sync URL params so the share link works
  useEffect(() => {
    const p = new URLSearchParams({ cash: cashPrice, miles, taxes, program: programId });
    setSearchParams(p, { replace: true });
  }, [cashPrice, miles, taxes, programId]);

  function handleShare() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }

  return (
    <>
      <Helmet>
        <title>Calculateur cash vs miles | Miles Optimizer</title>
        <meta name="description" content="Calculez la valeur de vos miles en cents par mile. Comparez cash et miles pour votre prochain vol." />
        <link rel="canonical" href="https://miles-optimizer-next.onrender.com/calculator" />
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="mb-8">
          <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2">Outil gratuit</p>
          <h1 className="text-3xl font-black text-slate-900 mb-2">Calculateur cash vs miles</h1>
          <p className="text-slate-500">Calculez la vraie valeur de votre rachat de miles en ¢/mile.</p>
        </div>

        <div className="grid md:grid-cols-[1fr_380px] gap-6">

          {/* Inputs */}
          <Card>
            <h3 className="font-bold text-slate-800 mb-5">Paramètres</h3>

            <div className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
                  Prix cash du vol (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                  <input
                    type="number"
                    value={cashPrice}
                    onChange={e => setCashPrice(e.target.value)}
                    min="0"
                    className="w-full pl-7 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {[400, 700, 1000, 1500, 2500].map(v => (
                    <button key={v} type="button" onClick={() => setCashPrice(String(v))}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${Number(cashPrice) === v ? "bg-primary/10 border-primary/30 text-primary" : "border-slate-200 text-slate-500 hover:border-slate-300"}`}>
                      {v}$
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
                  Miles utilisés
                </label>
                <input
                  type="number"
                  value={miles}
                  onChange={e => setMiles(e.target.value)}
                  min="0"
                  className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <div className="flex gap-2 mt-2 flex-wrap">
                  {[25000, 40000, 60000, 80000, 120000].map(v => (
                    <button key={v} type="button" onClick={() => setMiles(String(v))}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${Number(miles) === v ? "bg-primary/10 border-primary/30 text-primary" : "border-slate-200 text-slate-500 hover:border-slate-300"}`}>
                      {(v/1000).toFixed(0)}k
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
                  Taxes + surcharges (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                  <input
                    type="number"
                    value={taxes}
                    onChange={e => setTaxes(e.target.value)}
                    min="0"
                    className="w-full pl-7 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
                  Programme de fidélité
                </label>
                <select
                  value={programId}
                  onChange={e => setProgramId(e.target.value)}
                  className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
                >
                  {PROGRAMS.map(p => (
                    <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          {/* Result */}
          <div className="space-y-4">
            <Card className={`border-2 ${score.worthIt ? "border-green-200 bg-green-50/50" : "border-slate-200"}`}>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Résultat</p>

              <div className="text-5xl font-black text-slate-900 mb-1 tabular-nums">
                {score.centsPerMile}<span className="text-2xl text-slate-400">¢</span>
              </div>
              <p className="text-slate-500 text-sm mb-4">par mile utilisé</p>

              <DealScore score={score} showDetails size="md" />

              <button
                onClick={handleShare}
                className="mt-4 w-full flex items-center justify-center gap-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-xl py-2.5 hover:border-slate-300 hover:bg-slate-50 transition-all"
              >
                {copied ? (
                  <><span className="text-green-600">✓</span> Lien copié !</>
                ) : (
                  <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 1 1 0-2.684m0 2.684 6.632 3.316m-6.632-6 6.632-3.316m0 0a3 3 0 1 0 5.367-2.684 3 3 0 0 0-5.367 2.684Zm0 9.316a3 3 0 1 0 5.368 2.683 3 3 0 0 0-5.368-2.683Z" /></svg>Partager ce calcul</>
                )}
              </button>

              {score.savingsUSD > 0 && (
                <div className="mt-4 bg-green-50 rounded-xl p-3 border border-green-100">
                  <p className="text-sm text-green-800 font-semibold">
                    💰 Vous économisez environ <strong>{score.savingsUSD}$</strong> vs le cash
                  </p>
                  <p className="text-xs text-green-600 mt-0.5">
                    Coût réel en miles : ~{score.totalMilesCost}$ (acquisition + taxes)
                  </p>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500 space-y-1">
                <div className="flex justify-between">
                  <span>Prix cash</span><span className="font-medium">{cashPrice}$</span>
                </div>
                <div className="flex justify-between">
                  <span>Coût acquisition miles ({program.pricePMile * 100}¢/mile)</span>
                  <span className="font-medium">~{Math.round(Number(miles) * program.pricePMile)}$</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxes et surcharges</span><span className="font-medium">{taxes}$</span>
                </div>
                <div className="flex justify-between font-semibold text-slate-700 pt-1 border-t border-slate-100">
                  <span>Coût total miles</span>
                  <span>{score.totalMilesCost}$</span>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
                Grille de référence
              </p>
              <div className="space-y-1.5 text-xs">
                {[
                  { range: "≥ 2,5¢", label: "Excellent", color: "text-green-600", bg: "bg-green-50" },
                  { range: "1,8–2,5¢", label: "Très bon", color: "text-green-600", bg: "bg-green-50" },
                  { range: "1,2–1,8¢", label: "Bon", color: "text-blue-600", bg: "bg-blue-50" },
                  { range: "0,8–1,2¢", label: "Correct", color: "text-amber-600", bg: "bg-amber-50" },
                  { range: "< 0,8¢", label: "Faible", color: "text-red-600", bg: "bg-red-50" },
                ].map(({ range, label, color, bg }) => (
                  <div key={label} className={`flex justify-between items-center px-2.5 py-1.5 rounded-lg ${bg}`}>
                    <span className="font-mono text-slate-600">{range}</span>
                    <span className={`font-semibold ${color}`}>{label}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* All programs comparison */}
        <div className="mt-10">
          <h2 className="text-xl font-bold text-slate-900 mb-5">
            Comparaison tous programmes ({cashPrice}$ cash / {Number(miles).toLocaleString()} miles)
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {allScores.map(({ program: p, score: s }) => (
              <div key={p.id} className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-3">
                <span className="text-2xl flex-shrink-0">{p.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{p.short}</p>
                  <DealScore score={s} size="sm" />
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-lg font-black text-slate-900 tabular-nums">{s.centsPerMile}¢</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
