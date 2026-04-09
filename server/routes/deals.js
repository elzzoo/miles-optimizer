import { Router } from "express";
import { cacheMiddleware } from "../middleware/cache.js";
import { scoreDeal } from "../services/dealScorer.js";

const router = Router();

const TOP_ROUTES = [
  { from: "DSS", to: "CDG", label: "Dakar → Paris" },
  { from: "DSS", to: "JFK", label: "Dakar → New York" },
  { from: "DSS", to: "DXB", label: "Dakar → Dubaï" },
  { from: "DSS", to: "IST", label: "Dakar → Istanbul" },
  { from: "ABJ", to: "CDG", label: "Abidjan → Paris" },
  { from: "ABJ", to: "LHR", label: "Abidjan → Londres" },
  { from: "CMN", to: "CDG", label: "Casablanca → Paris" },
  { from: "CMN", to: "JFK", label: "Casablanca → New York" },
  { from: "LOS", to: "LHR", label: "Lagos → Londres" },
  { from: "LOS", to: "DXB", label: "Lagos → Dubaï" },
  { from: "NBO", to: "CDG", label: "Nairobi → Paris" },
  { from: "NBO", to: "LHR", label: "Nairobi → Londres" },
  { from: "ACC", to: "AMS", label: "Accra → Amsterdam" },
  { from: "ADD", to: "CDG", label: "Addis → Paris" },
  { from: "CPT", to: "LHR", label: "Le Cap → Londres" },
];

// Realistic cash price estimates per route (USD, economy round-trip)
const ROUTE_PRICES = {
  "DSS-CDG": 650,  "DSS-JFK": 1100, "DSS-DXB": 720,  "DSS-IST": 600,
  "ABJ-CDG": 700,  "ABJ-LHR": 850,  "CMN-CDG": 400,  "CMN-JFK": 900,
  "LOS-LHR": 750,  "LOS-DXB": 600,  "NBO-CDG": 800,  "NBO-LHR": 700,
  "ACC-AMS": 750,  "ADD-CDG": 900,  "CPT-LHR": 950,
};

// Miles needed estimates by route (for top programs)
const PROGRAM_MILES = {
  "aeroplan":   { "DSS-CDG": 42000, "DSS-JFK": 55000, "DSS-IST": 35000 },
  "lifemiles":  { "DSS-CDG": 38000, "DSS-JFK": 50000 },
  "flyingblue": { "DSS-CDG": 35000, "ABJ-CDG": 36000, "CMN-CDG": 28000, "NBO-CDG": 38000, "ADD-CDG": 40000 },
  "turkish":    { "DSS-IST": 20000, "ABJ-CDG": 45000, "CMN-CDG": 35000 },
  "united":     { "DSS-CDG": 44000, "LOS-LHR": 40000, "NBO-LHR": 38000, "CPT-LHR": 45000 },
  "ba":         { "CMN-CDG": 22000, "LOS-LHR": 40000, "NBO-LHR": 38000, "CPT-LHR": 45000, "ABJ-LHR": 42000 },
};

router.get("/", cacheMiddleware(12 * 3600), async (req, res) => {
  const { PROGRAMS } = await import("../data/programs.js");
  const programMap = Object.fromEntries(PROGRAMS.map(p => [p.id, p]));

  const deals = [];

  for (const route of TOP_ROUTES) {
    const key = `${route.from}-${route.to}`;
    const cashPriceUSD = ROUTE_PRICES[key] ?? 700;

    for (const [programId, routeMiles] of Object.entries(PROGRAM_MILES)) {
      const milesNeeded = routeMiles[key];
      if (!milesNeeded) continue;

      const program = programMap[programId];
      if (!program) continue;

      const score = scoreDeal({
        program,
        milesNeeded,
        taxesUSD: program.taxUSD ?? 60,
        cashPriceUSD,
      });

      if (score.centsPerMile >= 1.0) {
        deals.push({
          id:           `${programId}-${key}`,
          route,
          program:      { id: program.id, name: program.name, short: program.short, emoji: program.emoji, bookingUrl: program.bookingUrl },
          cashPriceUSD,
          milesNeeded,
          taxesUSD:     program.taxUSD ?? 60,
          score,
          updatedAt:    new Date().toISOString(),
        });
      }
    }
  }

  // Sort by score
  deals.sort((a, b) => b.score.centsPerMile - a.score.centsPerMile);

  res.json({ deals: deals.slice(0, 30), total: deals.length, updatedAt: new Date().toISOString() });
});

export default router;
