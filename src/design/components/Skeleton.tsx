interface SkeletonProps {
  variant?: "card" | "text" | "circle" | "block";
  className?: string;
  count?: number;
}

export default function Skeleton({ variant = "card", className = "", count = 3 }: SkeletonProps) {
  if (variant === "text")   return <div className={`h-4 rounded-full bg-slate-200 animate-pulse ${className}`} />;
  if (variant === "circle") return <div className={`rounded-full bg-slate-200 animate-pulse ${className}`} />;
  if (variant === "block")  return <div className={`rounded-xl bg-slate-200 animate-pulse h-32 ${className}`} />;
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-slate-100 bg-white p-5 animate-pulse">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 space-y-2">
              <div className="flex gap-2">
                <div className="h-5 w-16 rounded-full bg-slate-200" />
                <div className="h-5 w-24 rounded-full bg-slate-100" />
              </div>
              <div className="h-4 w-32 rounded-full bg-slate-100" />
            </div>
            <div className="space-y-2">
              <div className="h-6 w-20 rounded-lg bg-slate-200" />
              <div className="h-3 w-14 rounded-full bg-slate-100 ml-auto" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
