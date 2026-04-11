-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'premium')),
  search_count_today INTEGER DEFAULT 0,
  search_date DATE DEFAULT CURRENT_DATE,
  alerts_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Price alerts table
CREATE TABLE IF NOT EXISTS price_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  origin TEXT NOT NULL CHECK (origin ~ '^[A-Z]{3}$'),
  destination TEXT NOT NULL CHECK (destination ~ '^[A-Z]{3}$'),
  max_miles INTEGER NOT NULL CHECK (max_miles > 0),
  cabin INTEGER DEFAULT 0 CHECK (cabin IN (0, 1)),  -- 0=eco, 1=business
  is_active BOOLEAN DEFAULT true,
  last_checked TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Magic links table
CREATE TABLE IF NOT EXISTS magic_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_magic_links_token   ON magic_links(token) WHERE NOT used;
CREATE INDEX IF NOT EXISTS idx_magic_links_expires ON magic_links(expires_at);
CREATE INDEX IF NOT EXISTS idx_price_alerts_user   ON price_alerts(user_id);

-- Test premium users
INSERT INTO users (email, plan) VALUES
  ('binou@milesoptimizer.com', 'premium'),
  ('saloum@milesoptimizer.com', 'premium')
ON CONFLICT (email) DO UPDATE SET plan = 'premium', updated_at = NOW();
