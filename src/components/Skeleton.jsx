export default function Skeleton() {
  return (
    <div className="animate-pulse space-y-2">
      {[1, 2, 3].map(i => (
        <div key={i} className="rounded-xl bg-white bg-opacity-10 h-20" />
      ))}
    </div>
  );
}
