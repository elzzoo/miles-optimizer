import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { supabaseAdmin } from "../services/supabase.js";

const router = Router();
const MAX_FREE_ALERTS   = 0;
const MAX_PREMIUM_ALERTS = 10;

// GET /api/alerts — list user's alerts
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("alerts")
      .select("*")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    res.json({ alerts: data });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch alerts" });
  }
});

// POST /api/alerts — create alert
router.post("/", authMiddleware, async (req, res) => {
  const { origin, destination, max_miles, cabin = 0 } = req.body;

  if (!origin || !destination || !max_miles) {
    return res.status(400).json({ error: "origin, destination, max_miles required" });
  }
  if (!/^[A-Z]{3}$/.test(origin) || !/^[A-Z]{3}$/.test(destination)) {
    return res.status(400).json({ error: "Invalid IATA codes" });
  }
  if (Number(max_miles) < 1000 || Number(max_miles) > 500000) {
    return res.status(400).json({ error: "max_miles must be 1000-500000" });
  }

  // Check plan limits
  const isPremium = req.user.user_metadata?.plan === "premium";
  const maxAllowed = isPremium ? MAX_PREMIUM_ALERTS : MAX_FREE_ALERTS;

  const { count } = await supabaseAdmin
    .from("alerts")
    .select("id", { count: "exact" })
    .eq("user_id", req.user.id)
    .eq("is_active", true);

  if ((count ?? 0) >= maxAllowed) {
    return res.status(403).json({
      error: "Quota reached",
      upgrade: true,
      message: isPremium
        ? "Maximum 10 alertes actives en Premium"
        : "Alertes disponibles en Premium uniquement",
    });
  }

  const { data, error } = await supabaseAdmin.from("alerts").insert({
    user_id:     req.user.id,
    origin:      origin.toUpperCase(),
    destination: destination.toUpperCase(),
    max_miles:   Number(max_miles),
    cabin:       Number(cabin),
  }).select().single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ alert: data });
});

// PATCH /api/alerts/:id — toggle active
router.patch("/:id", authMiddleware, async (req, res) => {
  const { is_active } = req.body;
  const { data, error } = await supabaseAdmin
    .from("alerts")
    .update({ is_active })
    .eq("id", req.params.id)
    .eq("user_id", req.user.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  if (!data)  return res.status(404).json({ error: "Alert not found" });
  res.json({ alert: data });
});

// DELETE /api/alerts/:id
router.delete("/:id", authMiddleware, async (req, res) => {
  const { error } = await supabaseAdmin
    .from("alerts")
    .delete()
    .eq("id", req.params.id)
    .eq("user_id", req.user.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

export default router;
