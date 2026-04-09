/**
 * Deal Scoring Engine
 * Calculates the real value of a miles redemption vs cash price
 */

/**
 * @param {Object} params
 * @param {Object} params.program   - Program object from PROGRAMS list
 * @param {number} params.milesNeeded
 * @param {number} params.taxesUSD
 * @param {number} params.cashPriceUSD
 * @returns {{ centsPerMile, label, color, savingsUSD, savingsPct, worthIt }}
 */
export function scoreDeal({ program, milesNeeded, taxesUSD, cashPriceUSD }) {
  if (!cashPriceUSD || cashPriceUSD <= 0 || !milesNeeded || milesNeeded <= 0) {
    return { centsPerMile: 0, label: "N/A", color: "neutral", savingsUSD: 0, savingsPct: 0, worthIt: false };
  }

  // Net value of redemption = what you'd pay in cash minus the taxes you still pay
  const netCashValue = Math.max(0, cashPriceUSD - taxesUSD);
  // Cents per mile = net cash value / miles used × 100
  const centsPerMile = (netCashValue / milesNeeded) * 100;

  let label, color, worthIt;
  if (centsPerMile >= 2.5)      { label = "Excellent"; color = "success";   worthIt = true;  }
  else if (centsPerMile >= 1.8) { label = "Très bon";  color = "success";   worthIt = true;  }
  else if (centsPerMile >= 1.2) { label = "Bon";       color = "primary";   worthIt = true;  }
  else if (centsPerMile >= 0.8) { label = "Correct";   color = "warning";   worthIt = false; }
  else                           { label = "Faible";    color = "danger";    worthIt = false; }

  // Cost of miles if you had to buy them at pricePMile
  const milesAcquisitionCost = milesNeeded * (program.pricePMile || 0.015);
  const totalMilesCost = milesAcquisitionCost + taxesUSD;
  const savingsUSD = Math.round(cashPriceUSD - totalMilesCost);
  const savingsPct = Math.max(0, Math.round((savingsUSD / cashPriceUSD) * 100));

  return {
    centsPerMile: Math.round(centsPerMile * 10) / 10,
    label,
    color,
    savingsUSD,
    savingsPct,
    worthIt,
    totalMilesCost: Math.round(totalMilesCost),
  };
}

/**
 * Score a list of {program, milesNeeded, taxesUSD} against a cash price
 * Returns sorted by centsPerMile desc
 */
export function scoreAllDeals(programs, cashPriceUSD) {
  return programs
    .map(({ program, milesNeeded, taxesUSD }) => ({
      program,
      milesNeeded,
      taxesUSD,
      score: scoreDeal({ program, milesNeeded, taxesUSD, cashPriceUSD }),
    }))
    .sort((a, b) => b.score.centsPerMile - a.score.centsPerMile);
}
