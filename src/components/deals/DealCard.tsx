import Card from "../../design/components/Card";
import DealScore from "../miles/DealScore";
import { useAnalytics } from "../../hooks/useAnalytics";

// Generate a search URL for next month (no specific date needed for deals browsing)
function getSearchUrl(from: string, to: string) {
  const next = new Date();
  next.setMonth(next.getMonth() + 1);
  const depDate = next.toISOString().slice(0, 10);
  return `/search?origin=${from}&dest=${to}&depDate=${depDate}`;
}

interface Deal {
  id: string;
  route: { from: string; to: string; label: string };
  program: { id: string; name: string; short: string; emoji: string; bookingUrl: string };
  cashPriceUSD: number;
  milesNeeded: number;
  taxesUSD: number;
  score: {
    centsPerMile: number; label: string; color: string;
    savingsUSD: number; savingsPct: number; worthIt: boolean;
  };
}

interface Props {
  deal: Deal;
  rank?: number;
  blurred?: boolean;
}

export default function DealCard({ deal, rank, blurred = false }: Props) {
  const { trackDealClick, trackBooking } = useAnalytics();

  return (
    <Card hover className={`relative overflow-hidden ${blurred ? "select-none" : ""}`}>
      {blurred && (
        <div className="absolute inset-0 z-10 backdrop-blur-sm bg-white/60 flex items-center justify-center rounded-2xl">
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-700 mb-2">🔒 Réservé Premium</p>
            <a href="/premium" className="text-xs text-primary font-medium hover:underline">Débloquer →</a>
          </div>
        </div>
      )}

      {rank !== undefined && (
        <div className="absolute top-4 left-4">
          <span className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
            rank === 0 ? "bg-amber-100 text-amber-700" :
            rank === 1 ? "bg-slate-100 text-slate-600" :
            rank === 2 ? "bg-orange-50 text-orange-600" : "bg-slate-50 text-slate-500"
          }`}>
            {rank + 1}
          </span>
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0 pl-6">
          {/* Route */}
          <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-800 mb-1">
            <span>{deal.route.from}</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 text-primary flex-shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
            <span>{deal.route.to}</span>
            <span className="text-slate-400 font-normal text-xs">· {deal.route.label.split("→")[1]?.trim()}</span>
          </div>

          {/* Program */}
          <div className="flex items-center gap-1.5 mb-3">
            <span className="text-base">{deal.program.emoji}</span>
            <span className="text-sm text-slate-600">{deal.program.name}</span>
          </div>

          {/* Score */}
          <DealScore score={deal.score as any} showDetails size="sm" />
        </div>

        {/* Right: miles + price */}
        <div className="text-right flex-shrink-0">
          <div className="text-2xl font-black text-slate-900 tabular-nums">
            {(deal.milesNeeded / 1000).toFixed(0)}k
          </div>
          <div className="text-xs text-slate-500 mb-2">miles + {deal.taxesUSD}$</div>
          <div className="text-xs text-slate-400 line-through">{deal.cashPriceUSD}$ cash</div>

          <div className="mt-2 flex flex-col items-end gap-1.5">
            <a
              href={getSearchUrl(deal.route.from, deal.route.to)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-primary transition-colors"
            >
              🔍 Vérifier le prix
            </a>
            <a
              href={deal.program.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                trackDealClick(deal.program.id, deal.route.label);
                trackBooking(deal.program.id);
                fetch(`/api/go?program=${deal.program.id}&from=${deal.route.from}&to=${deal.route.to}`).catch(() => {});
              }}
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-blue-700 transition-colors"
            >
              Réserver ↗
            </a>
          </div>
        </div>
      </div>
    </Card>
  );
}
