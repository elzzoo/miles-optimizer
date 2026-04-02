# Miles Optimizer — Plan 1: Critical Fixes + i18n + Currency

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corriger les bugs critiques de production, internationaliser l'app (FR/EN), et rendre la devise configurable (USD par défaut) pour le lancement international.

**Architecture:** Système i18n sans librairie externe — hook `useTranslation()` + dictionnaires JS. Currency Context global via `useCurrency()` hook. Les traductions couvrent tous les textes UI hardcodés. La devise sélectionnée est persistée dans `localStorage`.

**Tech Stack:** React 18, Vite, Tailwind CSS, Express.js, localStorage API

---

## Fichiers concernés

| Action | Fichier | Responsabilité |
|---|---|---|
| Modify | `src/components/DestinationCard.jsx` | Fix hooks order |
| Delete | `server/cache/airportCache.js` | Code mort |
| Modify | `server.js` | Ajouter CSP header |
| Modify | `server/services/promos.js` | Retirer champs promos hardcodés |
| Create | `src/i18n/en.js` | Dictionnaire anglais |
| Create | `src/i18n/fr.js` | Dictionnaire français |
| Create | `src/i18n/index.js` | Hook useTranslation + détection langue |
| Create | `src/hooks/useCurrency.js` | Hook devise + context |
| Modify | `src/utils/currency.js` | Ajouter convert() |
| Modify | `src/App.jsx` | i18n + currency selector + toggle langue |
| Modify | `src/components/MilesCard.jsx` | i18n |
| Modify | `src/components/FlightCard.jsx` | i18n |
| Modify | `src/components/DestinationCard.jsx` | i18n |
| Modify | `src/components/PromoBanner.jsx` | i18n |
| Modify | `src/components/AirportPicker.jsx` | i18n |
| Modify | `src/data/airports.js` | Ajouter cityEn, countryEn |
| Modify | `src/data/programs.js` | Ajouter notesEn, retirer promoActive/promoDaysLeft/promoLabel |
| Modify | `index.html` | lang dynamique (via JS) |

---

## Task 1 — Fix React Hooks Order (DestinationCard)

**Files:**
- Modify: `src/components/DestinationCard.jsx`

- [ ] **Lire le fichier actuel**

```bash
cat src/components/DestinationCard.jsx
```

- [ ] **Corriger l'ordre des hooks** — déplacer les hooks AVANT le `return null` conditionnel

Remplacer le début de la fonction :

```jsx
export default function DestinationCard({ airport }) {
  if (!airport) return null;  // ← BUG: hooks appelés après

  const { weather, loading: wLoading } = useWeather(airport.lat, airport.lon);
  const country = useCountryInfo(airport.iso2);
```

Par :

```jsx
export default function DestinationCard({ airport }) {
  const { weather, loading: wLoading } = useWeather(airport?.lat, airport?.lon);
  const country = useCountryInfo(airport?.iso2);

  if (!airport) return null;  // ← hooks appelés avant, correct
```

- [ ] **Vérifier manuellement** — ouvrir l'app dans le navigateur, changer la destination, vérifier que la météo s'affiche sans erreur console React.

- [ ] **Commit**

```bash
git add src/components/DestinationCard.jsx
git commit -m "fix: move hooks before conditional return in DestinationCard (Rules of Hooks)"
```

---

## Task 2 — Supprimer Code Mort + Ajouter CSP

**Files:**
- Delete: `server/cache/airportCache.js`
- Modify: `server.js`

- [ ] **Supprimer le fichier mort**

```bash
git rm server/cache/airportCache.js
```

- [ ] **Ajouter le CSP header dans `server.js`** — ajouter dans le bloc security headers existant :

```js
// Après les headers existants (X-Content-Type-Options, etc.)
res.setHeader(
  "Content-Security-Policy",
  "default-src 'self'; " +
  "script-src 'self' 'unsafe-inline'; " +
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
  "font-src https://fonts.gstatic.com; " +
  "img-src 'self' data:; " +
  "connect-src 'self' https://api.open-meteo.com https://restcountries.com https://open.er-api.com;"
);
```

- [ ] **Vérifier** — après redémarrage du serveur, inspecter les headers de réponse :

```bash
curl -I http://localhost:3001/api/health | grep -i "content-security"
# Attendu : Content-Security-Policy: default-src 'self'; ...
```

- [ ] **Commit**

```bash
git add server.js
git commit -m "fix: add CSP header, remove dead airportCache.js"
```

---

## Task 3 — Nettoyer promos hardcodées dans programs.js

**Files:**
- Modify: `src/data/programs.js`

- [ ] **Dans chaque programme de `programs.js`**, supprimer les champs `promoActive`, `promoDaysLeft`, `promoLabel` (ils sont figés et non maintenus). Par exemple :

```js
// AVANT (à supprimer de chaque programme) :
promoActive: true,
promoDaysLeft: 5,
promoLabel: "Promo 50% bonus miles",

// APRÈS : ces 3 champs supprimés
```

- [ ] **Mettre à jour `MilesCard.jsx`** — retirer les références à ces champs supprimés :

```jsx
// Supprimer ces blocs dans MilesCard.jsx :
{program.promoActive && (
  <div className="inline-flex items-center gap-1 bg-emerald-100 ...">
    🔥 {program.promoLabel}{program.promoDaysLeft !== null && ` · ${program.promoDaysLeft}j`}
  </div>
)}
{!program.promoActive && program.promoDaysLeft === null && (
  <p className="text-xs text-gray-400 italic mb-2">💡 {program.promoLabel}</p>
)}

// Et dans la ligne prix par mile, retirer la condition promoActive :
// AVANT:
<span className={`font-bold ${program.promoActive ? "text-emerald-600" : ""}`}>
  ${result.ppm.toFixed(4)} {program.promoActive && "🔥"}
</span>
// APRÈS:
<span className="font-bold">
  ${result.ppm.toFixed(4)}
</span>
```

- [ ] **Vérifier** — l'app compile, les MilesCards s'affichent sans les badges promo hardcodés.

- [ ] **Commit**

```bash
git add src/data/programs.js src/components/MilesCard.jsx
git commit -m "fix: remove hardcoded promo fields from programs.js"
```

---

## Task 4 — Créer le système i18n

**Files:**
- Create: `src/i18n/en.js`
- Create: `src/i18n/fr.js`
- Create: `src/i18n/index.js`

- [ ] **Créer `src/i18n/en.js`**

```js
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
  btnCopyLink: "Copy link",

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
};

export default en;
```

- [ ] **Créer `src/i18n/fr.js`**

