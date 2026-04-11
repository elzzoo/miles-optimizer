/**
 * DB-backed search quota middleware
 * - Premium users (JWT plan === 'premium'): unlimited
 * - Free authenticated users: 5 searches/day in Supabase users table
 * - Unauthenticated: 5 searches/day per IP (fallback rate limiter applied in server.js)
 */
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { supabaseAdmin, isSupabaseConfigured } from "../services/supabase.js";

const JWT_SECRET   = process.env.JWT_SECRET || crypto.randomBytes(32).toString("hex");
const FREE_LIMIT   = 5;

function todayISO() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

export async function dbQuotaMiddleware(req, res, next) {
  // Try to extract user from JWT (optional)
  let userPayload = null;
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) {
    try { userPayload = jwt.verify(auth.slice(7), JWT_SECRET); } catch {}
  }

  // Premium users bypass quota
  if (userPayload?.plan === "premium") return next();

  // If Supabase is configured and user is authenticated, use DB quota
  if (userPayload && isSupabaseConfigured) {
    const today = todayISO();
    const { data: user } = await supabaseAdmin
      .from("users")
      .select("id, search_count_today, search_date")
      .eq("id", userPayload.sub)
      .maybeSingle();

    if (user) {
      // Reset counter if it's a new day
      const count = user.search_date === today ? user.search_count_today : 0;

      if (count >= FREE_LIMIT) {
        return res.status(429).json({
          error: "Quota de recherches quotidien atteint (5/jour).",
          upgrade: true,
          remaining: 0,
        });
      }

      // Increment counter (fire and forget — don't block the search)
      const newCount = count + 1;
      supabaseAdmin
        .from("users")
        .update({ search_count_today: newCount, search_date: today })
        .eq("id", user.id)
        .then(() => {})
        .catch(() => {});

      res.setHeader("X-Quota-Remaining", String(FREE_LIMIT - newCount));
    }
  }

  // For unauthenticated users, the IP-based rate limiter in server.js handles it
  next();
}
