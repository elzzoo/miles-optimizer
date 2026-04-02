import { useWeather } from "../hooks/useWeather.js";
import { useCountryInfo } from "../hooks/useCountryInfo.js";

function formatUtcOffset(offset) {
  if (offset == null) return "";
  const sign = offset >= 0 ? "+" : "-";
  return `UTC${sign}${Math.abs(offset)}`;
}

export default function DestinationCard({ airport, lang, t }) {
  const { weather, loading: wLoading } = useWeather(airport?.lat, airport?.lon);
  const country = useCountryInfo(airport?.iso2);

  if (!airport) return null;
  const hasData = weather || country;
  if (!hasData && !wLoading) return null;

  const cityDisplay = lang === "en" ? (airport.cityEn || airport.city) : airport.city;
  const countryDisplay = lang === "en" ? (airport.countryEn || airport.country) : airport.country;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 mb-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base">{airport.flag}</span>
        <span className="text-white font-bold text-sm">{cityDisplay}</span>
        <span className="text-indigo-400 text-xs">{countryDisplay}</span>
        <span className="text-indigo-600 text-xs ml-auto">{airport.code}</span>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
        {wLoading && <span className="text-indigo-500 animate-pulse">⏳ {t?.destWeatherLoading || "Loading weather…"}</span>}
        {weather && (
          <>
            <span className="flex items-center gap-1 text-white">
              <span>{weather.icon}</span>
              <span className="font-bold">{weather.temp}°C</span>
              <span className="text-indigo-300">{weather.label}</span>
            </span>
            <span className="text-indigo-400">💧 {weather.humidity}%</span>
            <span className="text-indigo-400">💨 {weather.wind} km/h</span>
            {weather.utcOffset != null && <span className="text-indigo-400">🕐 {formatUtcOffset(weather.utcOffset)}</span>}
          </>
        )}
        {country?.capital && <span className="text-indigo-300">🏛 {country.capital}</span>}
        {country?.currency && (
          <span className="text-indigo-300">
            💱 {country.currency.code}{country.currency.symbol ? ` (${country.currency.symbol})` : ""}
          </span>
        )}
      </div>
    </div>
  );
}