```js
const fr = {
  tagline: "Comparez cash vs miles — trouvez le moins cher",
  warmupMsg: "Démarrage du serveur en cours (15-30s)…",
  roundTrip: "↔ Aller-retour",
  oneWay: "→ Aller simple",
  labelDeparture: "Départ",
  labelDestination: "Destination",
  labelDepart: "Départ",
  labelReturn: "Retour",
  labelCabin: "Classe",
  labelPassengers: "Passagers",
  cabinBusiness: "Business",
  cabinEco: "Éco",
  adultSingular: "adulte",
  adultPlural: "adultes",
  btnSearch: "🔍 Rechercher les vols",
  btnSearching: "Recherche en cours…",
  btnSwap: "Inverser départ et destination",
  btnCopyLink: "Copier le lien",
  routeSummary: (orig, dest, arrow, dist, km, cabin, type, pax) =>
    [orig, arrow, dest, "·", `${dist} mi · ${km} km`, "·", cabin, "·", type, ...(pax > 1 ? ["·", `${pax} pax`] : [])].join(" "),
  availableFlights: "✈️ Vols disponibles",
  sourceGoogle: "🔵 Google…",
  sourceGoogleDone: "✅ Google",
  sourceGoogleFail: "❌ Google",
  sourceSky: "🔶 Sky…",
  sourceSkyDone: "✅ Sky",
  sourceSkyFail: "❌ Sky",
  selectedNote: "Prix sélectionné utilisé pour la comparaison miles ↓",
  partialResults: (src) => `⚠️ ${src} indisponible — résultats partiels`,
  bothFailedTitle: "⚠️ Recherche temps réel indisponible",
  bothFailedSub: "Prix estimés utilisés pour la comparaison. Réessayez dans quelques instants.",
  priceSelected: "💵 Prix sélectionné",
  priceBest: "💵 Meilleur prix trouvé",
  priceEstimate: "💵 Estimation marché",
  priceSourceReal: (type) => `${type} — Google Flights / Skyscanner`,
  priceSourceEst: (type, cabin) => `${type} ${cabin} — prix indicatif`,
  oneWayLabel: "Aller simple",
  roundTripLabel: "A/R",
  businessLabel: "Business",
  ecoLabel: "Éco",
  bestOptionMiles: "Meilleure option : payer en miles",
  bestOptionCash: "Meilleure option : payer en cash",
  viaProgram: (name) => `Via ${name}`,
  savingsText: (usd, pct) => `économie de ${usd} (${pct}%)`,
  milesPlusTax: (miles, tax) => `${miles} + ${tax} de taxes`,
  costMoreCash: (extra) => `Les miles coûtent ${extra} de plus que le billet cash`,
  programsTitle: (n) => `📊 ${n} programmes miles — par prix croissant`,
  cardOneWay: "Aller simple",
  cardRoundTrip: "A/R",
  cardViaMiles: "via miles",
  cardHide: "▲ masquer",
  cardDetails: "▼ détails",
  cardMilesNeeded: "Miles nécessaires",
  cardPricePerMile: "Prix par mile",
  cardMilesCost: "Coût achat miles",
  cardTaxes: "Taxes & frais",
  cardTotal: "TOTAL",
  cardSavings: (usd, pct) => `Économie de ${usd} (${pct}%) 🎉`,
  cardBook: "Réserver avec des miles ↗",
  disclaimer: "Prix des vols : Google Flights & Skyscanner en temps réel. Coûts en miles : barèmes officiels des programmes de fidélité. La disponibilité des sièges prime varie — vérifiez sur le site du programme avant d'acheter des miles.",
  emptyStateTitle: "🌍",
  emptyStateMsg: "Renseignez votre trajet et cliquez sur",
  emptyStateCta: "Rechercher les vols",
  footerRates: (xof, eur) => `1 USD = ${xof} FCFA · 1 USD = ${eur} EUR`,
  footerLive: "taux en direct",
  footerBy: "Miles Optimizer · Par Saloum",
  langToggle: "EN",
  currencyLabel: "Devise",
  currencyUSD: "USD $",
  currencyEUR: "EUR €",
  currencyXOF: "FCFA",
  currencyGBP: "GBP £",
  pickerSearch: "Rechercher un aéroport…",
  pickerNoResult: "Aucun aéroport trouvé",
  destCapital: "Capitale",
  destCurrency: "Devise locale",
  destWeatherLoading: "Météo…",
};

export default fr;
```

- [ ] **Créer `src/i18n/index.js`**

```js
import { useState, useEffect, useCallback } from "react";
import en from "./en.js";
import fr from "./fr.js";

const DICTS = { en, fr };
const LS_KEY = "miles-optimizer-lang";

function detectLang() {
  const saved = localStorage.getItem(LS_KEY);
  if (saved && DICTS[saved]) return saved;
  const nav = (navigator.language || "en").slice(0, 2).toLowerCase();
  return DICTS[nav] ? nav : "en";
}

export function useTranslation() {
  const [lang, setLangState] = useState(detectLang);

  const setLang = useCallback((l) => {
    localStorage.setItem(LS_KEY, l);
    setLangState(l);
    document.documentElement.lang = l;
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const t = DICTS[lang];

  return { t, lang, setLang };
}
```

- [ ] **Vérifier la syntaxe** — aucune erreur au build :

```bash
cd /tmp/miles-optimizer && node --input-type=module < src/i18n/index.js 2>&1 || echo "check imports manually"
```

- [ ] **Commit**

```bash
git add src/i18n/
git commit -m "feat: add i18n system with EN/FR dictionaries and useTranslation hook"
```

---

## Task 5 — Ajouter `cityEn` / `countryEn` aux aéroports

**Files:**
- Modify: `src/data/airports.js`

- [ ] **Ajouter les champs `cityEn` et `countryEn`** à chaque entrée de `AIRPORTS`. Exemple pour les premières entrées :

