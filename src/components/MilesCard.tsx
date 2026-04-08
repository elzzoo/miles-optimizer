import { useState } from "react";
import type { Program, MilesResult, ExchangeRates, Currency, Cabin } from "../types.js";
import { fmt, convert, formatAmount } from "../utils/currency.js";

interface MilesCardProps {
  program: Program;
  result: MilesResult;
  rank: number;
  cashUSD: number;
  isOneWay: boolean;
  rates: ExchangeRates | null;
  currency: Currency;
  t?: Record<string, unknown>;
  lang?: string;
  origin?: string;
  dest?: string;
  cabin?: Cabin;
}

const RANK_STYLES = {
  0: {
    border: "border-amber-400/50",
    glow: "shadow-amber-500/10",
    bar: "bg-gradient-to-r from-amber-400 to-amber-500",
    badgeBg: "bg-amber-500/20 border-amber-400/30",
    badgeText: "text-amber-300",
  },
  1: {
    border: "border-slate-500/30",
    glow: "",
    bar: "bg-gradient-to-r from-slate-500 to-slate-400",
    badgeBg: "bg-slate-500/20 border-slate-400/20",
    badgeText: "text-slate-300",
  },
  2: {
    border: "border-orange-500/30",
    glow: "",
    bar: "bg-gradient-to-r from-orange-600 to-orange-400",
    badgeBg: "bg-orange-500/20 border-orange-400/20",
    badgeText: "text-orange-300",
  },
};

