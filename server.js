import "dotenv/config";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { fileURLToPath } from "url";
import path from "path";
import flightsRouter from "./server/routes/flights.js";

const app = express();
const PORT = process.env.PORT || 3001;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Frontend is served by the same Express server in production
// so CORS only needs to cover local dev
const allowedOrigins = ["http://localhost:5173", "http://localhost:3001"];
app.use(cors({ origin: allowedOrigins }));

app.use("/api/", rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Trop de requêtes, réessayez dans une minute." },
}));

app.use("/api", flightsRouter);

app.use(express.static(path.join(__dirname, "dist")));
app.get("*", (req, res) => res.sendFile(path.join(__dirname, "dist", "index.html")));

app.listen(PORT, () => console.log(`✈️  Miles Optimizer — port ${PORT}`));
