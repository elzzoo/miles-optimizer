import { supabaseAdmin, isSupabaseConfigured } from "../services/supabase.js";

/**
 * JWT middleware — verifies Supabase auth token
 * Attaches req.user on success
 */
export async function authMiddleware(req, res, next) {
  if (!isSupabaseConfigured) {
    return res.status(503).json({ error: "Auth not configured" });
  }

  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing authorization header" });
  }

  const token = header.slice(7);
  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: "Invalid or expired token" });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Auth error" });
  }
}

/**
 * Optional auth — doesn't fail if not authenticated, just sets req.user = null
 */
export async function optionalAuthMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ") || !isSupabaseConfigured) {
    req.user = null;
    return next();
  }
  const token = header.slice(7);
  try {
    const { data: { user } } = await supabaseAdmin.auth.getUser(token);
    req.user = user ?? null;
  } catch { req.user = null; }
  next();
}
