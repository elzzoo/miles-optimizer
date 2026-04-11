// Types centraux de Miles Optimizer

export interface ExchangeRates {
  USD_EUR: number;
  USD_XOF: number;
  USD_GBP: number;
  updatedAt: string | null;
  _fallback?: boolean;
}

export interface Flight {
  price: number;
  airline: string;
  direct: boolean;
  stops: number;
  duration: number | undefined;
  depTime: string | undefined;
  source: "google" | "sky" | "duffel";
}

export interface Program {
  id: string;
  name: string;
  short: string;
  emoji: string;
  alliance: string;
  allianceBg: string;
  allianceText: string;
  airlines: string[];
  pricePMile: number;
  taxUSD: number;
  lowTax: boolean;
  notes: string;
  notesEn: string;
  chartType: string;
  bookingUrl: string;
  updatedAt: string;
}

export interface MilesResult {
  milesOW: number;
  milesPerPax: number;
  milesUsed: number;
  ppm: number;
  milesCostUSD: number;
  taxes: number;
  totalUSD: number;
  totalXOF: number;
  totalEUR: number;
}

export interface ProgramWithResult {
  program: Program;
  result: MilesResult | null;
}

export type TripType = "round" | "oneway";
export type Currency = "USD" | "EUR" | "XOF" | "GBP";
export type Cabin = 0 | 1;

export interface SearchState {
  origin: string;
  dest: string;
  tripType: TripType;
  cabin: Cabin;
  passengers: number;
}

export interface CountryInfo {
  name: string;
  capital: string;
  currency: string;
  languages: string[];
  flag: string;
  latlng: [number, number];
}

export interface WeatherData {
  temp: number;
  tempMax: number;
  tempMin: number;
  code: number;
}