export default function MilesCard({ program, result, rank, cashUSD, isOneWay, rates, currency, t, lang, origin, dest, cabin }: MilesCardProps) {
  const [expanded, setExpanded] = useState(rank === 0);
  if (!result) return null;

  // Stale data check
  function isStale(updatedAt) {
    if (!updatedAt) return false;
    const [year, month] = updatedAt.split("-").map(Number);
    const updated = new Date(year, month - 1);
    const diffDays = (Date.now() - updated) / (1000 * 60 * 60 * 24);
    return diffDays > 90;
  }

  // CPP: (cashUSD - taxes) / milesUsed * 100 = cents per mile
  const cpp = (result.milesUsed > 0 && cashUSD > result.taxes)
    ? ((cashUSD - result.taxes) / result.milesUsed * 100)
    : null;

  const cppBenchmark = cpp === null ? null
    : cpp > 2 ? (t?.cppExcellent || "Excellent (>2¢)")
    : cpp > 1 ? (t?.cppGood || "Good (1-2¢)")
    : (t?.cppLow || "Low (<1¢)");

  const savings = cashUSD - result.totalUSD;
  const savingsPct = Math.round((savings / cashUSD) * 100);
  const isCheaper = savings > 0;
  const style = RANK_STYLES[rank] || { border: "border-white/10", glow: "", bar: "bg-white/20", badgeBg: "bg-white/10 border-white/10", badgeText: "text-slate-400" };

  const totalDisplay = formatAmount(convert(result.totalUSD, currency, rates), currency);
  const totalSecondary = currency !== "XOF"
    ? fmt.xof(result.totalXOF)
    : fmt.eur(result.totalEUR);

  const cardOneWay = t?.cardOneWay || "One way";
  const cardRoundTrip = t?.cardRoundTrip || "Round trip";

  return (
    <div className={`rounded-2xl border ${style.border} bg-white/5 backdrop-blur-sm overflow-hidden transition-all duration-200 shadow-lg ${style.glow}`}>
      {/* Rank bar */}
      <div className={`h-0.5 ${style.bar}`} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            {rank < 3 && (
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm border ${style.badgeBg}`}>
                <span className={`font-bold ${style.badgeText}`}>{rank + 1}</span>
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4.5 h-4.5 text-indigo-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                  </svg>
                </div>
                <span className="font-bold text-slate-50 text-base">{program.short}</span>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full mt-1 inline-block ${program.allianceBg} ${program.allianceText} opacity-80`}>
                {program.alliance}
              </span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-2xl font-bold text-slate-50">{totalDisplay}</div>
            <div className="text-xs text-slate-500 mt-0.5">{totalSecondary}</div>
            {isCheaper ? (
              <div className="mt-1.5 inline-flex items-center gap-1 bg-emerald-500/15 text-emerald-400 font-bold text-xs px-2.5 py-1 rounded-full border border-emerald-500/20">
                -{Math.abs(savingsPct)}% économisé
              </div>
            ) : (
              <div className="mt-1.5 inline-flex items-center gap-1 bg-red-500/10 text-red-400 font-medium text-xs px-2.5 py-1 rounded-full border border-red-500/20">
                +{fmt.usd(-savings)} vs cash
              </div>
            )}
          </div>
        </div>

        {/* Expand toggle */}
        <button
          className="w-full rounded-xl p-3 mb-3 cursor-pointer transition-all bg-white/5 hover:bg-white/10 border border-white/8 text-left"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400 font-medium">
              {isOneWay ? (t?.cardOneWay || "Aller simple") : (t?.cardRoundTrip || "Aller-retour")} — {t?.cardViaMiles || "via miles"}
            </span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </div>
        </button>

        {/* Details */}
        {expanded && (
          <div className="space-y-1 text-sm mb-4">
            {[
              { label: t?.cardMilesNeeded || "Miles requis", value: fmt.miles(result.milesUsed), bold: true },
              { label: t?.cardPricePerMile || "Prix par mile", value: `$${result.ppm.toFixed(4)}` },
              { label: t?.cardMilesCost || "Coût achat miles", value: fmt.usd(result.milesCostUSD) },
              { label: t?.cardTaxes || "Taxes & frais", value: `~${fmt.usd(result.taxes)}`, extra: program.lowTax ? "text-emerald-400" : "text-amber-400" },
            ].map(({ label, value, bold, extra }) => (
              <div key={label} className="flex justify-between py-2 border-b border-white/5">
                <span className="text-slate-400">{label}</span>
                <span className={`font-medium text-slate-200 ${extra || ""} ${bold ? "font-bold" : ""}`}>{value}</span>
              </div>
            ))}
            {cpp !== null && (
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-slate-400">{t?.cppLabel || "Valeur du mile"}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  cpp > 2 ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                  : cpp > 1 ? "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                  : "bg-red-500/10 text-red-400 border border-red-500/20"
                }`}>
                  {cpp.toFixed(2)}¢ — {cppBenchmark}
                </span>
              </div>
            )}
            <div className="flex justify-between py-2.5 rounded-xl bg-white/5 px-3 mt-1 border border-white/8">
              <span className="font-bold text-slate-300">{t?.cardTotal || "TOTAL"}</span>
              <div className="text-right">
                <div className="font-bold text-slate-50">{totalDisplay}</div>
                <div className="text-xs text-slate-500">{totalSecondary}</div>
              </div>
            </div>
            {isCheaper && (
              <div className="bg-emerald-500/10 rounded-xl px-4 py-2.5 text-center border border-emerald-500/15">
                <span className="text-emerald-400 font-bold text-sm">
                  {t?.cardSavings ? t.cardSavings(fmt.usd(savings), savingsPct) : `Économie: ${fmt.usd(savings)} (${savingsPct}%)`}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        {program.updatedAt && isStale(program.updatedAt) && (
          <p className="text-xs text-amber-400/70 mb-2">{t?.staleRates || "Tarifs potentiellement obsolètes"}</p>
        )}
        <p className="text-xs text-slate-500 italic mb-3 leading-relaxed">
          {lang === "en" ? (program.notesEn || program.notes) : program.notes}
        </p>
        {program.airlines.length > 0 && (
          <p className="text-xs text-slate-500 mb-3">{program.airlines.join(" · ")}</p>
        )}
        {program.bookingUrl && (
          <a
            href={`/api/go?program=${program.id}&origin=${origin || ""}&dest=${dest || ""}&cabin=${cabin ?? ""}&ref=milescard`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 transition-colors border border-indigo-500/25 cursor-pointer"
          >
            {t?.cardBook || "Réserver avec des miles"} ↗
          </a>
        )}
      </div>
    </div>
  );
}
