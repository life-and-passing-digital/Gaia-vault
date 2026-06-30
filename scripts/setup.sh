#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Gaia Vault — one-shot local setup
#
#   bash scripts/setup.sh
#
# Installs dependencies, prepares your env file, generates the two local
# encryption keys, and (if the Supabase CLI is present) pushes migrations.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

say() { printf "\033[0;32m›\033[0m %s\n" "$1"; }
warn() { printf "\033[0;33m!\033[0m %s\n" "$1"; }

say "Installing dependencies…"
if command -v pnpm >/dev/null 2>&1; then pnpm install
elif command -v npm >/dev/null 2>&1; then npm install
else echo "Need npm or pnpm on PATH." >&2; exit 1; fi

if [ ! -f .env.local ]; then
  say "Creating .env.local from .env.example…"
  cp .env.example .env.local

  if command -v openssl >/dev/null 2>&1; then
    say "Generating local development encryption keys…"
    WRAP_KEY="$(openssl rand -base64 32)"
    PEPPER="$(openssl rand -base64 32)"
    # Portable in-place sed (works on GNU and BSD/macOS).
    sed -i.bak "s|^RELEASE_WRAPPING_KEY=.*|RELEASE_WRAPPING_KEY=${WRAP_KEY}|" .env.local
    sed -i.bak "s|^VAULT_KEY_DERIVATION_PEPPER=.*|VAULT_KEY_DERIVATION_PEPPER=${PEPPER}|" .env.local
    rm -f .env.local.bak
    warn "These are DEV keys held in env. Production MUST use a KMS / Supabase Vault — see docs/SECURITY.md."
  else
    warn "openssl not found — set RELEASE_WRAPPING_KEY and VAULT_KEY_DERIVATION_PEPPER manually."
  fi
else
  warn ".env.local already exists — leaving it untouched."
fi

if command -v supabase >/dev/null 2>&1; then
  say "Pushing Supabase migrations (local)…"
  supabase db push || warn "Supabase push skipped/failed — start the local stack first (supabase start)."
else
  warn "Supabase CLI not found — install it to run migrations (https://supabase.com/docs/guides/cli)."
fi

say "Done. Fill in the remaining secrets in .env.local, then run: npm run dev"
