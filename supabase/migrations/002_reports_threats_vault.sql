-- ============================================================
-- Migration: 002_reports_threats_vault
-- Description: Aegis workspace tables — security reports, threat signals,
--              and the encrypted password vault — with row level security.
--
-- HOW TO RUN: paste this whole file into the Supabase SQL Editor and run it.
-- It is idempotent, so re-running it is safe.
--
-- PASSWORD ENCRYPTION DECISION (documented on purpose):
--   `vault_items.password_encrypted` stores ciphertext produced by the browser
--   with the Web Crypto API (AES-256-GCM, payload format `v1.<iv>.<data>`).
--   The per-user data key is generated in the browser on first use and kept in
--   the signed-in user's own `user_metadata` (readable only by that user).
--   The plaintext password is never sent to the database or to the API server.
--   pgcrypto was the alternative; Web Crypto was chosen because it keeps the
--   key out of the database entirely and needs no extension or DB secret.
-- ============================================================

-- ============================================================
-- 1. reports — security scans and reviews
-- ============================================================

create table if not exists public.reports (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  type        text not null,
  severity    text not null default 'low'
    check (severity in ('critical', 'high', 'medium', 'low')),
  status      text not null default 'open'
    check (status in ('open', 'in_progress', 'resolved')),
  description text,
  created_at  timestamptz not null default now()
);

create index if not exists idx_reports_user_created
  on public.reports (user_id, created_at desc);

alter table public.reports enable row level security;

drop policy if exists reports_select_own on public.reports;
create policy reports_select_own on public.reports
  for select using (auth.uid() = user_id);

drop policy if exists reports_insert_own on public.reports;
create policy reports_insert_own on public.reports
  for insert with check (auth.uid() = user_id);

drop policy if exists reports_update_own on public.reports;
create policy reports_update_own on public.reports
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists reports_delete_own on public.reports;
create policy reports_delete_own on public.reports
  for delete using (auth.uid() = user_id);

-- ============================================================
-- 2. threats — live threat signals
-- ============================================================

create table if not exists public.threats (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  severity    text not null default 'low'
    check (severity in ('critical', 'high', 'medium', 'low')),
  source      text not null,
  description text,
  created_at  timestamptz not null default now()
);

create index if not exists idx_threats_user_created
  on public.threats (user_id, created_at desc);

alter table public.threats enable row level security;

drop policy if exists threats_select_own on public.threats;
create policy threats_select_own on public.threats
  for select using (auth.uid() = user_id);

drop policy if exists threats_insert_own on public.threats;
create policy threats_insert_own on public.threats
  for insert with check (auth.uid() = user_id);

drop policy if exists threats_update_own on public.threats;
create policy threats_update_own on public.threats
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists threats_delete_own on public.threats;
create policy threats_delete_own on public.threats
  for delete using (auth.uid() = user_id);

-- ============================================================
-- 3. vault_items — encrypted credentials
-- ============================================================

create table if not exists public.vault_items (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users (id) on delete cascade,
  site               text not null,
  username           text,
  password_encrypted text not null,
  strength           text not null default 'weak'
    check (strength in ('weak', 'fair', 'good', 'strong')),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists idx_vault_items_user_updated
  on public.vault_items (user_id, updated_at desc);

alter table public.vault_items enable row level security;

drop policy if exists vault_items_select_own on public.vault_items;
create policy vault_items_select_own on public.vault_items
  for select using (auth.uid() = user_id);

drop policy if exists vault_items_insert_own on public.vault_items;
create policy vault_items_insert_own on public.vault_items
  for insert with check (auth.uid() = user_id);

drop policy if exists vault_items_update_own on public.vault_items;
create policy vault_items_update_own on public.vault_items
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists vault_items_delete_own on public.vault_items;
create policy vault_items_delete_own on public.vault_items
  for delete using (auth.uid() = user_id);

-- Keep updated_at accurate even when a row is changed outside the app.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists vault_items_touch_updated_at on public.vault_items;
create trigger vault_items_touch_updated_at
  before update on public.vault_items
  for each row execute function public.touch_updated_at();

-- ============================================================
-- 4. Realtime — the /threats page subscribes to threat changes
-- ============================================================

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      alter publication supabase_realtime add table public.threats;
    exception
      when duplicate_object then null;
      when others then null;
    end;
    begin
      alter publication supabase_realtime add table public.reports;
    exception
      when duplicate_object then null;
      when others then null;
    end;
  end if;
end;
$$;

-- ============================================================
-- 5. Self-service account deletion (/account danger zone)
-- Runs as the definer so it can remove the auth.users row; the app simply
-- calls supabase.rpc('delete_own_account'). All child rows cascade away.
-- ============================================================

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_own_account() from public;
revoke all on function public.delete_own_account() from anon;
grant execute on function public.delete_own_account() to authenticated;
