# Miles Optimizer — Plan 2: Nouveaux Programmes + Calcul CPP

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Passer de 8 à 20 programmes miles, ajouter le calcul de la valeur implicite du mile (cpp), et afficher un avertissement si les données dépassent 90 jours.

**Architecture:** Deux fichiers de données (`charts.js` + `programs.js`) reçoivent les nouveaux programmes. `MilesCard.jsx` calcule et affiche le cpp à partir des props `result` et `cashUSD` déjà disponibles. Les clés i18n nouvelles sont ajoutées aux deux dictionnaires existants.

**Tech Stack:** React 18, Vite, Tailwind CSS, JS pur (pas de librairie externe)

---

## Fichiers concernés

| Action | Fichier | Responsabilité |
|---|---|---|
| Modify | `src/data/charts.js` | Ajouter zone charts pour les 12 nouveaux programmes |
| Modify | `src/data/programs.js` | Ajouter 12 programmes + champ `updatedAt` sur tous les 20 |
| Modify | `src/i18n/en.js` | Clés cpp (cppLabel, cppExcellent, cppGood, cppLow, staleRates) |
| Modify | `src/i18n/fr.js` | Idem en français |
| Modify | `src/components/MilesCard.jsx` | Afficher cpp badge + stale data warning |

---

## Task 1 — Ajouter les zone charts dans `charts.js`

**Files:**
- Modify: `src/data/charts.js`

- [ ] **Lire le fichier actuel**

```bash
cat src/data/charts.js
```

- [ ] **Ajouter 12 nouvelles entrées dans `ZONE_CHARTS`** — insérer après la dernière entrée (`aadvantage`) et avant le `;` fermant l'objet.

Les données sont au format `{eco, bus}` par paire de régions (africa/europe/middle-east/americas/asia/oceania) :

