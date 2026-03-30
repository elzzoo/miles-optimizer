import { useState, useMemo, useRef, useEffect, useCallback } from "react";

// ─── DATE HELPERS ─────────────────────────────────────────────
const today = new Date();
const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r.toISOString().split("T")[0]; };

// ─── EXCHANGE RATES ───────────────────────────────────────────
const USD_XOF = 568;
const USD_EUR = 0.92;

// ─── AIRPORTS ────────────────────────────────────────────────
const AIRPORTS = [
  { code:"DSS",city:"Dakar",country:"Sénégal",flag:"🇸🇳",lat:14.67,lon:-17.07 },
  { code:"ABJ",city:"Abidjan",country:"Côte d'Ivoire",flag:"🇨🇮",lat:5.26,lon:-3.93 },
  { code:"ACC",city:"Accra",country:"Ghana",flag:"🇬🇭",lat:5.61,lon:-0.17 },
  { code:"BKO",city:"Bamako",country:"Mali",flag:"🇲🇱",lat:12.54,lon:-7.95 },
  { code:"LOS",city:"Lagos",country:"Nigeria",flag:"🇳🇬",lat:6.58,lon:3.32 },
  { code:"ABV",city:"Abuja",country:"Nigeria",flag:"🇳🇬",lat:9.00,lon:7.26 },
  { code:"OUA",city:"Ouagadougou",country:"Burkina Faso",flag:"🇧🇫",lat:12.35,lon:-1.51 },
  { code:"COO",city:"Cotonou",country:"Bénin",flag:"🇧🇯",lat:6.36,lon:2.38 },
  { code:"CKY",city:"Conakry",country:"Guinée",flag:"🇬🇳",lat:9.58,lon:-13.61 },
  { code:"DLA",city:"Douala",country:"Cameroun",flag:"🇨🇲",lat:4.01,lon:9.72 },
  { code:"LBV",city:"Libreville",country:"Gabon",flag:"🇬🇦",lat:0.46,lon:9.41 },
  { code:"ADD",city:"Addis Abeba",country:"Éthiopie",flag:"🇪🇹",lat:8.98,lon:38.80 },
  { code:"NBO",city:"Nairobi",country:"Kenya",flag:"🇰🇪",lat:-1.32,lon:36.93 },
  { code:"JNB",city:"Johannesburg",country:"Afrique du Sud",flag:"🇿🇦",lat:-26.14,lon:28.24 },
  { code:"CPT",city:"Le Cap",country:"Afrique du Sud",flag:"🇿🇦",lat:-33.96,lon:18.60 },
  { code:"CAI",city:"Le Caire",country:"Égypte",flag:"🇪🇬",lat:30.12,lon:31.41 },
  { code:"CMN",city:"Casablanca",country:"Maroc",flag:"🇲🇦",lat:33.37,lon:-7.59 },
  { code:"TUN",city:"Tunis",country:"Tunisie",flag:"🇹🇳",lat:36.85,lon:10.23 },
  { code:"ALG",city:"Alger",country:"Algérie",flag:"🇩🇿",lat:36.69,lon:3.22 },
  { code:"LHR",city:"Londres",country:"Royaume-Uni",flag:"🇬🇧",lat:51.48,lon:-0.45 },
  { code:"LGW",city:"Londres Gatwick",country:"Royaume-Uni",flag:"🇬🇧",lat:51.15,lon:-0.18 },
  { code:"CDG",city:"Paris CDG",country:"France",flag:"🇫🇷",lat:49.01,lon:2.55 },
  { code:"ORY",city:"Paris Orly",country:"France",flag:"🇫🇷",lat:48.73,lon:2.38 },
  { code:"AMS",city:"Amsterdam",country:"Pays-Bas",flag:"🇳🇱",lat:52.31,lon:4.77 },
  { code:"BRU",city:"Bruxelles",country:"Belgique",flag:"🇧🇪",lat:50.90,lon:4.48 },
  { code:"FRA",city:"Francfort",country:"Allemagne",flag:"🇩🇪",lat:50.03,lon:8.57 },
  { code:"MUC",city:"Munich",country:"Allemagne",flag:"🇩🇪",lat:48.35,lon:11.79 },
  { code:"MAD",city:"Madrid",country:"Espagne",flag:"🇪🇸",lat:40.47,lon:-3.57 },
  { code:"BCN",city:"Barcelone",country:"Espagne",flag:"🇪🇸",lat:41.30,lon:2.08 },
  { code:"LIS",city:"Lisbonne",country:"Portugal",flag:"🇵🇹",lat:38.77,lon:-9.13 },
  { code:"FCO",city:"Rome",country:"Italie",flag:"🇮🇹",lat:41.80,lon:12.25 },
  { code:"MXP",city:"Milan",country:"Italie",flag:"🇮🇹",lat:45.63,lon:8.72 },
  { code:"ZRH",city:"Zurich",country:"Suisse",flag:"🇨🇭",lat:47.46,lon:8.55 },
  { code:"GVA",city:"Genève",country:"Suisse",flag:"🇨🇭",lat:46.24,lon:6.11 },
  { code:"IST",city:"Istanbul",country:"Turquie",flag:"🇹🇷",lat:41.27,lon:28.74 },
  { code:"DXB",city:"Dubaï",country:"Émirats",flag:"🇦🇪",lat:25.25,lon:55.37 },
  { code:"AUH",city:"Abu Dhabi",country:"Émirats",flag:"🇦🇪",lat:24.44,lon:54.65 },
  { code:"DOH",city:"Doha",country:"Qatar",flag:"🇶🇦",lat:25.27,lon:51.61 },
  { code:"RUH",city:"Riyad",country:"Arabie Saoudite",flag:"🇸🇦",lat:24.96,lon:46.70 },
  { code:"JED",city:"Djeddah",country:"Arabie Saoudite",flag:"🇸🇦",lat:21.67,lon:39.16 },
  { code:"BEY",city:"Beyrouth",country:"Liban",flag:"🇱🇧",lat:33.82,lon:35.49 },
  { code:"TLV",city:"Tel Aviv",country:"Israël",flag:"🇮🇱",lat:32.01,lon:34.89 },
  { code:"DEL",city:"Delhi",country:"Inde",flag:"🇮🇳",lat:28.56,lon:77.10 },
  { code:"BOM",city:"Mumbai",country:"Inde",flag:"🇮🇳",lat:19.09,lon:72.87 },
  { code:"BKK",city:"Bangkok",country:"Thaïlande",flag:"🇹🇭",lat:13.69,lon:100.75 },
  { code:"SIN",city:"Singapour",country:"Singapour",flag:"🇸🇬",lat:1.36,lon:103.99 },
  { code:"HKG",city:"Hong Kong",country:"Hong Kong",flag:"🇭🇰",lat:22.31,lon:113.91 },
  { code:"PEK",city:"Pékin",country:"Chine",flag:"🇨🇳",lat:40.08,lon:116.58 },
  { code:"PVG",city:"Shanghai",country:"Chine",flag:"🇨🇳",lat:31.15,lon:121.80 },
  { code:"NRT",city:"Tokyo Narita",country:"Japon",flag:"🇯🇵",lat:35.76,lon:140.39 },
  { code:"ICN",city:"Séoul",country:"Corée du Sud",flag:"🇰🇷",lat:37.46,lon:126.44 },
  { code:"JFK",city:"New York JFK",country:"États-Unis",flag:"🇺🇸",lat:40.64,lon:-73.78 },
  { code:"EWR",city:"New York Newark",country:"États-Unis",flag:"🇺🇸",lat:40.69,lon:-74.17 },
  { code:"LAX",city:"Los Angeles",country:"États-Unis",flag:"🇺🇸",lat:33.94,lon:-118.41 },
  { code:"ORD",city:"Chicago",country:"États-Unis",flag:"🇺🇸",lat:41.98,lon:-87.90 },
  { code:"MIA",city:"Miami",country:"États-Unis",flag:"🇺🇸",lat:25.79,lon:-80.29 },
  { code:"ATL",city:"Atlanta",country:"États-Unis",flag:"🇺🇸",lat:33.64,lon:-84.43 },
  { code:"SFO",city:"San Francisco",country:"États-Unis",flag:"🇺🇸",lat:37.62,lon:-122.38 },
  { code:"BOS",city:"Boston",country:"États-Unis",flag:"🇺🇸",lat:42.37,lon:-71.01 },
  { code:"DFW",city:"Dallas",country:"États-Unis",flag:"🇺🇸",lat:32.90,lon:-97.04 },
  { code:"IAD",city:"Washington DC",country:"États-Unis",flag:"🇺🇸",lat:38.94,lon:-77.46 },
  { code:"YYZ",city:"Toronto",country:"Canada",flag:"🇨🇦",lat:43.68,lon:-79.63 },
  { code:"YUL",city:"Montréal",country:"Canada",flag:"🇨🇦",lat:45.47,lon:-73.74 },
  { code:"GRU",city:"São Paulo",country:"Brésil",flag:"🇧🇷",lat:-23.43,lon:-46.47 },
  { code:"GIG",city:"Rio de Janeiro",country:"Brésil",flag:"🇧🇷",lat:-22.81,lon:-43.25 },
  { code:"EZE",city:"Buenos Aires",country:"Argentine",flag:"🇦🇷",lat:-34.82,lon:-58.54 },
  { code:"BOG",city:"Bogotá",country:"Colombie",flag:"🇨🇴",lat:4.70,lon:-74.14 },
  { code:"LIM",city:"Lima",country:"Pérou",flag:"🇵🇪",lat:-12.02,lon:-77.11 },
  { code:"MEX",city:"Mexico",country:"Mexique",flag:"🇲🇽",lat:19.44,lon:-99.07 },
  { code:"SYD",city:"Sydney",country:"Australie",flag:"🇦🇺",lat:-33.95,lon:151.18 },
  { code:"MEL",city:"Melbourne",country:"Australie",flag:"🇦🇺",lat:-37.67,lon:144.84 },
  { code:"AKL",city:"Auckland",country:"Nouvelle-Zélande",flag:"🇳🇿",lat:-37.01,lon:174.79 },
];

