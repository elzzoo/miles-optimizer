import { useState, useMemo, useRef, useEffect } from "react";

// ─── EXCHANGE RATES ───────────────────────────────────────────
const USD_XOF = 568;
const USD_EUR = 0.92;
const LAST_UPDATED = "Mars 2026";

// ─── AIRPORTS DATABASE ────────────────────────────────────────
const AIRPORTS = [
  { code: "DSS", city: "Dakar", country: "Sénégal", flag: "🇸🇳", lat: 14.67, lon: -17.07 },
  { code: "ABJ", city: "Abidjan", country: "Côte d'Ivoire", flag: "🇨🇮", lat: 5.26, lon: -3.93 },
  { code: "ACC", city: "Accra", country: "Ghana", flag: "🇬🇭", lat: 5.61, lon: -0.17 },
  { code: "ADD", city: "Addis Abeba", country: "Éthiopie", flag: "🇪🇹", lat: 8.98, lon: 38.80 },
  { code: "AMS", city: "Amsterdam", country: "Pays-Bas", flag: "🇳🇱", lat: 52.31, lon: 4.77 },
  { code: "BKK", city: "Bangkok", country: "Thaïlande", flag: "🇹🇭", lat: 13.69, lon: 100.75 },
  { code: "BKO", city: "Bamako", country: "Mali", flag: "🇲🇱", lat: 12.54, lon: -7.95 },
  { code: "BOG", city: "Bogotá", country: "Colombie", flag: "🇨🇴", lat: 4.70, lon: -74.15 },
  { code: "CAI", city: "Le Caire", country: "Égypte", flag: "🇪🇬", lat: 30.12, lon: 31.41 },
  { code: "CDG", city: "Paris", country: "France", flag: "🇫🇷", lat: 49.01, lon: 2.55 },
  { code: "CMN", city: "Casablanca", country: "Maroc", flag: "🇲🇦", lat: 33.37, lon: -7.59 },
  { code: "COO", city: "Cotonou", country: "Bénin", flag: "🇧🇯", lat: 6.36, lon: 2.38 },
  { code: "CPT", city: "Le Cap", country: "Afrique du Sud", flag: "🇿🇦", lat: -33.96, lon: 18.60 },
  { code: "DEL", city: "New Delhi", country: "Inde", flag: "🇮🇳", lat: 28.56, lon: 77.10 },
  { code: "DOH", city: "Doha", country: "Qatar", flag: "🇶🇦", lat: 25.27, lon: 51.61 },
  { code: "DXB", city: "Dubaï", country: "EAU", flag: "🇦🇪", lat: 25.25, lon: 55.37 },
  { code: "EZE", city: "Buenos Aires", country: "Argentine", flag: "🇦🇷", lat: -34.82, lon: -58.54 },
  { code: "FCO", city: "Rome", country: "Italie", flag: "🇮🇹", lat: 41.80, lon: 12.25 },
  { code: "FRA", city: "Francfort", country: "Allemagne", flag: "🇩🇪", lat: 50.03, lon: 8.57 },
  { code: "GRU", city: "São Paulo", country: "Brésil", flag: "🇧🇷", lat: -23.43, lon: -46.47 },
  { code: "HKG", city: "Hong Kong", country: "Hong Kong", flag: "🇭🇰", lat: 22.31, lon: 113.91 },
  { code: "ICN", city: "Séoul", country: "Corée du Sud", flag: "🇰🇷", lat: 37.46, lon: 126.44 },
  { code: "IST", city: "Istanbul", country: "Turquie", flag: "🇹🇷", lat: 41.00, lon: 28.97 },
  { code: "JFK", city: "New York", country: "USA", flag: "🇺🇸", lat: 40.64, lon: -73.78 },
  { code: "JNB", city: "Johannesburg", country: "Afrique du Sud", flag: "🇿🇦", lat: -26.14, lon: 28.24 },
  { code: "KUL", city: "Kuala Lumpur", country: "Malaisie", flag: "🇲🇾", lat: 2.74, lon: 101.70 },
  { code: "LAX", city: "Los Angeles", country: "USA", flag: "🇺🇸", lat: 33.94, lon: -118.41 },
  { code: "LHR", city: "Londres", country: "Royaume-Uni", flag: "🇬🇧", lat: 51.48, lon: -0.45 },
  { code: "LIM", city: "Lima", country: "Pérou", flag: "🇵🇪", lat: -12.02, lon: -77.11 },
  { code: "LIS", city: "Lisbonne", country: "Portugal", flag: "🇵🇹", lat: 38.77, lon: -9.13 },
  { code: "LOS", city: "Lagos", country: "Nigeria", flag: "🇳🇬", lat: 6.58, lon: 3.32 },
  { code: "MAD", city: "Madrid", country: "Espagne", flag: "🇪🇸", lat: 40.47, lon: -3.57 },
  { code: "MIA", city: "Miami", country: "USA", flag: "🇺🇸", lat: 25.80, lon: -80.29 },
  { code: "MUC", city: "Munich", country: "Allemagne", flag: "🇩🇪", lat: 48.35, lon: 11.79 },
  { code: "NBO", city: "Nairobi", country: "Kenya", flag: "🇰🇪", lat: -1.32, lon: 36.93 },
  { code: "NRT", city: "Tokyo", country: "Japon", flag: "🇯🇵", lat: 35.77, lon: 140.39 },
  { code: "ORD", city: "Chicago", country: "USA", flag: "🇺🇸", lat: 41.98, lon: -87.91 },
  { code: "OUA", city: "Ouagadougou", country: "Burkina Faso", flag: "🇧🇫", lat: 12.35, lon: -1.51 },
  { code: "PEK", city: "Pékin", country: "Chine", flag: "🇨🇳", lat: 40.08, lon: 116.58 },
  { code: "SIN", city: "Singapour", country: "Singapour", flag: "🇸🇬", lat: 1.36, lon: 103.99 },
  { code: "SYD", city: "Sydney", country: "Australie", flag: "🇦🇺", lat: -33.94, lon: 151.18 },
  { code: "YUL", city: "Montréal", country: "Canada", flag: "🇨🇦", lat: 45.47, lon: -73.74 },
  { code: "YYZ", city: "Toronto", country: "Canada", flag: "🇨🇦", lat: 43.68, lon: -79.63 },
  { code: "ZRH", city: "Zurich", country: "Suisse", flag: "🇨🇭", lat: 47.46, lon: 8.55 },
];

