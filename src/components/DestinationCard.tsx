// @ts-nocheck
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
        {wLoading && (
          <span className="text-indigo-500 animate-pulse flex items-center gap-1">
            <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            {t?.destWeatherLoading || "Loading weather…"}
          </span>
        )}
        {weather && (
          <>
            <span className="flex items-center gap-1 text-white">
              <span>{weather.icon}</span>
              <span className="font-bold">{weather.temp}°C</span>
              <span className="text-indigo-300">{weather.label}</span>
            </span>
            <span className="text-indigo-400 flex items-center gap-0.5">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
              </svg>
              {weather.humidity}%
            </span>
            <span className="text-indigo-400 flex items-center gap-0.5">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 3.03v.568c0 .334.148.65.405.864l1.068.89c.442.369.535 1.01.216 1.49l-.51.766a2.25 2.25 0 0 1-1.161.886l-.143.048a1.107 1.107 0 0 0-.57 1.664c.369.555.169 1.307-.427 1.605L9 13.125l.423 1.059a.956.956 0 0 1-1.652.928l-.679-.906a1.125 1.125 0 0 0-1.906.172L4.5 15.75l-.612.153M12.75 3.031a9 9 0 0 0-8.862 12.872M12.75 3.031a9 9 0 0 1 6.69 14.036m0 0-.177-.529A2.249 2.249 0 0 0 17.128 15H16.5l-.324-.324a1.453 1.453 0 0 0-2.328.377l-.036.073a1.586 1.586 0 0 1-.982.816l-.99.282c-.55.157-.894.702-.8 1.267l.073.438c.08.474.49.821.97.821.846 0 1.598.542 1.865 1.345l.215.643" />
              </svg>
              {weather.wind} km/h
            </span>
            {weather.utcOffset != null && (
              <span className="text-indigo-400 flex items-center gap-0.5">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                {formatUtcOffset(weather.utcOffset)}
              </span>
            )}
          </>
        )}
        {country?.capital && (
          <span className="text-indigo-300 flex items-center gap-0.5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z" />
            </svg>
            {country.capital}
          </span>
        )}
        {country?.currency && (
          <span className="text-indigo-300 flex items-center gap-0.5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            {country.currency.code}{country.currency.symbol ? ` (${country.currency.symbol})` : ""}
          </span>
        )}
      </div>
    </div>
  );
}
