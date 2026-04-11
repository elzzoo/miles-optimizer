import Card from "../../design/components/Card";
import DealScore from "../miles/DealScore";
import { useAnalytics } from "../../hooks/useAnalytics";

function buildProgramUrl(programId: string, origin: string, dest: string, depDate: string): string {
  const baseUrls: Record<string, string | ((o: string, d: string, date: string) => string)> = {
    aeroplan:    (o, d, dt) => `https://www.aircanada.com/aeroplan/redeem/availability/outbound?org0=${o}&dest0=${d}&departureDate=${dt}&lang=fr-CA&tripType=O&marketCode=INT`,
    flyingblue:  (o, d, dt) => `https://wwws.airfrance.fr/recherche/vols?origin=${o}&destination=${d}&outwardDate=${dt}&cabinClass=ECONOMY&passengerCount=1&tripType=ONE_WAY`,
    lifemiles:   (o, d, dt) => `https://www.lifemiles.com/miles/redeem/search?origin=${o}&destination=${d}&departureDate=${dt}&adults=1&cabin=Y`,
    ba:          (o, d) => `https://www.britishairways.com/en-gb/flights/offers/avios-flights?departurePoint=${o}&destinationPoint=${d}`,
    aadvantage:  (o, d, dt) => `https://www.aa.com/booking/search?locale=fr_FR&pax=1&adult=1&type=OneWay&searchType=Award&carriers=ALL&fromStation=${o}&toStation=${d}&departDate=${dt}`,
    united:      (o, d, dt) => `https://www.united.com/en/us/book-flight/united-awards/search?f=${o}&t=${d}&d=${dt}&tt=1&sc=7&px=1&taxng=1&newHP=True`,
    turkish:     "https://www.turkishairlines.com/fr-fr/miles-smiles/utiliser-vos-miles/vols-miles/",
    fidelys:     "https://fidelys.tunisair.com/en/use-miles",
    sindbad:     "https://www.royalairmaroc.com/fr-fr/fidelite/sindbad/utiliser-mes-miles",
    asantemiles: "https://www.kenya-airways.com/fr/flying-blue/utiliser-mes-miles/",
    safarflyer:  "https://www.airalgerie.dz/fr/safar-flyer",
    aegean:      "https://en.aegeanair.com/miles-bonus/use-miles/award-flights/",
    shebamiles:  "https://www.ethiopianairlines.com/fr/shebamiles/use-miles",
    qatar:       "https://www.qatarairways.com/en/privilege-club/avios.html",
    krisflyer:   "https://www.singaporeair.com/en_UK/us/krisflyer/redeem/award-redemption/",
  };
  const fn = baseUrls[programId];
  if (!fn) return "#";
  if (typeof fn === "function") return fn(origin, dest, depDate);
  return fn;
}

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
  tpPrice?: number | null;   // real Travelpayouts price (null = using estimate)
  tpUrl?: string | null;     // Aviasales affiliate link
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
  topDeal?: boolean;
}

export default function DealCard({ deal, rank, blurred = false, topDeal = false }: Props) {
  const { trackDealClick, trackBooking } = useAnalytics();

  function handleShare() {
    const url = `${window.location.origin}/best-deals?highlight=${deal.id}`;
    const text = `✈️ Deal miles : ${deal.route.label} — ${(deal.milesNeeded / 1000).toFixed(0)}k miles + ${deal.taxesUSD}$ (valeur ${deal.score.centsPerMile}¢/mile) via ${deal.program.name}`;
    if (navigator.share) {
      navigator.share({ title: "Miles Optimizer Deal", text, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${text}\n${url}`).then(() => {
        alert("Lien copié !");
      }).catch(() => {});
    }
  }

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

      {topDeal && (
        <div className="absolute -top-px left-4">
          <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-b-lg tracking-wide shadow-sm">
            🔥 Deal du jour
          </span>
        </div>
      )}

      {rank !== undefined && (
        <div className={`absolute left-4 ${topDeal ? "top-7" : "top-4"}`}>
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
          <div className="text-xs mb-2">
            <span className="line-through text-slate-400">{deal.cashPriceUSD}$</span>
            {deal.tpPrice && deal.tpPrice !== deal.cashPriceUSD && (
              <span className="ml-1.5 text-emerald-600 font-semibold">{deal.tpPrice}$ réel</span>
            )}
            <span className="text-slate-400"> cash</span>
          </div>

          <div className="mt-2 flex flex-col items-end gap-1.5">
            {deal.tpUrl && (
              <a
                href={deal.tpUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                ✈️ Acheter cash
              </a>
            )}
            <a
              href={getSearchUrl(deal.route.from, deal.route.to)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-primary transition-colors"
            >
              🔍 Vérifier le prix
            </a>
            <a
              href={buildProgramUrl(
                deal.program.id,
                deal.route.from,
                deal.route.to,
                (() => { const d = new Date(); d.setMonth(d.getMonth() + 1); return d.toISOString().slice(0, 10); })()
              )}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                trackDealClick(deal.program.id, deal.route.label);
                trackBooking(deal.program.id);
                fetch(`/api/go?program=${deal.program.id}&from=${deal.route.from}&to=${deal.route.to}`).catch(() => {});
              }}
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-blue-700 transition-colors"
            >
              Réserver miles ↗
            </a>
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
              title="Partager ce deal"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
              </svg>
              Partager
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}