```js
export const AIRPORTS = [
  {code:"DSS",city:"Dakar",cityEn:"Dakar",country:"Sénégal",countryEn:"Senegal",flag:"🇸🇳",iso2:"SN",lat:14.67,lon:-17.07},
  {code:"ABJ",city:"Abidjan",cityEn:"Abidjan",country:"Côte d'Ivoire",countryEn:"Ivory Coast",flag:"🇨🇮",iso2:"CI",lat:5.26,lon:-3.93},
  {code:"ACC",city:"Accra",cityEn:"Accra",country:"Ghana",countryEn:"Ghana",flag:"🇬🇭",iso2:"GH",lat:5.61,lon:-0.17},
  {code:"BKO",city:"Bamako",cityEn:"Bamako",country:"Mali",countryEn:"Mali",flag:"🇲🇱",iso2:"ML",lat:12.54,lon:-7.95},
  {code:"LOS",city:"Lagos",cityEn:"Lagos",country:"Nigeria",countryEn:"Nigeria",flag:"🇳🇬",iso2:"NG",lat:6.58,lon:3.32},
  {code:"ABV",city:"Abuja",cityEn:"Abuja",country:"Nigeria",countryEn:"Nigeria",flag:"🇳🇬",iso2:"NG",lat:9.00,lon:7.26},
  {code:"OUA",city:"Ouagadougou",cityEn:"Ouagadougou",country:"Burkina Faso",countryEn:"Burkina Faso",flag:"🇧🇫",iso2:"BF",lat:12.35,lon:-1.51},
  {code:"COO",city:"Cotonou",cityEn:"Cotonou",country:"Bénin",countryEn:"Benin",flag:"🇧🇯",iso2:"BJ",lat:6.36,lon:2.38},
  {code:"CKY",city:"Conakry",cityEn:"Conakry",country:"Guinée",countryEn:"Guinea",flag:"🇬🇳",iso2:"GN",lat:9.58,lon:-13.61},
  {code:"DLA",city:"Douala",cityEn:"Douala",country:"Cameroun",countryEn:"Cameroon",flag:"🇨🇲",iso2:"CM",lat:4.01,lon:9.72},
  {code:"LBV",city:"Libreville",cityEn:"Libreville",country:"Gabon",countryEn:"Gabon",flag:"🇬🇦",iso2:"GA",lat:0.46,lon:9.41},
  {code:"ADD",city:"Addis Abeba",cityEn:"Addis Ababa",country:"Éthiopie",countryEn:"Ethiopia",flag:"🇪🇹",iso2:"ET",lat:8.98,lon:38.80},
  {code:"NBO",city:"Nairobi",cityEn:"Nairobi",country:"Kenya",countryEn:"Kenya",flag:"🇰🇪",iso2:"KE",lat:-1.32,lon:36.93},
  {code:"JNB",city:"Johannesburg",cityEn:"Johannesburg",country:"Afrique du Sud",countryEn:"South Africa",flag:"🇿🇦",iso2:"ZA",lat:-26.14,lon:28.24},
  {code:"CPT",city:"Le Cap",cityEn:"Cape Town",country:"Afrique du Sud",countryEn:"South Africa",flag:"🇿🇦",iso2:"ZA",lat:-33.96,lon:18.60},
  {code:"CAI",city:"Le Caire",cityEn:"Cairo",country:"Égypte",countryEn:"Egypt",flag:"🇪🇬",iso2:"EG",lat:30.12,lon:31.41},
  {code:"CMN",city:"Casablanca",cityEn:"Casablanca",country:"Maroc",countryEn:"Morocco",flag:"🇲🇦",iso2:"MA",lat:33.37,lon:-7.59},
  {code:"TUN",city:"Tunis",cityEn:"Tunis",country:"Tunisie",countryEn:"Tunisia",flag:"🇹🇳",iso2:"TN",lat:36.85,lon:10.23},
  {code:"ALG",city:"Alger",cityEn:"Algiers",country:"Algérie",countryEn:"Algeria",flag:"🇩🇿",iso2:"DZ",lat:36.69,lon:3.22},
  {code:"LHR",city:"Londres",cityEn:"London",country:"Royaume-Uni",countryEn:"United Kingdom",flag:"🇬🇧",iso2:"GB",lat:51.48,lon:-0.45},
  {code:"LGW",city:"Londres Gatwick",cityEn:"London Gatwick",country:"Royaume-Uni",countryEn:"United Kingdom",flag:"🇬🇧",iso2:"GB",lat:51.15,lon:-0.18},
  {code:"CDG",city:"Paris CDG",cityEn:"Paris CDG",country:"France",countryEn:"France",flag:"🇫🇷",iso2:"FR",lat:49.01,lon:2.55},
  {code:"ORY",city:"Paris Orly",cityEn:"Paris Orly",country:"France",countryEn:"France",flag:"🇫🇷",iso2:"FR",lat:48.73,lon:2.38},
  {code:"AMS",city:"Amsterdam",cityEn:"Amsterdam",country:"Pays-Bas",countryEn:"Netherlands",flag:"🇳🇱",iso2:"NL",lat:52.31,lon:4.77},
  {code:"BRU",city:"Bruxelles",cityEn:"Brussels",country:"Belgique",countryEn:"Belgium",flag:"🇧🇪",iso2:"BE",lat:50.90,lon:4.48},
  {code:"FRA",city:"Francfort",cityEn:"Frankfurt",country:"Allemagne",countryEn:"Germany",flag:"🇩🇪",iso2:"DE",lat:50.03,lon:8.57},
  {code:"MUC",city:"Munich",cityEn:"Munich",country:"Allemagne",countryEn:"Germany",flag:"🇩🇪",iso2:"DE",lat:48.35,lon:11.79},
  {code:"MAD",city:"Madrid",cityEn:"Madrid",country:"Espagne",countryEn:"Spain",flag:"🇪🇸",iso2:"ES",lat:40.47,lon:-3.57},
  {code:"BCN",city:"Barcelone",cityEn:"Barcelona",country:"Espagne",countryEn:"Spain",flag:"🇪🇸",iso2:"ES",lat:41.30,lon:2.08},
  {code:"LIS",city:"Lisbonne",cityEn:"Lisbon",country:"Portugal",countryEn:"Portugal",flag:"🇵🇹",iso2:"PT",lat:38.77,lon:-9.13},
  {code:"FCO",city:"Rome",cityEn:"Rome",country:"Italie",countryEn:"Italy",flag:"🇮🇹",iso2:"IT",lat:41.80,lon:12.25},
  {code:"MXP",city:"Milan",cityEn:"Milan",country:"Italie",countryEn:"Italy",flag:"🇮🇹",iso2:"IT",lat:45.63,lon:8.72},
  {code:"ZRH",city:"Zurich",cityEn:"Zurich",country:"Suisse",countryEn:"Switzerland",flag:"🇨🇭",iso2:"CH",lat:47.46,lon:8.55},
  {code:"GVA",city:"Genève",cityEn:"Geneva",country:"Suisse",countryEn:"Switzerland",flag:"🇨🇭",iso2:"CH",lat:46.24,lon:6.11},
  {code:"IST",city:"Istanbul",cityEn:"Istanbul",country:"Turquie",countryEn:"Turkey",flag:"🇹🇷",iso2:"TR",lat:41.27,lon:28.74},
  {code:"DXB",city:"Dubaï",cityEn:"Dubai",country:"Émirats",countryEn:"UAE",flag:"🇦🇪",iso2:"AE",lat:25.25,lon:55.37},
  {code:"AUH",city:"Abu Dhabi",cityEn:"Abu Dhabi",country:"Émirats",countryEn:"UAE",flag:"🇦🇪",iso2:"AE",lat:24.44,lon:54.65},
  {code:"DOH",city:"Doha",cityEn:"Doha",country:"Qatar",countryEn:"Qatar",flag:"🇶🇦",iso2:"QA",lat:25.27,lon:51.61},
  {code:"RUH",city:"Riyad",cityEn:"Riyadh",country:"Arabie Saoudite",countryEn:"Saudi Arabia",flag:"🇸🇦",iso2:"SA",lat:24.96,lon:46.70},
  {code:"JED",city:"Djeddah",cityEn:"Jeddah",country:"Arabie Saoudite",countryEn:"Saudi Arabia",flag:"🇸🇦",iso2:"SA",lat:21.67,lon:39.16},
  {code:"BEY",city:"Beyrouth",cityEn:"Beirut",country:"Liban",countryEn:"Lebanon",flag:"🇱🇧",iso2:"LB",lat:33.82,lon:35.49},
  {code:"TLV",city:"Tel Aviv",cityEn:"Tel Aviv",country:"Israël",countryEn:"Israel",flag:"🇮🇱",iso2:"IL",lat:32.01,lon:34.89},
  {code:"DEL",city:"Delhi",cityEn:"Delhi",country:"Inde",countryEn:"India",flag:"🇮🇳",iso2:"IN",lat:28.56,lon:77.10},
  {code:"BOM",city:"Mumbai",cityEn:"Mumbai",country:"Inde",countryEn:"India",flag:"🇮🇳",iso2:"IN",lat:19.09,lon:72.87},
  {code:"BKK",city:"Bangkok",cityEn:"Bangkok",country:"Thaïlande",countryEn:"Thailand",flag:"🇹🇭",iso2:"TH",lat:13.69,lon:100.75},
  {code:"SIN",city:"Singapour",cityEn:"Singapore",country:"Singapour",countryEn:"Singapore",flag:"🇸🇬",iso2:"SG",lat:1.36,lon:103.99},
  {code:"HKG",city:"Hong Kong",cityEn:"Hong Kong",country:"Hong Kong",countryEn:"Hong Kong",flag:"🇭🇰",iso2:"HK",lat:22.31,lon:113.91},
  {code:"PEK",city:"Pékin",cityEn:"Beijing",country:"Chine",countryEn:"China",flag:"🇨🇳",iso2:"CN",lat:40.08,lon:116.58},
  {code:"PVG",city:"Shanghai",cityEn:"Shanghai",country:"Chine",countryEn:"China",flag:"🇨🇳",iso2:"CN",lat:31.15,lon:121.80},
  {code:"NRT",city:"Tokyo Narita",cityEn:"Tokyo Narita",country:"Japon",countryEn:"Japan",flag:"🇯🇵",iso2:"JP",lat:35.76,lon:140.39},
  {code:"ICN",city:"Séoul",cityEn:"Seoul",country:"Corée du Sud",countryEn:"South Korea",flag:"🇰🇷",iso2:"KR",lat:37.46,lon:126.44},
  {code:"JFK",city:"New York JFK",cityEn:"New York JFK",country:"États-Unis",countryEn:"United States",flag:"🇺🇸",iso2:"US",lat:40.64,lon:-73.78},
  {code:"EWR",city:"New York Newark",cityEn:"New York Newark",country:"États-Unis",countryEn:"United States",flag:"🇺🇸",iso2:"US",lat:40.69,lon:-74.17},
  {code:"LAX",city:"Los Angeles",cityEn:"Los Angeles",country:"États-Unis",countryEn:"United States",flag:"🇺🇸",iso2:"US",lat:33.94,lon:-118.41},
  {code:"ORD",city:"Chicago",cityEn:"Chicago",country:"États-Unis",countryEn:"United States",flag:"🇺🇸",iso2:"US",lat:41.98,lon:-87.90},
  {code:"MIA",city:"Miami",cityEn:"Miami",country:"États-Unis",countryEn:"United States",flag:"🇺🇸",iso2:"US",lat:25.79,lon:-80.29},
  {code:"ATL",city:"Atlanta",cityEn:"Atlanta",country:"États-Unis",countryEn:"United States",flag:"🇺🇸",iso2:"US",lat:33.64,lon:-84.43},
  {code:"SFO",city:"San Francisco",cityEn:"San Francisco",country:"États-Unis",countryEn:"United States",flag:"🇺🇸",iso2:"US",lat:37.62,lon:-122.38},
  {code:"BOS",city:"Boston",cityEn:"Boston",country:"États-Unis",countryEn:"United States",flag:"🇺🇸",iso2:"US",lat:42.37,lon:-71.01},
  {code:"DFW",city:"Dallas",cityEn:"Dallas",country:"États-Unis",countryEn:"United States",flag:"🇺🇸",iso2:"US",lat:32.90,lon:-97.04},
  {code:"IAD",city:"Washington DC",cityEn:"Washington DC",country:"États-Unis",countryEn:"United States",flag:"🇺🇸",iso2:"US",lat:38.94,lon:-77.46},
  {code:"YYZ",city:"Toronto",cityEn:"Toronto",country:"Canada",countryEn:"Canada",flag:"🇨🇦",iso2:"CA",lat:43.68,lon:-79.63},
  {code:"YUL",city:"Montréal",cityEn:"Montreal",country:"Canada",countryEn:"Canada",flag:"🇨🇦",iso2:"CA",lat:45.47,lon:-73.74},
  {code:"GRU",city:"São Paulo",cityEn:"São Paulo",country:"Brésil",countryEn:"Brazil",flag:"🇧🇷",iso2:"BR",lat:-23.43,lon:-46.47},
  {code:"GIG",city:"Rio de Janeiro",cityEn:"Rio de Janeiro",country:"Brésil",countryEn:"Brazil",flag:"🇧🇷",iso2:"BR",lat:-22.81,lon:-43.25},
  {code:"EZE",city:"Buenos Aires",cityEn:"Buenos Aires",country:"Argentine",countryEn:"Argentina",flag:"🇦🇷",iso2:"AR",lat:-34.82,lon:-58.54},
  {code:"BOG",city:"Bogotá",cityEn:"Bogotá",country:"Colombie",countryEn:"Colombia",flag:"🇨🇴",iso2:"CO",lat:4.70,lon:-74.14},
  {code:"LIM",city:"Lima",cityEn:"Lima",country:"Pérou",countryEn:"Peru",flag:"🇵🇪",iso2:"PE",lat:-12.02,lon:-77.11},
  {code:"MEX",city:"Mexico",cityEn:"Mexico City",country:"Mexique",countryEn:"Mexico",flag:"🇲🇽",iso2:"MX",lat:19.44,lon:-99.07},
  {code:"SYD",city:"Sydney",cityEn:"Sydney",country:"Australie",countryEn:"Australia",flag:"🇦🇺",iso2:"AU",lat:-33.95,lon:151.18},
  {code:"MEL",city:"Melbourne",cityEn:"Melbourne",country:"Australie",countryEn:"Australia",flag:"🇦🇺",iso2:"AU",lat:-37.67,lon:144.84},
  {code:"AKL",city:"Auckland",cityEn:"Auckland",country:"Nouvelle-Zélande",countryEn:"New Zealand",flag:"🇳🇿",iso2:"NZ",lat:-37.01,lon:174.79},
];
```