```js
  krisflyer:{africa:{africa:[12000,28000],europe:[30000,85000],"middle-east":[25000,65000],americas:[35000,100000],asia:[25000,65000],oceania:[40000,110000]},europe:{africa:[30000,85000],europe:[10000,28000],"middle-east":[15000,42000],americas:[30000,72000],asia:[30000,85000],oceania:[42000,110000]},"middle-east":{africa:[25000,65000],europe:[15000,42000],"middle-east":[8000,20000],americas:[28000,68000],asia:[22000,60000],oceania:[38000,100000]},americas:{africa:[35000,100000],europe:[30000,72000],"middle-east":[28000,68000],americas:[8000,22000],asia:[32000,85000],oceania:[40000,108000]},asia:{africa:[25000,65000],europe:[30000,85000],"middle-east":[22000,60000],americas:[32000,85000],asia:[8000,20000],oceania:[15000,38000]},oceania:{africa:[40000,110000],europe:[42000,110000],"middle-east":[38000,100000],americas:[40000,108000],asia:[15000,38000],oceania:[8000,20000]}},
  shebamiles:{africa:{africa:[5000,12000],europe:[20000,50000],"middle-east":[18000,45000],americas:[30000,75000],asia:[35000,85000],oceania:[45000,110000]},europe:{africa:[20000,50000],europe:[10000,25000],"middle-east":[15000,38000],americas:[28000,65000],asia:[32000,80000],oceania:[42000,105000]},"middle-east":{africa:[18000,45000],europe:[15000,38000],"middle-east":[8000,18000],americas:[28000,65000],asia:[22000,58000],oceania:[38000,95000]},americas:{africa:[30000,75000],europe:[28000,65000],"middle-east":[28000,65000],americas:[10000,25000],asia:[32000,80000],oceania:[40000,105000]},asia:{africa:[35000,85000],europe:[32000,80000],"middle-east":[22000,58000],americas:[32000,80000],asia:[10000,22000],oceania:[15000,38000]},oceania:{africa:[45000,110000],europe:[42000,105000],"middle-east":[38000,95000],americas:[40000,105000],asia:[15000,38000],oceania:[10000,25000]}},
  milesandmore:{africa:{africa:[8000,18000],europe:[25000,60000],"middle-east":[20000,50000],americas:[35000,85000],asia:[38000,90000],oceania:[50000,115000]},europe:{africa:[25000,60000],europe:[10000,25000],"middle-east":[15000,38000],americas:[28000,68000],asia:[32000,78000],oceania:[42000,105000]},"middle-east":{africa:[20000,50000],europe:[15000,38000],"middle-east":[7000,17000],americas:[28000,68000],asia:[22000,55000],oceania:[38000,95000]},americas:{africa:[35000,85000],europe:[28000,68000],"middle-east":[28000,68000],americas:[8000,20000],asia:[32000,78000],oceania:[42000,108000]},asia:{africa:[38000,90000],europe:[32000,78000],"middle-east":[22000,55000],americas:[32000,78000],asia:[10000,22000],oceania:[15000,38000]},oceania:{africa:[50000,115000],europe:[42000,105000],"middle-east":[38000,95000],americas:[42000,108000],asia:[15000,38000],oceania:[10000,22000]}},
  aegean:{africa:{africa:[10000,22000],europe:[22000,55000],"middle-east":[18000,45000],americas:[32000,78000],asia:[38000,88000],oceania:[48000,108000]},europe:{africa:[22000,55000],europe:[8000,18000],"middle-east":[12000,30000],americas:[28000,65000],asia:[32000,75000],oceania:[42000,100000]},"middle-east":{africa:[18000,45000],europe:[12000,30000],"middle-east":[6000,14000],americas:[28000,65000],asia:[20000,50000],oceania:[35000,88000]},americas:{africa:[32000,78000],europe:[28000,65000],"middle-east":[28000,65000],americas:[9000,20000],asia:[32000,75000],oceania:[42000,105000]},asia:{africa:[38000,88000],europe:[32000,75000],"middle-east":[20000,50000],americas:[32000,75000],asia:[9000,20000],oceania:[15000,35000]},oceania:{africa:[48000,108000],europe:[42000,100000],"middle-east":[35000,88000],americas:[42000,105000],asia:[15000,35000],oceania:[9000,20000]}},
  skywards:{africa:{africa:[10000,20000],europe:[25000,60000],"middle-east":[18000,45000],americas:[38000,90000],asia:[35000,80000],oceania:[48000,110000]},europe:{africa:[25000,60000],europe:[10000,25000],"middle-east":[15000,38000],americas:[30000,72000],asia:[32000,78000],oceania:[42000,105000]},"middle-east":{africa:[18000,45000],europe:[15000,38000],"middle-east":[8000,18000],americas:[30000,72000],asia:[22000,55000],oceania:[38000,95000]},americas:{africa:[38000,90000],europe:[30000,72000],"middle-east":[30000,72000],americas:[10000,22000],asia:[35000,85000],oceania:[45000,110000]},asia:{africa:[35000,80000],europe:[32000,78000],"middle-east":[22000,55000],americas:[35000,85000],asia:[9000,20000],oceania:[15000,35000]},oceania:{africa:[48000,110000],europe:[42000,105000],"middle-east":[38000,95000],americas:[45000,110000],asia:[15000,35000],oceania:[9000,20000]}},
  etihad:{africa:{africa:[10000,22000],europe:[25000,62000],"middle-east":[18000,45000],americas:[38000,88000],asia:[32000,80000],oceania:[45000,108000]},europe:{africa:[25000,62000],europe:[10000,25000],"middle-east":[15000,38000],americas:[30000,70000],asia:[32000,78000],oceania:[42000,105000]},"middle-east":{africa:[18000,45000],europe:[15000,38000],"middle-east":[8000,18000],americas:[30000,70000],asia:[22000,55000],oceania:[38000,95000]},americas:{africa:[38000,88000],europe:[30000,70000],"middle-east":[30000,70000],americas:[10000,22000],asia:[32000,80000],oceania:[42000,108000]},asia:{africa:[32000,80000],europe:[32000,78000],"middle-east":[22000,55000],americas:[32000,80000],asia:[9000,20000],oceania:[15000,35000]},oceania:{africa:[45000,108000],europe:[42000,105000],"middle-east":[38000,95000],americas:[42000,108000],asia:[15000,35000],oceania:[9000,20000]}},
  sindbad:{africa:{africa:[10000,20000],europe:[22000,55000],"middle-east":[15000,38000],americas:[35000,85000],asia:[30000,72000],oceania:[42000,105000]},europe:{africa:[22000,55000],europe:[10000,22000],"middle-east":[12000,30000],americas:[28000,68000],asia:[28000,70000],oceania:[40000,100000]},"middle-east":{africa:[15000,38000],europe:[12000,30000],"middle-east":[6000,14000],americas:[28000,68000],asia:[18000,45000],oceania:[35000,88000]},americas:{africa:[35000,85000],europe:[28000,68000],"middle-east":[28000,68000],americas:[10000,22000],asia:[30000,72000],oceania:[40000,100000]},asia:{africa:[30000,72000],europe:[28000,70000],"middle-east":[18000,45000],americas:[30000,72000],asia:[8000,18000],oceania:[14000,32000]},oceania:{africa:[42000,105000],europe:[40000,100000],"middle-east":[35000,88000],americas:[40000,100000],asia:[14000,32000],oceania:[8000,18000]}},
  asante:{africa:{africa:[8000,18000],europe:[25000,60000],"middle-east":[20000,50000],americas:[35000,85000],asia:[38000,90000],oceania:[48000,110000]},europe:{africa:[25000,60000],europe:[10000,25000],"middle-east":[14000,35000],americas:[28000,65000],asia:[32000,78000],oceania:[42000,105000]},"middle-east":{africa:[20000,50000],europe:[14000,35000],"middle-east":[7000,16000],americas:[28000,65000],asia:[22000,55000],oceania:[38000,95000]},americas:{africa:[35000,85000],europe:[28000,65000],"middle-east":[28000,65000],americas:[9000,20000],asia:[32000,80000],oceania:[42000,108000]},asia:{africa:[38000,90000],europe:[32000,78000],"middle-east":[22000,55000],americas:[32000,80000],asia:[9000,20000],oceania:[15000,35000]},oceania:{africa:[48000,110000],europe:[42000,105000],"middle-east":[38000,95000],americas:[42000,108000],asia:[15000,35000],oceania:[9000,20000]}},
  airsenegal:{africa:{africa:[5000,10000],europe:[20000,50000],"middle-east":[18000,45000],americas:[30000,75000],asia:[35000,85000],oceania:[45000,110000]},europe:{africa:[20000,50000],europe:[9000,22000],"middle-east":[14000,35000],americas:[28000,65000],asia:[32000,78000],oceania:[42000,105000]},"middle-east":{africa:[18000,45000],europe:[14000,35000],"middle-east":[7000,16000],americas:[28000,65000],asia:[22000,55000],oceania:[38000,95000]},americas:{africa:[30000,75000],europe:[28000,65000],"middle-east":[28000,65000],americas:[9000,20000],asia:[32000,80000],oceania:[42000,108000]},asia:{africa:[35000,85000],europe:[32000,78000],"middle-east":[22000,55000],americas:[32000,80000],asia:[9000,20000],oceania:[15000,35000]},oceania:{africa:[45000,110000],europe:[42000,105000],"middle-east":[38000,95000],americas:[42000,108000],asia:[15000,35000],oceania:[9000,20000]}},
  safar:{africa:{africa:[8000,18000],europe:[22000,55000],"middle-east":[18000,45000],americas:[30000,75000],asia:[35000,85000],oceania:[45000,108000]},europe:{africa:[22000,55000],europe:[8000,20000],"middle-east":[12000,30000],americas:[25000,62000],asia:[30000,72000],oceania:[40000,100000]},"middle-east":{africa:[18000,45000],europe:[12000,30000],"middle-east":[6000,14000],americas:[25000,62000],asia:[20000,50000],oceania:[35000,88000]},americas:{africa:[30000,75000],europe:[25000,62000],"middle-east":[25000,62000],americas:[9000,20000],asia:[30000,72000],oceania:[40000,105000]},asia:{africa:[35000,85000],europe:[30000,72000],"middle-east":[20000,50000],americas:[30000,72000],asia:[9000,20000],oceania:[15000,35000]},oceania:{africa:[45000,108000],europe:[40000,100000],"middle-east":[35000,88000],americas:[40000,105000],asia:[15000,35000],oceania:[9000,20000]}},
  fidelys:{africa:{africa:[6000,14000],europe:[20000,50000],"middle-east":[15000,38000],americas:[30000,75000],asia:[35000,85000],oceania:[45000,108000]},europe:{africa:[20000,50000],europe:[8000,20000],"middle-east":[10000,25000],americas:[25000,62000],asia:[28000,70000],oceania:[38000,95000]},"middle-east":{africa:[15000,38000],europe:[10000,25000],"middle-east":[5000,12000],americas:[25000,62000],asia:[18000,45000],oceania:[32000,85000]},americas:{africa:[30000,75000],europe:[25000,62000],"middle-east":[25000,62000],americas:[8000,20000],asia:[28000,70000],oceania:[38000,100000]},asia:{africa:[35000,85000],europe:[28000,70000],"middle-east":[18000,45000],americas:[28000,70000],asia:[9000,20000],oceania:[15000,35000]},oceania:{africa:[45000,108000],europe:[38000,95000],"middle-east":[32000,85000],americas:[38000,100000],asia:[15000,35000],oceania:[9000,20000]}},
```

