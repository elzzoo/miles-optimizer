import { useMemo } from "react";
import type { ProgramWithResult, ExchangeRates, Cabin } from "../types.js";
import { PROGRAMS } from "../data/programs.js";
import { getMilesOW } from "../data/charts.js";
import { FALLBACK_RATES } from "../utils/currency.js";

interface UseMilesCalculatorParams {
  origin: string;
  dest: string;
  cabin: Cabin;
  distMiles: number | null;
  isOneWay: boolean;
  passengers: number;
  rates: ExchangeRates | null;
  milesOwned: boolean;
}

export function useMilesCalculator({ origin, dest, cabin, distMiles, isOneWay, passengers, rates, milesOwned }: UseMilesCalculatorParams): ProgramWithResult[] {
  return useMemo(() => {
    const pax = passengers || 1;
    const USD_XOF = rates?.USD_XOF || FALLBACK_RATES.USD_XOF;
    const USD_EUR = rates?.USD_EUR || FALLBACK_RATES.USD_EUR;

    return PROGRAMS.map(program => {
      const [ecoOW, busOW] = getMilesOW(program.id, origin, dest, distMiles);
      const milesOW = cabin === 1 ? busOW : ecoOW;
      if (milesOW == null) return { program, result: null };

      const milesPerPax = isOneWay ? milesOW : milesOW * 2;
      const milesUsed = milesPerPax * pax;
      const ppm = milesOwned ? 0 : program.pricePMile;
      const milesCostUSD = milesUsed * ppm;
      const taxes = program.taxUSD * pax;
      const totalUSD = milesCostUSD + taxes;

      return {
        program,
        result: {
          milesOW, milesPerPax, milesUsed, ppm,
          milesCostUSD,
          taxes,
          totalUSD,
          totalXOF: totalUSD * USD_XOF,
          totalEUR: totalUSD * USD_EUR,
        },
      };
    })
    .filter(x => x.result !== null)
    .sort((a, b) => a.result.totalUSD - b.result.totalUSD);
  }, [origin, dest, cabin, distMiles, isOneWay, passengers, rates, milesOwned]);
}
