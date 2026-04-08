import { useState, useMemo } from "react";
import type { Flight } from "../types.js";

export type SortBy = "price" | "duration" | "departure";

export interface FlightFilters {
  airline: string | null;    // null = toutes
  directOnly: boolean;
  maxStops: number | null;   // null = tous
  sortBy: SortBy;
}

export function useFlightFilters(allFlights: Flight[], initialDirectOnly = false) {
  const [filters, setFilters] = useState<FlightFilters>({
    airline: null,
    directOnly: initialDirectOnly,
    maxStops: null,
    sortBy: "price",
  });

  // Sync directOnly from parent form toggle
  const setDirectOnly = (v: boolean) =>
    setFilters(f => ({ ...f, directOnly: v, maxStops: v ? 0 : f.maxStops }));

  const setAirline = (v: string | null) => setFilters(f => ({ ...f, airline: v }));
  const setMaxStops = (v: number | null) => setFilters(f => ({ ...f, maxStops: v, directOnly: v === 0 }));
  const setSortBy = (v: SortBy) => setFilters(f => ({ ...f, sortBy: v }));
  const reset = () => setFilters({ airline: null, directOnly: false, maxStops: null, sortBy: "price" });

  // Unique airlines from results
  const airlines = useMemo(() => {
    const set = new Set(allFlights.map(f => f.airline).filter(a => a && a !== "—"));
    return Array.from(set).sort();
  }, [allFlights]);

  // Filtered + sorted flights
  const filteredFlights = useMemo(() => {
    let result = [...allFlights];

    if (filters.airline) result = result.filter(f => f.airline === filters.airline);
    if (filters.directOnly) result = result.filter(f => f.direct);
    else if (filters.maxStops !== null) result = result.filter(f => f.stops <= filters.maxStops!);

    result.sort((a, b) => {
      if (filters.sortBy === "duration") return (a.duration ?? 9999) - (b.duration ?? 9999);
      if (filters.sortBy === "departure") return (a.depTime ?? "").localeCompare(b.depTime ?? "");
      return a.price - b.price;
    });

    return result;
  }, [allFlights, filters]);

  const activeFiltersCount = [
    filters.airline !== null,
    filters.directOnly || filters.maxStops !== null,
    filters.sortBy !== "price",
  ].filter(Boolean).length;

  return { filters, filteredFlights, airlines, activeFiltersCount, setDirectOnly, setAirline, setMaxStops, setSortBy, reset };
}
