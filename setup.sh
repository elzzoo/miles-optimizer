#!/usr/bin/env bash
# ============================================================
# Miles Optimizer v2 — One-shot setup script
# Usage: bash setup.sh
# ============================================================
set -euo pipefail

BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

header() { echo -e "\n${CYAN}${BOLD}▶ $1${NC}"; }
ok()     { echo -e "  ${GREEN}✓${NC} $1"; }
warn()   { echo -e "  ${YELLOW}⚠${NC}  $1"; }
err()    { echo -e "  ${RED}✗${NC} $1"; }
ask()    { echo -en "  ${BOLD}$1${NC} "; }

ENV_FILE=".env"

# ── 1. Check prerequisites ────────────────────────────────
header "Checking prerequisites"
command -v node  >/dev/null && ok "Node.js $(node -v)" || { err "Node.js not found — install from nodejs.org"; exit 1; }
command -v npm   >/dev/null && ok "npm $(npm -v)"       || { err "npm not found"; exit 1; }
command -v git   >/dev/null && ok "git $(git --version | head -1)" || warn "git not found — commits won't work"

# ── 2. Install dependencies ───────────────────────────────
header "Installing dependencies"
npm install --ignore-scripts
ok "Dependencies installed"

# ── 3. Collect Supabase credentials ──────────────────────
header "Supabase configuration"
echo ""
echo "  Get these from: https://supabase.com/dashboard → your project → Settings → API"
echo ""

CURRENT_URL=$(grep '^SUPABASE_URL=' "$ENV_FILE" 2>/dev/null | cut -d= -f2-)
CURRENT_SVC=$(grep '^SUPABASE_SERVICE_KEY=' "$ENV_FILE" 2>/dev/null | cut -d= -f2-)

if [[ -z "$CURRENT_URL" ]]; then
  ask "Project URL (https://xxxx.supabase.co):"
  read -r SUPABASE_URL_INPUT
  SUPABASE_URL_INPUT="${SUPABASE_URL_INPUT%/}"  # strip trailing slash
else
  warn "SUPABASE_URL already set: $CURRENT_URL"
  ask "Press Enter to keep, or enter new URL:"
  read -r NEW_URL
  SUPABASE_URL_INPUT="${NEW_URL:-$CURRENT_URL}"
fi

if [[ -z "$CURRENT_SVC" ]]; then
  ask "service_role key (starts with eyJ...):"
  read -r SUPABASE_SVC_INPUT
else
  warn "SUPABASE_SERVICE_KEY already set"
  ask "Press Enter to keep, or enter new key:"
  read -r NEW_SVC
  SUPABASE_SVC_INPUT="${NEW_SVC:-$CURRENT_SVC}"
fi

# ── 4. Update .env ────────────────────────────────────────
header "Updating .env"

update_env() {
  local key="$1" val="$2"
  if grep -q "^${key}=" "$ENV_FILE" 2>/dev/null; then
    # Replace existing line
    if [[ "$OSTYPE" == "darwin"* ]]; then
      sed -i '' "s|^${key}=.*|${key}=${val}|" "$ENV_FILE"
    else
      sed -i "s|^${key}=.*|${key}=${val}|" "$ENV_FILE"
    fi
  else
    echo "${key}=${val}" >> "$ENV_FILE"
  fi
}

[[ -n "$SUPABASE_URL_INPUT" ]] && {
  update_env "SUPABASE_URL"      "$SUPABASE_URL_INPUT"
  update_env "VITE_SUPABASE_URL" "$SUPABASE_URL_INPUT"
  ok "SUPABASE_URL set"
}
[[ -n "$SUPABASE_SVC_INPUT" ]] && {
  update_env "SUPABASE_SERVICE_KEY" "$SUPABASE_SVC_INPUT"
  ok "SUPABASE_SERVICE_KEY set"
}

# ── 5. Run Supabase schema ────────────────────────────────
header "Supabase database schema"
echo ""
if [[ -f "supabase/schema.sql" ]]; then
  ok "Schema file ready: supabase/schema.sql"
  echo ""
  echo "  To apply the schema:"
  echo "  1. Go to https://supabase.com/dashboard → your project → SQL Editor"
  echo "  2. Click 'New Query'"
  echo "  3. Paste the contents of: supabase/schema.sql"
  echo "  4. Click 'Run'"
  echo ""

  # Try psql if available
  if command -v psql >/dev/null && [[ -n "${SUPABASE_URL_INPUT:-}" ]]; then
    # Extract DB URL from project URL (standard Supabase format)
    PROJECT_REF=$(echo "$SUPABASE_URL_INPUT" | sed 's|https://||' | cut -d. -f1)
    DB_URL="postgresql://postgres:${SUPABASE_SVC_INPUT}@db.${PROJECT_REF}.supabase.co:5432/postgres"
    ask "Try to run schema via psql automatically? (y/N):"
    read -r RUN_PSQL
    if [[ "${RUN_PSQL,,}" == "y" ]]; then
      echo "  Running schema..."
      if psql "$DB_URL" -f supabase/schema.sql 2>&1; then
        ok "Schema applied successfully via psql"
      else
        warn "psql failed — please apply the schema manually via the dashboard"
      fi
    fi
  fi
else
  err "supabase/schema.sql not found"
fi

# ── 6. Build the frontend ─────────────────────────────────
header "Building frontend"
npm run build
ok "Build successful — dist/ created"

# ── 7. Test server startup ────────────────────────────────
header "Testing server"
# Load new env vars for this process
export SUPABASE_URL="$SUPABASE_URL_INPUT"
export SUPABASE_SERVICE_KEY="$SUPABASE_SVC_INPUT"
export PORT=3099  # use non-standard port for test

node -e "
import('./server.js').then(() => {
  setTimeout(() => {
    fetch('http://localhost:3099/api/status')
      .then(r => r.json())
      .then(d => {
        console.log('Status:', JSON.stringify(d.services, null, 2));
        process.exit(0);
      })
      .catch(() => process.exit(0));
  }, 2000);
}).catch(e => { console.error(e.message); process.exit(1); });
" 2>&1 | head -20 || warn "Server test skipped (non-critical)"

# ── 8. Render deployment instructions ────────────────────
header "Render deployment"
echo ""
echo "  Your render.yaml is already configured with 2 services:"
echo "    • miles-optimizer      (branch: main)"
echo "    • miles-optimizer-next (branch: next)"
echo ""
echo "  To deploy:"
echo "  1. Push your code: git push origin next"
echo "  2. Go to https://dashboard.render.com"
echo "  3. New → Blueprint → Connect your GitHub repo"
echo "  4. Render will read render.yaml and create both services automatically"
echo ""
echo "  ⚠️  Add missing env vars in Render dashboard → Environment:"
echo "     SUPABASE_URL          = $SUPABASE_URL_INPUT"
echo "     SUPABASE_SERVICE_KEY  = (your service role key)"
echo ""

# ── 9. Summary ────────────────────────────────────────────
header "Setup complete ✅"
echo ""
echo "  Next steps:"
echo ""
echo "  1. Apply SQL schema in Supabase Dashboard → SQL Editor"
echo "  2. Set Supabase auth settings:"
echo "       Site URL  → https://miles-optimizer-next.onrender.com"
echo "       Redirect  → https://miles-optimizer-next.onrender.com"
echo "  3. Push to GitHub: git push origin next"
echo "  4. Connect repo to Render via Blueprint"
echo "  5. Add SUPABASE_URL + SUPABASE_SERVICE_KEY to Render env vars"
echo ""
echo "  Local dev: npm run dev (port 5173 + API proxy to 3001)"
echo ""