Ajouter ces 12 lignes à la fin de l'objet `ZONE_CHARTS`, juste avant `};` (la ligne qui ferme l'objet). La virgule après `aadvantage` doit rester.

- [ ] **Vérifier la syntaxe** — s'assurer que l'objet se ferme correctement avec `};`

```bash
node --input-type=module <<'EOF'
import { ZONE_CHARTS } from "/tmp/miles-optimizer/src/data/charts.js";
console.log("Keys:", Object.keys(ZONE_CHARTS).length, "programs loaded");
console.log("krisflyer africa→europe:", ZONE_CHARTS.krisflyer?.africa?.europe);
EOF
```
Attendu : `Keys: 19 programs loaded` et `[30000, 85000]`

- [ ] **Commit**

```bash
git add src/data/charts.js
git commit -m "feat: add zone charts for 12 new miles programs"
```

---

## Task 2 — Ajouter les 12 nouveaux programmes dans `programs.js`

**Files:**
- Modify: `src/data/programs.js`

- [ ] **Lire le fichier actuel** pour comprendre la structure exacte

```bash
cat src/data/programs.js
```

- [ ] **Ajouter `updatedAt: "2026-04"` à chaque programme existant** (8 programmes). Par exemple pour Aeroplan :

```js
// Ajouter dans chaque programme existant, après bookingUrl :
updatedAt: "2026-04",
```