// ─── REGION MAPPING ───────────────────────────────────────────
const REGION = {
  DSS:"africa", ABJ:"africa", ACC:"africa", ADD:"africa", BKO:"africa",
  COO:"africa", CPT:"africa", JNB:"africa", LOS:"africa", NBO:"africa",
  OUA:"africa", CAI:"africa",
  CMN:"europe", // Casablanca often grouped with Europe in award charts
  AMS:"europe", CDG:"europe", FCO:"europe", FRA:"europe", IST:"europe",
  LHR:"europe", LIS:"europe", MAD:"europe", MUC:"europe", ZRH:"europe",
  DOH:"middle-east", DXB:"middle-east", DEL:"middle-east",
  BOG:"americas", EZE:"americas", GRU:"americas", JFK:"americas",
  LAX:"americas", LIM:"americas", MIA:"americas", ORD:"americas",
  YUL:"americas", YYZ:"americas",
  BKK:"asia", HKG:"asia", ICN:"asia", KUL:"asia", NRT:"asia",
  PEK:"asia", SIN:"asia",
  SYD:"oceania",
};

// ─── PROGRAMS ─────────────────────────────────────────────────
const PROGRAMS = [
  {
    id: "aeroplan",
    name: "Air Canada Aeroplan",
    short: "Aeroplan",
    emoji: "🍁",
    alliance: "Star Alliance",
    allianceBg: "bg-blue-100",
    allianceText: "text-blue-800",
    promoStatus: "active",        // active | expiring | expired | none
    promoLabel: "30% REMISE",
    promoExpiry: "2026-05-13",
    promoPrice: 0.0175,
    stdPrice: 0.025,
    taxUSD: 10,
    lowTax: true,
    notes: "Taxes quasi nulles (~10$) sur Turkish. Idéal pour réserver le vol direct DSS–IST.",
    route: "Turkish direct DSS–IST",
    chartType: "distance",
  },
  {
    id: "lifemiles",
    name: "Avianca LifeMiles",
    short: "LifeMiles",
    emoji: "🌿",
    alliance: "Star Alliance",
    allianceBg: "bg-blue-100",
    allianceText: "text-blue-800",
    promoStatus: "expired",
    promoLabel: "PROMO EXPIRÉE",
    promoExpiry: null,
    promoPrice: 0.033,
    stdPrice: 0.033,
    lastPromoPrice: 0.0127,
    lastPromoBonus: 160,
    nextExpected: "~Avril 2026",
    taxUSD: 60,
    lowTax: true,
    notes: "Meilleur taux si promo active (160%). Promos toutes les 4–6 semaines environ.",
    route: "Turkish direct DSS–IST",
    chartType: "zone",
  },
  {
    id: "flyingblue",
    name: "Flying Blue (Air France)",
    short: "Flying Blue",
    emoji: "✈️",
    alliance: "SkyTeam",
    allianceBg: "bg-sky-100",
    allianceText: "text-sky-800",
    promoStatus: "active",
    promoLabel: "BONUS 80%",
    promoExpiry: "2026-04-16",
    promoPrice: 0.0169,
    stdPrice: 0.028,
    taxUSD: 400,
    lowTax: false,
    notes: "Prix dynamique (variable). Taxes élevées (~400$) sur Air France business. Via Paris CDG.",
    route: "Air France DSS–CDG–IST",
    chartType: "zone",
  },
  {
    id: "united",
    name: "United MileagePlus",
    short: "United",
    emoji: "🌐",
    alliance: "Star Alliance",
    allianceBg: "bg-blue-100",
    allianceText: "text-blue-800",
    promoStatus: "expiring",
    promoLabel: "⚠️ EXPIRE DEMAIN",
    promoExpiry: "2026-03-30",
    promoPrice: 0.0188,
    stdPrice: 0.035,
    taxUSD: 50,
    lowTax: true,
    notes: "Promo expire DEMAIN. Agis vite si tu veux ce tarif.",
    route: "Turkish direct DSS–IST",
    chartType: "zone",
  },
  {
    id: "turkish",
    name: "Turkish Miles&Smiles",
    short: "Miles&Smiles",
    emoji: "🌙",
    alliance: "Star Alliance",
    allianceBg: "bg-blue-100",
    allianceText: "text-blue-800",
    promoStatus: "none",
    promoLabel: "SANS PROMO",
    promoExpiry: null,
    promoPrice: 0.03,
    stdPrice: 0.03,
    taxUSD: 217,
    lowTax: false,
    notes: "Programme propre Turkish. Attendre une promo (~100% bonus) pour réduire le coût.",
    route: "Turkish direct DSS–IST",
    chartType: "zone",
  },
  {
    id: "qatar",
    name: "Qatar Avios",
    short: "Qatar Avios",
    emoji: "🇶🇦",
    alliance: "OneWorld",
    allianceBg: "bg-red-100",
    allianceText: "text-red-800",
    promoStatus: "expired",
    promoLabel: "PROMO EXPIRÉE",
    promoExpiry: null,
    promoPrice: 0.023,
    stdPrice: 0.023,
    lastPromoPrice: 0.0153,
    lastPromoBonus: 50,
    nextExpected: "~Fin mai 2026",
    taxUSD: 80,
    lowTax: true,
    notes: "Excellent si promo active. Vol Qatar DSS–DOH–IST (1 escale à Doha).",
    route: "Qatar Airways DSS–DOH–IST",
    chartType: "zone",
  },
];