// ─── REGION MAP ──────────────────────────────────────────────
const REGION = {
  DSS:"africa",ABJ:"africa",ACC:"africa",BKO:"africa",LOS:"africa",ABV:"africa",
  OUA:"africa",COO:"africa",CKY:"africa",DLA:"africa",LBV:"africa",ADD:"africa",
  NBO:"africa",JNB:"africa",CPT:"africa",CAI:"africa",CMN:"africa",TUN:"africa",ALG:"africa",
  LHR:"europe",LGW:"europe",CDG:"europe",ORY:"europe",AMS:"europe",BRU:"europe",
  FRA:"europe",MUC:"europe",MAD:"europe",BCN:"europe",LIS:"europe",FCO:"europe",
  MXP:"europe",ZRH:"europe",GVA:"europe",IST:"europe",
  DXB:"middle-east",AUH:"middle-east",DOH:"middle-east",RUH:"middle-east",
  JED:"middle-east",BEY:"middle-east",TLV:"middle-east",
  DEL:"asia",BOM:"asia",BKK:"asia",SIN:"asia",HKG:"asia",PEK:"asia",PVG:"asia",NRT:"asia",ICN:"asia",
  JFK:"americas",EWR:"americas",LAX:"americas",ORD:"americas",MIA:"americas",ATL:"americas",
  SFO:"americas",BOS:"americas",DFW:"americas",IAD:"americas",YYZ:"americas",YUL:"americas",
  GRU:"americas",GIG:"americas",EZE:"americas",BOG:"americas",LIM:"americas",MEX:"americas",
  SYD:"oceania",MEL:"oceania",AKL:"oceania",
};

