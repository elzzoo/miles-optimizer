import "dotenv/config";
import express from "express";
import cors from "cors";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { fileURLToPath } from "url";
import path from "path";
import flightsRouter from "./server/routes/flights.js";
import affiliationRouter from "./server/routes/affiliation.js";

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
    "script-src 'self' 'unsafe-inline'; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src https://fonts.gstatic.com; " +
    "img-src 'self' data:; " +
    "connect-src 'self' https://api.open-meteo.com https://restcountries.com https://open.er-api.com;"
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

app.use("/api/google-flights", searchLimit);
app.use("/api/skyscanner", searchLimit);
app.use("/api/", (req, res, next) => {
  if (req.path === "/google-flights" || req.path === "/skyscanner") return next();
  generalLimit(req, res, next);
});

app.use("/api", flightsRouter);
app.use("/api", affiliationRouter);

app.use(express.static(path.join(__dirname, "dist")));
app.get("*", (req, res) => res.sendFile(path.join(__dirname, "dist", "index.html")));

app.listen(PORT, async () => {
  console.log(`✈️  Miles Optimizer — port ${PORT}`);
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
});
