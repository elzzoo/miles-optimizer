import { Router } from "express";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { supabaseAdmin, isSupabaseConfigured } from "../services/supabase.js";

const router = Router();
const APP_URL    = process.env.APP_URL || "https://miles-optimizer-next-3y3m.onrender.com";
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString("hex");
const FROM_EMAIL = "Miles Optimizer <noreply@milesoptimizer.com>";

// POST /api/auth/magic-link
router.post("/magic-link", async (req, res) => {
  const { email } = req.body;
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return res.status(400).json({ error: "Email invalide" });
  }
  const clean = email.trim().toLowerCase().slice(0, 254);
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString(); // 1h

  // Store in Supabase magic_links table
  if (isSupabaseConfigured) {
    const { error } = await supabaseAdmin
      .from("magic_links")
      .insert({ email: clean, token, expires_at: expiresAt });
    if (error) {
      console.error("[auth] magic_links insert:", error.message);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  // Send email via Resend
  const magicLink = `${APP_URL}/auth/verify?token=${token}`;
  if (process.env.RESEND_API_KEY) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: FROM_EMAIL,
        to: clean,
        subject: "🔑 Votre lien de connexion — Miles Optimizer",
        html: `
<!DOCTYPE html><html><body style="font-family:Inter,system-ui,sans-serif;background:#F8FAFC;margin:0;padding:32px">
<div style="background:white;border-radius:16px;padding:32px;max-width:440px;margin:0 auto;box-shadow:0 4px 16px rgba(0,0,0,.08)">
  <div style="text-align:center;margin-bottom:24px">
    <div style="background:#2563EB;width:48px;height:48px;border-radius:12px;display:inline-flex;align-items:center;justify-content:center;font-size:24px">✈️</div>
    <h1 style="font-size:20px;font-weight:800;color:#0F172A;margin:12px 0 4px">Miles Optimizer</h1>
    <p style="color:#64748B;font-size:14px;margin:0">Votre lien de connexion</p>
  </div>
  <p style="color:#334155;font-size:15px;line-height:1.6">Cliquez sur le bouton ci-dessous pour vous connecter. Ce lien est valable <strong>1 heure</strong>.</p>
  <div style="text-align:center;margin:32px 0">
    <a href="${magicLink}" style="background:#2563EB;color:white;font-weight:700;font-size:15px;padding:14px 32px;border-radius:12px;text-decoration:none;display:inline-block">
      Se connecter →
    </a>
  </div>
  <p style="color:#94A3B8;font-size:12px;text-align:center">Si vous n'avez pas demandé ce lien, ignorez cet email.</p>
</div>
</body></html>`,
      });
    } catch (e) {
      console.error("[auth] Resend error:", e.message);
      // Don't fail — return ok anyway (graceful degradation)
    }
  }

  res.json({ ok: true });
});

// GET /api/auth/verify?token=xxx — validates token, returns JWT, redirects to frontend
router.get("/verify", async (req, res) => {
  const { token } = req.query;
  if (!token) return res.redirect(`${APP_URL}/alerts?error=missing_token`);

  if (!isSupabaseConfigured) {
    return res.redirect(`${APP_URL}/alerts?error=auth_not_configured`);
  }

  const { data: link, error } = await supabaseAdmin
    .from("magic_links")
    .select("*")
    .eq("token", token)
    .eq("used", false)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (error || !link) {
    return res.redirect(`${APP_URL}/alerts?error=invalid_token`);
  }

  // Mark as used
  await supabaseAdmin.from("magic_links").update({ used: true }).eq("id", link.id);

  // Upsert user
  const { data: user } = await supabaseAdmin
    .from("users")
    .upsert({ email: link.email }, { onConflict: "email", ignoreDuplicates: false })
    .select()
    .single();

  const plan = user?.plan || "free";
  const userId = user?.id || link.email;

  // Sign JWT (7 days)
  const sessionJwt = jwt.sign(
    { sub: userId, email: link.email, plan },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  // Redirect to frontend with token in URL
  res.redirect(`${APP_URL}/?auth_token=${sessionJwt}`);
});

// GET /api/auth/me — returns current user from JWT
router.get("/me", (req, res) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return res.status(401).json({ error: "Non autorisé" });
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET);
    res.json({ user: { id: payload.sub, email: payload.email, plan: payload.plan } });
  } catch {
    res.status(401).json({ error: "Token invalide ou expiré" });
  }
});

// POST /api/auth/logout — client clears token; server is stateless
router.post("/logout", (req, res) => res.json({ ok: true }));

// Middleware to check auth from JWT (exported for use in other routes)
export function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return res.status(401).json({ error: "Non autorisé" });
  try {
    req.user = jwt.verify(auth.slice(7), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Token invalide ou expiré" });
  }
}

export function optionalAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) {
    try { req.user = jwt.verify(auth.slice(7), JWT_SECRET); } catch {}
  }
  next();
}

export default router;