// ─── MILES PROGRAMS ──────────────────────────────────────────
const PROGRAMS = [
  {
    id:"aeroplan",name:"Air Canada Aeroplan",short:"Aeroplan",emoji:"🍁",
    alliance:"Star Alliance",allianceBg:"bg-blue-100",allianceText:"text-blue-800",
    airlines:["Air Canada","Turkish Airlines","Lufthansa","Swiss","Air India","Egyptair","Ethiopian","Brussels Airlines"],
    promoActive:true,promoLabel:"30% REMISE",promoDaysLeft:44,
    pricePMile:0.0175,stdPricePMile:0.025,taxUSD:10,lowTax:true,
    notes:"Taxes quasi nulles (~10$). Excellent sur Turkish, Lufthansa, Ethiopian.",
    chartType:"distance",
  },
  {
    id:"lifemiles",name:"Avianca LifeMiles",short:"LifeMiles",emoji:"🌿",
    alliance:"Star Alliance",allianceBg:"bg-blue-100",allianceText:"text-blue-800",
    airlines:["Turkish Airlines","Lufthansa","Air Canada","United","Egyptian","Ethiopian","Brussels"],
    promoActive:false,promoLabel:"Prochaine promo ~Avril 2026",promoDaysLeft:null,
    pricePMile:0.033,stdPricePMile:0.033,taxUSD:60,lowTax:true,
    notes:"Pas de surcharge carburant sur les partenaires. Très rentable avec promo (bonus 50-150%).",
    chartType:"zone",
  },
  {
    id:"flyingblue",name:"Flying Blue (Air France)",short:"Flying Blue",emoji:"✈️",
    alliance:"SkyTeam",allianceBg:"bg-sky-100",allianceText:"text-sky-800",
    airlines:["Air France","KLM","Delta","Kenya Airways","Tarom"],
    promoActive:true,promoLabel:"BONUS 80%",promoDaysLeft:17,
    pricePMile:0.0169,stdPricePMile:0.028,taxUSD:400,lowTax:false,
    notes:"Taxes élevées sur AF/KLM long-courrier. Mieux sur les partenaires SkyTeam.",
    chartType:"zone",
  },
  {
    id:"united",name:"United MileagePlus",short:"United",emoji:"🌐",
    alliance:"Star Alliance",allianceBg:"bg-blue-100",allianceText:"text-blue-800",
    airlines:["United Airlines","Turkish Airlines","Lufthansa","Air Canada","Ethiopian","Egyptair"],
    promoActive:true,promoLabel:"⚠️ EXPIRE DEMAIN",promoDaysLeft:0,
    pricePMile:0.0188,stdPricePMile:0.035,taxUSD:50,lowTax:true,
    notes:"Pas de surcharge carburant sur la plupart des partenaires. Bon barème Afrique-Europe.",
    chartType:"zone",
  },
  {
    id:"turkish",name:"Turkish Miles&Smiles",short:"Miles&Smiles",emoji:"🌙",
    alliance:"Star Alliance",allianceBg:"bg-blue-100",allianceText:"text-blue-800",
    airlines:["Turkish Airlines"],
    promoActive:false,promoLabel:"Attendre promo ~100% bonus",promoDaysLeft:null,
    pricePMile:0.03,stdPricePMile:0.03,taxUSD:217,lowTax:false,
    notes:"Idéal pour vol direct Turkish. Attendre une promo bonus pour réduire le coût.",
    chartType:"zone",
  },
  {
    id:"qatar",name:"Qatar Avios",short:"Qatar Avios",emoji:"🇶🇦",
    alliance:"OneWorld",allianceBg:"bg-red-100",allianceText:"text-red-800",
    airlines:["Qatar Airways","British Airways","Iberia","American Airlines","Cathay Pacific"],
    promoActive:false,promoLabel:"Prochaine promo ~Mai 2026",promoDaysLeft:null,
    pricePMile:0.023,stdPricePMile:0.023,taxUSD:80,lowTax:true,
    notes:"Excellent si promo active. Connexion via Doha. Vols Qatar disponibles sur nombreuses routes.",
    chartType:"zone",
  },
  {
    id:"ba",name:"British Airways Executive Club",short:"BA Avios",emoji:"🇬🇧",
    alliance:"OneWorld",allianceBg:"bg-red-100",allianceText:"text-red-800",
    airlines:["British Airways","Iberia","Finnair","American Airlines","Qatar Airways"],
    promoActive:false,promoLabel:"Standard",promoDaysLeft:null,
    pricePMile:0.02,stdPricePMile:0.02,taxUSD:350,lowTax:false,
    notes:"Tarif distance. Taxes élevées sur BA, mieux sur Iberia/Finnair. Fréquentes promos d'achat de miles.",
    chartType:"distance",
  },
  {
    id:"aadvantage",name:"American AAdvantage",short:"AAdvantage",emoji:"🦅",
    alliance:"OneWorld",allianceBg:"bg-red-100",allianceText:"text-red-800",
    airlines:["American Airlines","British Airways","Iberia","Qatar Airways","Cathay Pacific","Finnair"],
    promoActive:false,promoLabel:"Standard",promoDaysLeft:null,
    pricePMile:0.028,stdPricePMile:0.028,taxUSD:75,lowTax:true,
    notes:"Bon barème sur les partenaires OneWorld. Taxes modérées. Promos d'achat fréquentes.",
    chartType:"zone",
  },
];

