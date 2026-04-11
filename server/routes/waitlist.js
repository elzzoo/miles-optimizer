import { Router } from "express";
import { supabaseAdmin, isSupabaseConfigured } from "../services/supabase.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WAITLIST_FILE = path.join(__dirname, "../data/waitlist.json");

function saveToFile(email, source = "waitlist") {
  let list = [];
  try { list = JSON.parse(fs.readFileSync(WAITLIST_FILE, "utf8")); } catch {}
  if (!list.find(e => e.email === email)) {
    list.push({ email, source, createdAt: new Date().toISOString() });
    fs.mkdirSync(path.dirname(WAITLIST_FILE), { recursive: true });
    fs.writeFileSync(WAITLIST_FILE, JSON.stringify(list, null, 2));
  }
}

const router = Router();

router.post("/", async (req, res) => {
  const { email, source = "waitlist" } = req.body;
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return res.status(400).json({ error: "Email invalide" });
  }
  const clean = email.trim().toLowerCase().slice(0, 254);

  if (isSupabaseConfigured) {
    const { error } = await supabaseAdmin
      .from("waitlist")
      .upsert({ email: clean }, { onConflict: "email", ignoreDuplicates: true });
    if (error) {
      console.error("[waitlist] upsert error:", error.message);
      try { saveToFile(clean, source); } catch {}
    }
  } else {
    try { saveToFile(clean, source); } catch (e) {
      console.error("[waitlist] file save error:", e.message);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  // Send confirmation email via Resend
  if (process.env.RESEND_API_KEY) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: "Miles Optimizer <noreply@milesoptimizer.com>",
        to: clean,
        subject: "✅ Vous êtes sur la liste — Miles Optimizer Premium",
        html: `
<!DOCTYPE html><html><body style="font-family:Inter,system-ui,sans-serif;background:#F8FAFC;margin:0;padding:32px">
<div style="background:white;border-radius:16px;padding:32px;max-width:440px;margin:0 auto;box-shadow:0 4px 16px rgba(0,0,0,.08)">
  <div style="text-align:center;margin-bottom:24px">
    <div style="background:#2563EB;width:48px;height:48px;border-radius:12px;display:inline-flex;align-items:center;justify-content:center;font-size:24px">✈️</div>
    <h1 style="font-size:20px;font-weight:800;color:#0F172A;margin:12px 0 4px">Miles Optimizer Premium</h1>
    <p style="color:#64748B;font-size:14px;margin:0">Vous êtes sur la liste d'attente !</p>
  </div>
  <p style="color:#334155;font-size:15px;line-height:1.6">Merci pour votre intérêt ! Vous serez parmi les premiers à être notifié au lancement et recevrez <strong>-20% de réduction</strong> exclusive.</p>
  <div style="background:#F0F9FF;border:1px solid #BAE6FD;border-radius:12px;padding:16px;margin:24px 0">
    <p style="margin:0;font-size:14px;color:#0369A1;font-weight:600">Ce que vous obtiendrez en Premium :</p>
    <ul style="margin:8px 0 0;padding-left:20px;font-size:13px;color:#0C4A6E;line-height:2">
      <li>Recherches de vols illimitées</li>
      <li>10 alertes prix par email</li>
      <li>Accès à tous les deals (30+)</li>
      <li>Filtres avancés et export</li>
    </ul>
  </div>
  <p style="color:#94A3B8;font-size:12px;text-align:center;margin-top:24px">Miles Optimizer · <a href="https://miles-optimizer-next-3y3m.onrender.com" style="color:#2563EB">miles-optimizer.com</a></p>
</div>
</body></html>`,
      });
    } catch (e) {
      console.error("[waitlist] Resend error:", e.message);
    }
  }

  res.json({ ok: true });
});

export default router;