- [ ] **Ajouter les 12 nouveaux programmes** à la fin du tableau PROGRAMS, avant le `];` fermant :

```js
  // ── Star Alliance ──────────────────────────────────────────
  {
    id: "krisflyer",
    name: "Singapore Airlines KrisFlyer",
    short: "KrisFlyer",
    emoji: "🦁",
    alliance: "Star Alliance",
    allianceBg: "bg-blue-100",
    allianceText: "text-blue-800",
    airlines: ["Singapore Airlines", "Air India", "Turkish", "Lufthansa", "Ethiopian"],
    pricePMile: 0.0285,
    taxUSD: 80,
    lowTax: true,
    notes: "Bon barème sur longues distances. Pas de surcharge carburant sur partenaires.",
    notesEn: "Good rates for long-haul. No fuel surcharge on Star Alliance partners.",
    chartType: "zone",
    bookingUrl: "https://www.singaporeair.com/en_UK/us/krisflyer/redeem/award-redemption/",
    updatedAt: "2026-04",
  },
  {
    id: "shebamiles",
    name: "Ethiopian Airlines ShebaMiles",
    short: "ShebaMiles",
    emoji: "🦅",
    alliance: "Star Alliance",
    allianceBg: "bg-blue-100",
    allianceText: "text-blue-800",
    airlines: ["Ethiopian Airlines", "Lufthansa", "Turkish", "Air Canada", "United"],
    pricePMile: 0.025,
    taxUSD: 30,
    lowTax: true,
    notes: "Excellent pour vols Afrique. Taxes très faibles. Nombreux partenaires Star Alliance.",
    notesEn: "Excellent for Africa routes. Very low taxes. Many Star Alliance partners.",
    chartType: "zone",
    bookingUrl: "https://www.ethiopianairlines.com/sheba",
    updatedAt: "2026-04",
  },
  {
    id: "milesandmore",
    name: "Miles & More",
    short: "Miles & More",
    emoji: "🇩🇪",
    alliance: "Star Alliance",
    allianceBg: "bg-blue-100",
    allianceText: "text-blue-800",
    airlines: ["Lufthansa", "Swiss", "Austrian", "Brussels Airlines", "Air Dolomiti"],
    pricePMile: 0.0275,
    taxUSD: 300,
    lowTax: false,
    notes: "Forte surcharge carburant sur Lufthansa group. Mieux via partenaires.",
    notesEn: "High fuel surcharges on Lufthansa group. Better value via partners.",
    chartType: "zone",
    bookingUrl: "https://www.miles-and-more.com/row/en/earn-and-redeem/redeem-miles/award-flight.html",
    updatedAt: "2026-04",
  },
  {
    id: "aegean",
    name: "Aegean Miles+Bonus",
    short: "Miles+Bonus",
    emoji: "🇬🇷",
    alliance: "Star Alliance",
    allianceBg: "bg-blue-100",
    allianceText: "text-blue-800",
    airlines: ["Aegean Airlines", "Air France", "Lufthansa", "Turkish", "Ethiopian"],
    pricePMile: 0.0235,
    taxUSD: 50,
    lowTax: true,
    notes: "Bon barème sur Star Alliance. Meilleure valeur sur vols courts et médiums.",
    notesEn: "Good rates on Star Alliance. Best value on short/medium-haul.",
    chartType: "zone",
    bookingUrl: "https://www.aegeanair.com/en/miles-and-bonus/",
    updatedAt: "2026-04",
  },
  // ── Indépendants ───────────────────────────────────────────
  {
    id: "skywards",
    name: "Emirates Skywards",
    short: "Skywards",
    emoji: "🇦🇪",
    alliance: "Indépendant",
    allianceBg: "bg-orange-100",
    allianceText: "text-orange-800",
    airlines: ["Emirates", "flydubai"],
    pricePMile: 0.031,
    taxUSD: 120,
    lowTax: false,
    notes: "Idéal pour Dubaï et connexions via DXB. Réseau unique.",
    notesEn: "Ideal for Dubai and connections via DXB. Unique network.",
    chartType: "zone",
    bookingUrl: "https://www.emirates.com/english/skywards/redeeming-miles/",
    updatedAt: "2026-04",
  },
  {
    id: "etihad",
    name: "Etihad Guest",
    short: "Etihad Guest",
    emoji: "🇦🇪",
    alliance: "Indépendant",
    allianceBg: "bg-orange-100",
    allianceText: "text-orange-800",
    airlines: ["Etihad Airways", "Air Serbia", "Air Seychelles"],
    pricePMile: 0.028,
    taxUSD: 100,
    lowTax: false,
    notes: "Bon pour Abu Dhabi et vols long-courrier premium.",
    notesEn: "Good for Abu Dhabi and long-haul premium travel.",
    chartType: "zone",
    bookingUrl: "https://www.etihad.com/en/etihad-guest/redeem-miles",
    updatedAt: "2026-04",
  },
  {
    id: "sindbad",
    name: "Oman Air Sindbad",
    short: "Sindbad",
    emoji: "🇴🇲",
    alliance: "Indépendant",
    allianceBg: "bg-orange-100",
    allianceText: "text-orange-800",
    airlines: ["Oman Air"],
    pricePMile: 0.022,
    taxUSD: 60,
    lowTax: true,
    notes: "Bon rapport qualité/prix sur Oman Air. Connexions Afrique via Muscat.",
    notesEn: "Good value on Oman Air. Africa connections via Muscat.",
    chartType: "zone",
    bookingUrl: "https://www.omanair.com/en/sindbad-programme",
    updatedAt: "2026-04",
  },
  // ── SkyTeam ─────────────────────────────────────────────────
  {
    id: "asante",
    name: "Kenya Airways Asante Miles",
    short: "Asante Miles",
    emoji: "🇰🇪",
    alliance: "SkyTeam",
    allianceBg: "bg-sky-100",
    allianceText: "text-sky-800",
    airlines: ["Kenya Airways", "Air France", "KLM", "Delta"],
    pricePMile: 0.02,
    taxUSD: 80,
    lowTax: true,
    notes: "Idéal pour vols intra-Afrique et Europe via Nairobi.",
    notesEn: "Ideal for intra-Africa and Europe flights via Nairobi.",
    chartType: "zone",
    bookingUrl: "https://www.kenya-airways.com/en/flying-with-us/asante-miles/",
    updatedAt: "2026-04",
  },
  // ── Africains / régionaux ───────────────────────────────────
  {
    id: "airsenegal",
    name: "Air Sénégal Rewards",
    short: "Air Sénégal",
    emoji: "🇸🇳",
    alliance: "Indépendant",
    allianceBg: "bg-orange-100",
    allianceText: "text-orange-800",
    airlines: ["Air Sénégal"],
    pricePMile: 0.025,
    taxUSD: 50,
    lowTax: true,
    notes: "Programme local. Vols Dakar–Europe et intra-Afrique.",
    notesEn: "Local program. Dakar–Europe and intra-Africa routes.",
    chartType: "zone",
    bookingUrl: "https://www.flyairsenegal.com",
    updatedAt: "2026-04",
  },
  {
    id: "safar",
    name: "Royal Air Maroc Safar Flyer",
    short: "Safar Flyer",
    emoji: "🇲🇦",
    alliance: "OneWorld",
    allianceBg: "bg-red-100",
    allianceText: "text-red-800",
    airlines: ["Royal Air Maroc", "British Airways", "Qatar Airways", "American", "Iberia"],
    pricePMile: 0.022,
    taxUSD: 90,
    lowTax: true,
    notes: "Membre OneWorld. Bon barème sur vols Afrique–Europe via Casablanca.",
    notesEn: "OneWorld member. Good rates for Africa–Europe via Casablanca.",
    chartType: "zone",
    bookingUrl: "https://www.royalairmaroc.com/safarflyer",
    updatedAt: "2026-04",
  },
  {
    id: "fidelys",
    name: "Tunisair Fidelys",
    short: "Fidelys",
    emoji: "🇹🇳",
    alliance: "Indépendant",
    allianceBg: "bg-orange-100",
    allianceText: "text-orange-800",
    airlines: ["Tunisair"],
    pricePMile: 0.02,
    taxUSD: 60,
    lowTax: true,
    notes: "Programme local Tunisair. Europe et Afrique du Nord.",
    notesEn: "Tunisair local program. Mainly Europe and North Africa.",
    chartType: "zone",
    bookingUrl: "https://www.tunisair.com/fidelys",
    updatedAt: "2026-04",
  },
```