// ─── AWARD CHARTS (miles one-way: [eco, biz]) ────────────────
const ZONE_CHARTS = {
  lifemiles:{
    africa:{africa:[5000,10000],europe:[25000,63000],"middle-east":[20000,55000],americas:[35000,80000],asia:[40000,90000],oceania:[50000,110000]},
    europe:{africa:[25000,63000],europe:[10000,25000],"middle-east":[15000,40000],americas:[30000,70000],asia:[35000,90000],oceania:[45000,110000]},
    "middle-east":{africa:[20000,55000],europe:[15000,40000],"middle-east":[8000,20000],americas:[30000,65000],asia:[25000,60000],oceania:[40000,100000]},
    americas:{africa:[35000,80000],europe:[30000,70000],"middle-east":[30000,65000],americas:[8000,20000],asia:[40000,90000],oceania:[45000,110000]},
    asia:{africa:[40000,90000],europe:[35000,90000],"middle-east":[25000,60000],americas:[40000,90000],asia:[8000,20000],oceania:[15000,40000]},
    oceania:{africa:[50000,110000],europe:[45000,110000],"middle-east":[40000,100000],americas:[45000,110000],asia:[15000,40000],oceania:[8000,20000]},
  },
  flyingblue:{
    africa:{africa:[15000,35000],europe:[30000,70000],"middle-east":[25000,60000],americas:[40000,80000],asia:[45000,90000],oceania:[55000,110000]},
    europe:{africa:[30000,70000],europe:[8000,20000],"middle-east":[15000,35000],americas:[30000,60000],asia:[35000,80000],oceania:[45000,100000]},
    "middle-east":{africa:[25000,60000],europe:[15000,35000],"middle-east":[8000,18000],americas:[30000,65000],asia:[25000,60000],oceania:[40000,95000]},
    americas:{africa:[40000,80000],europe:[30000,60000],"middle-east":[30000,65000],americas:[8000,20000],asia:[40000,85000],oceania:[50000,110000]},
    asia:{africa:[45000,90000],europe:[35000,80000],"middle-east":[25000,60000],americas:[40000,85000],asia:[8000,20000],oceania:[18000,45000]},
    oceania:{africa:[55000,110000],europe:[45000,100000],"middle-east":[40000,95000],americas:[50000,110000],asia:[18000,45000],oceania:[8000,20000]},
  },
  united:{
    africa:{africa:[15000,35000],europe:[30000,88000],"middle-east":[25000,70000],americas:[30000,80000],asia:[35000,100000],oceania:[45000,120000]},
    europe:{africa:[30000,88000],europe:[10000,30000],"middle-east":[15000,45000],americas:[30000,70000],asia:[35000,90000],oceania:[45000,115000]},
    "middle-east":{africa:[25000,70000],europe:[15000,45000],"middle-east":[8000,20000],americas:[30000,70000],asia:[25000,65000],oceania:[40000,100000]},
    americas:{africa:[30000,80000],europe:[30000,70000],"middle-east":[30000,70000],americas:[8000,20000],asia:[35000,90000],oceania:[40000,110000]},
    asia:{africa:[35000,100000],europe:[35000,90000],"middle-east":[25000,65000],americas:[35000,90000],asia:[10000,25000],oceania:[15000,40000]},
    oceania:{africa:[45000,120000],europe:[45000,115000],"middle-east":[40000,100000],americas:[40000,110000],asia:[15000,40000],oceania:[10000,25000]},
  },
  turkish:{
    africa:{africa:[8000,15000],europe:[30000,65000],"middle-east":[25000,50000],americas:[45000,90000],asia:[42500,85000],oceania:[55000,110000]},
    europe:{africa:[30000,65000],europe:[12500,30000],"middle-east":[15000,35000],americas:[35000,80000],asia:[37500,80000],oceania:[50000,105000]},
    "middle-east":{africa:[25000,50000],europe:[15000,35000],"middle-east":[8000,18000],americas:[37500,80000],asia:[30000,65000],oceania:[45000,95000]},
    americas:{africa:[45000,90000],europe:[35000,80000],"middle-east":[37500,80000],americas:[12500,27500],asia:[42500,90000],oceania:[55000,110000]},
    asia:{africa:[42500,85000],europe:[37500,80000],"middle-east":[30000,65000],americas:[42500,90000],asia:[15000,32500],oceania:[35000,70000]},
    oceania:{africa:[55000,110000],europe:[50000,105000],"middle-east":[45000,95000],americas:[55000,110000],asia:[35000,70000],oceania:[15000,35000]},
  },
  qatar:{
    africa:{africa:[10000,25000],europe:[22000,55000],"middle-east":[18000,45000],americas:[35000,80000],asia:[30000,70000],oceania:[45000,100000]},
    europe:{africa:[22000,55000],europe:[8000,20000],"middle-east":[12000,30000],americas:[30000,65000],asia:[35000,75000],oceania:[45000,100000]},
    "middle-east":{africa:[18000,45000],europe:[12000,30000],"middle-east":[5000,12000],americas:[30000,65000],asia:[20000,50000],oceania:[35000,90000]},
    americas:{africa:[35000,80000],europe:[30000,65000],"middle-east":[30000,65000],americas:[10000,25000],asia:[35000,80000],oceania:[45000,105000]},
    asia:{africa:[30000,70000],europe:[35000,75000],"middle-east":[20000,50000],americas:[35000,80000],asia:[8000,20000],oceania:[15000,35000]},
    oceania:{africa:[45000,100000],europe:[45000,100000],"middle-east":[35000,90000],americas:[45000,105000],asia:[15000,35000],oceania:[8000,20000]},
  },
  ba:{
    africa:{africa:[9000,18000],europe:[20000,50000],"middle-east":[18000,45000],americas:[30000,70000],asia:[35000,80000],oceania:[45000,100000]},
    europe:{africa:[20000,50000],europe:[8000,20000],"middle-east":[12000,32000],americas:[26000,60000],asia:[32000,72000],oceania:[43000,100000]},
    "middle-east":{africa:[18000,45000],europe:[12000,32000],"middle-east":[6000,15000],americas:[28000,65000],asia:[22000,55000],oceania:[38000,90000]},
    americas:{africa:[30000,70000],europe:[26000,60000],"middle-east":[28000,65000],americas:[9000,22000],asia:[32000,75000],oceania:[42000,100000]},
    asia:{africa:[35000,80000],europe:[32000,72000],"middle-east":[22000,55000],americas:[32000,75000],asia:[9000,22000],oceania:[16000,38000]},
    oceania:{africa:[45000,100000],europe:[43000,100000],"middle-east":[38000,90000],americas:[42000,100000],asia:[16000,38000],oceania:[9000,22000]},
  },
  aadvantage:{
    africa:{africa:[10000,22000],europe:[22500,57500],"middle-east":[20000,50000],americas:[25000,57500],asia:[35000,80000],oceania:[45000,110000]},
    europe:{africa:[22500,57500],europe:[10000,25000],"middle-east":[15000,37500],americas:[22500,57500],asia:[30000,70000],oceania:[40000,100000]},
    "middle-east":{africa:[20000,50000],europe:[15000,37500],"middle-east":[7500,17500],americas:[25000,57500],asia:[22500,55000],oceania:[35000,90000]},
    americas:{africa:[25000,57500],europe:[22500,57500],"middle-east":[25000,57500],americas:[7500,17500],asia:[30000,70000],oceania:[40000,100000]},
    asia:{africa:[35000,80000],europe:[30000,70000],"middle-east":[22500,55000],americas:[30000,70000],asia:[10000,22500],oceania:[17500,42500]},
    oceania:{africa:[45000,110000],europe:[40000,100000],"middle-east":[35000,90000],americas:[40000,100000],asia:[17500,42500],oceania:[10000,25000]},
  },
};

