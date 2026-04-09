-- ==============================================================
-- Miles Optimizer v2 -- Supabase Schema
-- Paste this entire file in: Supabase Dashboard > SQL Editor > New Query
-- ==============================================================

-- 1. ALERTS
CREATE TABLE IF NOT EXISTS public.alerts (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  origin       TEXT NOT NULL CHECK (origin ~ '^[A-Z]{3}$'),
  destination  TEXT NOT NULL CHECK (destination ~ '^[A-Z]{3}$'),
  max_miles    INTEGER NOT NULL CHECK (max_miles BETWEEN 1000 AND 500000),
  cabin        SMALLINT NOT NULL DEFAULT 0 CHECK (cabin IN (0, 1)),
  is_active    BOOLEAN NOT NULL DEFAULT true,
  last_checked TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS alerts_user_id_idx ON public.alerts(user_id);
CREATE INDEX IF NOT EXISTS alerts_active_idx  ON public.alerts(is_active) WHERE is_active = true;

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS alerts_updated_at ON public.alerts;
CREATE TRIGGER alerts_updated_at
  BEFORE UPDATE ON public.alerts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 2. ALERT HITS (email log)
CREATE TABLE IF NOT EXISTS public.alert_hits (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_id       UUID REFERENCES public.alerts(id) ON DELETE CASCADE NOT NULL,
  program_id     TEXT NOT NULL,
  miles_found    INTEGER NOT NULL,
  cash_price     NUMERIC(10,2),
  cents_per_mile NUMERIC(6,2),
  email_sent     BOOLEAN NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS alert_hits_alert_id_idx ON public.alert_hits(alert_id);

-- 3. PREMIUM WAITLIST
CREATE TABLE IF NOT EXISTS public.waitlist (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email      TEXT NOT NULL UNIQUE,
  source     TEXT DEFAULT 'premium_page',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. SEARCH ANALYTICS
CREATE TABLE IF NOT EXISTS public.search_events (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  origin       TEXT,
  destination  TEXT,
  cabin        SMALLINT,
  user_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  result_count INTEGER,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS search_events_created_idx ON public.search_events(created_at DESC);

-- 5. ROW LEVEL SECURITY

ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own alerts"
  ON public.alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own alerts"
  ON public.alerts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own alerts"
  ON public.alerts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own alerts"
  ON public.alerts FOR DELETE
  USING (auth.uid() = user_id);

ALTER TABLE public.alert_hits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view hits for own alerts"
  ON public.alert_hits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.alerts
      WHERE alerts.id = alert_hits.alert_id
        AND alerts.user_id = auth.uid()
    )
  );

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can join waitlist"
  ON public.waitlist FOR INSERT
  WITH CHECK (true);

ALTER TABLE public.search_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log searches"
  ON public.search_events FOR INSERT
  WITH CHECK (true);
