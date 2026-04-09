import { useState, useEffect } from "react";
import Skeleton from "../../design/components/Skeleton";

interface Destination {
  iata: string;
  name: string;
  country: string;
  photo: string | null;
  continent?: string;
}

interface Props {
  from?: string;
  onSelect?: (iata: string, name: string) => void;
}

export default function DestinationGrid({ from = "DSS", onSelect }: Props) {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/destinations?from=${from}&limit=12`)
      .then(r => r.json())
      .then(d => { setDestinations(d.destinations ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [from]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-[4/3] animate-pulse bg-slate-200 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {destinations.map((d) => (
        <button
          key={d.iata}
          onClick={() => onSelect?.(d.iata, d.name)}
          className="group relative aspect-[4/3] rounded-2xl overflow-hidden text-left focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {/* Image */}
          {d.photo ? (
            <img
              src={d.photo}
              alt={d.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center">
              <span className="text-4xl">✈️</span>
            </div>
          )}

          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <p className="text-white font-semibold text-sm leading-tight">{d.name}</p>
            <p className="text-white/70 text-xs">{d.country}</p>
          </div>

          {/* IATA badge */}
          <div className="absolute top-2.5 right-2.5">
            <span className="bg-black/40 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              {d.iata}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
