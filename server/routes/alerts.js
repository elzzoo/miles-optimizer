import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { supabaseAdmin, isSupabaseConfigured } from "../services/supabase.js";

const router = Router();
const MAX_PREMIUM_ALERTS = 10;

// GET /api/alerts — list user's alerts
router.get("/", authMiddleware, async (req, res) => {
  if (!isSupabaseConfigured) return res.json({ alerts: [] });
  try {
    const { data, error } = await supabaseAdmin
      .from("price_alerts")
      .select("*")
      .eq("user_id", req.user.sub)
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    res.json({ alerts: data ?? [] });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/alerts — create alert
router.post("/", authMiddleware, async (req, res) => {
  if (!isSupabaseConfigured) {
    return res.status(503).json({ error: "Base de données non configurée" });
  }

  const { origin, destination, max_miles, cabin = 0 } = req.body;

  if (!origin || !destination || !max_miles) {
    return res.status(400).json({ error: "origin, destination, max_miles requis" });
  }
  if (!/^[A-Z]{3}$/.test(origin) || !/^[A-Z]{3}$/.test(destination)) {
    return res.status(400).json({ error: "Codes IATA invalides (ex: CDG, JFK)" });
  }
  if (Number(max_miles) < 1000 || Number(max_miles) > 500000) {
    return res.status(400).json({ error: "max_miles doit être entre 1 000 et 500 000" });
  }

  // Only premium users can create alerts
  const isPremium = req.user.plan === "premium";
  if (!isPremium) {
    return res.status(403).json({
      error: "Alertes disponibles en Premium uniquement",
      upgrade: true,
    });
  }

  // Check quota
  const { count } = await supabaseAdmin
    .from("price_alerts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", req.user.sub)
    .eq("is_active", true);

  if ((count ?? 0) >= MAX_PREMIUM_ALERTS) {
    return res.status(403).json({
      error: `Maximum ${MAX_PREMIUM_ALERTS} alertes actives atteint`,
    });
  }

  const { data, error } = await supabaseAdmin
    .from("price_alerts")
    .insert({
      user_id:     req.user.sub,
      origin:      origin.toUpperCase(),
      destination: destination.toUpperCase(),
      max_miles:   Number(max_miles),
      cabin:       Number(cabin),
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ alert: data });
});

// PATCH /api/alerts/:id — toggle active
router.patch("/:id", authMiddleware, async (req, res) => {
  if (!isSupabaseConfigured) return res.status(503).json({ error: "DB non configurée" });
  const { is_active } = req.body;
  const { data, error } = await supabaseAdmin
    .from("price_alerts")
    .update({ is_active })
    .eq("id", req.params.id)
    .eq("user_id", req.user.sub)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  if (!data)  return res.status(404).json({ error: "Alerte introuvable" });
  res.json({ alert: data });
});

// DELETE /api/alerts/:id
router.delete("/:id", authMiddleware, async (req, res) => {
  if (!isSupabaseConfigured) return res.status(503).json({ error: "DB non configurée" });
  const { error } = await supabaseAdmin
    .from("price_alerts")
    .delete()
    .eq("id", req.params.id)
    .eq("user_id", req.user.sub);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

export default router;
