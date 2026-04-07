import { Router } from "express";
import { PROGRAMS } from "../../src/data/programs.js";

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

router.get("/go", (req, res) => {
  const { program, origin, dest, cabin, ref } = req.query;

  if (!program || !BOOKING_URLS[program]) {
    return res.status(400).json({ error: "Unknown program" });
  }

  // Log click
  clickLog.push({ program, origin: origin || null, dest: dest || null, cabin: cabin || null, ref: ref || null, ts: new Date().toISOString() });
  if (clickLog.length > MAX_LOG) clickLog.shift();

  // Redirect to affiliate link or fallback bookingUrl
  const url = affiliateLinks[program] || BOOKING_URLS[program];
  res.redirect(302, url);
});

router.get("/analytics", (req, res) => {
  res.json({ count: clickLog.length, clicks: clickLog });
});

export default router;
