import { useMemo } from "react";
import { PROGRAMS } from "../data/programs.js";
import { getMilesOW } from "../data/charts.js";
import { USD_XOF, USD_EUR } from "../utils/currency.js";

export function useMilesCalculator({ origin, dest, cabin, distMiles, isOneWay, passengers }) {
  return useMemo(() => {
    const pax = passengers || 1;
    return PROGRAMS.map(program => {
      const [ecoOW, busOW] = getMilesOW(program.id, origin, dest, distMiles);
      const milesOW = cabin === 1 ? busOW : ecoOW;
      if (milesOW == null) return { program, result: null };

      const milesPerPax = isOneWay ? milesOW : milesOW * 2;
      const milesUsed = milesPerPax * pax;
      const ppm = program.pricePMile;
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
  }, [origin, dest, cabin, distMiles, isOneWay, passengers]);
}
