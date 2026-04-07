export default function Skeleton() {
  return (
    <div className="animate-pulse space-y-2">
      {[1, 2, 3].map(i => (
        <div key={i} className="rounded-xl bg-white/8 animate-pulse h-20" />
      ))}
    </div>
  );
}
