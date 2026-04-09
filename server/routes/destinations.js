import { Router } from "express";
import { getDestinationsFrom } from "../services/openTripMap.js";
import { getPhoto } from "../services/unsplash.js";
import { cacheMiddleware } from "../middleware/cache.js";

const router = Router();

// GET /api/destinations?from=DSS&limit=12
router.get("/", cacheMiddleware(24 * 3600), async (req, res) => {
  const { from = "DSS", limit = "12" } = req.query;

  if (!/^[A-Z]{3}$/.test(from)) {
    return res.status(400).json({ error: "Invalid IATA origin" });
  }

  try {
    const destinations = await getDestinationsFrom(from, Math.min(Number(limit), 20));

    // Enrich with photos in parallel
    const enriched = await Promise.all(
      destinations.map(async (d) => ({
        ...d,
        photo: await getPhoto(d.name),
      }))
    );

    res.json({ destinations: enriched, from, count: enriched.length });
  } catch (err) {
    console.error("[destinations]", err);
    res.status(500).json({ error: "Failed to fetch destinations" });
  }
});

// GET /api/destinations/where-can-i-go?from=DSS&miles=50000
router.get("/where-can-i-go", cacheMiddleware(12 * 3600), async (req, res) => {
  const { from = "DSS", miles = "50000" } = req.query;
  const maxMiles = Math.min(Number(miles), 500000);

  if (!/^[A-Z]{3}$/.test(from)) {
    return res.status(400).json({ error: "Invalid IATA origin" });
  }

  // Import PROGRAMS dynamically to avoid ESM issues
  const { PROGRAMS } = await import("../../src/data/programs.js");
  const { haversine } = await import("../../src/utils/distance.js");
  const { airportsMap } = await import("../../src/data/airports.js");

  try {
    const all = await getDestinationsFrom(from, 20);
    const origA = airportsMap[from];

    const reachable = await Promise.all(
      all.map(async (d) => {
        if (!origA) return null;
        const distMiles = haversine(origA.lat, origA.lon, d.lat, d.lon);

        // Find cheapest program that can reach this dest
        const programs = PROGRAMS.filter(p => {
          let estimated;
          if (distMiles < 1500)      estimated = 10000;
          else if (distMiles < 3500) estimated = 25000;
          else if (distMiles < 6000) estimated = 40000;
          else                       estimated = 60000;
          return estimated <= maxMiles;
        });

        if (!programs.length) return null;

        const photo = await getPhoto(d.name);
        return { ...d, photo, distMiles: Math.round(distMiles), reachableWith: programs.length };
      })
    );

    const filtered = reachable.filter(Boolean).sort((a, b) => a.distMiles - b.distMiles);
    res.json({ destinations: filtered, from, maxMiles, count: filtered.length });
  } catch (err) {
    console.error("[where-can-i-go]", err);
    res.status(500).json({ error: "Failed to compute destinations" });
  }
});

export default router;
