import { useState } from "react";
import { fmt, convert, formatAmount } from "../utils/currency.js";

const RANK_STYLES = {
  0: { border: "border-yellow-400", bg: "bg-gradient-to-br from-yellow-50 to-amber-50", badge: "🥇", bar: "bg-yellow-400" },
  1: { border: "border-slate-200", bg: "bg-white", badge: "🥈", bar: "bg-slate-300" },
  2: { border: "border-orange-200", bg: "bg-white", badge: "🥉", bar: "bg-orange-300" },
};

export default function MilesCard({ program, result, rank, cashUSD, isOneWay, rates, currency, t, lang, origin, dest, cabin }) {
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

  const cppColor = cpp === null ? ""
    : cpp > 2 ? "text-emerald-700 bg-emerald-50"
    : cpp > 1 ? "text-amber-700 bg-amber-50"
    : "text-red-600 bg-red-50";

  const savings = cashUSD - result.totalUSD;
  const savingsPct = Math.round((savings / cashUSD) * 100);
  const isCheaper = savings > 0;
  const style = RANK_STYLES[rank] || { border: "border-gray-100", bg: "bg-white", badge: "", bar: "" };

  const totalDisplay = formatAmount(convert(result.totalUSD, currency, rates), currency);
  const totalSecondary = currency !== "XOF"
    ? fmt.xof(result.totalXOF)
    : fmt.eur(result.totalEUR);

  const cardOneWay = t?.cardOneWay || "One way";
  const cardRoundTrip = t?.cardRoundTrip || "Round trip";

  return (
    <div className={`rounded-2xl border-2 ${style.border} ${style.bg} overflow-hidden transition-all`}>
      {rank < 3 && <div className={`h-1 ${style.bar}`} />}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            {style.badge && <span className="text-2xl flex-shrink-0">{style.badge}</span>}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-lg">{program.emoji}</span>
                <span className="font-black text-gray-900 text-base">{program.short}</span>
              </div>
              <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${program.allianceBg} ${program.allianceText}`}>{program.alliance}</span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-2xl font-black text-gray-900">{totalDisplay}</div>
            <div className="text-xs text-gray-400">{totalSecondary}</div>
            {isCheaper ? (
              <div className="mt-1 inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 font-black text-sm px-2 py-0.5 rounded-full">
                -{Math.abs(savingsPct)}% 💰
              </div>
            ) : (
              <div className="mt-1 inline-flex items-center gap-1 bg-red-50 text-red-500 font-bold text-xs px-2 py-0.5 rounded-full">
                +{fmt.usd(-savings)} vs cash
              </div>
            )}
          </div>
        </div>

        <div
          className={`rounded-xl p-3 mb-3 cursor-pointer transition-colors ${rank === 0 ? "bg-amber-100 hover:bg-amber-200" : "bg-gray-50 hover:bg-gray-100"}`}
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 font-medium">{isOneWay ? cardOneWay : cardRoundTrip} — {t?.cardViaMiles || "via miles"}</span>
            <span className="text-xs text-gray-400 font-medium">{expanded ? (t?.cardHide || "▲ hide") : (t?.cardDetails || "▼ details")}</span>
          </div>
        </div>

        {expanded && (
          <div className="space-y-2 text-sm mb-3">
            <div className="flex justify-between py-1.5 border-b border-gray-100">
              <span className="text-gray-500">{t?.cardMilesNeeded || "Miles required"}</span>
              <span className="font-bold">{fmt.miles(result.milesUsed)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-gray-100">
              <span className="text-gray-500">{t?.cardPricePerMile || "Price per mile"}</span>
              <span className="font-bold">${result.ppm.toFixed(4)}</span>
            </div>
            {cpp !== null && (
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">{t?.cppLabel || "Mile value"}</span>
                <span className={`font-bold text-xs px-2 py-0.5 rounded-full ${cppColor}`}>
                  {cpp.toFixed(2)}¢ — {cppBenchmark}
                </span>
              </div>
            )}
            <div className="flex justify-between py-1.5 border-b border-gray-100">
              <span className="text-gray-500">{t?.cardMilesCost || "Miles purchase cost"}</span>
              <span className="font-bold">{fmt.usd(result.milesCostUSD)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-gray-100">
              <span className="text-gray-500">{t?.cardTaxes || "Fees & taxes"}</span>
              <span className={`font-bold ${program.lowTax ? "text-emerald-600" : "text-orange-500"}`}>
                ~{fmt.usd(result.taxes)} {program.lowTax ? "✅" : "⚠️"}
              </span>
            </div>
            <div className="flex justify-between py-1.5 rounded-lg bg-gray-50 px-2">
              <span className="font-bold text-gray-700">{t?.cardTotal || "TOTAL"}</span>
              <div className="text-right">
                <div className="font-black">{totalDisplay}</div>
                <div className="text-xs text-gray-400">{totalSecondary}</div>
              </div>
            </div>
            {isCheaper && (
              <div className="bg-emerald-50 rounded-lg px-3 py-2 text-center">
                <span className="text-emerald-700 font-black text-sm">
                  {t?.cardSavings ? t.cardSavings(fmt.usd(savings), savingsPct) : `Savings: ${fmt.usd(savings)} (${savingsPct}%) 🎉`}
                </span>
              </div>
            )}
          </div>
        )}

        {program.updatedAt && isStale(program.updatedAt) && (
          <p className="text-xs text-amber-500 mb-1">⚠️ {t?.staleRates || "Rates may be outdated"}</p>
        )}
        <p className="text-xs text-gray-400 italic mb-2">{lang === "en" ? (program.notesEn || program.notes) : program.notes}</p>
        {program.airlines.length > 0 && (
          <p className="text-xs text-gray-400 mb-3">✈️ {program.airlines.join(" · ")}</p>
        )}
        {program.bookingUrl && (
          <a
            href={`/api/go?program=${program.id}&origin=${origin || ""}&dest=${dest || ""}&cabin=${cabin ?? ""}&ref=milescard`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors border border-indigo-100">
            {t?.cardBook || "Book with miles ↗"}
          </a>
        )}
      </div>
    </div>
  );
}