// ─── AWARD CHARTS ─────────────────────────────────────────────
// Miles one-way: [economy, business]
const ZONE_CHARTS = {
  lifemiles: {
    africa: {
      africa:[5000,10000], europe:[25000,63000], "middle-east":[20000,55000],
      americas:[35000,80000], asia:[40000,90000], oceania:[50000,110000],
    },
    europe: {
      africa:[25000,63000], europe:[10000,25000], "middle-east":[15000,40000],
      americas:[30000,70000], asia:[35000,90000], oceania:[45000,110000],
    },
    "middle-east": {
      africa:[20000,55000], europe:[15000,40000], "middle-east":[8000,20000],
      americas:[30000,65000], asia:[25000,60000], oceania:[40000,100000],
    },
    americas: {
      africa:[35000,80000], europe:[30000,70000], "middle-east":[30000,65000],
      americas:[8000,20000], asia:[40000,90000], oceania:[45000,110000],
    },
    asia: {
      africa:[40000,90000], europe:[35000,90000], "middle-east":[25000,60000],
      americas:[40000,90000], asia:[8000,20000], oceania:[15000,40000],
    },
    oceania: {
      africa:[50000,110000], europe:[45000,110000], "middle-east":[40000,100000],
      americas:[45000,110000], asia:[15000,40000], oceania:[8000,20000],
    },
  },
  flyingblue: {
    africa: {
      africa:[15000,35000], europe:[30000,70000], "middle-east":[25000,60000],
      americas:[40000,80000], asia:[45000,90000], oceania:[55000,110000],
    },
    europe: {
      africa:[30000,70000], europe:[8000,20000], "middle-east":[15000,35000],
      americas:[30000,60000], asia:[35000,80000], oceania:[45000,100000],
    },
    "middle-east": {
      africa:[25000,60000], europe:[15000,35000], "middle-east":[8000,18000],
      americas:[30000,65000], asia:[25000,60000], oceania:[40000,95000],
    },
    americas: {
      africa:[40000,80000], europe:[30000,60000], "middle-east":[30000,65000],
      americas:[8000,20000], asia:[40000,85000], oceania:[50000,110000],
    },
    asia: {
      africa:[45000,90000], europe:[35000,80000], "middle-east":[25000,60000],
      americas:[40000,85000], asia:[8000,20000], oceania:[18000,45000],
    },
    oceania: {
      africa:[55000,110000], europe:[45000,100000], "middle-east":[40000,95000],
      americas:[50000,110000], asia:[18000,45000], oceania:[8000,20000],
    },
  },
  united: {
    africa: {
      africa:[15000,35000], europe:[30000,88000], "middle-east":[25000,70000],
      americas:[30000,80000], asia:[35000,100000], oceania:[45000,120000],
    },
    europe: {
      africa:[30000,88000], europe:[10000,30000], "middle-east":[15000,45000],
      americas:[30000,70000], asia:[35000,90000], oceania:[45000,115000],
    },
    "middle-east": {
      africa:[25000,70000], europe:[15000,45000], "middle-east":[8000,20000],
      americas:[30000,70000], asia:[25000,65000], oceania:[40000,100000],
    },
    americas: {
      africa:[30000,80000], europe:[30000,70000], "middle-east":[30000,70000],
      americas:[8000,20000], asia:[35000,90000], oceania:[40000,110000],
    },
    asia: {
      africa:[35000,100000], europe:[35000,90000], "middle-east":[25000,65000],
      americas:[35000,90000], asia:[10000,25000], oceania:[15000,40000],
    },
    oceania: {
      africa:[45000,120000], europe:[45000,115000], "middle-east":[40000,100000],
      americas:[40000,110000], asia:[15000,40000], oceania:[10000,25000],
    },
  },
  turkish: {
    africa: {
      africa:[8000,15000], europe:[30000,65000], "middle-east":[25000,50000],
      americas:[45000,90000], asia:[42500,85000], oceania:[55000,110000],
    },
    europe: {
      africa:[30000,65000], europe:[12500,30000], "middle-east":[15000,35000],
      americas:[35000,80000], asia:[37500,80000], oceania:[50000,105000],
    },
    "middle-east": {
      africa:[25000,50000], europe:[15000,35000], "middle-east":[8000,18000],
      americas:[37500,80000], asia:[30000,65000], oceania:[45000,95000],
    },
    americas: {
      africa:[45000,90000], europe:[35000,80000], "middle-east":[37500,80000],
      americas:[12500,27500], asia:[42500,90000], oceania:[55000,110000],
    },
    asia: {
      africa:[42500,85000], europe:[37500,80000], "middle-east":[30000,65000],
      americas:[42500,90000], asia:[15000,32500], oceania:[35000,70000],
    },
    oceania: {
      africa:[55000,110000], europe:[50000,105000], "middle-east":[45000,95000],
      americas:[55000,110000], asia:[35000,70000], oceania:[15000,35000],
    },
  },
  qatar: {
    africa: {
      africa:[10000,25000], europe:[22000,55000], "middle-east":[18000,45000],
      americas:[35000,80000], asia:[30000,70000], oceania:[45000,100000],
    },
    europe: {
      africa:[22000,55000], europe:[8000,20000], "middle-east":[12000,30000],
      americas:[30000,65000], asia:[35000,75000], oceania:[45000,100000],
    },
    "middle-east": {
      africa:[18000,45000], europe:[12000,30000], "middle-east":[5000,12000],
      americas:[30000,65000], asia:[20000,50000], oceania:[35000,90000],
    },
    americas: {
      africa:[35000,80000], europe:[30000,65000], "middle-east":[30000,65000],
      americas:[10000,25000], asia:[35000,80000], oceania:[45000,105000],
    },
    asia: {
      africa:[30000,70000], europe:[35000,75000], "middle-east":[20000,50000],
      americas:[35000,80000], asia:[8000,20000], oceania:[15000,35000],
    },
    oceania: {
      africa:[45000,100000], europe:[45000,100000], "middle-east":[35000,90000],
      americas:[45000,105000], asia:[15000,35000], oceania:[8000,20000],
    },
  },
};

