import { useState, useEffect } from "react";

export interface AuthUser {
  id: string;
  email: string;
  plan: "free" | "premium";
}

export interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  isPremium: boolean;
  token: string | null;
  signIn: (email: string) => Promise<{ error: Error | null }>;
  signOut: () => void;
}

const TOKEN_KEY = "mo_auth_token";

function decodeJwt(token: string): AuthUser | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (payload.exp && Date.now() > payload.exp * 1000) return null;
    return { id: payload.sub, email: payload.email, plan: payload.plan || "free" };
  } catch { return null; }
}

export function useAuth(): AuthState {
  const [token, setToken]   = useState<string | null>(null);
  const [user, setUser]     = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check URL for auth_token (after magic link redirect)
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("auth_token");
    if (urlToken) {
      localStorage.setItem(TOKEN_KEY, urlToken);
      // Clean URL
      const url = new URL(window.location.href);
      url.searchParams.delete("auth_token");
      window.history.replaceState({}, "", url.toString());
    }

    // Load token from storage
    const stored = urlToken || localStorage.getItem(TOKEN_KEY);
    if (stored) {
      const decoded = decodeJwt(stored);
      if (decoded) {
        setToken(stored);
        setUser(decoded);
      } else {
        localStorage.removeItem(TOKEN_KEY); // expired
      }
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string): Promise<{ error: Error | null }> => {
    try {
      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur serveur");
      return { error: null };
    } catch (e: any) {
      return { error: new Error(e.message) };
    }
  };

  const signOut = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  };

  return {
    user,
    loading,
    isPremium: user?.plan === "premium",
    token,
    signIn,
    signOut,
  };
}