Conserver le reste du fichier (`REGION`, `airportsMap`) inchangé.

- [ ] **Commit**

```bash
git add src/data/airports.js
git commit -m "feat: add cityEn/countryEn fields to all airports for i18n"
```

---

## Task 6 — Hook useCurrency + convert() dans currency.js

**Files:**
- Modify: `src/utils/currency.js`
- Create: `src/hooks/useCurrency.js`

- [ ] **Mettre à jour `src/utils/currency.js`** — ajouter la fonction `convert()` :

```js
export const FALLBACK_RATES = { USD_XOF: 568, USD_EUR: 0.92, USD_GBP: 0.79 };

export const CURRENCIES = ["USD", "EUR", "XOF", "GBP"];

export function convert(amountUSD, currency, rates) {
  if (amountUSD == null) return null;
  const r = rates || FALLBACK_RATES;
  switch (currency) {
    case "EUR": return amountUSD * (r.USD_EUR || FALLBACK_RATES.USD_EUR);
    case "XOF": return amountUSD * (r.USD_XOF || FALLBACK_RATES.USD_XOF);
    case "GBP": return amountUSD * (r.USD_GBP || FALLBACK_RATES.USD_GBP);
    default: return amountUSD; // USD
  }
}

export function formatAmount(amount, currency) {
  if (amount == null) return "—";
  switch (currency) {
    case "EUR": return "€" + new Intl.NumberFormat("fr-FR").format(Math.round(amount));
    case "XOF": return new Intl.NumberFormat("fr-FR").format(Math.round(amount)) + " FCFA";
    case "GBP": return "£" + new Intl.NumberFormat("en-GB").format(Math.round(amount));
    default: return "$" + new Intl.NumberFormat("en-US").format(Math.round(amount));
  }
}

export const fmt = {
  xof: (n) => n == null ? "—" : new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " FCFA",
  usd: (n) => n == null ? "—" : "$" + new Intl.NumberFormat("en-US").format(Math.round(n)),
  eur: (n) => n == null ? "—" : "€" + new Intl.NumberFormat("fr-FR").format(Math.round(n)),
  gbp: (n) => n == null ? "—" : "£" + new Intl.NumberFormat("en-GB").format(Math.round(n)),
  miles: (n) => n == null ? "—" : new Intl.NumberFormat("fr-FR").format(n) + " miles",
};

export function estimateCash(distMiles, oneWay) {
  let [eco, bus] = distMiles < 800 ? [300, 900]
    : distMiles < 2000 ? [500, 1500]
    : distMiles < 4000 ? [800, 2500]
    : distMiles < 7000 ? [1200, 3500]
    : [1600, 5000];
  if (oneWay) { eco = Math.round(eco * 0.6); bus = Math.round(bus * 0.6); }
  return [eco, bus];
}
```

