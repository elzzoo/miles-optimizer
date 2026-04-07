const en = {
  // Header
  tagline: "Compare cash vs miles — find the cheapest",

  // Warm-up
  warmupMsg: "Server starting up (15-30s)…",

  // Trip type
  roundTrip: "↔ Round trip",
  oneWay: "→ One way",

  // Form labels
  labelDeparture: "Departure",
  labelDestination: "Destination",
  labelDepart: "Depart",
  labelReturn: "Return",
  labelCabin: "Cabin",
  labelPassengers: "Passengers",
  cabinBusiness: "Business",
  cabinEco: "Economy",
  adultSingular: "adult",
  adultPlural: "adults",

  // Buttons
  btnSearch: "🔍 Search flights",
  btnSearching: "Searching…",
  btnSwap: "Swap origin and destination",
  milesOwnedLabel: "I already have miles",
  milesOwnedOn: "My miles",
  milesOwnedOff: "Buy miles",
  btnCopyLink: "Copy link",
  linkCopied: "Copied! ✅",

  // Results header
  routeSummary: (orig, dest, arrow, dist, km, cabin, type, pax) =>
    [orig, arrow, dest, "·", `${dist} mi · ${km} km`, "·", cabin, "·", type, ...(pax > 1 ? ["·", `${pax} pax`] : [])].join(" "),
  availableFlights: "✈️ Available flights",
  sourceGoogle: "🔵 Google…",
  sourceGoogleDone: "✅ Google",
  sourceGoogleFail: "❌ Google",
  sourceSky: "🔶 Sky…",
  sourceSkyDone: "✅ Sky",
  sourceSkyFail: "❌ Sky",
  selectedNote: "Selected price used for miles comparison ↓",
  partialResults: (src) => `⚠️ ${src} unavailable — partial results`,
  bothFailedTitle: "⚠️ Real-time search unavailable",
  bothFailedSub: "Estimated prices used for comparison. Try again in a few moments.",

  // Cash box
  priceSelected: "💵 Selected price",
  priceBest: "💵 Best price found",
  priceEstimate: "💵 Market estimate",
  priceSourceReal: (type) => `${type} — Google Flights / Skyscanner`,
  priceSourceEst: (type, cabin) => `${type} ${cabin} — indicative price`,
  oneWayLabel: "One way",
  roundTripLabel: "Round trip",
  businessLabel: "Business",
  ecoLabel: "Economy",

  // Recommendation
  bestOptionMiles: "Best option: pay in miles",
  bestOptionCash: "Best option: pay in cash",
  viaProgram: (name) => `Via ${name}`,
  savingsText: (usd, pct) => `savings of ${usd} (${pct}%)`,
  milesPlusTax: (miles, tax) => `${miles} + ${tax} in taxes`,
  costMoreCash: (extra) => `Miles cost ${extra} more than the cash ticket`,

  // Miles programs section
  programsTitle: (n) => `📊 ${n} miles programs — sorted by price`,

  // MilesCard
  cardOneWay: "One way",
  cardRoundTrip: "Round trip",
  cardViaMiles: "via miles",
  cardHide: "▲ hide",
  cardDetails: "▼ details",
  cardMilesNeeded: "Miles required",
  cardPricePerMile: "Price per mile",
  cardMilesCost: "Miles purchase cost",
  cardTaxes: "Fees & taxes",
  cardTotal: "TOTAL",
  cardSavings: (usd, pct) => `Savings of ${usd} (${pct}%) 🎉`,
  cardBook: "Book with miles ↗",

  // Disclaimer
  disclaimer: "Flight prices: Google Flights & Skyscanner in real time. Miles costs: official loyalty program rates. Award seat availability varies — verify on the program's website before buying miles.",

  // Empty state
  emptyStateTitle: "🌍",
  emptyStateMsg: "Enter your route and click",
  emptyStateCta: "Search flights",

  // Footer
  footerRates: (xof, eur) => `1 USD = ${xof} XOF · 1 USD = ${eur} EUR`,
  footerLive: "live rates",
  footerBy: "Miles Optimizer · By Saloum",

  // Language toggle
  langToggle: "FR",

  // Currency selector
  currencyLabel: "Currency",
  currencyUSD: "USD $",
  currencyEUR: "EUR €",
  currencyXOF: "FCFA",
  currencyGBP: "GBP £",

  // AirportPicker
  pickerSearch: "Search airport…",
  pickerNoResult: "No airport found",

  // DestinationCard
  destCapital: "Capital",
  destCurrency: "Currency",
  destWeatherLoading: "Loading weather…",

  // CPP (cents per mile)
  cppLabel: "Mile value",
  cppExcellent: "Excellent (>2¢)",
  cppGood: "Good (1-2¢)",
  cppLow: "Low (<1¢)",
  staleRates: "Rates may be outdated",
};

export default en;
