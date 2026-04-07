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
  clickLog.push({
    program,
    origin: origin ? origin.slice(0, 8) : null,
    dest: dest ? dest.slice(0, 8) : null,
    cabin: cabin ? cabin.slice(0, 4) : null,
    ref: ref ? ref.slice(0, 128) : null,
    ts: new Date().toISOString(),
  });
  if (clickLog.length > MAX_LOG) clickLog.shift();

  // Redirect to affiliate link or fallback bookingUrl
  // Validate affiliate URL to prevent open redirect via misconfigured env var
  const affiliateUrl = affiliateLinks[program];
  const candidate = (affiliateUrl && affiliateUrl.startsWith("https://")) ? affiliateUrl : BOOKING_URLS[program];
  if (!candidate || !candidate.startsWith("https://")) {
    return res.status(500).json({ error: "No valid redirect URL for program" });
  }
  res.redirect(302, candidate);
});

router.get("/analytics", (req, res) => {
  res.json({ count: clickLog.length, clicks: clickLog });
});

export default router;
