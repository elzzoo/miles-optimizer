import { useState, useMemo, useRef, useEffect } from "react";

// ─── DATE HELPERS (module level) ─────────────────────────────
const today = new Date();
const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate()+n); return r.toISOString().split("T")[0]; };

// ─── API KEYS ─────────────────────────────────────────────────
const SERPAPI_KEY = "e7bffc5ecd6f2cdea398e0dfd1489e4d8c8dac14636bb82f17d9434950567cab";
const RAPIDAPI_KEY = "7a33df2553msh195ddaf40ee376ep180429jsn506b3d5c2fcf";
const RAPIDAPI_HOST = "sky-scrapper.p.rapidapi.com";

// ─── GOOGLE FLIGHTS via SerpAPI ───────────────────────────────
async function fetchGoogleFlights(origin, dest, depDate, retDate, cabin) {
  const travelClass = cabin === 1 ? 3 : 1; // 1=economy, 3=business
  const params = new URLSearchParams({
    engine: "google_flights",
    departure_id: origin,
    arrival_id: dest,
    outbound_date: depDate,
    currency: "USD",
    hl: "fr",
    travel_class: travelClass,
    api_key: SERPAPI_KEY,
  });
  if (retDate) params.set("return_date", retDate);
  const res = await fetch(`https://serpapi.com/search.json?${params}`);
  if (!res.ok) throw new Error(`Google Flights: ${res.status}`);
  return res.json();
}

// ─── SKYSCANNER via RapidAPI Sky Scrapper ─────────────────────
const RH = { "x-rapidapi-key": RAPIDAPI_KEY, "x-rapidapi-host": RAPIDAPI_HOST };

async function getEntityId(iata) {
  const res = await fetch(
    `https://${RAPIDAPI_HOST}/api/v1/flights/searchAirport?query=${iata}&locale=en-US`,
    { headers: RH }
  );
  const json = await res.json();
  const match = json.data?.find(
    (a) => a.navigation?.relevantFlightParams?.skyId === iata
  );
  return match?.navigation?.relevantFlightParams || null;
}

async function fetchSkyscanner(origin, dest, depDate, retDate, cabin) {
  const [origE, destE] = await Promise.all([getEntityId(origin), getEntityId(dest)]);
  if (!origE || !destE) throw new Error("Aéroport non trouvé");
  const cabinClass = cabin === 1 ? "business" : "economy";
  const params = new URLSearchParams({
    originSkyId: origE.skyId,
    destinationSkyId: destE.skyId,
    originEntityId: origE.entityId,
    destinationEntityId: destE.entityId,
    date: depDate,
    cabinClass,
    adults: "1",
    currency: "USD",
    market: "FR",
    locale: "fr-FR",
  });
  if (retDate) params.set("returnDate", retDate);
  const res = await fetch(
    `https://${RAPIDAPI_HOST}/api/v2/flights/searchFlights?${params}`,
    { headers: RH }
  );
  if (!res.ok) throw new Error(`Skyscanner: ${res.status}`);
  return res.json();
}

// ─── EXCHANGE RATES ───────────────────────────────────────────
const USD_XOF = 568;
const USD_EUR = 0.92;
const LAST_UPDATED = "Mars 2026";