- [ ] **Créer `src/hooks/useCurrency.js`**

```js
import { useState, useCallback } from "react";
import { CURRENCIES } from "../utils/currency.js";

const LS_KEY = "miles-optimizer-currency";

function detectCurrency() {
  const saved = localStorage.getItem(LS_KEY);
  if (saved && CURRENCIES.includes(saved)) return saved;
  // Défaut international = USD
  return "USD";
}

export function useCurrency() {
  const [currency, setCurrencyState] = useState(detectCurrency);

  const setCurrency = useCallback((c) => {
    if (CURRENCIES.includes(c)) {
      localStorage.setItem(LS_KEY, c);
      setCurrencyState(c);
    }
  }, []);

  return { currency, setCurrency, currencies: CURRENCIES };
}
```

- [ ] **Commit**

```bash
git add src/utils/currency.js src/hooks/useCurrency.js
git commit -m "feat: add convert(), formatAmount(), useCurrency hook for multi-currency support"
```

---

## Task 7 — Intégrer i18n + currency dans App.jsx

**Files:**
- Modify: `src/App.jsx`

- [ ] **Remplacer le contenu complet de `src/App.jsx`** :

```jsx
import { useState, useMemo, useEffect, useCallback } from "react";
import AirportPicker from "./components/AirportPicker.jsx";
import FlightCard from "./components/FlightCard.jsx";
import MilesCard from "./components/MilesCard.jsx";
import Skeleton from "./components/Skeleton.jsx";
import PromoBanner from "./components/PromoBanner.jsx";
import DestinationCard from "./components/DestinationCard.jsx";
import { useFlights } from "./hooks/useFlights.js";
import { useMilesCalculator } from "./hooks/useMilesCalculator.js";
import { useRates } from "./hooks/useRates.js";
import { useTranslation } from "./i18n/index.js";
import { useCurrency } from "./hooks/useCurrency.js";
import { airportsMap } from "./data/airports.js";
import { today, addDays } from "./utils/dates.js";
import { fmt, estimateCash, convert, formatAmount } from "./utils/currency.js";
import { haversine } from "./utils/distance.js";

export default function App() {
  const [origin, setOrigin] = useState("DSS");
  const [dest, setDest] = useState("IST");
  const [tripType, setTripType] = useState("round");
  const [depDate, setDepDate] = useState(addDays(today, 30));
  const [retDate, setRetDate] = useState(addDays(today, 40));
  const [cabin, setCabin] = useState(1);
  const [passengers, setPassengers] = useState(1);
  const [searched, setSearched] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [isWarm, setIsWarm] = useState(false);

  const { t, lang, setLang } = useTranslation();
  const { currency, setCurrency, currencies } = useCurrency();
  const rates = useRates();
  const isOneWay = tripType === "oneway";
  const origA = airportsMap[origin];
  const destA = airportsMap[dest];
  const distMiles = useMemo(() => origA && destA ? haversine(origA.lat, origA.lon, destA.lat, destA.lon) : 0, [origA, destA]);
  const distKm = Math.round(distMiles * 1.60934);

  const { googleFlights, skyFlights, gLoading, sLoading, gError, sError, loading, allFlights, bestApiPrice, search, reset } = useFlights();
  const milesResults = useMilesCalculator({ origin, dest, cabin, distMiles, isOneWay, passengers, rates });

  useEffect(() => {
    fetch("/api/health").then(() => setIsWarm(true)).catch(() => setIsWarm(true));
  }, []);

  useEffect(() => {
    if (retDate <= depDate) setRetDate(addDays(depDate, 7));
  }, [depDate]);

  const selectedFlightPrice = selectedIdx !== null ? allFlights[selectedIdx]?.price : null;
  const [estEco, estBus] = useMemo(() => estimateCash(distMiles, isOneWay), [distMiles, isOneWay]);
  const estPrice = cabin === 1 ? estBus : estEco;
  const cashUSD = selectedFlightPrice ?? bestApiPrice ?? estPrice;
  const isRealPrice = !!(selectedFlightPrice || bestApiPrice);

  // Affichage du prix dans la devise choisie
  const cashDisplay = formatAmount(convert(cashUSD, currency, rates), currency);
  const cashSecondary = currency !== "XOF" ? fmt.xof(cashUSD * rates.USD_XOF) : fmt.usd(cashUSD);

  const handleSearch = useCallback(() => {
    if (!origin || !dest || origin === dest) return;
    setSearched(true);
    setSelectedIdx(null);
    reset();
    const params = new URLSearchParams({ origin, dest, depDate, cabin: String(cabin), passengers: String(passengers) });
    if (!isOneWay) params.set("retDate", retDate);
    search(params);
  }, [origin, dest, depDate, retDate, cabin, passengers, isOneWay, search, reset]);

  const handleSwap = useCallback(() => {
    setOrigin(dest);
    setDest(origin);
    setSearched(false);
    setSelectedIdx(null);
  }, [origin, dest]);

  const bestMiles = milesResults[0];
  const milesSavings = bestMiles?.result ? cashUSD - bestMiles.result.totalUSD : null;
  const bothFailed = !loading && searched && allFlights.length === 0 && gError && sError;
  const oneFailed = !loading && searched && (gError || sError) && allFlights.length > 0;

  // Noms d'aéroports selon la langue
  const cityName = (a) => a ? (lang === "en" ? (a.cityEn || a.city) : a.city) : "";
  const countryName = (a) => a ? (lang === "en" ? (a.countryEn || a.country) : a.country) : "";

  return (
    <div className="min-h-screen pb-12" style={{ background: "linear-gradient(135deg,#0f172a 0%,#1e3a5f 50%,#0f172a 100%)" }}>
      <div className="max-w-lg mx-auto px-4">

        {/* HEADER */}
        <div className="text-center pt-8 pb-5">
          <div className="text-5xl mb-2">🧳</div>
          <h1 className="text-3xl font-black text-white tracking-tight">Miles Optimizer</h1>
          <p className="text-blue-300 text-sm mt-1">{t.tagline}</p>
          {/* Language + Currency toggles */}
          <div className="flex items-center justify-center gap-2 mt-3">
            <button
              onClick={() => setLang(lang === "fr" ? "en" : "fr")}
              className="text-xs font-bold px-2.5 py-1 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              aria-label="Toggle language">
              {t.langToggle}
            </button>
            <select
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              className="text-xs font-bold px-2.5 py-1 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors border-0 outline-none cursor-pointer"
              aria-label={t.currencyLabel}>
              <option value="USD">{t.currencyUSD}</option>
              <option value="EUR">{t.currencyEUR}</option>
              <option value="XOF">{t.currencyXOF}</option>
              <option value="GBP">{t.currencyGBP}</option>
            </select>
          </div>
        </div>

        {/* WARM-UP BANNER */}
        {!isWarm && (
          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 mb-4 flex items-center gap-3">
            <span className="animate-spin text-lg">⏳</span>
            <p className="text-blue-300 text-xs">{t.warmupMsg}</p>
          </div>
        )}

        {/* PROMO BANNER */}
        <PromoBanner />

        {/* SEARCH FORM */}
        <div className="bg-white rounded-3xl shadow-2xl p-5 mb-5">
          {/* Trip type */}
          <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 mb-4">
            {[{ val: "round", label: t.roundTrip }, { val: "oneway", label: t.oneWay }].map(({ val, label }) => (
              <button key={val}
                onClick={() => { setTripType(val); setSearched(false); }}
                aria-pressed={tripType === val}
                className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${tripType === val ? "bg-white text-indigo-700 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}>
                {label}
              </button>
            ))}
          </div>

          {/* Airports */}
          <div className="flex items-end gap-2 mb-3">
            <AirportPicker label={t.labelDeparture} value={origin} onChange={v => { setOrigin(v); setSearched(false); }} exclude={dest} lang={lang} />
            <button onClick={handleSwap} aria-label={t.btnSwap}
              className="mb-1 w-10 h-10 rounded-full bg-gray-100 hover:bg-indigo-100 text-gray-600 flex items-center justify-center text-lg transition-all flex-shrink-0 hover:scale-110">
              ⇄
            </button>
            <AirportPicker label={t.labelDestination} value={dest} onChange={v => { setDest(v); setSearched(false); }} exclude={origin} lang={lang} />
          </div>

          {/* Distance badge */}
          {distMiles > 0 && (
            <div className="flex justify-center mb-3">
              <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                📏 {distMiles.toLocaleString()} mi · {distKm.toLocaleString()} km
              </span>
            </div>
          )}

          {/* Dates */}
          <div className={`grid gap-3 mb-4 ${isOneWay ? "grid-cols-1" : "grid-cols-2"}`}>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">{t.labelDepart}</p>
              <input type="date" value={depDate} min={addDays(today, 0)}
                onChange={e => setDepDate(e.target.value)}
                className="w-full p-2.5 rounded-xl border-2 border-gray-100 bg-gray-50 text-sm focus:border-indigo-400 outline-none" />
            </div>
            {!isOneWay && (
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">{t.labelReturn}</p>
                <input type="date" value={retDate} min={addDays(depDate, 1)}
                  onChange={e => setRetDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border-2 border-gray-100 bg-gray-50 text-sm focus:border-indigo-400 outline-none" />
              </div>
            )}
          </div>

          {/* Cabin + Passengers */}
          <div className="flex gap-3 mb-5">
            <div className="flex-1">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{t.labelCabin}</p>
              <div className="flex gap-2">
                {[{ val: 1, icon: "💼", label: t.cabinBusiness }, { val: 0, icon: "🪑", label: t.cabinEco }].map(({ val, icon, label }) => (
                  <button key={val} onClick={() => setCabin(val)} aria-pressed={cabin === val}
                    className={`flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl font-bold text-sm transition-all ${cabin === val ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                    {icon} {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="w-28">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{t.labelPassengers}</p>
              <select value={passengers} onChange={e => setPassengers(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border-2 border-gray-100 bg-gray-50 text-sm focus:border-indigo-400 outline-none h-[42px]">
                {[1, 2, 3, 4, 5, 6].map(n => (
                  <option key={n} value={n}>{n} {n > 1 ? t.adultPlural : t.adultSingular}</option>
                ))}
              </select>
            </div>
          </div>

          <button onClick={handleSearch}
            disabled={!origin || !dest || origin === dest || loading}
            aria-label={t.btnSearch}
            className={`w-full py-4 rounded-2xl text-white font-black text-base transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed ${loading ? "bg-indigo-400" : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 hover:shadow-xl hover:-translate-y-0.5"}`}>
            {loading
              ? <span className="flex items-center justify-center gap-2"><span className="inline-block animate-spin">✈️</span>{t.btnSearching}</span>
              : t.btnSearch}
          </button>
        </div>

        {/* DESTINATION CARD */}
        {destA && <DestinationCard airport={destA} lang={lang} t={t} />}

        {/* RESULTS */}
        {searched && (
          <>
            <div className="flex justify-center mb-5">
              <div className="flex items-center gap-2 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-full px-4 py-2 text-white text-sm flex-wrap justify-center">
                <span>{origA?.flag} {cityName(origA)}</span>
                <span className="text-indigo-300">{isOneWay ? "→" : "⇄"}</span>
                <span>{destA?.flag} {cityName(destA)}</span>
                <span className="text-indigo-400">·</span>
                <span className="text-indigo-200">{distMiles.toLocaleString()} mi · {distKm.toLocaleString()} km</span>
                <span className="text-indigo-400">·</span>
                <span className="text-indigo-200">{cabin === 1 ? t.cabinBusiness : t.cabinEco}</span>
                <span className="text-indigo-400">·</span>
                <span className="text-indigo-200">{isOneWay ? t.oneWayLabel : t.roundTripLabel}</span>
                {passengers > 1 && <><span className="text-indigo-400">·</span><span className="text-indigo-200">{passengers} pax</span></>}
              </div>
            </div>

            {/* Flights */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-white font-bold text-sm">{t.availableFlights}</p>
                <div className="flex items-center gap-3 text-xs">
                  <span className={`${gLoading ? "text-blue-300 animate-pulse" : googleFlights ? "text-emerald-400" : gError ? "text-red-400" : ""}`}>
                    {gLoading ? t.sourceGoogle : googleFlights ? t.sourceGoogleDone : gError ? t.sourceGoogleFail : ""}
                  </span>
                  <span className={`${sLoading ? "text-orange-300 animate-pulse" : skyFlights ? "text-emerald-400" : sError ? "text-red-400" : ""}`}>
                    {sLoading ? t.sourceSky : skyFlights ? t.sourceSkyDone : sError ? t.sourceSkyFail : ""}
                  </span>
                </div>
              </div>
              {loading && allFlights.length === 0 && <Skeleton />}
              {allFlights.length > 0 && (
                <div className="space-y-2">
                  {allFlights.map((f, i) => (
                    <FlightCard key={i} flight={f} idx={i} source={f.source} selectedIdx={selectedIdx} onSelect={setSelectedIdx} rates={rates} currency={currency} t={t} />
                  ))}
                  {selectedIdx !== null && <p className="text-center text-indigo-400 text-xs py-1">{t.selectedNote}</p>}
                  {oneFailed && <p className="text-center text-yellow-500 text-xs py-1">{t.partialResults(gError ? "Google Flights" : "Skyscanner")}</p>}
                </div>
              )}
              {bothFailed && (
                <div className="bg-white bg-opacity-5 border border-white border-opacity-10 rounded-2xl p-4 text-center">
                  <p className="text-red-300 text-sm font-bold">{t.bothFailedTitle}</p>
                  <p className="text-indigo-400 text-xs mt-1">{t.bothFailedSub}</p>
                </div>
              )}
            </div>

            {/* Cash reference */}
            <div className="rounded-2xl bg-white bg-opacity-10 border border-white border-opacity-20 px-4 py-3 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-bold text-sm">
                    {isRealPrice ? (selectedFlightPrice ? t.priceSelected : t.priceBest) : t.priceEstimate}
                  </p>
                  <p className="text-indigo-300 text-xs">
                    {isRealPrice
                      ? t.priceSourceReal(isOneWay ? t.oneWayLabel : t.roundTripLabel)
                      : t.priceSourceEst(isOneWay ? t.oneWayLabel : t.roundTripLabel, cabin === 1 ? t.cabinBusiness : t.cabinEco)}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-white font-black text-2xl">{cashDisplay}</div>
                  <div className="text-indigo-300 text-xs">{cashSecondary}</div>
                </div>
              </div>
            </div>

            {/* Recommendation */}
            {bestMiles && milesSavings !== null && (
              <div className={`rounded-2xl px-4 py-4 mb-5 ${milesSavings > 0 ? "bg-emerald-500 bg-opacity-20 border border-emerald-400 border-opacity-40" : "bg-slate-500 bg-opacity-20 border border-slate-400 border-opacity-30"}`}>
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{milesSavings > 0 ? "💡" : "💳"}</span>
                  <div>
                    {milesSavings > 0 ? (
                      <>
                        <p className="text-emerald-300 font-black text-base">{t.bestOptionMiles}</p>
                        <p className="text-white font-bold">
                          {t.viaProgram(bestMiles.program.short)} — <span className="text-emerald-300">{t.savingsText(fmt.usd(milesSavings), Math.round((milesSavings / cashUSD) * 100))}</span>
                        </p>
                        <p className="text-indigo-300 text-xs mt-1">{t.milesPlusTax(fmt.miles(bestMiles.result.milesUsed), fmt.usd(bestMiles.result.taxes))}</p>
                      </>
                    ) : (
                      <>
                        <p className="text-slate-300 font-black text-base">{t.bestOptionCash}</p>
                        <p className="text-white text-sm"><span className="text-orange-300 font-bold">{t.costMoreCash(fmt.usd(-milesSavings))}</span></p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Miles programs */}
            <p className="text-indigo-400 text-xs font-bold uppercase tracking-widest mb-3">
              {t.programsTitle(milesResults.length)}
            </p>
            <div className="space-y-3">
              {milesResults.map(({ program, result }, i) => (
                <MilesCard key={program.id} program={program} result={result} rank={i} cashUSD={cashUSD} isOneWay={isOneWay} rates={rates} currency={currency} t={t} />
              ))}
            </div>

            <div className="mt-6 rounded-2xl bg-white bg-opacity-5 border border-white border-opacity-10 p-4 text-indigo-400 text-xs leading-relaxed">
              <p className="font-bold text-indigo-300 mb-1">⚠️ {lang === "en" ? "Disclaimer" : "À savoir"}</p>
              <p>{t.disclaimer}</p>
            </div>
          </>
        )}

        {!searched && (
          <div className="text-center py-8 text-indigo-400">
            <div className="text-4xl mb-3">{t.emptyStateTitle}</div>
            <p className="text-sm">{t.emptyStateMsg}<br /><span className="text-indigo-300 font-bold">{t.emptyStateCta}</span></p>
          </div>
        )}

        <div className="text-center mt-8 text-indigo-400 text-xs space-y-0.5">
          <p>
            {t.footerRates(rates.USD_XOF.toFixed(0), rates.USD_EUR.toFixed(3))}
            {rates.updatedAt && <span className="text-indigo-500 ml-1">({t.footerLive})</span>}
          </p>
          <p>{t.footerBy}</p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Commit**

```bash
git add src/App.jsx
git commit -m "feat: integrate i18n and currency selector into App.jsx"
```

---

## Task 8 — Mettre à jour les composants (MilesCard, FlightCard, DestinationCard, AirportPicker)

**Files:**
- Modify: `src/components/MilesCard.jsx`
- Modify: `src/components/FlightCard.jsx`
- Modify: `src/components/DestinationCard.jsx`
- Modify: `src/components/AirportPicker.jsx`

- [ ] **Mettre à jour `src/components/MilesCard.jsx`** — accepter `t`, `currency`, `rates` en props et utiliser `formatAmount(convert(...))` pour les totaux :

```jsx
import { useState } from "react";
import { fmt, convert, formatAmount } from "../utils/currency.js";

const RANK_STYLES = {
  0: { border: "border-yellow-400", bg: "bg-gradient-to-br from-yellow-50 to-amber-50", badge: "🥇", bar: "bg-yellow-400" },
  1: { border: "border-slate-200", bg: "bg-white", badge: "🥈", bar: "bg-slate-300" },
  2: { border: "border-orange-200", bg: "bg-white", badge: "🥉", bar: "bg-orange-300" },
};

export default function MilesCard({ program, result, rank, cashUSD, isOneWay, rates, currency, t }) {
  const [expanded, setExpanded] = useState(rank === 0);
  if (!result) return null;

  const savings = cashUSD - result.totalUSD;
  const savingsPct = Math.round((savings / cashUSD) * 100);
  const isCheaper = savings > 0;
  const style = RANK_STYLES[rank] || { border: "border-gray-100", bg: "bg-white", badge: "", bar: "" };

  const totalDisplay = formatAmount(convert(result.totalUSD, currency, rates), currency);
  const totalSecondary = currency !== "XOF"
    ? fmt.xof(result.totalXOF)
    : fmt.eur(result.totalEUR);

  const cardOneWay = t?.cardOneWay || "One way";
  const cardRoundTrip = t?.cardRoundTrip || "Round trip";

  return (
    <div className={`rounded-2xl border-2 ${style.border} ${style.bg} overflow-hidden transition-all`}>
      {rank < 3 && <div className={`h-1 ${style.bar}`} />}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            {style.badge && <span className="text-2xl flex-shrink-0">{style.badge}</span>}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-lg">{program.emoji}</span>
                <span className="font-black text-gray-900 text-base">{program.short}</span>
              </div>
              <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${program.allianceBg} ${program.allianceText}`}>{program.alliance}</span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-2xl font-black text-gray-900">{totalDisplay}</div>
            <div className="text-xs text-gray-400">{totalSecondary}</div>
            {isCheaper ? (
              <div className="mt-1 inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 font-black text-sm px-2 py-0.5 rounded-full">
                -{Math.abs(savingsPct)}% 💰
              </div>
            ) : (
              <div className="mt-1 inline-flex items-center gap-1 bg-red-50 text-red-500 font-bold text-xs px-2 py-0.5 rounded-full">
                +{fmt.usd(-savings)} vs cash
              </div>
            )}
          </div>
        </div>

        <div
          className={`rounded-xl p-3 mb-3 cursor-pointer transition-colors ${rank === 0 ? "bg-amber-100 hover:bg-amber-200" : "bg-gray-50 hover:bg-gray-100"}`}
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 font-medium">{isOneWay ? cardOneWay : cardRoundTrip} — {t?.cardViaMiles || "via miles"}</span>
            <span className="text-xs text-gray-400 font-medium">{expanded ? (t?.cardHide || "▲ hide") : (t?.cardDetails || "▼ details")}</span>
          </div>
        </div>

        {expanded && (
          <div className="space-y-2 text-sm mb-3">
            <div className="flex justify-between py-1.5 border-b border-gray-100">
              <span className="text-gray-500">{t?.cardMilesNeeded || "Miles required"}</span>
              <span className="font-bold">{fmt.miles(result.milesUsed)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-gray-100">
              <span className="text-gray-500">{t?.cardPricePerMile || "Price per mile"}</span>
              <span className="font-bold">${result.ppm.toFixed(4)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-gray-100">
              <span className="text-gray-500">{t?.cardMilesCost || "Miles purchase cost"}</span>
              <span className="font-bold">{fmt.usd(result.milesCostUSD)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-gray-100">
              <span className="text-gray-500">{t?.cardTaxes || "Fees & taxes"}</span>
              <span className={`font-bold ${program.lowTax ? "text-emerald-600" : "text-orange-500"}`}>
                ~{fmt.usd(result.taxes)} {program.lowTax ? "✅" : "⚠️"}
              </span>
            </div>
            <div className="flex justify-between py-1.5 rounded-lg bg-gray-50 px-2">
              <span className="font-bold text-gray-700">{t?.cardTotal || "TOTAL"}</span>
              <div className="text-right">
                <div className="font-black">{totalDisplay}</div>
                <div className="text-xs text-gray-400">{totalSecondary}</div>
              </div>
            </div>
            {isCheaper && (
              <div className="bg-emerald-50 rounded-lg px-3 py-2 text-center">
                <span className="text-emerald-700 font-black text-sm">
                  {t?.cardSavings ? t.cardSavings(fmt.usd(savings), savingsPct) : `Savings: ${fmt.usd(savings)} (${savingsPct}%) 🎉`}
                </span>
              </div>
            )}
          </div>
        )}

        <p className="text-xs text-gray-400 italic mb-2">{program.notes}</p>
        {program.airlines.length > 0 && (
          <p className="text-xs text-gray-400 mb-3">✈️ {program.airlines.join(" · ")}</p>
        )}
        {program.bookingUrl && (
          <a href={program.bookingUrl} target="_blank" rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors border border-indigo-100">
            {t?.cardBook || "Book with miles ↗"}
          </a>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Mettre à jour `src/components/FlightCard.jsx`** — accepter `currency`, `rates`, `t` et afficher le prix converti :

```jsx
import { fmt, convert, formatAmount, FALLBACK_RATES } from "../utils/currency.js";

export default function FlightCard({ flight, idx, selectedIdx, onSelect, source, rates, currency, t }) {
  const isSelected = selectedIdx === idx;
  const depTime = flight.depTime ? String(flight.depTime).slice(11, 16) : null;
  const priceDisplay = formatAmount(convert(flight.price, currency || "USD", rates), currency || "USD");
  const priceSecondary = (currency !== "XOF")
    ? fmt.xof(flight.price * (rates?.USD_XOF || FALLBACK_RATES.USD_XOF))
    : fmt.usd(flight.price);

  return (
    <div onClick={() => onSelect(isSelected ? null : idx)}
      className={`cursor-pointer rounded-xl border-2 p-3 transition-all ${isSelected ? "border-indigo-500 bg-indigo-50 shadow-md" : "border-gray-100 bg-white hover:border-indigo-200 hover:shadow-sm"}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${source === "google" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"}`}>
              {source === "google" ? "🔵 Google" : "🔶 Sky"}
            </span>
            <span className="font-bold text-gray-900 text-sm truncate">{flight.airline}</span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            {flight.direct
              ? <span className="text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">✅ Direct</span>
              : <span className="text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">{flight.stops} stop(s)</span>}
            {flight.duration && <span className="text-gray-400">⏱ {Math.floor(flight.duration / 60)}h{String(flight.duration % 60).padStart(2, "0")}</span>}
            {depTime && <span className="text-gray-400">🕐 {depTime}</span>}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-lg font-black text-gray-900">{priceDisplay}</div>
          <div className="text-xs text-gray-400">{priceSecondary}</div>
          {isSelected && <div className="text-xs text-indigo-600 font-bold mt-0.5">✓ {t?.priceSelected?.replace("💵 ", "") || "Selected"}</div>}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Mettre à jour `src/components/DestinationCard.jsx`** — utiliser `cityEn`/`countryEn` selon `lang`, accepter `t` :

```jsx
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
```

- [ ] **Mettre à jour `src/components/AirportPicker.jsx`** — accepter `lang` et afficher `cityEn`/`countryEn` si EN :

Lire le fichier actuel, puis ajouter le prop `lang` et utiliser `a.cityEn || a.city` et `a.countryEn || a.country` dans l'affichage des options.

- [ ] **Commit**

```bash
git add src/components/MilesCard.jsx src/components/FlightCard.jsx src/components/DestinationCard.jsx src/components/AirportPicker.jsx
git commit -m "feat: update all components with i18n t prop and multi-currency display"
```

---

## Task 9 — Ajouter notesEn à programs.js

**Files:**
- Modify: `src/data/programs.js`

- [ ] **Ajouter le champ `notesEn`** à chaque programme. Exemple :

```js
// Aeroplan
notes: "Taxes quasi nulles (~10$). Excellent sur Turkish, Lufthansa, Ethiopian.",
notesEn: "Near-zero taxes (~$10). Excellent on Turkish, Lufthansa, Ethiopian.",

// LifeMiles
notes: "Très rentable avec promo (bonus 50-150%). Pas de surcharge carburant.",
notesEn: "Highly profitable during promos (50-150% bonus). No fuel surcharge.",

// Flying Blue
notes: "Promos mensuelles. Bon rapport qualité/prix sur AF/KLM.",
notesEn: "Monthly promos. Good value on Air France/KLM.",

// MileagePlus
notes: "Bon barème sur longues distances. Partenaires variés.",
notesEn: "Good rates for long-haul. Wide partner network.",

// Miles&Smiles
notes: "Excellente valeur sur Turkish Airlines. Taxes faibles.",
notesEn: "Excellent value on Turkish Airlines. Low taxes.",

// Qatar Avios
notes: "Bon pour Qatar Airways premium. Flexible.",
notesEn: "Good for Qatar Airways premium travel. Flexible.",

// BA Avios
notes: "Barème par distance. Bon sur courtes distances.",
notesEn: "Distance-based chart. Good value for short-haul.",

// AAdvantage
notes: "Partenaires nombreux. Variable selon disponibilité.",
notesEn: "Large partner network. Variable based on availability.",
```

- [ ] **Mettre à jour `MilesCard.jsx`** — utiliser `program.notesEn` si lang EN :

Dans `MilesCard.jsx`, le prop `t` ne contient pas la langue. Passer `lang` en plus, ou utiliser la clé directement depuis `program` :

```jsx
// Modifier la signature et la ligne d'affichage des notes :
export default function MilesCard({ program, result, rank, cashUSD, isOneWay, rates, currency, t, lang }) {
  // ...
  // Dans le JSX, remplacer :
  <p className="text-xs text-gray-400 italic mb-2">{program.notes}</p>
  // Par :
  <p className="text-xs text-gray-400 italic mb-2">{lang === "en" ? (program.notesEn || program.notes) : program.notes}</p>
```

Et mettre à jour l'appel dans `App.jsx` :
```jsx
<MilesCard key={program.id} program={program} result={result} rank={i} cashUSD={cashUSD} isOneWay={isOneWay} rates={rates} currency={currency} t={t} lang={lang} />
```

- [ ] **Commit**

```bash
git add src/data/programs.js src/components/MilesCard.jsx src/App.jsx
git commit -m "feat: add notesEn to all programs, display in correct language"
```

---

## Task 10 — Vérification finale et push

- [ ] **Vérifier le build** :

```bash
cd /tmp/miles-optimizer && npm run build 2>&1 | tail -20
# Attendu : ✓ built in Xs — aucune erreur
```

- [ ] **Vérifier manuellement** — lancer le serveur et tester :
  1. L'app charge en FR par défaut si `navigator.language` est `fr`
  2. Cliquer le toggle "EN" → tous les textes passent en anglais
  3. Sélectionner "EUR €" → les prix s'affichent en euros
  4. Sélectionner "FCFA" → les prix s'affichent en FCFA
  5. Rafraîchir → la langue et la devise sont mémorisées
  6. La météo destination s'affiche sans erreur console

- [ ] **Push final**

```bash
git push origin main
```

---

## Résumé des commits produits

1. `fix: move hooks before conditional return in DestinationCard`
2. `fix: add CSP header, remove dead airportCache.js`
3. `fix: remove hardcoded promo fields from programs.js`
4. `feat: add i18n system with EN/FR dictionaries and useTranslation hook`
5. `feat: add cityEn/countryEn fields to all airports for i18n`
6. `feat: add convert(), formatAmount(), useCurrency hook for multi-currency support`
7. `feat: integrate i18n and currency selector into App.jsx`
8. `feat: update all components with i18n t prop and multi-currency display`
9. `feat: add notesEn to all programs, display in correct language`