- [ ] **Commit**

```bash
git add src/data/programs.js
git commit -m "feat: add 12 new miles programs, add updatedAt field to all programs"
```

---

## Task 3 — Ajouter les clés i18n pour cpp

**Files:**
- Modify: `src/i18n/en.js`
- Modify: `src/i18n/fr.js`

- [ ] **Ajouter dans `src/i18n/en.js`** — ajouter ces clés à la fin de l'objet `en`, avant le `};` final :

```js
  // CPP (cents per mile)
  cppLabel: "Mile value",
  cppExcellent: "Excellent (>2¢)",
  cppGood: "Good (1-2¢)",
  cppLow: "Low (<1¢)",
  staleRates: "Rates may be outdated",
```

- [ ] **Ajouter dans `src/i18n/fr.js`** — ajouter ces clés à la fin de l'objet `fr`, avant le `};` final :

```js
  // CPP (centimes par mile)
  cppLabel: "Valeur du mile",
  cppExcellent: "Excellent (>2¢)",
  cppGood: "Bon (1-2¢)",
  cppLow: "Faible (<1¢)",
  staleRates: "Barèmes peut-être dépassés",
```

- [ ] **Commit**

```bash
git add src/i18n/en.js src/i18n/fr.js
git commit -m "feat: add cpp i18n keys (mile value benchmark labels)"
```

