import { Router } from "express";
import { supabaseAdmin } from "../services/supabase.js";

const router = Router();

// POST /api/waitlist — store email for launch notification
router.post("/", async (req, res) => {
  const { email } = req.body;
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return res.status(400).json({ error: "Email invalide" });
  }

  const clean = email.trim().toLowerCase().slice(0, 254);

  const { error } = await supabaseAdmin
    .from("waitlist")
    .upsert({ email: clean }, { onConflict: "email", ignoreDuplicates: true });

  if (error) {
    console.error("[waitlist] upsert error:", error.message);
    return res.status(500).json({ error: "Erreur serveur" });
  }

  res.json({ ok: true });
});

export default router;
