export interface DealScore {
  centsPerMile: number;
  label: string;
  color: "success" | "primary" | "warning" | "danger" | "neutral";
  savingsUSD: number;
  savingsPct: number;
  worthIt: boolean;
  totalMilesCost?: number;
}

export function scoreDeal(params: {
  program: { pricePMile: number; taxUSD: number };
  milesNeeded: number;
  taxesUSD?: number;
  cashPriceUSD: number;
}): DealScore {
  const { program, milesNeeded, cashPriceUSD } = params;
  const taxesUSD = params.taxesUSD ?? program.taxUSD ?? 60;

  if (!cashPriceUSD || cashPriceUSD <= 0 || !milesNeeded || milesNeeded <= 0) {
    return { centsPerMile: 0, label: "N/A", color: "neutral", savingsUSD: 0, savingsPct: 0, worthIt: false };
  }

  const netCashValue = Math.max(0, cashPriceUSD - taxesUSD);
  const centsPerMile = (netCashValue / milesNeeded) * 100;

  let label: string, color: DealScore["color"], worthIt: boolean;
  if (centsPerMile >= 2.5)      { label = "Excellent"; color = "success";  worthIt = true;  }
  else if (centsPerMile >= 1.8) { label = "Très bon";  color = "success";  worthIt = true;  }
  else if (centsPerMile >= 1.2) { label = "Bon";       color = "primary";  worthIt = true;  }
  else if (centsPerMile >= 0.8) { label = "Correct";   color = "warning";  worthIt = false; }
  else                           { label = "Faible";    color = "danger";   worthIt = false; }

  const milesAcquisitionCost = milesNeeded * (program.pricePMile || 0.015);
  const totalMilesCost = milesAcquisitionCost + taxesUSD;
  const savingsUSD = Math.round(cashPriceUSD - totalMilesCost);
  const savingsPct = Math.max(0, Math.round((savingsUSD / cashPriceUSD) * 100));

  return { centsPerMile: Math.round(centsPerMile * 10) / 10, label, color, savingsUSD, savingsPct, worthIt, totalMilesCost: Math.round(totalMilesCost) };
}