---

## Task 4 — Afficher le cpp et le stale warning dans MilesCard

**Files:**
- Modify: `src/components/MilesCard.jsx`

- [ ] **Lire le fichier actuel**

```bash
cat src/components/MilesCard.jsx
```

- [ ] **Ajouter la fonction `isStale`** et les calculs cpp en tête du composant, juste après `if (!result) return null;` :

```jsx
  // Stale data check
  function isStale(updatedAt) {
    if (!updatedAt) return false;
    const [year, month] = updatedAt.split("-").map(Number);
    const updated = new Date(year, month - 1);
    const diffDays = (Date.now() - updated) / (1000 * 60 * 60 * 24);
    return diffDays > 90;
  }

  // CPP calculation: (cashUSD - taxes) / milesUsed * 100 = cents per mile
  const cpp = (result.milesUsed > 0 && cashUSD > result.taxes)
    ? ((cashUSD - result.taxes) / result.milesUsed * 100)
    : null;

  const cppBenchmark = cpp === null ? null
    : cpp > 2 ? (t?.cppExcellent || "Excellent (>2¢)")
    : cpp > 1 ? (t?.cppGood || "Good (1-2¢)")
    : (t?.cppLow || "Low (<1¢)");

  const cppColor = cpp === null ? ""
    : cpp > 2 ? "text-emerald-700 bg-emerald-50"
    : cpp > 1 ? "text-amber-700 bg-amber-50"
    : "text-red-600 bg-red-50";
```

