import Badge from "../../design/components/Badge";
import type { DealScore as DealScoreType } from "../../utils/scoring";

interface Props {
  score: DealScoreType;
  showDetails?: boolean;
  size?: "sm" | "md";
}

export default function DealScore({ score, showDetails = false, size = "md" }: Props) {
  const variant = score.color as any;

  return (
    <div className={`flex flex-col ${size === "sm" ? "gap-0.5" : "gap-1"}`}>
      <div className="flex items-center gap-2">
        <Badge variant={variant} dot>
          {score.label}
        </Badge>
        <span className={`font-bold tabular-nums ${size === "sm" ? "text-xs" : "text-sm"} text-slate-700`}>
          {score.centsPerMile}¢<span className="font-normal text-slate-500">/mile</span>
        </span>
      </div>

      {showDetails && score.savingsUSD > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 flex-shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-4-6h8" />
          </svg>
          Économie estimée : <strong>{score.savingsUSD}$</strong> ({score.savingsPct}%)
        </div>
      )}

      {showDetails && !score.worthIt && (
        <p className="text-xs text-slate-400">Le cash peut être plus avantageux</p>
      )}
    </div>
  );
}