// ─── AIRPORTS DATABASE (200+ aéroports mondiaux) ─────────────
const AIRPORTS = [
  // ── AFRIQUE DE L'OUEST ──
  { code: "DSS", city: "Dakar", country: "Sénégal", flag: "🇸🇳", lat: 14.67, lon: -17.07 },
  { code: "ABJ", city: "Abidjan", country: "Côte d'Ivoire", flag: "🇨🇮", lat: 5.26, lon: -3.93 },
  { code: "ACC", city: "Accra", country: "Ghana", flag: "🇬🇭", lat: 5.61, lon: -0.17 },
  { code: "BKO", city: "Bamako", country: "Mali", flag: "🇲🇱", lat: 12.54, lon: -7.95 },
  { code: "COO", city: "Cotonou", country: "Bénin", flag: "🇧🇯", lat: 6.36, lon: 2.38 },
  { code: "LOS", city: "Lagos", country: "Nigeria", flag: "🇳🇬", lat: 6.58, lon: 3.32 },
  { code: "ABV", city: "Abuja", country: "Nigeria", flag: "🇳🇬", lat: 9.00, lon: 7.26 },
  { code: "OUA", city: "Ouagadougou", country: "Burkina Faso", flag: "🇧🇫", lat: 12.35, lon: -1.51 },
  { code: "CKY", city: "Conakry", country: "Guinée", flag: "🇬🇳", lat: 9.58, lon: -13.61 },
  { code: "FNA", city: "Freetown", country: "Sierra Leone", flag: "🇸🇱", lat: 8.62, lon: -13.19 },
  { code: "ROB", city: "Monrovia", country: "Liberia", flag: "🇱🇷", lat: 6.23, lon: -10.36 },
  { code: "LFW", city: "Lomé", country: "Togo", flag: "🇹🇬", lat: 6.16, lon: 1.25 },
  { code: "BXO", city: "Bissau", country: "Guinée-Bissau", flag: "🇬🇼", lat: 11.90, lon: -15.65 },
  { code: "NKC", city: "Nouakchott", country: "Mauritanie", flag: "🇲🇷", lat: 18.10, lon: -15.95 },
  { code: "SID", city: "Sal", country: "Cap-Vert", flag: "🇨🇻", lat: 16.74, lon: -22.95 },
  { code: "KAN", city: "Kano", country: "Nigeria", flag: "🇳🇬", lat: 12.05, lon: 8.52 },
  // ── AFRIQUE CENTRALE ──
  { code: "DLA", city: "Douala", country: "Cameroun", flag: "🇨🇲", lat: 4.01, lon: 9.72 },
  { code: "NSI", city: "Yaoundé", country: "Cameroun", flag: "🇨🇲", lat: 3.72, lon: 11.55 },
  { code: "LBV", city: "Libreville", country: "Gabon", flag: "🇬🇦", lat: 0.46, lon: 9.41 },
  { code: "FIH", city: "Kinshasa", country: "RD Congo", flag: "🇨🇩", lat: -4.39, lon: 15.44 },
  { code: "BZV", city: "Brazzaville", country: "Congo", flag: "🇨🇬", lat: -4.25, lon: 15.25 },
  { code: "BGF", city: "Bangui", country: "RCA", flag: "🇨🇫", lat: 4.40, lon: 18.52 },
  { code: "SSG", city: "Malabo", country: "Guinée Équatoriale", flag: "🇬🇶", lat: 3.76, lon: 8.71 },
  { code: "NDJ", city: "N'Djamena", country: "Tchad", flag: "🇹🇩", lat: 12.13, lon: 15.03 },
  // ── AFRIQUE DE L'EST ──
  { code: "ADD", city: "Addis Abeba", country: "Éthiopie", flag: "🇪🇹", lat: 8.98, lon: 38.80 },
  { code: "NBO", city: "Nairobi", country: "Kenya", flag: "🇰🇪", lat: -1.32, lon: 36.93 },
  { code: "MBA", city: "Mombasa", country: "Kenya", flag: "🇰🇪", lat: -4.03, lon: 39.59 },
  { code: "DAR", city: "Dar es Salaam", country: "Tanzanie", flag: "🇹🇿", lat: -6.88, lon: 39.20 },
  { code: "JRO", city: "Kilimandjaro", country: "Tanzanie", flag: "🇹🇿", lat: -3.43, lon: 37.07 },
  { code: "KGL", city: "Kigali", country: "Rwanda", flag: "🇷🇼", lat: -1.97, lon: 30.14 },
  { code: "EBB", city: "Entebbe", country: "Ouganda", flag: "🇺🇬", lat: 0.04, lon: 32.44 },
  { code: "BJM", city: "Bujumbura", country: "Burundi", flag: "🇧🇮", lat: -3.32, lon: 29.32 },
  { code: "MGQ", city: "Mogadiscio", country: "Somalie", flag: "🇸🇴", lat: 2.01, lon: 45.30 },
  { code: "HGA", city: "Hargeisa", country: "Somaliland", flag: "🇸🇴", lat: 9.52, lon: 44.09 },
  { code: "ASM", city: "Asmara", country: "Érythrée", flag: "🇪🇷", lat: 15.29, lon: 38.91 },
  { code: "DJI", city: "Djibouti", country: "Djibouti", flag: "🇩🇯", lat: 11.55, lon: 43.16 },
  // ── AFRIQUE DU NORD ──
  { code: "CAI", city: "Le Caire", country: "Égypte", flag: "🇪🇬", lat: 30.12, lon: 31.41 },
  { code: "HBE", city: "Alexandrie", country: "Égypte", flag: "🇪🇬", lat: 31.18, lon: 29.95 },
  { code: "CMN", city: "Casablanca", country: "Maroc", flag: "🇲🇦", lat: 33.37, lon: -7.59 },
  { code: "RAK", city: "Marrakech", country: "Maroc", flag: "🇲🇦", lat: 31.61, lon: -8.04 },
  { code: "TNG", city: "Tanger", country: "Maroc", flag: "🇲🇦", lat: 35.73, lon: -5.92 },
  { code: "ALG", city: "Alger", country: "Algérie", flag: "🇩🇿", lat: 36.69, lon: 3.22 },
  { code: "TUN", city: "Tunis", country: "Tunisie", flag: "🇹🇳", lat: 36.85, lon: 10.23 },
  { code: "TIP", city: "Tripoli", country: "Libye", flag: "🇱🇾", lat: 32.66, lon: 13.16 },
  { code: "KRT", city: "Khartoum", country: "Soudan", flag: "🇸🇩", lat: 15.59, lon: 32.55 },
  // ── AFRIQUE DU SUD & AUSTRALE ──
  { code: "JNB", city: "Johannesburg", country: "Afrique du Sud", flag: "🇿🇦", lat: -26.14, lon: 28.24 },
  { code: "CPT", city: "Le Cap", country: "Afrique du Sud", flag: "🇿🇦", lat: -33.96, lon: 18.60 },
  { code: "DUR", city: "Durban", country: "Afrique du Sud", flag: "🇿🇦", lat: -29.97, lon: 30.95 },
  { code: "HRE", city: "Harare", country: "Zimbabwe", flag: "🇿🇼", lat: -17.93, lon: 31.09 },
  { code: "LUN", city: "Lusaka", country: "Zambie", flag: "🇿🇲", lat: -15.33, lon: 28.45 },
  { code: "BLZ", city: "Blantyre", country: "Malawi", flag: "🇲🇼", lat: -15.68, lon: 34.97 },
  { code: "MPM", city: "Maputo", country: "Mozambique", flag: "🇲🇿", lat: -25.92, lon: 32.57 },
  { code: "WDH", city: "Windhoek", country: "Namibie", flag: "🇳🇦", lat: -22.48, lon: 17.47 },
  { code: "GBE", city: "Gaborone", country: "Botswana", flag: "🇧🇼", lat: -24.56, lon: 25.92 },
  { code: "TNR", city: "Antananarivo", country: "Madagascar", flag: "🇲🇬", lat: -18.80, lon: 47.48 },
  { code: "MRU", city: "Mahébourg", country: "Maurice", flag: "🇲🇺", lat: -20.43, lon: 57.68 },
  { code: "SEZ", city: "Mahe", country: "Seychelles", flag: "🇸🇨", lat: -4.67, lon: 55.52 },
  // ── EUROPE DE L'OUEST ──
  { code: "LHR", city: "Londres", country: "Royaume-Uni", flag: "🇬🇧", lat: 51.48, lon: -0.45 },
  { code: "LGW", city: "Londres Gatwick", country: "Royaume-Uni", flag: "🇬🇧", lat: 51.15, lon: -0.18 },
  { code: "MAN", city: "Manchester", country: "Royaume-Uni", flag: "🇬🇧", lat: 53.35, lon: -2.27 },
  { code: "CDG", city: "Paris CDG", country: "France", flag: "🇫🇷", lat: 49.01, lon: 2.55 },
  { code: "ORY", city: "Paris Orly", country: "France", flag: "🇫🇷", lat: 48.73, lon: 2.38 },
  { code: "NCE", city: "Nice", country: "France", flag: "🇫🇷", lat: 43.66, lon: 7.21 },
  { code: "LYS", city: "Lyon", country: "France", flag: "🇫🇷", lat: 45.72, lon: 5.08 },
  { code: "AMS", city: "Amsterdam", country: "Pays-Bas", flag: "🇳🇱", lat: 52.31, lon: 4.77 },
  { code: "BRU", city: "Bruxelles", country: "Belgique", flag: "🇧🇪", lat: 50.90, lon: 4.48 },
  { code: "FRA", city: "Francfort", country: "Allemagne", flag: "🇩🇪", lat: 50.03, lon: 8.57 },
  { code: "MUC", city: "Munich", country: "Allemagne", flag: "🇩🇪", lat: 48.35, lon: 11.79 },
  { code: "BER", city: "Berlin", country: "Allemagne", flag: "🇩🇪", lat: 52.37, lon: 13.50 },
  { code: "HAM", city: "Hambourg", country: "Allemagne", flag: "🇩🇪", lat: 53.63, lon: 10.00 },
  { code: "MAD", city: "Madrid", country: "Espagne", flag: "🇪🇸", lat: 40.47, lon: -3.57 },
  { code: "BCN", city: "Barcelone", country: "Espagne", flag: "🇪🇸", lat: 41.30, lon: 2.08 },
  { code: "LIS", city: "Lisbonne", country: "Portugal", flag: "🇵🇹", lat: 38.77, lon: -9.13 },
  { code: "OPO", city: "Porto", country: "Portugal", flag: "🇵🇹", lat: 41.24, lon: -8.68 },
  { code: "FCO", city: "Rome", country: "Italie", flag: "🇮🇹", lat: 41.80, lon: 12.25 },
  { code: "MXP", city: "Milan", country: "Italie", flag: "🇮🇹", lat: 45.63, lon: 8.72 },
  { code: "VCE", city: "Venise", country: "Italie", flag: "🇮🇹", lat: 45.50, lon: 12.35 },
  { code: "ZRH", city: "Zurich", country: "Suisse", flag: "🇨🇭", lat: 47.46, lon: 8.55 },
  { code: "GVA", city: "Genève", country: "Suisse", flag: "🇨🇭", lat: 46.24, lon: 6.11 },
  { code: "VIE", city: "Vienne", country: "Autriche", flag: "🇦🇹", lat: 48.11, lon: 16.57 },
  { code: "CPH", city: "Copenhague", country: "Danemark", flag: "🇩🇰", lat: 55.62, lon: 12.66 },
  { code: "ARN", city: "Stockholm", country: "Suède", flag: "🇸🇪", lat: 59.65, lon: 17.92 },
  { code: "OSL", city: "Oslo", country: "Norvège", flag: "🇳🇴", lat: 60.20, lon: 11.08 },
  { code: "HEL", city: "Helsinki", country: "Finlande", flag: "🇫🇮", lat: 60.32, lon: 24.96 },
  { code: "DUB", city: "Dublin", country: "Irlande", flag: "🇮🇪", lat: 53.43, lon: -6.27 },
  { code: "ATH", city: "Athènes", country: "Grèce", flag: "🇬🇷", lat: 37.94, lon: 23.95 },
  { code: "SKG", city: "Thessalonique", country: "Grèce", flag: "🇬🇷", lat: 40.52, lon: 22.97 },
  // ── EUROPE DE L'EST & BALKANS ──
  { code: "IST", city: "Istanbul", country: "Turquie", flag: "🇹🇷", lat: 41.00, lon: 28.97 },
  { code: "SAW", city: "Istanbul Sabiha", country: "Turquie", flag: "🇹🇷", lat: 40.90, lon: 29.31 },
  { code: "AYT", city: "Antalya", country: "Turquie", flag: "🇹🇷", lat: 36.90, lon: 30.80 },
  { code: "WAW", city: "Varsovie", country: "Pologne", flag: "🇵🇱", lat: 52.17, lon: 20.97 },
  { code: "PRG", city: "Prague", country: "Tchéquie", flag: "🇨🇿", lat: 50.10, lon: 14.26 },
  { code: "BUD", city: "Budapest", country: "Hongrie", flag: "🇭🇺", lat: 47.44, lon: 19.26 },
  { code: "OTP", city: "Bucarest", country: "Roumanie", flag: "🇷🇴", lat: 44.57, lon: 26.10 },
  { code: "SOF", city: "Sofia", country: "Bulgarie", flag: "🇧🇬", lat: 42.70, lon: 23.41 },
  { code: "BEG", city: "Belgrade", country: "Serbie", flag: "🇷🇸", lat: 44.82, lon: 20.29 },
  { code: "ZAG", city: "Zagreb", country: "Croatie", flag: "🇭🇷", lat: 45.74, lon: 16.07 },
  { code: "SVO", city: "Moscou Sheremetyevo", country: "Russie", flag: "🇷🇺", lat: 55.97, lon: 37.41 },
  { code: "LED", city: "Saint-Pétersbourg", country: "Russie", flag: "🇷🇺", lat: 59.80, lon: 30.26 },
  { code: "KBP", city: "Kiev", country: "Ukraine", flag: "🇺🇦", lat: 50.34, lon: 30.89 },
  { code: "TBS", city: "Tbilissi", country: "Géorgie", flag: "🇬🇪", lat: 41.67, lon: 44.95 },
  { code: "EVN", city: "Erevan", country: "Arménie", flag: "🇦🇲", lat: 40.15, lon: 44.40 },
  { code: "GYD", city: "Bakou", country: "Azerbaïdjan", flag: "🇦🇿", lat: 40.47, lon: 50.04 },
  // ── MOYEN-ORIENT ──
  { code: "DXB", city: "Dubaï", country: "EAU", flag: "🇦🇪", lat: 25.25, lon: 55.37 },
  { code: "AUH", city: "Abu Dhabi", country: "EAU", flag: "🇦🇪", lat: 24.44, lon: 54.65 },
  { code: "SHJ", city: "Sharjah", country: "EAU", flag: "🇦🇪", lat: 25.33, lon: 55.52 },
  { code: "DOH", city: "Doha", country: "Qatar", flag: "🇶🇦", lat: 25.27, lon: 51.61 },
  { code: "KWI", city: "Koweït", country: "Koweït", flag: "🇰🇼", lat: 29.23, lon: 47.97 },
  { code: "BAH", city: "Bahreïn", country: "Bahreïn", flag: "🇧🇭", lat: 26.27, lon: 50.63 },
  { code: "MCT", city: "Mascate", country: "Oman", flag: "🇴🇲", lat: 23.59, lon: 58.28 },
  { code: "RUH", city: "Riyad", country: "Arabie Saoudite", flag: "🇸🇦", lat: 24.96, lon: 46.70 },
  { code: "JED", city: "Djeddah", country: "Arabie Saoudite", flag: "🇸🇦", lat: 21.68, lon: 39.16 },
  { code: "MED", city: "Médine", country: "Arabie Saoudite", flag: "🇸🇦", lat: 24.55, lon: 39.70 },
  { code: "DMM", city: "Dammam", country: "Arabie Saoudite", flag: "🇸🇦", lat: 26.47, lon: 49.80 },
  { code: "AMM", city: "Amman", country: "Jordanie", flag: "🇯🇴", lat: 31.72, lon: 35.99 },
  { code: "BEY", city: "Beyrouth", country: "Liban", flag: "🇱🇧", lat: 33.82, lon: 35.49 },
  { code: "TLV", city: "Tel Aviv", country: "Israël", flag: "🇮🇱", lat: 32.01, lon: 34.89 },
  { code: "BGW", city: "Bagdad", country: "Irak", flag: "🇮🇶", lat: 33.26, lon: 44.23 },
  { code: "IKA", city: "Téhéran", country: "Iran", flag: "🇮🇷", lat: 35.41, lon: 51.15 },
  { code: "SAH", city: "Sanaa", country: "Yémen", flag: "🇾🇪", lat: 15.48, lon: 44.22 },
  // ── ASIE DU SUD ──
  { code: "DEL", city: "New Delhi", country: "Inde", flag: "🇮🇳", lat: 28.56, lon: 77.10 },
  { code: "BOM", city: "Mumbai", country: "Inde", flag: "🇮🇳", lat: 19.09, lon: 72.87 },
  { code: "BLR", city: "Bangalore", country: "Inde", flag: "🇮🇳", lat: 13.20, lon: 77.71 },
  { code: "MAA", city: "Chennai", country: "Inde", flag: "🇮🇳", lat: 12.99, lon: 80.18 },
  { code: "HYD", city: "Hyderabad", country: "Inde", flag: "🇮🇳", lat: 17.23, lon: 78.43 },
  { code: "CCU", city: "Calcutta", country: "Inde", flag: "🇮🇳", lat: 22.65, lon: 88.45 },
  { code: "CMB", city: "Colombo", country: "Sri Lanka", flag: "🇱🇰", lat: 7.18, lon: 79.88 },
  { code: "KHI", city: "Karachi", country: "Pakistan", flag: "🇵🇰", lat: 24.90, lon: 67.16 },
  { code: "LHE", city: "Lahore", country: "Pakistan", flag: "🇵🇰", lat: 31.52, lon: 74.40 },
  { code: "ISB", city: "Islamabad", country: "Pakistan", flag: "🇵🇰", lat: 33.62, lon: 73.10 },
  { code: "DAC", city: "Dhaka", country: "Bangladesh", flag: "🇧🇩", lat: 23.84, lon: 90.40 },
  { code: "KTM", city: "Katmandou", country: "Népal", flag: "🇳🇵", lat: 27.70, lon: 85.36 },
  // ── ASIE DU SUD-EST ──
  { code: "BKK", city: "Bangkok", country: "Thaïlande", flag: "🇹🇭", lat: 13.69, lon: 100.75 },
  { code: "HKT", city: "Phuket", country: "Thaïlande", flag: "🇹🇭", lat: 8.11, lon: 98.32 },
  { code: "SIN", city: "Singapour", country: "Singapour", flag: "🇸🇬", lat: 1.36, lon: 103.99 },
  { code: "KUL", city: "Kuala Lumpur", country: "Malaisie", flag: "🇲🇾", lat: 2.74, lon: 101.70 },
  { code: "CGK", city: "Jakarta", country: "Indonésie", flag: "🇮🇩", lat: -6.13, lon: 106.65 },
  { code: "DPS", city: "Bali", country: "Indonésie", flag: "🇮🇩", lat: -8.75, lon: 115.17 },
  { code: "MNL", city: "Manille", country: "Philippines", flag: "🇵🇭", lat: 14.51, lon: 121.02 },
  { code: "CEB", city: "Cebu", country: "Philippines", flag: "🇵🇭", lat: 10.31, lon: 124.00 },
  { code: "SGN", city: "Hô Chi Minh", country: "Vietnam", flag: "🇻🇳", lat: 10.82, lon: 106.66 },
  { code: "HAN", city: "Hanoï", country: "Vietnam", flag: "🇻🇳", lat: 21.22, lon: 105.81 },
  { code: "DAD", city: "Da Nang", country: "Vietnam", flag: "🇻🇳", lat: 16.04, lon: 108.20 },
  { code: "PNH", city: "Phnom Penh", country: "Cambodge", flag: "🇰🇭", lat: 11.55, lon: 104.84 },
  { code: "VTE", city: "Vientiane", country: "Laos", flag: "🇱🇦", lat: 17.99, lon: 102.56 },
  { code: "RGN", city: "Rangoun", country: "Myanmar", flag: "🇲🇲", lat: 16.91, lon: 96.13 },
  // ── ASIE DE L'EST ──
  { code: "PEK", city: "Pékin", country: "Chine", flag: "🇨🇳", lat: 40.08, lon: 116.58 },
  { code: "PVG", city: "Shanghai Pudong", country: "Chine", flag: "🇨🇳", lat: 31.14, lon: 121.80 },
  { code: "SHA", city: "Shanghai Hongqiao", country: "Chine", flag: "🇨🇳", lat: 31.20, lon: 121.34 },
  { code: "CAN", city: "Guangzhou", country: "Chine", flag: "🇨🇳", lat: 23.39, lon: 113.30 },
  { code: "SZX", city: "Shenzhen", country: "Chine", flag: "🇨🇳", lat: 22.64, lon: 113.81 },
  { code: "CTU", city: "Chengdu", country: "Chine", flag: "🇨🇳", lat: 30.58, lon: 103.95 },
  { code: "XIY", city: "Xi'an", country: "Chine", flag: "🇨🇳", lat: 34.45, lon: 108.75 },
  { code: "HKG", city: "Hong Kong", country: "Hong Kong", flag: "🇭🇰", lat: 22.31, lon: 113.91 },
  { code: "MFM", city: "Macao", country: "Macao", flag: "🇲🇴", lat: 22.15, lon: 113.59 },
  { code: "TPE", city: "Taipei", country: "Taïwan", flag: "🇹🇼", lat: 25.08, lon: 121.23 },
  { code: "ICN", city: "Séoul", country: "Corée du Sud", flag: "🇰🇷", lat: 37.46, lon: 126.44 },
  { code: "GMP", city: "Séoul Gimpo", country: "Corée du Sud", flag: "🇰🇷", lat: 37.56, lon: 126.80 },
  { code: "NRT", city: "Tokyo Narita", country: "Japon", flag: "🇯🇵", lat: 35.77, lon: 140.39 },
  { code: "HND", city: "Tokyo Haneda", country: "Japon", flag: "🇯🇵", lat: 35.55, lon: 139.78 },
  { code: "KIX", city: "Osaka", country: "Japon", flag: "🇯🇵", lat: 34.43, lon: 135.24 },
  { code: "CTS", city: "Sapporo", country: "Japon", flag: "🇯🇵", lat: 42.78, lon: 141.69 },
  { code: "ULN", city: "Oulan-Bator", country: "Mongolie", flag: "🇲🇳", lat: 47.84, lon: 106.77 },
  // ── AMÉRIQUE DU NORD ──
  { code: "JFK", city: "New York JFK", country: "USA", flag: "🇺🇸", lat: 40.64, lon: -73.78 },
  { code: "EWR", city: "Newark", country: "USA", flag: "🇺🇸", lat: 40.69, lon: -74.17 },
  { code: "LGA", city: "New York LaGuardia", country: "USA", flag: "🇺🇸", lat: 40.78, lon: -73.87 },
  { code: "LAX", city: "Los Angeles", country: "USA", flag: "🇺🇸", lat: 33.94, lon: -118.41 },
  { code: "ORD", city: "Chicago O'Hare", country: "USA", flag: "🇺🇸", lat: 41.98, lon: -87.91 },
  { code: "MDW", city: "Chicago Midway", country: "USA", flag: "🇺🇸", lat: 41.79, lon: -87.75 },
  { code: "MIA", city: "Miami", country: "USA", flag: "🇺🇸", lat: 25.80, lon: -80.29 },
  { code: "ATL", city: "Atlanta", country: "USA", flag: "🇺🇸", lat: 33.64, lon: -84.43 },
  { code: "DFW", city: "Dallas", country: "USA", flag: "🇺🇸", lat: 32.90, lon: -97.04 },
  { code: "IAH", city: "Houston", country: "USA", flag: "🇺🇸", lat: 29.98, lon: -95.34 },
  { code: "SFO", city: "San Francisco", country: "USA", flag: "🇺🇸", lat: 37.62, lon: -122.38 },
  { code: "SEA", city: "Seattle", country: "USA", flag: "🇺🇸", lat: 47.45, lon: -122.31 },
  { code: "BOS", city: "Boston", country: "USA", flag: "🇺🇸", lat: 42.37, lon: -71.02 },
  { code: "DCA", city: "Washington DC", country: "USA", flag: "🇺🇸", lat: 38.85, lon: -77.04 },
  { code: "IAD", city: "Washington Dulles", country: "USA", flag: "🇺🇸", lat: 38.94, lon: -77.46 },
  { code: "LAS", city: "Las Vegas", country: "USA", flag: "🇺🇸", lat: 36.08, lon: -115.15 },
  { code: "DEN", city: "Denver", country: "USA", flag: "🇺🇸", lat: 39.86, lon: -104.67 },
  { code: "PHX", city: "Phoenix", country: "USA", flag: "🇺🇸", lat: 33.44, lon: -112.01 },
  { code: "MSP", city: "Minneapolis", country: "USA", flag: "🇺🇸", lat: 44.88, lon: -93.22 },
  { code: "DTW", city: "Detroit", country: "USA", flag: "🇺🇸", lat: 42.21, lon: -83.35 },
  { code: "PHL", city: "Philadelphie", country: "USA", flag: "🇺🇸", lat: 39.87, lon: -75.24 },
  { code: "CLT", city: "Charlotte", country: "USA", flag: "🇺🇸", lat: 35.21, lon: -80.94 },
  { code: "HNL", city: "Honolulu", country: "USA", flag: "🇺🇸", lat: 21.33, lon: -157.93 },
  { code: "ANC", city: "Anchorage", country: "USA", flag: "🇺🇸", lat: 61.17, lon: -149.99 },
  { code: "YYZ", city: "Toronto", country: "Canada", flag: "🇨🇦", lat: 43.68, lon: -79.63 },
  { code: "YUL", city: "Montréal", country: "Canada", flag: "🇨🇦", lat: 45.47, lon: -73.74 },
  { code: "YVR", city: "Vancouver", country: "Canada", flag: "🇨🇦", lat: 49.19, lon: -123.18 },
  { code: "YYC", city: "Calgary", country: "Canada", flag: "🇨🇦", lat: 51.13, lon: -114.01 },
  { code: "YEG", city: "Edmonton", country: "Canada", flag: "🇨🇦", lat: 53.31, lon: -113.58 },
  { code: "MEX", city: "Mexico", country: "Mexique", flag: "🇲🇽", lat: 19.44, lon: -99.07 },
  { code: "GDL", city: "Guadalajara", country: "Mexique", flag: "🇲🇽", lat: 20.52, lon: -103.31 },
  { code: "MTY", city: "Monterrey", country: "Mexique", flag: "🇲🇽", lat: 25.78, lon: -100.11 },
  { code: "CUN", city: "Cancun", country: "Mexique", flag: "🇲🇽", lat: 21.04, lon: -86.88 },
  // ── CARAÏBES & AMÉRIQUE CENTRALE ──
  { code: "HAV", city: "La Havane", country: "Cuba", flag: "🇨🇺", lat: 22.99, lon: -82.41 },
  { code: "SDQ", city: "Saint-Domingue", country: "Rép. Dominicaine", flag: "🇩🇴", lat: 18.43, lon: -69.67 },
  { code: "MBJ", city: "Montego Bay", country: "Jamaïque", flag: "🇯🇲", lat: 18.50, lon: -77.91 },
  { code: "PTP", city: "Pointe-à-Pitre", country: "Guadeloupe", flag: "🇬🇵", lat: 16.27, lon: -61.53 },
  { code: "FDF", city: "Fort-de-France", country: "Martinique", flag: "🇲🇶", lat: 14.59, lon: -61.00 },
  { code: "SJU", city: "San Juan", country: "Porto Rico", flag: "🇵🇷", lat: 18.44, lon: -66.00 },
  { code: "GUA", city: "Guatemala City", country: "Guatemala", flag: "🇬🇹", lat: 14.58, lon: -90.53 },
  { code: "SAP", city: "San Pedro Sula", country: "Honduras", flag: "🇭🇳", lat: 15.45, lon: -87.92 },
  { code: "SAL", city: "San Salvador", country: "El Salvador", flag: "🇸🇻", lat: 13.44, lon: -89.06 },
  { code: "MGA", city: "Managua", country: "Nicaragua", flag: "🇳🇮", lat: 12.14, lon: -86.17 },
  { code: "SJO", city: "San José", country: "Costa Rica", flag: "🇨🇷", lat: 9.99, lon: -84.21 },
  { code: "PTY", city: "Panama City", country: "Panama", flag: "🇵🇦", lat: 9.07, lon: -79.38 },
  // ── AMÉRIQUE DU SUD ──
  { code: "GRU", city: "São Paulo", country: "Brésil", flag: "🇧🇷", lat: -23.43, lon: -46.47 },
  { code: "GIG", city: "Rio de Janeiro", country: "Brésil", flag: "🇧🇷", lat: -22.81, lon: -43.25 },
  { code: "BSB", city: "Brasilia", country: "Brésil", flag: "🇧🇷", lat: -15.87, lon: -47.92 },
  { code: "FOR", city: "Fortaleza", country: "Brésil", flag: "🇧🇷", lat: -3.78, lon: -38.53 },
  { code: "REC", city: "Recife", country: "Brésil", flag: "🇧🇷", lat: -8.13, lon: -34.92 },
  { code: "EZE", city: "Buenos Aires", country: "Argentine", flag: "🇦🇷", lat: -34.82, lon: -58.54 },
  { code: "COR", city: "Córdoba", country: "Argentine", flag: "🇦🇷", lat: -31.31, lon: -64.21 },
  { code: "SCL", city: "Santiago", country: "Chili", flag: "🇨🇱", lat: -33.39, lon: -70.79 },
  { code: "LIM", city: "Lima", country: "Pérou", flag: "🇵🇪", lat: -12.02, lon: -77.11 },
  { code: "BOG", city: "Bogotá", country: "Colombie", flag: "🇨🇴", lat: 4.70, lon: -74.15 },
  { code: "MDE", city: "Medellín", country: "Colombie", flag: "🇨🇴", lat: 6.16, lon: -75.42 },
  { code: "CTG", city: "Carthagène", country: "Colombie", flag: "🇨🇴", lat: 10.44, lon: -75.51 },
  { code: "UIO", city: "Quito", country: "Équateur", flag: "🇪🇨", lat: -0.13, lon: -78.36 },
  { code: "GYE", city: "Guayaquil", country: "Équateur", flag: "🇪🇨", lat: -2.16, lon: -79.88 },
  { code: "CCS", city: "Caracas", country: "Venezuela", flag: "🇻🇪", lat: 10.60, lon: -66.99 },
  { code: "ASU", city: "Asunción", country: "Paraguay", flag: "🇵🇾", lat: -25.24, lon: -57.52 },
  { code: "MVD", city: "Montevideo", country: "Uruguay", flag: "🇺🇾", lat: -34.84, lon: -56.03 },
  { code: "LPB", city: "La Paz", country: "Bolivie", flag: "🇧🇴", lat: -16.51, lon: -68.19 },
  { code: "GEO", city: "Georgetown", country: "Guyana", flag: "🇬🇾", lat: 6.50, lon: -58.25 },
  { code: "PBM", city: "Paramaribo", country: "Suriname", flag: "🇸🇷", lat: 5.45, lon: -55.19 },
  // ── OCÉANIE ──
  { code: "SYD", city: "Sydney", country: "Australie", flag: "🇦🇺", lat: -33.94, lon: 151.18 },
  { code: "MEL", city: "Melbourne", country: "Australie", flag: "🇦🇺", lat: -37.67, lon: 144.84 },
  { code: "BNE", city: "Brisbane", country: "Australie", flag: "🇦🇺", lat: -27.38, lon: 153.12 },
  { code: "PER", city: "Perth", country: "Australie", flag: "🇦🇺", lat: -31.94, lon: 115.97 },
  { code: "ADL", city: "Adélaïde", country: "Australie", flag: "🇦🇺", lat: -34.95, lon: 138.53 },
  { code: "AKL", city: "Auckland", country: "Nouvelle-Zélande", flag: "🇳🇿", lat: -37.01, lon: 174.79 },
  { code: "CHC", city: "Christchurch", country: "Nouvelle-Zélande", flag: "🇳🇿", lat: -43.49, lon: 172.53 },
  { code: "NAN", city: "Nadi", country: "Fidji", flag: "🇫🇯", lat: -17.76, lon: 177.44 },
  { code: "PPT", city: "Papeete", country: "Polynésie française", flag: "🇵🇫", lat: -17.56, lon: -149.61 },
  { code: "NOU", city: "Nouméa", country: "Nouvelle-Calédonie", flag: "🇳🇨", lat: -22.02, lon: 166.21 },
  { code: "GUM", city: "Guam", country: "Guam", flag: "🇬🇺", lat: 13.48, lon: 144.80 },
];