Note : `isStale` est une fonction locale déclarée à l'intérieur du composant (pas un hook, pas besoin de `useCallback`).

- [ ] **Dans la section `expanded`**, ajouter la ligne cpp APRÈS la ligne "Prix par mile" et AVANT la ligne "Coût achat miles" :

Chercher le bloc :
```jsx
            <div className="flex justify-between py-1.5 border-b border-gray-100">
              <span className="text-gray-500">{t?.cardPricePerMile || "Price per mile"}</span>
              <span className="font-bold">${result.ppm.toFixed(4)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-gray-100">
              <span className="text-gray-500">{t?.cardMilesCost || "Miles purchase cost"}</span>
```

Et insérer entre les deux :
```jsx
            {cpp !== null && (
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">{t?.cppLabel || "Mile value"}</span>
                <span className={`font-bold text-xs px-2 py-0.5 rounded-full ${cppColor}`}>
                  {cpp.toFixed(2)}¢ — {cppBenchmark}
                </span>
              </div>
            )}
```

- [ ] **Ajouter le stale warning** juste avant la ligne des notes (`<p className="text-xs text-gray-400 italic mb-2">`) :

```jsx
        {program.updatedAt && isStale(program.updatedAt) && (
          <p className="text-xs text-amber-500 mb-1">⚠️ {t?.staleRates || "Rates may be outdated"}</p>
        )}
```

- [ ] **Vérifier manuellement** — ouvrir l'app, faire une recherche, cliquer "détails" sur une MilesCard → la ligne "Valeur du mile" doit apparaître avec un badge coloré.

- [ ] **Commit**

```bash
git add src/components/MilesCard.jsx
git commit -m "feat: add cpp (cents per mile) badge and stale data warning in MilesCard"
```

---

## Task 5 — Push final

- [ ] **Vérifier qu'il n'y a pas de référence cassée** :

```bash
grep -r "airsenegal\|shebamiles\|krisflyer" src/data/charts.js | wc -l
# Attendu : 3 (une entrée par programme dans ZONE_CHARTS)
```

```bash
grep "updatedAt" src/data/programs.js | wc -l
# Attendu : 20 (tous les programmes en ont un)
```

```bash
grep "cppLabel\|staleRates" src/i18n/en.js src/i18n/fr.js
# Attendu : 2 occurrences dans chaque fichier
```

- [ ] **Push**

```bash
git push origin main
```

---

## Résumé des commits produits

1. `feat: add zone charts for 12 new miles programs`
2. `feat: add 12 new miles programs, add updatedAt field to all programs`
3. `feat: add cpp i18n keys (mile value benchmark labels)`
4. `feat: add cpp (cents per mile) badge and stale data warning in MilesCard`
