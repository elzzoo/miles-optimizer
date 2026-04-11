import "dotenv/config";
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: !!process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || "development",
  tracesSampleRate: 0.1,
});

import express from "express";
import cors from "cors";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { fileURLToPath } from "url";
import path from "path";
import flightsRouter from "./server/routes/flights.js";
import affiliationRouter from "./server/routes/affiliation.js";
import alertsRouter from "./server/routes/alerts.js";
import destinationsRouter from "./server/routes/destinations.js";
import dealsRouter from "./server/routes/deals.js";
import waitlistRouter from "./server/routes/waitlist.js";
import stripeRouter from "./server/routes/stripe.js";
import authRouter from "./server/routes/auth.js";

const app = express();
app.use(compression());
const PORT = process.env.PORT || 3001;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Frontend is served by the same Express server in production
// so CORS only needs to cover local dev
const allowedOrigins = ["http://localhost:5173", "http://localhost:3001"];
app.use(cors({ origin: allowedOrigins }));

// Security headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "no-referrer-when-downgrade");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' https://plausible.io; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src https://fonts.gstatic.com; " +
    "img-src 'self' data: https://images.unsplash.com; " +
    "connect-src 'self' https://api.open-meteo.com https://restcountries.com https://open.er-api.com https://api.opentripmap.com https://api.unsplash.com https://images.unsplash.com https://plausible.io;"
  );
  next();
});

// Rate limit strict pour les routes de recherche (coûteuses en quota API)
const searchLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Trop de recherches, réessayez dans une minute." },
});

// Rate limit général pour toutes les autres routes API
const generalLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Trop de requêtes, réessayez dans une minute." },
});

// Status endpoint — declared FIRST so it's never shadowed by routers or catch-all
app.get("/api/status", (req, res) => {
  res.json({
    ok:      true,
    version: "2.0.0",
    env:     process.env.NODE_ENV || "development",
    services: {
      supabase:      !!process.env.SUPABASE_URL,
      resend:        !!process.env.RESEND_API_KEY,
      serpapi:       !!process.env.SERPAPI_KEY,
      rapidapi:      !!process.env.RAPIDAPI_KEY,
      unsplash:      !!process.env.UNSPLASH_ACCESS_KEY,
      travelpayouts: !!(process.env.TRAVELPAYOUTS_TOKEN && process.env.TRAVELPAYOUTS_MARKER),
      duffel:        !!(process.env.DUFFEL_TOKEN || process.env.DUFFEL_API_TOKEN),
      redis:         !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN),
    },
    ts: new Date().toISOString(),
  });
});

// Origin/referer check for /api/flights
const ALLOWED_ORIGINS_FLIGHTS = [
  process.env.APP_URL,
  'https://miles-optimizer-next-3y3m.onrender.com',
  'https://miles-optimizer-eight.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
].filter(Boolean);

app.use('/api/flights', (req, res, next) => {
  const origin = req.headers.origin || req.headers.referer || '';
  const ok = !origin || ALLOWED_ORIGINS_FLIGHTS.some(o => origin.startsWith(o));
  if (!ok && process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Accès non autorisé' });
  }
  next();
});

const flightsQuotaLimit = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24h
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Quota atteint. Passez Premium pour des recherches illimitées.' },
  skip: (req) => process.env.NODE_ENV !== 'production', // only in prod
});
app.use('/api/flights', flightsQuotaLimit);

app.use("/api/flights",        searchLimit);
app.use("/api/google-flights", searchLimit);
app.use("/api/", (req, res, next) => {
  if (req.path === "/flights" || req.path === "/google-flights") return next();
  generalLimit(req, res, next);
});

// Stripe webhook needs raw body — must be before express.json()
app.use("/api/stripe/webhook", express.raw({ type: "application/json" }));

app.use(express.json());
app.use("/api/auth",         authRouter);
app.use("/api", flightsRouter);
app.use("/api", affiliationRouter);
app.use("/api/alerts",        alertsRouter);
app.use("/api/destinations",  destinationsRouter);
app.use("/api/deals",         dealsRouter);
app.use("/api/waitlist",      waitlistRouter);
app.use("/api/stripe",        stripeRouter);

app.use(express.static(path.join(__dirname, "dist")));
app.get("*", (req, res) => res.sendFile(path.join(__dirname, "dist", "index.html")));

// Warm-up: ping every 14 min to prevent Render free tier sleep
setInterval(() => {
  fetch(`http://localhost:${PORT}/api/health`).catch(() => {});
}, 14 * 60 * 1000);

app.listen(PORT, async () => {
  console.log(`✈️  Miles Optimizer v2 (next) — port ${PORT}`);
  // Pré-charger les caches pour éviter la latence au premier utilisateur
  try {
    const { getExchangeRates } = await import("./server/services/exchangeRates.js");
    await getExchangeRates();
    console.log("✅ Taux de change pré-chargés");
  } catch { console.warn("⚠️  Pré-chargement taux échoué"); }
  try {
    const { fetchPromos } = await import("./server/services/promos.js");
    await fetchPromos();
    console.log("✅ Promos pré-chargées");
  } catch { console.warn("⚠️  Pré-chargement promos échoué"); }

  // Start alert cron checker
  try {
    const { startAlertChecker } = await import("./server/services/alertChecker.js");
    startAlertChecker();
  } catch (e) { console.warn("⚠️  Alert checker non démarré:", e.message); }
});
