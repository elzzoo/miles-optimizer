import { useState, useEffect, useCallback } from "react";

export interface Alert {
  id: string;
  origin: string;
  destination: string;
  max_miles: number;
  cabin: number;
  is_active: boolean;
  last_checked: string | null;
  created_at: string;
}

export function useAlerts(token: string | null) {
  const [alerts, setAlerts]   = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const fetchAlerts = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const r = await fetch("/api/alerts", { headers: authHeaders });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error);
      setAlerts(json.alerts ?? []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const createAlert = async (data: { origin: string; destination: string; max_miles: number; cabin?: number }) => {
    const r = await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify(data),
    });
    const json = await r.json();
    if (!r.ok) throw new Error(json.error ?? json.message ?? "Erreur");
    setAlerts(prev => [json.alert, ...prev]);
    return json;
  };

  const deleteAlert = async (id: string) => {
    await fetch(`/api/alerts/${id}`, { method: "DELETE", headers: authHeaders });
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const toggleAlert = async (id: string, is_active: boolean) => {
    const r = await fetch(`/api/alerts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({ is_active }),
    });
    const json = await r.json();
    if (r.ok) setAlerts(prev => prev.map(a => a.id === id ? json.alert : a));
  };

  return { alerts, loading, error, createAlert, deleteAlert, toggleAlert, refetch: fetchAlerts };
}
