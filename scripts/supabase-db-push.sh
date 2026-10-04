#!/usr/bin/env bash
set -euo pipefail

# Direct Supabase database hosts may resolve to IPv6, which can time out in CI
# or environments without IPv6 egress. Use the Supavisor session pooler URL:
# postgresql://postgres.<PROJECT_REF>:[PASSWORD]@aws-0-<REGION>.pooler.supabase.com:5432/postgres
if [[ -z "${SUPABASE_DB_URL:-}" ]]; then
  echo "SUPABASE_DB_URL is required." >&2
  echo "Use the Supabase Dashboard > Connect > Session pooler connection string (port 5432), not the direct db host." >&2
  exit 2
fi

if [[ "${SUPABASE_DB_URL}" == *"db."*"supabase.co"* ]]; then
  echo "SUPABASE_DB_URL appears to use the direct Supabase database host." >&2
  echo "Replace it with the Session pooler URL at aws-0-<region>.pooler.supabase.com:5432 to avoid IPv6 timeout failures." >&2
  exit 2
fi

if [[ "${SUPABASE_DB_URL}" != *"pooler.supabase.com:5432"* ]]; then
  echo "SUPABASE_DB_URL must use the Supavisor session pooler on port 5432 for migrations." >&2
  exit 2
fi

npx --yes supabase@latest db push --db-url "${SUPABASE_DB_URL}" --yes
