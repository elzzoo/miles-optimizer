import { useState, useEffect, createContext, useContext } from "react";
import { createClient, User, Session } from "@supabase/supabase-js";

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL      || "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const supabase = SUPABASE_URL
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isPremium: boolean;
  signIn: (email: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  token: string | null;
}

export function useAuth(): AuthState {
  const [user, setUser]       = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => {
      setSession(s);
      setUser(s?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string) => {
    if (!supabase) return { error: new Error("Auth not configured") };
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    if (supabase) await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const isPremium = user?.user_metadata?.plan === "premium";
  const token = session?.access_token ?? null;

  return { user, session, loading, isPremium, signIn, signOut, token };
}
