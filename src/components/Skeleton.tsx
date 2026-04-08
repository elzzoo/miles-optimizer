export default function Skeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map(i => (
        <div key={i} className="rounded-2xl border border-white/8 bg-white/4 p-4 animate-pulse">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 space-y-2">
              <div className="flex gap-2">
                <div className="h-5 w-16 rounded-full bg-white/10" />
                <div className="h-5 w-24 rounded-full bg-white/8" />
              </div>
              <div className="flex gap-2">
                <div className="h-4 w-12 rounded-full bg-white/6" />
                <div className="h-4 w-16 rounded-full bg-white/6" />
              </div>
            </div>
            <div className="text-right space-y-2">
              <div className="h-6 w-20 rounded-lg bg-white/10 ml-auto" />
              <div className="h-3 w-14 rounded-full bg-white/6 ml-auto" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
