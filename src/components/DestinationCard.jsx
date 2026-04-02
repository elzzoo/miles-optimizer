import { useWeather } from "../hooks/useWeather.js";
import { useCountryInfo } from "../hooks/useCountryInfo.js";

function formatUtcOffset(offset) {
  if (offset == null) return "";
  const sign = offset >= 0 ? "+" : "-";
  return `UTC${sign}${Math.abs(offset)}`;
}

export default function DestinationCard({ airport }) {
  const { weather, loading: wLoading } = useWeather(airport?.lat, airport?.lon);
  const country = useCountryInfo(airport?.iso2);

  if (!airport) return null;  // ← hooks called before, correct

  const hasData = weather || country;
  if (!hasData && !wLoading) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 mb-4">
      {/* Destination header */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base">{airport.flag}</span>
        <span className="text-white font-bold text-sm">{airport.city}</span>
        <span className="text-indigo-400 text-xs">{airport.country}</span>
        <span className="text-indigo-600 text-xs ml-auto">{airport.code}</span>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
        {/* Weather */}
        {wLoading && (
          <span className="text-indigo-500 animate-pulse">⏳ Météo…</span>
        )}
        {weather && (
          <>
            <span className="flex items-center gap-1 text-white">
              <span>{weather.icon}</span>
              <span className="font-bold">{weather.temp}°C</span>
              <span className="text-indigo-300">{weather.label}</span>
            </span>
            <span className="text-indigo-400">💧 {weather.humidity}%</span>
            <span className="text-indigo-400">💨 {weather.wind} km/h</span>
            {weather.utcOffset != null && (
              <span className="text-indigo-400">🕐 {formatUtcOffset(weather.utcOffset)}</span>
            )}
          </>
        )}

        {/* Country info */}
        {country?.capital && (
          <span className="text-indigo-300">🏛 {country.capital}</span>
        )}
        {country?.currency && (
          <span className="text-indigo-300">
            💱 {country.currency.code}{country.currency.symbol ? ` (${country.currency.symbol})` : ""}
          </span>
        )}
      </div>
    </div>
  );
}
