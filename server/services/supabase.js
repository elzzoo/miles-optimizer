import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL         = process.env.SUPABASE_URL         || "";
const SUPABASE_ANON_KEY    = process.env.SUPABASE_ANON_KEY    || "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!SUPABASE_URL && !!SUPABASE_ANON_KEY;

// Proxy that returns a safe "not configured" error instead of crashing
function notConfiguredProxy(name) {
  return new Proxy({}, {
    get(_, prop) {
      if (prop === "then") return undefined; // not a Promise
      return () => {
        console.warn(`[supabase] ${name} called but Supabase is not configured`);
        return Promise.resolve({ data: null, error: new Error("Supabase not configured"), count: 0 });
      };
    },
  });
}

// Public client (anon key — respects RLS)
export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : notConfiguredProxy("supabase");

// Admin client (service key — bypasses RLS, server-side only)
export const supabaseAdmin = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : notConfiguredProxy("supabaseAdmin");
