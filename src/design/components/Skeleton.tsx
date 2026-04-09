interface SkeletonProps {
  className?: string;
  variant?: "text" | "card" | "circle" | "image";
  lines?: number;
}

function SkeletonBase({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200 rounded-lg ${className}`} />;
}

export default function Skeleton({ variant = "text", lines = 3, className = "" }: SkeletonProps) {
  if (variant === "card") {
    return (
      <div className={`bg-white rounded-2xl border border-slate-100 p-5 space-y-3 ${className}`}>
        <SkeletonBase className="h-4 w-2/3" />
        <SkeletonBase className="h-3 w-full" />
        <SkeletonBase className="h-3 w-4/5" />
        <div className="flex gap-2 pt-1">
          <SkeletonBase className="h-7 w-20 rounded-full" />
          <SkeletonBase className="h-7 w-16 rounded-full" />
        </div>
      </div>
    );
  }
  if (variant === "image") {
    return <SkeletonBase className={`aspect-video rounded-2xl ${className}`} />;
  }
  if (variant === "circle") {
    return <SkeletonBase className={`rounded-full ${className}`} />;
  }
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBase key={i} className={`h-3 ${i === lines - 1 ? "w-3/5" : "w-full"}`} />
      ))}
    </div>
  );
}

export function FlightSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <Skeleton key={i} variant="card" />
      ))}
    </div>
  );
}
