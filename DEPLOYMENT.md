# Production deployment

## Fix for `failed to connect to postgres` / IPv6 timeout

Do not use the direct Supabase database URL (`db.<project-ref>.supabase.co`) for migrations from CI or networks without IPv6 egress. Use the **Session pooler** connection string from Supabase Dashboard → **Connect**:

```text
postgresql://postgres.<PROJECT_REF>:<PASSWORD>@aws-0-<REGION>.pooler.supabase.com:5432/postgres
```

Use port **5432** (session mode) for migrations. Do not commit this URL or its password.

Local migration command:

```bash
export SUPABASE_DB_URL='postgresql://postgres.<PROJECT_REF>:<PASSWORD>@aws-0-<REGION>.pooler.supabase.com:5432/postgres'
bash scripts/supabase-db-push.sh
```

The script rejects the direct `db.*.supabase.co` host and requires the pooler URL so this timeout does not recur.

## Automatic deployment

`.github/workflows/deploy.yml` runs on every push to `main` in this order:

1. TypeScript check, tests, and production build.
2. Supabase migrations through the session pooler.
3. Cloudflare Pages deployment.

Configure these **GitHub Actions production environment** values once:

- Secret `SUPABASE_DB_URL`: the session pooler URL above.
- Secret `CLOUDFLARE_API_TOKEN`: a token with Cloudflare Pages deployment permission.
- Secret `CLOUDFLARE_ACCOUNT_ID`: the Cloudflare account ID.
- Variable `CLOUDFLARE_PAGES_PROJECT`: the existing Cloudflare Pages project name.

The browser still uses `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`; those are separate from the migration password and must never be replaced with the database URL.
