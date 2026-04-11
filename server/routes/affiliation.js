import { Router } from "express";
import { PROGRAMS } from "../data/programs.js";

const router = Router();

// Build a static bookingUrl lookup from PROGRAMS
const BOOKING_URLS = Object.fromEntries(PROGRAMS.map(p => [p.id, p.bookingUrl]));

// Parse optional AFFILIATE_LINKS env var once at startup
let affiliateLinks = {};
try {
  if (process.env.AFFILIATE_LINKS) {
    affiliateLinks = JSON.parse(process.env.AFFILIATE_LINKS);
  }
} catch {
  console.warn("[affiliation] AFFILIATE_LINKS is not valid JSON — using bookingUrl fallback for all programs");
}

// In-memory click log (max 1000 entries)
const clickLog = [];
const MAX_LOG = 1000;

function buildDynamicUrl(programId, origin, dest, depDate) {
  const o = (origin || "").toUpperCase();
  const d = (dest || "").toUpperCase();
  // Format YYMMDD for Aviasales
  const aviasalesDate = depDate ? (() => {
    const dt = new Date(depDate + "T12:00:00");
    const yy = String(dt.getFullYear()).slice(2);
    const mm = String(dt.getMonth() + 1).padStart(2, "0");
    const dd = String(dt.getDate()).padStart(2, "0");
    return yy + mm + dd;
  })() : "";

  const map = {
    aeroplan:    o && d && depDate ? `https://www.aircanada.com/aeroplan/redeem/availability/outbound?org0=${o}&dest0=${d}&departureDate=${depDate}&lang=fr-CA&tripType=O&marketCode=INT` : null,
    flyingblue:  o && d && depDate ? `https://wwws.airfrance.fr/recherche/vols?origin=${o}&destination=${d}&outwardDate=${depDate}&cabinClass=ECONOMY&passengerCount=1&tripType=ONE_WAY` : null,
    lifemiles:   o && d && depDate ? `https://www.lifemiles.com/miles/redeem/search?origin=${o}&destination=${d}&departureDate=${depDate}&adults=1&cabin=Y` : null,
    ba:          o && d ? `https://www.britishairways.com/en-gb/flights/offers/avios-flights?departurePoint=${o}&destinationPoint=${d}` : null,
    aadvantage:  o && d && depDate ? `https://www.aa.com/booking/search?locale=fr_FR&pax=1&adult=1&type=OneWay&searchType=Award&carriers=ALL&fromStation=${o}&toStation=${d}&departDate=${depDate}` : null,
    united:      o && d && depDate ? `https://www.united.com/en/us/book-flight/united-awards/search?f=${o}&t=${d}&d=${depDate}&tt=1&sc=7&px=1&taxng=1&newHP=True` : null,
    turkish:     "https://www.turkishairlines.com/fr-fr/miles-smiles/utiliser-vos-miles/vols-miles/",
    fidelys:     "https://fidelys.tunisair.com/en/use-miles",
    sindbad:     "https://www.royalairmaroc.com/fr-fr/fidelite/sindbad/utiliser-mes-miles",
    asantemiles: "https://www.kenya-airways.com/fr/flying-blue/utiliser-mes-miles/",
    safarflyer:  "https://www.airalgerie.dz/fr/safar-flyer",
    aegean:      "https://en.aegeanair.com/miles-bonus/use-miles/award-flights/",
    shebamiles:  "https://www.ethiopianairlines.com/fr/shebamiles/use-miles",
  };
  return map[programId] || null;
}

router.get("/go", (req, res) => {
  const { program, origin, dest, cabin, ref } = req.query;

  if (!program || !BOOKING_URLS[program]) {
    return res.status(400).json({ error: "Unknown program" });
  }

  // Log click
  clickLog.push({
    program,
    origin: origin ? origin.slice(0, 8) : null,
    dest: dest ? dest.slice(0, 8) : null,
    cabin: cabin ? cabin.slice(0, 4) : null,
    ref: ref ? ref.slice(0, 128) : null,
    ts: new Date().toISOString(),
  });
  if (clickLog.length > MAX_LOG) clickLog.shift();

  // If called via fetch (analytics ping from MilesCard), return 200 — navigation is handled client-side
  const isFetch = req.headers["sec-fetch-mode"] === "cors" ||
    req.headers["sec-fetch-mode"] === "no-cors" ||
    (req.headers["accept"] && !req.headers["accept"].includes("text/html"));
  if (isFetch) {
    return res.json({ ok: true });
  }

  // For direct navigation (fallback), redirect to booking URL
  const affiliateUrl = affiliateLinks[program];
  const dynamicUrl = buildDynamicUrl(program, origin, dest, req.query.depDate);
  const candidate = dynamicUrl || (affiliateUrl && affiliateUrl.startsWith("https://")) ? (dynamicUrl || affiliateUrl) : BOOKING_URLS[program];
  if (!candidate || !candidate.startsWith("https://")) {
    return res.status(500).json({ error: "No valid redirect URL for program" });
  }
  res.redirect(302, candidate);
});

router.get("/analytics", (req, res) => {
  const key = req.headers["x-analytics-key"];
  if (!key || key !== process.env.ANALYTICS_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  res.json({ count: clickLog.length, clicks: clickLog });
});

export default router;