// Aeroplan distance bands [maxMiles, economy, business]
const AEROPLAN_BANDS = [
  [500,   6000,  17500],
  [1500,  15000, 37500],
  [2500,  20000, 55000],
  [4000,  30000, 70000],
  [6000,  40000, 85000],
  [9000,  50000, 100000],
  [Infinity, 65000, 115000],
];

// Cash price estimates A/R [economy, business] based on distance
function estimateCash(distMiles) {
  if (distMiles < 800)  return [300,  900];
  if (distMiles < 2000) return [500,  1500];
  if (distMiles < 4000) return [800,  2500];
  if (distMiles < 7000) return [1200, 3500];
  return [1600, 5000];
}

// ─── HELPERS ──────────────────────────────────────────────────
function haversine(lat1, lon1, lat2, lon2) {
  const R = 3959;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function getMilesOW(programId, originCode, destCode, distMiles) {
  if (programId === "aeroplan") {
    for (const [max, eco, bus] of AEROPLAN_BANDS) {
      if (distMiles <= max) return [eco, bus];
    }
  }
  const oReg = REGION[originCode] || "africa";
  const dReg = REGION[destCode] || "europe";
  const chart = ZONE_CHARTS[programId];
  if (!chart || !chart[oReg] || !chart[oReg][dReg]) return [null, null];
  return chart[oReg][dReg];
}

function calcResult(program, milesOW, cabin) {
  if (milesOW === null) return null;
  const milesRT = milesOW * 2;
  const usePromo = program.promoStatus === "active" || program.promoStatus === "expiring";
  const ppm = usePromo ? program.promoPrice : program.stdPrice;
  const milesCostUSD = milesRT * ppm;
  const taxes = program.taxUSD;
  const totalUSD = milesCostUSD + taxes;
  return {
    milesOW, milesRT, ppm, milesCostUSD, taxes,
    totalUSD,
    totalEUR: totalUSD * USD_EUR,
    totalXOF: totalUSD * USD_XOF,
  };
}

function daysLeft(expiry) {
  if (!expiry) return null;
  const now = new Date("2026-03-29");
  const exp = new Date(expiry);
  return Math.max(0, Math.ceil((exp - now) / 86400000));
}

const fmt = {
  xof: (n) => n == null ? "—" : new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " FCFA",
  usd: (n) => n == null ? "—" : "$" + new Intl.NumberFormat("en-US").format(Math.round(n)),
  eur: (n) => n == null ? "—" : "€" + new Intl.NumberFormat("fr-FR").format(Math.round(n)),
  miles: (n) => n == null ? "—" : new Intl.NumberFormat("fr-FR").format(n) + " miles",
  pct: (n) => n + "%",
};

// ─── AIRPORT SEARCH COMPONENT ─────────────────────────────────
function AirportPicker({ label, value, onChange, exclude }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef(null);

  const selected = AIRPORTS.find((a) => a.code === value);
  const filtered = useMemo(() => {
    const lq = q.toLowerCase();
    return AIRPORTS.filter(
      (a) =>
        a.code !== exclude &&
        (a.code.toLowerCase().includes(lq) ||
          a.city.toLowerCase().includes(lq) ||
          a.country.toLowerCase().includes(lq))
    ).slice(0, 9);
  }, [q, exclude]);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative flex-1" ref={ref}>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">{label}</p>
      <div
        className={`flex items-center gap-3 p-3 rounded-2xl border-2 cursor-pointer transition-all ${
          open ? "border-indigo-500 bg-indigo-50" : "border-gray-100 bg-gray-50 hover:border-gray-300"
        }`}
        onClick={() => { setOpen(!open); setQ(""); }}
      >
        {selected ? (
          <>
            <span className="text-2xl leading-none">{selected.flag}</span>
            <div className="min-w-0">
              <div className="font-black text-gray-900 text-lg leading-none">{selected.code}</div>
              <div className="text-xs text-gray-400 truncate">{selected.city}, {selected.country}</div>
            </div>
          </>
        ) : (
          <span className="text-gray-400 text-sm">Sélectionner...</span>
        )}
      </div>

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <input
              autoFocus
              className="w-full px-3 py-2 rounded-xl bg-gray-50 text-sm outline-none border border-gray-200 focus:border-indigo-400"
              placeholder="Ville, pays ou code IATA..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="max-h-56 overflow-y-auto">
            {filtered.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-4">Aucun résultat</p>
            )}
            {filtered.map((a) => (
              <div
                key={a.code}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-indigo-50 cursor-pointer transition-colors"
                onClick={() => { onChange(a.code); setOpen(false); }}
              >
                <span className="text-xl">{a.flag}</span>
                <div>
                  <span className="font-bold text-sm text-gray-900">{a.code}</span>
                  <span className="text-gray-400 text-sm"> — {a.city}, {a.country}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PROMO BADGE ──────────────────────────────────────────────
function PromoBadge({ status, label, expiry }) {
  const days = daysLeft(expiry);
  if (status === "active") {
    return (
      <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 font-bold text-xs px-2.5 py-1 rounded-full">
        ✅ {label}{days !== null && ` · ${days}j`}
      </span>
    );
  }
  if (status === "expiring") {
    return (
      <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 font-bold text-xs px-2.5 py-1 rounded-full">
        ⚠️ {label}
      </span>
    );
  }
  if (status === "expired") {
    return (
      <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-400 font-medium text-xs px-2.5 py-1 rounded-full">
        ❌ {label}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center bg-gray-100 text-gray-400 font-medium text-xs px-2.5 py-1 rounded-full">
      — {label}
    </span>
  );
}

// ─── RESULT CARD ──────────────────────────────────────────────
function ResultCard({ program, result, rank, cabin }) {
  const [expanded, setExpanded] = useState(rank === 0);

  const rankStyle = {
    0: { border: "border-yellow-400", bg: "bg-yellow-50", bar: "from-yellow-400 to-amber-300", badge: "🥇" },
    1: { border: "border-gray-300",   bg: "bg-white",     bar: "from-gray-300 to-gray-200",   badge: "🥈" },
    2: { border: "border-orange-300", bg: "bg-white",     bar: "from-orange-300 to-orange-200",badge: "🥉" },
  };
  const style = rankStyle[rank] || { border: "border-gray-100", bg: "bg-white", bar: "", badge: "" };

  const hasResult = result !== null;

  return (
    <div className={`rounded-2xl border-2 ${style.border} ${style.bg} shadow-sm overflow-hidden transition-all`}>
      {rank < 3 && <div className={`h-1 bg-gradient-to-r ${style.bar}`} />}
      <div className="p-4">
        {/* Header row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {style.badge && (
              <span className="text-2xl">{style.badge}</span>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">{program.emoji}</span>
                <span className="font-black text-gray-900 text-base">{program.short}</span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${program.allianceBg} ${program.allianceText}`}>
                  {program.alliance}
                </span>
                <span className="text-gray-300">·</span>
                <span className="text-xs text-gray-400">{program.route}</span>
              </div>
            </div>
          </div>
          <PromoBadge status={program.promoStatus} label={program.promoLabel} expiry={program.promoExpiry} />
        </div>

        {/* Price highlight */}
        {hasResult ? (
          <div
            className={`rounded-xl p-3 mb-3 cursor-pointer ${rank === 0 ? "bg-yellow-100" : "bg-gray-50"}`}
            onClick={() => setExpanded(!expanded)}
          >
            <div className="flex items-end justify-between">
              <div>
                <div className="text-xs text-gray-500 mb-0.5">A/R {cabin === 1 ? "Business" : "Économie"} estimé</div>
                <div className="text-2xl font-black text-gray-900">{fmt.xof(result.totalXOF)}</div>
                <div className="text-sm text-gray-500">{fmt.usd(result.totalUSD)} · {fmt.eur(result.totalEUR)}</div>
              </div>
              <div className="text-xs text-gray-400">{expanded ? "▲" : "▼"} détails</div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-xl p-3 mb-3 text-center text-gray-400 text-sm">
            Route non disponible via ce programme
          </div>
        )}

        {/* Expanded details */}
        {expanded && hasResult && (
          <div className="space-y-2 text-sm mb-3">
            <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
              <span className="text-gray-500">Miles nécessaires (A/R)</span>
              <span className="font-bold">{fmt.miles(result.milesRT)}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
              <span className="text-gray-500">Prix par mile</span>
              <span className={`font-bold ${program.promoStatus === "active" || program.promoStatus === "expiring" ? "text-emerald-600" : "text-gray-800"}`}>
                ${result.ppm.toFixed(4)}
                {(program.promoStatus === "active" || program.promoStatus === "expiring") && " 🔥"}
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
              <span className="text-gray-500">Achat des miles</span>
              <span className="font-bold">{fmt.usd(result.milesCostUSD)}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
              <span className="text-gray-500">Taxes & frais</span>
              <span className={`font-bold ${program.lowTax ? "text-emerald-600" : "text-red-500"}`}>
                ~{fmt.usd(result.taxes)} {program.lowTax ? "✅" : "⚠️"}
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5 bg-gray-50 rounded-lg px-2 -mx-1">
              <span className="font-bold text-gray-700">TOTAL</span>
              <div className="text-right">
                <div className="font-black text-gray-900">{fmt.usd(result.totalUSD)}</div>
                <div className="text-xs text-gray-400">{fmt.xof(result.totalXOF)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        <p className="text-xs text-gray-400 italic mb-2">{program.notes}</p>

        {/* Next promo hint for expired */}
        {program.promoStatus === "expired" && program.lastPromoPrice && hasResult && (
          <div className="bg-amber-50 rounded-lg px-3 py-2 text-xs text-amber-700 border border-amber-200">
            💡 <strong>Prochaine promo attendue: {program.nextExpected}</strong> — Coût estimé avec promo:{" "}
            <strong>{fmt.xof(result.milesRT * program.lastPromoPrice * USD_XOF)}</strong>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────
export default function App() {
  const [origin, setOrigin] = useState("DSS");
  const [dest, setDest] = useState("IST");
  const [depDate, setDepDate] = useState("2026-05-01");
  const [retDate, setRetDate] = useState("2026-05-10");
  const [cabin, setCabin] = useState(1); // 0=eco 1=business
  const [searched, setSearched] = useState(false);

  const origA = AIRPORTS.find((a) => a.code === origin);
  const destA = AIRPORTS.find((a) => a.code === dest);

  const distMiles = useMemo(() => {
    if (!origA || !destA) return 0;
    return haversine(origA.lat, origA.lon, destA.lat, destA.lon);
  }, [origA, destA]);

  const results = useMemo(() => {
    if (!origin || !dest || origin === dest) return [];
    return PROGRAMS.map((program) => {
      const [ecoOW, busOW] = getMilesOW(program.id, origin, dest, distMiles);
      const milesOW = cabin === 1 ? busOW : ecoOW;
      const result = milesOW != null ? calcResult(program, milesOW, cabin) : null;
      return { program, result };
    }).sort((a, b) => {
      if (!a.result) return 1;
      if (!b.result) return -1;
      return a.result.totalXOF - b.result.totalXOF;
    });
  }, [origin, dest, cabin, distMiles]);

  const [cashEco, cashBus] = useMemo(() => estimateCash(distMiles), [distMiles]);
  const cashUSD = cabin === 1 ? cashBus : cashEco;

  const activePromos = PROGRAMS.filter(
    (p) => p.promoStatus === "active" || p.promoStatus === "expiring"
  );

  const handleSearch = () => {
    if (origin && dest && origin !== dest) setSearched(true);
  };

  return (
    <div
      className="min-h-screen p-4 pb-10"
      style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)" }}
    >
      <div className="max-w-lg mx-auto">

        {/* ── HEADER ── */}
        <div className="text-center py-6">
          <div className="text-5xl mb-3">🧳</div>
          <h1 className="text-3xl font-black text-white tracking-tight">Miles Optimizer</h1>
          <p className="text-blue-300 text-sm mt-1">
            Trouvez le meilleur prix en Business ou Économie grâce aux miles
          </p>
        </div>

        {/* ── ACTIVE PROMOS BANNER ── */}
        {activePromos.length > 0 && (
          <div className="rounded-2xl border border-yellow-500 border-opacity-40 bg-yellow-500 bg-opacity-10 p-3 mb-4">
            <p className="text-yellow-300 text-xs font-bold uppercase tracking-widest mb-2">
              🔥 Promos actives maintenant
            </p>
            <div className="flex flex-wrap gap-2">
              {activePromos.map((p) => {
                const days = daysLeft(p.promoExpiry);
                return (
                  <div
                    key={p.id}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-full ${
                      p.promoStatus === "expiring"
                        ? "bg-orange-500 text-white"
                        : "bg-emerald-500 bg-opacity-20 text-emerald-300 border border-emerald-500 border-opacity-30"
                    }`}
                  >
                    <span>{p.emoji}</span>
                    <span>{p.short}</span>
                    <span className="opacity-80">— {p.promoLabel}</span>
                    {days !== null && (
                      <span className="bg-black bg-opacity-20 rounded-full px-1.5">{days}j</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── SEARCH FORM ── */}
        <div className="bg-white rounded-3xl shadow-2xl p-5 mb-5">

          {/* Origin / Destination */}
          <div className="flex items-end gap-2 mb-4">
            <AirportPicker label="Départ" value={origin} onChange={setOrigin} exclude={dest} />
            <button
              onClick={() => { setOrigin(dest); setDest(origin); setSearched(false); }}
              className="mb-1 w-10 h-10 rounded-full bg-gray-100 hover:bg-indigo-100 text-gray-500 flex items-center justify-center text-lg transition-colors flex-shrink-0"
              title="Inverser"
            >
              ⇄
            </button>
            <AirportPicker label="Destination" value={dest} onChange={setDest} exclude={origin} />
          </div>

          {/* Dates */}
          <div className="flex gap-3 mb-4">
            <div className="flex-1">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Aller</p>
              <input
                type="date"
                value={depDate}
                onChange={(e) => setDepDate(e.target.value)}
                className="w-full p-2.5 rounded-xl border-2 border-gray-100 bg-gray-50 text-sm focus:border-indigo-400 outline-none"
              />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Retour</p>
              <input
                type="date"
                value={retDate}
                onChange={(e) => setRetDate(e.target.value)}
                className="w-full p-2.5 rounded-xl border-2 border-gray-100 bg-gray-50 text-sm focus:border-indigo-400 outline-none"
              />
            </div>
          </div>

          {/* Cabin */}
          <div className="mb-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Classe</p>
            <div className="flex gap-2">
              {[{ val: 1, icon: "💼", label: "Business" }, { val: 0, icon: "🪑", label: "Économie" }].map(({ val, icon, label }) => (
                <button
                  key={val}
                  onClick={() => { setCabin(val); setSearched(false); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all ${
                    cabin === val
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  <span>{icon}</span> {label}
                </button>
              ))}
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={handleSearch}
            disabled={!origin || !dest || origin === dest}
            className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-base transition-all shadow-lg shadow-indigo-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            🔍 Comparer les programmes
          </button>
        </div>

        {/* ── RESULTS ── */}
        {searched && origA && destA && origin !== dest && (
          <>
            {/* Route info */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="flex items-center gap-2 bg-white bg-opacity-10 backdrop-blur-sm border border-white border-opacity-20 rounded-full px-4 py-2 text-white text-sm">
                <span>{origA.flag} {origin}</span>
                <span className="text-indigo-300">→</span>
                <span>{destA.flag} {dest}</span>
                <span className="text-indigo-400 mx-1">·</span>
                <span className="text-indigo-200">{distMiles.toLocaleString()} mi</span>
                <span className="text-indigo-400 mx-1">·</span>
                <span className="text-indigo-200">{cabin === 1 ? "Business" : "Économie"}</span>
              </div>
            </div>

            {/* Cash comparison bar */}
            <div className="flex items-center justify-between bg-white bg-opacity-10 border border-white border-opacity-20 rounded-2xl px-4 py-3 mb-4">
              <div>
                <p className="text-white font-bold text-sm">💵 Billet cash marché (estimation)</p>
                <p className="text-indigo-300 text-xs">A/R {cabin === 1 ? "Business" : "Économie"} — prix indicatif</p>
              </div>
              <div className="text-right">
                <div className="text-white font-black text-lg">{fmt.xof(cashUSD * USD_XOF)}</div>
                <div className="text-indigo-300 text-xs">{fmt.usd(cashUSD)} · {fmt.eur(cashUSD * USD_EUR)}</div>
              </div>
            </div>

            {/* Savings potential */}
            {results[0]?.result && (
              <div className="bg-emerald-500 bg-opacity-20 border border-emerald-400 border-opacity-30 rounded-2xl px-4 py-3 mb-4 flex items-center gap-3">
                <span className="text-2xl">💰</span>
                <div>
                  <p className="text-emerald-300 font-bold text-sm">Économie potentielle avec les miles</p>
                  <p className="text-white font-black">
                    {fmt.xof((cashUSD - results[0].result.totalUSD) * USD_XOF)}{" "}
                    <span className="text-emerald-300 font-normal text-sm">
                      vs billet cash (
                      {Math.round(((cashUSD - results[0].result.totalUSD) / cashUSD) * 100)}% d'économie)
                    </span>
                  </p>
                </div>
              </div>
            )}

            {/* Program cards */}
            <p className="text-indigo-300 text-xs font-bold uppercase tracking-widest mb-3">
              📊 {results.length} programmes comparés — classés par prix croissant
            </p>

            <div className="space-y-3">
              {results.map(({ program, result }, i) => (
                <ResultCard
                  key={program.id}
                  program={program}
                  result={result}
                  rank={i}
                  cabin={cabin}
                />
              ))}
            </div>

            {/* Disclaimer */}
            <div className="mt-5 rounded-2xl bg-white bg-opacity-5 border border-white border-opacity-10 p-4 text-indigo-300 text-xs leading-relaxed">
              <p className="font-bold mb-1">⚠️ Informations importantes</p>
              <p>
                Ces estimations sont basées sur les barèmes de <strong>mars 2026</strong> et les promos
                connues à cette date. Les prix des miles et la disponibilité des sièges primes
                changent en permanence. Vérifiez toujours le prix exact et la disponibilité sur
                le site officiel du programme avant d'acheter des miles.
              </p>
            </div>
          </>
        )}

        {/* ── FOOTER ── */}
        <div className="text-center mt-6 text-indigo-500 text-xs space-y-0.5">
          <p>Données actualisées: {LAST_UPDATED}</p>
          <p>1 USD = {USD_XOF} FCFA · 1 USD = {USD_EUR}€</p>
          <p className="mt-1 text-indigo-600">Miles Optimizer · Par Saloum</p>
        </div>
      </div>
    </div>
  );
}
