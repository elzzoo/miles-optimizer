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
  origin TEXT NOT NULL,
  dest TEXT NOT NULL,
  target_price NUMERIC,
  cabin TEXT DEFAULT 'eco',
  active BOOLEAN DEFAULT true,
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

-- Index for fast token lookup
CREATE INDEX IF NOT EXISTS idx_magic_links_token ON magic_links(token) WHERE NOT used;
CREATE INDEX IF NOT EXISTS idx_magic_links_expires ON magic_links(expires_at);

-- Test premium users
INSERT INTO users (email, plan) VALUES
  ('binou@milesoptimizer.com', 'premium'),
  ('saloum@milesoptimizer.com', 'premium')
ON CONFLICT (email) DO UPDATE SET plan = 'premium', updated_at = NOW();

-- Cleanup old magic links (run periodically)
-- DELETE FROM magic_links WHERE expires_at < NOW() - INTERVAL '24 hours';