// ─── REGION MAPPING ───────────────────────────────────────────
const REGION = {
  // Afrique de l'Ouest
  DSS:"africa", ABJ:"africa", ACC:"africa", BKO:"africa", COO:"africa",
  LOS:"africa", ABV:"africa", OUA:"africa", CKY:"africa", FNA:"africa",
  ROB:"africa", LFW:"africa", BXO:"africa", NKC:"africa", SID:"africa", KAN:"africa",
  // Afrique Centrale
  DLA:"africa", NSI:"africa", LBV:"africa", FIH:"africa", BZV:"africa",
  BGF:"africa", SSG:"africa", NDJ:"africa",
  // Afrique de l'Est
  ADD:"africa", NBO:"africa", MBA:"africa", DAR:"africa", JRO:"africa",
  KGL:"africa", EBB:"africa", BJM:"africa", MGQ:"africa", HGA:"africa",
  ASM:"africa", DJI:"africa",
  // Afrique du Nord
  CAI:"africa", HBE:"africa", CMN:"africa", RAK:"africa", TNG:"africa",
  ALG:"africa", TUN:"africa", TIP:"africa", KRT:"africa",
  // Afrique Australe
  JNB:"africa", CPT:"africa", DUR:"africa", HRE:"africa", LUN:"africa",
  BLZ:"africa", MPM:"africa", WDH:"africa", GBE:"africa", TNR:"africa",
  MRU:"africa", SEZ:"africa",
  // Europe Ouest
  LHR:"europe", LGW:"europe", MAN:"europe", CDG:"europe", ORY:"europe",
  NCE:"europe", LYS:"europe", AMS:"europe", BRU:"europe", FRA:"europe",
  MUC:"europe", BER:"europe", HAM:"europe", MAD:"europe", BCN:"europe",
  LIS:"europe", OPO:"europe", FCO:"europe", MXP:"europe", VCE:"europe",
  ZRH:"europe", GVA:"europe", VIE:"europe", CPH:"europe", ARN:"europe",
  OSL:"europe", HEL:"europe", DUB:"europe", ATH:"europe", SKG:"europe",
  // Europe Est
  IST:"europe", SAW:"europe", AYT:"europe", WAW:"europe", PRG:"europe",
  BUD:"europe", OTP:"europe", SOF:"europe", BEG:"europe", ZAG:"europe",
  SVO:"europe", LED:"europe", KBP:"europe", TBS:"europe", EVN:"europe", GYD:"europe",
  // Moyen-Orient
  DXB:"middle-east", AUH:"middle-east", SHJ:"middle-east", DOH:"middle-east",
  KWI:"middle-east", BAH:"middle-east", MCT:"middle-east", RUH:"middle-east",
  JED:"middle-east", MED:"middle-east", DMM:"middle-east", AMM:"middle-east",
  BEY:"middle-east", TLV:"middle-east", BGW:"middle-east", IKA:"middle-east",
  SAH:"middle-east",
  // Asie du Sud
  DEL:"asia", BOM:"asia", BLR:"asia", MAA:"asia", HYD:"asia", CCU:"asia",
  CMB:"asia", KHI:"asia", LHE:"asia", ISB:"asia", DAC:"asia", KTM:"asia",
  // Asie du Sud-Est
  BKK:"asia", HKT:"asia", SIN:"asia", KUL:"asia", CGK:"asia", DPS:"asia",
  MNL:"asia", CEB:"asia", SGN:"asia", HAN:"asia", DAD:"asia", PNH:"asia",
  VTE:"asia", RGN:"asia",
  // Asie de l'Est
  PEK:"asia", PVG:"asia", SHA:"asia", CAN:"asia", SZX:"asia", CTU:"asia",
  XIY:"asia", HKG:"asia", MFM:"asia", TPE:"asia", ICN:"asia", GMP:"asia",
  NRT:"asia", HND:"asia", KIX:"asia", CTS:"asia", ULN:"asia",
  // Amériques Nord
  JFK:"americas", EWR:"americas", LGA:"americas", LAX:"americas", ORD:"americas",
  MDW:"americas", MIA:"americas", ATL:"americas", DFW:"americas", IAH:"americas",
  SFO:"americas", SEA:"americas", BOS:"americas", DCA:"americas", IAD:"americas",
  LAS:"americas", DEN:"americas", PHX:"americas", MSP:"americas", DTW:"americas",
  PHL:"americas", CLT:"americas", HNL:"americas", ANC:"americas",
  YYZ:"americas", YUL:"americas", YVR:"americas", YYC:"americas", YEG:"americas",
  MEX:"americas", GDL:"americas", MTY:"americas", CUN:"americas",
  // Caraïbes & Amérique Centrale
  HAV:"americas", SDQ:"americas", MBJ:"americas", PTP:"americas", FDF:"americas",
  SJU:"americas", GUA:"americas", SAP:"americas", SAL:"americas", MGA:"americas",
  SJO:"americas", PTY:"americas",
  // Amérique du Sud
  GRU:"americas", GIG:"americas", BSB:"americas", FOR:"americas", REC:"americas",
  EZE:"americas", COR:"americas", SCL:"americas", LIM:"americas", BOG:"americas",
  MDE:"americas", CTG:"americas", UIO:"americas", GYE:"americas", CCS:"americas",
  ASU:"americas", MVD:"americas", LPB:"americas", GEO:"americas", PBM:"americas",
  // Océanie
  SYD:"oceania", MEL:"oceania", BNE:"oceania", PER:"oceania", ADL:"oceania",
  AKL:"oceania", CHC:"oceania", NAN:"oceania", PPT:"oceania", NOU:"oceania", GUM:"oceania",
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
    notes: "Taxes quasi nulles (~10$). Idéal pour les vols Turkish Airlines (Star Alliance).",
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
    notes: "Taxes modérées. Bon rapport qualité/prix sur les vols Star Alliance.",
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
    notes: "Programme Air France/KLM. Bon pour les destinations desservies par AF/KLM.",
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
    notes: "Promo expire bientôt. Idéal pour vols United et Star Alliance.",
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
    notes: "Programme Turkish Airlines. Attendre une promo (~100% bonus) pour réduire le coût.",
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
    notes: "Excellent si promo active. Fonctionne sur les vols Qatar Airways (1 escale possible à Doha).",
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
  const now = new Date();
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
function ResultCard({ program, result, rank, cabin, origin, dest }) {
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
                <span className="text-xs text-gray-400">{origin} → {dest}</span>
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
  const [depDate, setDepDate] = useState(addDays(today, 30));
  const [retDate, setRetDate] = useState(addDays(today, 40));
  const [cabin, setCabin] = useState(1); // 0=eco 1=business
  const [searched, setSearched] = useState(true);
  const [googleResults, setGoogleResults] = useState(null);
  const [skyResults, setSkyResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [googleError, setGoogleError] = useState(null);
  const [skyError, setSkyError] = useState(null);

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

  const bestGooglePrice = useMemo(() => {
    const all = [...(googleResults?.best_flights || []), ...(googleResults?.other_flights || [])];
    return all.length > 0 ? Math.min(...all.map(f => f.price).filter(Boolean)) : null;
  }, [googleResults]);

  const bestSkyPrice = useMemo(() => {
    const its = skyResults?.data?.itineraries || [];
    return its.length > 0 ? Math.min(...its.map(it => it.price?.raw).filter(Boolean)) : null;
  }, [skyResults]);

  const bestRealPrice = bestGooglePrice && bestSkyPrice
    ? Math.min(bestGooglePrice, bestSkyPrice)
    : bestGooglePrice ?? bestSkyPrice ?? null;

  const cashUSD = bestRealPrice ?? (cabin === 1 ? cashBus : cashEco);
  const isRealPrice = !!bestRealPrice;

  const activePromos = PROGRAMS.filter(
    (p) => p.promoStatus === "active" || p.promoStatus === "expiring"
  );

  const handleSearch = async () => {
    if (!origin || !dest || origin === dest) return;
    setSearched(true);
    setSearchLoading(true);
    setGoogleResults(null);
    setSkyResults(null);
    setGoogleError(null);
    setSkyError(null);

    await Promise.allSettled([
      fetchGoogleFlights(origin, dest, depDate, retDate, cabin)
        .then(setGoogleResults)
        .catch(e => setGoogleError(e.message)),
      fetchSkyscanner(origin, dest, depDate, retDate, cabin)
        .then(setSkyResults)
        .catch(e => setSkyError(e.message)),
    ]);

    setSearchLoading(false);
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
              onClick={() => { setOrigin(dest); setDest(origin); }}
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
                  onClick={() => setCabin(val)}
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
            disabled={!origin || !dest || origin === dest || searchLoading}
            className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-base transition-all shadow-lg shadow-indigo-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {searchLoading ? "✈️ Recherche en cours..." : "🔍 Comparer les programmes"}
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

            {/* ── REAL-TIME FLIGHT RESULTS ── */}
            {searchLoading && (
              <div className="bg-white bg-opacity-10 border border-white border-opacity-20 rounded-2xl p-6 mb-4 text-center">
                <div className="text-3xl mb-2">✈️</div>
                <p className="text-indigo-200 font-bold text-sm">Recherche des vols en cours...</p>
                <p className="text-indigo-400 text-xs mt-1">Google Flights + Skyscanner</p>
              </div>
            )}

            {!searchLoading && (googleResults || skyResults || googleError || skyError) && (
              <div className="space-y-3 mb-4">

                {/* Google Flights Results */}
                <div className="bg-white bg-opacity-10 border border-white border-opacity-20 rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 pt-3 pb-2">
                    <p className="text-white font-bold text-sm">🔵 Google Flights</p>
                    {googleError && <span className="text-red-400 text-xs">{googleError}</span>}
                    {bestGooglePrice && <span className="text-emerald-300 font-bold text-xs">Meilleur: {fmt.usd(bestGooglePrice)}</span>}
                  </div>
                  {googleResults && (() => {
                    const flights = [...(googleResults.best_flights || []), ...(googleResults.other_flights || [])].slice(0, 4);
                    return flights.length === 0 ? (
                      <p className="text-indigo-400 text-xs px-4 pb-3">Aucun vol trouvé</p>
                    ) : (
                      <div className="divide-y divide-white divide-opacity-10">
                        {flights.map((f, i) => {
                          const leg = f.flights?.[0];
                          const stops = (f.flights?.length || 1) - 1;
                          return (
                            <div key={i} className="flex items-center justify-between px-4 py-2.5">
                              <div>
                                <div className="text-white text-sm font-bold">{leg?.airline || "—"}</div>
                                <div className="text-indigo-300 text-xs">
                                  {stops === 0 ? "✅ Direct" : `${stops} escale(s)`}
                                  {leg?.departure_airport?.time && ` · ${String(leg.departure_airport.time).slice(0,10)}`}
                                </div>
                                {f.total_duration && (
                                  <div className="text-indigo-400 text-xs">{Math.floor(f.total_duration/60)}h{f.total_duration%60}min</div>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="text-white font-black">{fmt.usd(f.price)}</div>
                                <div className="text-indigo-300 text-xs">{fmt.xof(f.price * USD_XOF)}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

                {/* Skyscanner Results */}
                <div className="bg-white bg-opacity-10 border border-white border-opacity-20 rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 pt-3 pb-2">
                    <p className="text-white font-bold text-sm">🔶 Skyscanner</p>
                    {skyError && <span className="text-red-400 text-xs">{skyError}</span>}
                    {bestSkyPrice && <span className="text-emerald-300 font-bold text-xs">Meilleur: {fmt.usd(bestSkyPrice)}</span>}
                  </div>
                  {skyResults && (() => {
                    const its = skyResults.data?.itineraries?.slice(0, 4) || [];
                    return its.length === 0 ? (
                      <p className="text-indigo-400 text-xs px-4 pb-3">Aucun vol trouvé</p>
                    ) : (
                      <div className="divide-y divide-white divide-opacity-10">
                        {its.map((it, i) => {
                          const leg = it.legs?.[0];
                          const carrier = leg?.carriers?.marketing?.[0]?.name || "—";
                          return (
                            <div key={i} className="flex items-center justify-between px-4 py-2.5">
                              <div>
                                <div className="text-white text-sm font-bold">{carrier}</div>
                                <div className="text-indigo-300 text-xs">
                                  {leg?.stopCount === 0 ? "✅ Direct" : `${leg?.stopCount ?? "?"} escale(s)`}
                                  {leg?.departure && ` · ${String(leg.departure).slice(0,10)}`}
                                </div>
                                {leg?.durationInMinutes && (
                                  <div className="text-indigo-400 text-xs">{Math.floor(leg.durationInMinutes/60)}h{leg.durationInMinutes%60}min</div>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="text-white font-black">{fmt.usd(it.price?.raw)}</div>
                                <div className="text-indigo-300 text-xs">{fmt.xof((it.price?.raw || 0) * USD_XOF)}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

              </div>
            )}

            {/* Cash comparison bar */}
            <div className="flex items-center justify-between bg-white bg-opacity-10 border border-white border-opacity-20 rounded-2xl px-4 py-3 mb-4">
              <div>
                <p className="text-white font-bold text-sm">
                  {isRealPrice ? "💵 Meilleur prix cash trouvé" : "💵 Prix cash (estimation)"}
                </p>
                <p className="text-indigo-300 text-xs">
                  {isRealPrice
                    ? `A/R ${cabin === 1 ? "Business" : "Économie"} — source: Google Flights / Skyscanner`
                    : `A/R ${cabin === 1 ? "Business" : "Économie"} — prix indicatif`}
                </p>
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
                  origin={origin}
                  dest={dest}
                />
              ))}
            </div>

            {/* Disclaimer */}
            <div className="mt-5 rounded-2xl bg-white bg-opacity-5 border border-white border-opacity-10 p-4 text-indigo-300 text-xs leading-relaxed">
              <p className="font-bold mb-1">⚠️ Informations importantes</p>
              <p>
                Les prix cash sont indicatifs — utilisez Skyscanner ou Google Flights pour les vrais prix. Les coûts en miles sont calculés selon les barèmes officiels de <strong>mars 2026</strong>. Vérifiez toujours la disponibilité et le prix exact sur le site officiel du programme avant d'acheter des miles.
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