const AEROPLAN_BANDS = [
  [500,6000,17500],[1500,15000,37500],[2500,20000,55000],
  [4000,30000,70000],[6000,40000,85000],[9000,50000,100000],[Infinity,65000,115000],
];

const BA_BANDS = [
  [650,9000,18000],[1151,11000,22000],[2000,16500,33000],
  [3000,26500,53000],[4000,32500,65000],[5500,40000,80000],
  [6500,50000,100000],[Infinity,65000,130000],
];

function getMilesOW(programId, originCode, destCode, distMiles) {
  if (programId === "aeroplan") {
    for (const [max,eco,bus] of AEROPLAN_BANDS) if (distMiles <= max) return [eco,bus];
  }
  if (programId === "ba") {
    for (const [max,eco,bus] of BA_BANDS) if (distMiles <= max) return [eco,bus];
  }
  const oReg = REGION[originCode] || "africa";
  const dReg = REGION[destCode] || "europe";
  const chart = ZONE_CHARTS[programId];
  if (!chart?.[oReg]?.[dReg]) return [null,null];
  return chart[oReg][dReg];
}

function haversine(lat1,lon1,lat2,lon2) {
  const R=3959, dLat=((lat2-lat1)*Math.PI)/180, dLon=((lon2-lon1)*Math.PI)/180;
  const a=Math.sin(dLat/2)**2+Math.cos((lat1*Math.PI)/180)*Math.cos((lat2*Math.PI)/180)*Math.sin(dLon/2)**2;
  return Math.round(2*R*Math.atan2(Math.sqrt(a),Math.sqrt(1-a)));
}

function estimateCash(d) {
  if(d<800) return [300,900];
  if(d<2000) return [500,1500];
  if(d<4000) return [800,2500];
  if(d<7000) return [1200,3500];
  return [1600,5000];
}

const fmt = {
  xof:(n)=>n==null?"—":new Intl.NumberFormat("fr-FR").format(Math.round(n))+" FCFA",
  usd:(n)=>n==null?"—":"$"+new Intl.NumberFormat("en-US").format(Math.round(n)),
  eur:(n)=>n==null?"—":"€"+new Intl.NumberFormat("fr-FR").format(Math.round(n)),
  miles:(n)=>n==null?"—":new Intl.NumberFormat("fr-FR").format(n)+" miles",
};

