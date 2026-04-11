-- Enable UUID extension (required for gen_random_uuid())
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'premium')),
  search_count_today INTEGER NOT NULL DEFAULT 0,
  search_date DATE DEFAULT CURRENT_DATE,
  alerts_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Price alerts table
CREATE TABLE IF NOT EXISTS price_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  origin TEXT NOT NULL CHECK (origin ~ '^[A-Z]{3}$'),
  destination TEXT NOT NULL CHECK (destination ~ '^[A-Z]{3}$'),
  max_miles INTEGER NOT NULL CHECK (max_miles > 0),
  cabin INTEGER NOT NULL DEFAULT 0 CHECK (cabin IN (0, 1)),  -- 0=eco, 1=business
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_checked TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Magic links table
CREATE TABLE IF NOT EXISTS magic_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_magic_links_token   ON magic_links(token) WHERE NOT used;
CREATE INDEX IF NOT EXISTS idx_magic_links_expires ON magic_links(expires_at);
CREATE INDEX IF NOT EXISTS idx_price_alerts_user   ON price_alerts(user_id);

-- Test premium accounts
INSERT INTO users (email, plan) VALUES
  ('binou@milesoptimizer.com', 'premium'),
  ('saloum@milesoptimizer.com', 'premium')
ON CONFLICT (email) DO UPDATE SET plan = 'premium', updated_at = NOW();
