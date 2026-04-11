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
      // fallback to file
      try { saveToFile(clean, source); } catch {}
    }
  } else {
    try { saveToFile(clean, source); } catch (e) {
      console.error("[waitlist] file save error:", e.message);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }
  res.json({ ok: true });
});

export default router;