// ─── AIRPORT PICKER ──────────────────────────────────────────
function AirportPicker({ label, value, onChange, exclude }) {
  const [open,setOpen]=useState(false);
  const [q,setQ]=useState("");
  const ref=useRef(null);
  const selected=AIRPORTS.find(a=>a.code===value);
  const filtered=useMemo(()=>{
    const lq=q.toLowerCase();
    return AIRPORTS.filter(a=>a.code!==exclude&&(a.code.toLowerCase().includes(lq)||a.city.toLowerCase().includes(lq)||a.country.toLowerCase().includes(lq))).slice(0,8);
  },[q,exclude]);
  useEffect(()=>{
    const h=(e)=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false)};
    document.addEventListener("mousedown",h);
    return()=>document.removeEventListener("mousedown",h);
  },[]);
  return(
    <div className="relative flex-1" ref={ref}>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">{label}</p>
      <div className={`flex items-center gap-3 p-3 rounded-2xl border-2 cursor-pointer transition-all ${open?"border-indigo-500 bg-indigo-50":"border-gray-100 bg-gray-50 hover:border-gray-300"}`}
        onClick={()=>{setOpen(!open);setQ("")}}>
        {selected?(
          <><span className="text-2xl">{selected.flag}</span>
          <div className="min-w-0">
            <div className="font-black text-gray-900 text-lg leading-none">{selected.code}</div>
            <div className="text-xs text-gray-400 truncate">{selected.city}, {selected.country}</div>
          </div></>
        ):<span className="text-gray-400 text-sm">Sélectionner...</span>}
      </div>
      {open&&(
        <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <input autoFocus className="w-full px-3 py-2 rounded-xl bg-gray-50 text-sm outline-none border border-gray-200 focus:border-indigo-400"
              placeholder="Ville, pays ou code IATA..." value={q} onChange={e=>setQ(e.target.value)}/>
          </div>
          <div className="max-h-56 overflow-y-auto">
            {filtered.length===0&&<p className="text-center text-gray-400 text-sm py-4">Aucun résultat</p>}
            {filtered.map(a=>(
              <div key={a.code} className="flex items-center gap-3 px-4 py-2.5 hover:bg-indigo-50 cursor-pointer transition-colors"
                onClick={()=>{onChange(a.code);setOpen(false)}}>
                <span className="text-xl">{a.flag}</span>
                <div><span className="font-bold text-sm text-gray-900">{a.code}</span><span className="text-gray-400 text-sm"> — {a.city}, {a.country}</span></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── FLIGHT CARD ─────────────────────────────────────────────
function FlightCard({ flight, selected, onSelect, source }) {
  const isSelected = selected;
  return(
    <div onClick={onSelect} className={`cursor-pointer rounded-xl border-2 p-3 transition-all ${isSelected?"border-indigo-500 bg-indigo-50":"border-gray-100 bg-white hover:border-indigo-200"}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${source==="google"?"bg-blue-100 text-blue-700":"bg-orange-100 text-orange-700"}`}>
              {source==="google"?"🔵 Google":"🔶 Sky"}
            </span>
            <span className="font-bold text-gray-900 text-sm">{flight.airline}</span>
            {flight.direct&&<span className="text-xs text-emerald-600 font-semibold">✅ Direct</span>}
            {!flight.direct&&<span className="text-xs text-orange-600">{flight.stops} escale(s)</span>}
          </div>
          {flight.duration&&<div className="text-xs text-gray-400">{Math.floor(flight.duration/60)}h{flight.duration%60}min</div>}
          {flight.depTime&&<div className="text-xs text-gray-500">{flight.depTime}</div>}
        </div>
        <div className="text-right ml-3">
          <div className="text-xl font-black text-gray-900">{fmt.usd(flight.price)}</div>
          <div className="text-xs text-gray-400">{fmt.xof(flight.price*USD_XOF)}</div>
          {isSelected&&<div className="text-xs text-indigo-600 font-bold mt-0.5">✓ Sélectionné</div>}
        </div>
      </div>
    </div>
  );
}

// ─── MILES CARD ──────────────────────────────────────────────
function MilesCard({ program, result, rank, cashUSD, cabin }) {
  const [expanded,setExpanded]=useState(rank===0);
  if(!result) return null;
  const savings=cashUSD-result.totalUSD;
  const savingsPct=Math.round((savings/cashUSD)*100);
  const isBetter=savings>0;
  const rankColors={
    0:{border:"border-yellow-400",bg:"bg-yellow-50",badge:"🥇"},
    1:{border:"border-gray-300",bg:"bg-white",badge:"🥈"},
    2:{border:"border-orange-300",bg:"bg-white",badge:"🥉"},
  };
  const style=rankColors[rank]||{border:"border-gray-100",bg:"bg-white",badge:""};
  return(
    <div className={`rounded-2xl border-2 ${style.border} ${style.bg} overflow-hidden`}>
      {rank<3&&<div className={`h-1 ${rank===0?"bg-yellow-400":rank===1?"bg-gray-300":"bg-orange-300"}`}/>}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {style.badge&&<span className="text-2xl">{style.badge}</span>}
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg">{program.emoji}</span>
                <span className="font-black text-gray-900">{program.short}</span>
              </div>
              <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${program.allianceBg} ${program.allianceText}`}>{program.alliance}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-gray-900">{fmt.usd(result.totalUSD)}</div>
            <div className="text-xs text-gray-500">{fmt.xof(result.totalXOF)}</div>
            {isBetter?(
              <div className="text-emerald-600 font-bold text-sm">-{fmt.usd(savings)} ({savingsPct}%)</div>
            ):(
              <div className="text-red-500 font-bold text-sm">+{fmt.usd(-savings)} plus cher</div>
            )}
          </div>
        </div>

        {program.promoActive&&(
          <div className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 font-bold text-xs px-2.5 py-1 rounded-full mb-3">
            🔥 {program.promoLabel}{program.promoDaysLeft!==null&&` · ${program.promoDaysLeft}j restants`}
          </div>
        )}
        {!program.promoActive&&program.promoDaysLeft===null&&(
          <div className="text-xs text-gray-400 italic mb-2">{program.promoLabel}</div>
        )}

        <div className={`rounded-xl p-3 mb-3 cursor-pointer ${rank===0?"bg-yellow-100":"bg-gray-50"}`} onClick={()=>setExpanded(!expanded)}>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">A/R {cabin===1?"Business":"Économie"} — via miles</span>
            <span className="text-xs text-gray-400">{expanded?"▲":"▼"} détails</span>
          </div>
        </div>

        {expanded&&(
          <div className="space-y-2 text-sm mb-3">
            <div className="flex justify-between py-1.5 border-b border-gray-100">
              <span className="text-gray-500">Miles nécessaires (A/R)</span>
              <span className="font-bold">{fmt.miles(result.milesRT)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-gray-100">
              <span className="text-gray-500">Prix par mile</span>
              <span className={`font-bold ${program.promoActive?"text-emerald-600":""}`}>${result.ppm.toFixed(4)} {program.promoActive&&"🔥"}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-gray-100">
              <span className="text-gray-500">Coût achat miles</span>
              <span className="font-bold">{fmt.usd(result.milesCostUSD)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-gray-100">
              <span className="text-gray-500">Taxes & frais</span>
              <span className={`font-bold ${program.lowTax?"text-emerald-600":"text-orange-500"}`}>~{fmt.usd(result.taxes)} {program.lowTax?"✅":"⚠️"}</span>
            </div>
            <div className="flex justify-between py-1.5 bg-gray-50 rounded-lg px-2">
              <span className="font-bold text-gray-700">TOTAL</span>
              <div className="text-right">
                <div className="font-black">{fmt.usd(result.totalUSD)}</div>
                <div className="text-xs text-gray-400">{fmt.xof(result.totalXOF)}</div>
              </div>
            </div>
          </div>
        )}

        <p className="text-xs text-gray-400 italic">{program.notes}</p>

        {program.airlines.length>0&&(
          <div className="mt-2">
            <p className="text-xs text-gray-400 mb-1">Compagnies éligibles :</p>
            <p className="text-xs text-gray-500">{program.airlines.join(" · ")}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────
export default function App() {
  const [origin,setOrigin]=useState("DSS");
  const [dest,setDest]=useState("IST");
  const [depDate,setDepDate]=useState(addDays(today,30));
  const [retDate,setRetDate]=useState(addDays(today,40));
  const [cabin,setCabin]=useState(1);
  const [passengers,setPassengers]=useState(1);

  const [googleFlights,setGoogleFlights]=useState(null);
  const [skyFlights,setSkyFlights]=useState(null);
  const [gLoading,setGLoading]=useState(false);
  const [sLoading,setSLoading]=useState(false);
  const [gError,setGError]=useState(null);
  const [sError,setSError]=useState(null);
  const [searched,setSearched]=useState(false);
  const [selectedFlightPrice,setSelectedFlightPrice]=useState(null);

  const origA=AIRPORTS.find(a=>a.code===origin);
  const destA=AIRPORTS.find(a=>a.code===dest);
  const distMiles=useMemo(()=>origA&&destA?haversine(origA.lat,origA.lon,destA.lat,destA.lon):0,[origA,destA]);

  // Extract all flights from APIs
  const googleList = useMemo(()=>{
    if(!googleFlights) return [];
    const all=[...(googleFlights.best_flights||[]),...(googleFlights.other_flights||[])];
    return all.map(f=>({
      price:f.price,
      airline:f.flights?.[0]?.airline||"—",
      direct:(f.flights?.length||1)===1&&(f.layovers?.length||0)===0,
      stops:f.layovers?.length||0,
      duration:f.total_duration,
      depTime:f.flights?.[0]?.departure_airport?.time,
    })).filter(f=>f.price).sort((a,b)=>a.price-b.price).slice(0,5);
  },[googleFlights]);

  const skyList = useMemo(()=>{
    if(!skyFlights) return [];
    const its=skyFlights.data?.itineraries||[];
    return its.map(it=>({
      price:it.price?.raw,
      airline:it.legs?.[0]?.carriers?.marketing?.[0]?.name||"—",
      direct:(it.legs?.[0]?.stopCount||0)===0,
      stops:it.legs?.[0]?.stopCount||0,
      duration:it.legs?.[0]?.durationInMinutes,
      depTime:it.legs?.[0]?.departure,
    })).filter(f=>f.price).sort((a,b)=>a.price-b.price).slice(0,5);
  },[skyFlights]);

  const bestApiPrice = useMemo(()=>{
    const prices=[...googleList,...skyList].map(f=>f.price).filter(Boolean);
    return prices.length>0?Math.min(...prices):null;
  },[googleList,skyList]);

  const [estEco,estBus]=useMemo(()=>estimateCash(distMiles),[distMiles]);
  const estPrice=cabin===1?estBus:estEco;
  const cashUSD=selectedFlightPrice??bestApiPrice??estPrice;
  const isRealPrice=!!(selectedFlightPrice||bestApiPrice);

  const handleSearch = useCallback(async()=>{
    if(!origin||!dest||origin===dest) return;
    setSearched(true);
    setGoogleFlights(null);
    setSkyFlights(null);
    setGError(null);
    setSError(null);
    setSelectedFlightPrice(null);

    setGLoading(true);
    setSLoading(true);

    const qg=new URLSearchParams({origin,dest,depDate,retDate,cabin:String(cabin),passengers:String(passengers)});
    const qs=new URLSearchParams({origin,dest,depDate,retDate,cabin:String(cabin),passengers:String(passengers)});

    fetch(`/api/google-flights?${qg}`)
      .then(r=>r.json())
      .then(d=>{setGoogleFlights(d);setGLoading(false);})
      .catch(e=>{setGError(e.message);setGLoading(false);});

    fetch(`/api/skyscanner?${qs}`)
      .then(r=>r.json())
      .then(d=>{setSkyFlights(d);setSLoading(false);})
      .catch(e=>{setSError(e.message);setSLoading(false);});
  },[origin,dest,depDate,retDate,cabin,passengers]);

  const milesResults = useMemo(()=>{
    return PROGRAMS.map(program=>{
      const [ecoOW,busOW]=getMilesOW(program.id,origin,dest,distMiles);
      const milesOW=cabin===1?busOW:ecoOW;
      if(milesOW==null) return {program,result:null};
      const milesRT=milesOW*2;
      const ppm=program.pricePMile;
      const milesCostUSD=milesRT*ppm;
      const totalUSD=milesCostUSD+program.taxUSD;
      return {
        program,
        result:{milesOW,milesRT,ppm,milesCostUSD,taxes:program.taxUSD,totalUSD,totalXOF:totalUSD*USD_XOF,totalEUR:totalUSD*USD_EUR}
      };
    })
    .filter(x=>x.result!==null)
    .sort((a,b)=>a.result.totalUSD-b.result.totalUSD);
  },[origin,dest,cabin,distMiles]);

  const bestMiles=milesResults[0];
  const milesSavings=bestMiles?.result?cashUSD-bestMiles.result.totalUSD:null;

  const loading=gLoading||sLoading;
  const allFlights=[...googleList.map(f=>({...f,source:"google"})),...skyList.map(f=>({...f,source:"sky"}))].sort((a,b)=>a.price-b.price);

  return(
    <div className="min-h-screen p-4 pb-12" style={{background:"linear-gradient(135deg,#0f172a 0%,#1e3a5f 50%,#0f172a 100%)"}}>
      <div className="max-w-lg mx-auto">

        {/* HEADER */}
        <div className="text-center py-6">
          <div className="text-5xl mb-2">🧳</div>
          <h1 className="text-3xl font-black text-white tracking-tight">Miles Optimizer</h1>
          <p className="text-blue-300 text-sm mt-1">Trouvez le moins cher : cash ou miles</p>
        </div>

        {/* SEARCH FORM */}
        <div className="bg-white rounded-3xl shadow-2xl p-5 mb-5">
          <div className="flex items-end gap-2 mb-4">
            <AirportPicker label="Départ" value={origin} onChange={v=>{setOrigin(v);setSearched(false)}} exclude={dest}/>
            <button onClick={()=>{setOrigin(dest);setDest(origin);setSearched(false)}}
              className="mb-1 w-10 h-10 rounded-full bg-gray-100 hover:bg-indigo-100 text-gray-500 flex items-center justify-center text-lg transition-colors flex-shrink-0">⇄</button>
            <AirportPicker label="Destination" value={dest} onChange={v=>{setDest(v);setSearched(false)}} exclude={origin}/>
          </div>

          <div className="flex gap-3 mb-4">
            <div className="flex-1">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Aller</p>
              <input type="date" value={depDate} onChange={e=>setDepDate(e.target.value)}
                className="w-full p-2.5 rounded-xl border-2 border-gray-100 bg-gray-50 text-sm focus:border-indigo-400 outline-none"/>
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Retour</p>
              <input type="date" value={retDate} onChange={e=>setRetDate(e.target.value)}
                className="w-full p-2.5 rounded-xl border-2 border-gray-100 bg-gray-50 text-sm focus:border-indigo-400 outline-none"/>
            </div>
          </div>

          <div className="flex gap-3 mb-4">
            <div className="flex-1">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Classe</p>
              <div className="flex gap-2">
                {[{val:1,icon:"💼",label:"Business"},{val:0,icon:"🪑",label:"Éco"}].map(({val,icon,label})=>(
                  <button key={val} onClick={()=>setCabin(val)}
                    className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl font-bold text-sm transition-all ${cabin===val?"bg-indigo-600 text-white shadow-lg":"bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                    {icon} {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="w-24">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Passagers</p>
              <select value={passengers} onChange={e=>setPassengers(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border-2 border-gray-100 bg-gray-50 text-sm focus:border-indigo-400 outline-none">
                {[1,2,3,4,5,6].map(n=><option key={n} value={n}>{n} adulte{n>1?"s":""}</option>)}
              </select>
            </div>
          </div>

          <button onClick={handleSearch} disabled={!origin||!dest||origin===dest||loading}
            className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-base transition-all shadow-lg shadow-indigo-200 disabled:opacity-40 disabled:cursor-not-allowed">
            {loading?"✈️ Recherche en cours...":"🔍 Rechercher les vols"}
          </button>
        </div>

        {/* RESULTS */}
        {searched&&(
          <>
            {/* Route bar */}
            <div className="flex items-center justify-center mb-4">
              <div className="flex items-center gap-2 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-full px-4 py-2 text-white text-sm">
                <span>{origA?.flag} {origin}</span>
                <span className="text-indigo-300">→</span>
                <span>{destA?.flag} {dest}</span>
                <span className="text-indigo-400 mx-1">·</span>
                <span className="text-indigo-200">{distMiles.toLocaleString()} mi</span>
                <span className="text-indigo-400 mx-1">·</span>
                <span className="text-indigo-200">{cabin===1?"Business":"Économie"}</span>
                {passengers>1&&<><span className="text-indigo-400 mx-1">·</span><span className="text-indigo-200">{passengers} pax</span></>}
              </div>
            </div>

            {/* Loading indicators */}
            {(gLoading||sLoading)&&(
              <div className="bg-white bg-opacity-10 border border-white border-opacity-20 rounded-2xl p-5 mb-4 text-center">
                <div className="text-3xl mb-2 animate-bounce">✈️</div>
                <p className="text-white font-bold">Recherche des vols en cours...</p>
                <div className="flex justify-center gap-4 mt-2 text-xs">
                  <span className={`flex items-center gap-1 ${gLoading?"text-blue-300 animate-pulse":"text-emerald-400"}`}>
                    {gLoading?"🔵 Google Flights...":"✅ Google Flights"}
                  </span>
                  <span className={`flex items-center gap-1 ${sLoading?"text-orange-300 animate-pulse":"text-emerald-400"}`}>
                    {sLoading?"🔶 Skyscanner...":"✅ Skyscanner"}
                  </span>
                </div>
              </div>
            )}

            {/* Flight results */}
            {!loading&&allFlights.length>0&&(
              <div className="mb-4">
                <p className="text-indigo-300 text-xs font-bold uppercase tracking-widest mb-3">
                  ✈️ {allFlights.length} VOL(S) TROUVÉ(S) — SÉLECTIONNEZ POUR COMPARER
                </p>
                <div className="space-y-2">
                  {allFlights.map((f,i)=>(
                    <FlightCard key={i} flight={f} source={f.source}
                      selected={selectedFlightPrice===f.price}
                      onSelect={()=>setSelectedFlightPrice(selectedFlightPrice===f.price?null:f.price)}/>
                  ))}
                </div>
              </div>
            )}

            {/* Errors */}
            {!loading&&allFlights.length===0&&(gError||sError)&&(
              <div className="bg-white bg-opacity-5 border border-white border-opacity-10 rounded-2xl p-4 mb-4">
                <p className="text-indigo-300 text-sm font-bold mb-1">⚠️ Données en temps réel indisponibles</p>
                <p className="text-indigo-400 text-xs">Comparaison basée sur les prix estimés du marché.</p>
              </div>
            )}

            {/* Cash price bar */}
            <div className="flex items-center justify-between bg-white bg-opacity-10 border border-white border-opacity-20 rounded-2xl px-4 py-3 mb-4">
              <div>
                <p className="text-white font-bold text-sm">
                  {isRealPrice
                    ? selectedFlightPrice?"💵 Prix sélectionné":"💵 Meilleur prix trouvé"
                    : "💵 Prix cash estimé"}
                </p>
                <p className="text-indigo-300 text-xs">
                  {isRealPrice
                    ? "Source: Google Flights / Skyscanner (en temps réel)"
                    : "Estimation marché — lancez la recherche pour un vrai prix"}
                </p>
              </div>
              <div className="text-right">
                <div className="text-white font-black text-xl">{fmt.usd(cashUSD)}</div>
                <div className="text-indigo-300 text-xs">{fmt.xof(cashUSD*USD_XOF)} · {fmt.eur(cashUSD*USD_EUR)}</div>
              </div>
            </div>

            {/* Best miles recommendation */}
            {bestMiles&&milesSavings!==null&&(
              <div className={`rounded-2xl px-4 py-3 mb-4 flex items-center gap-3 ${milesSavings>0?"bg-emerald-500 bg-opacity-20 border border-emerald-400 border-opacity-30":"bg-orange-500 bg-opacity-20 border border-orange-400 border-opacity-30"}`}>
                <span className="text-2xl">{milesSavings>0?"💰":"💡"}</span>
                <div>
                  {milesSavings>0?(
                    <>
                      <p className="text-emerald-300 font-bold text-sm">Meilleure option : {bestMiles.program.short}</p>
                      <p className="text-white font-black">Économie de {fmt.usd(milesSavings)} ({Math.round((milesSavings/cashUSD)*100)}%) vs billet cash</p>
                    </>
                  ):(
                    <>
                      <p className="text-orange-300 font-bold text-sm">Cash moins cher que les miles ici</p>
                      <p className="text-white text-sm">Le billet cash est {fmt.usd(-milesSavings)} moins cher que le meilleur programme miles</p>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Miles comparison */}
            <p className="text-indigo-300 text-xs font-bold uppercase tracking-widest mb-3">
              📊 {milesResults.length} PROGRAMMES MILES — CLASSÉS PAR PRIX CROISSANT
            </p>
            <div className="space-y-3">
              {milesResults.map(({program,result},i)=>(
                <MilesCard key={program.id} program={program} result={result} rank={i} cashUSD={cashUSD} cabin={cabin}/>
              ))}
            </div>

            {/* Disclaimer */}
            <div className="mt-5 rounded-2xl bg-white bg-opacity-5 border border-white border-opacity-10 p-4 text-indigo-300 text-xs leading-relaxed">
              <p className="font-bold mb-1">⚠️ Informations importantes</p>
              <p>Les prix des vols proviennent de Google Flights et Skyscanner en temps réel. Les coûts en miles sont basés sur les barèmes officiels et les promos du moment. La disponibilité des sièges prime peut varier — vérifiez toujours sur le site officiel du programme avant d'acheter des miles.</p>
            </div>
          </>
        )}

        {/* Footer */}
        <div className="text-center mt-6 text-indigo-600 text-xs">
          <p>1 USD = {USD_XOF} FCFA · 1 USD = {USD_EUR}€</p>
          <p className="mt-1">Miles Optimizer · Par Saloum</p>
        </div>
      </div>
    </div>
  );
}
