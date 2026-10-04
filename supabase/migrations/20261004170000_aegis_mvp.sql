-- Aegis Secure MVP domain schema. Run in Supabase SQL editor or migration pipeline.
-- Existing learning/workspace tables are intentionally left untouched.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'client' check (role in ('client','provider','admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  description text not null,
  scope text not null,
  deliverables text not null,
  starting_price numeric(12,2),
  currency text not null default 'INR',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references auth.users(id) on delete cascade,
  provider_id uuid references auth.users(id) on delete set null,
  service_id uuid references public.services(id) on delete set null,
  title text not null,
  requirements text not null,
  budget numeric(12,2),
  deadline date,
  status text not null default 'REQUESTED' check (status in ('REQUESTED','ACCEPTED','IN_PROGRESS','AWAITING_CLIENT','DELIVERED','COMPLETED','CANCELLED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  uploaded_by uuid not null references auth.users(id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  kind text not null default 'project',
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  slug text unique not null,
  description text not null,
  category text not null,
  price numeric(12,2) not null check (price >= 0),
  currency text not null default 'INR',
  download_path text,
  active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  amount numeric(12,2) not null check (amount >= 0),
  currency text not null default 'INR',
  status text not null default 'PENDING' check (status in ('PENDING','PAID','FAILED','REFUNDED')),
  provider_reference text,
  created_at timestamptz not null default now()
);

create index if not exists projects_client_id_idx on public.projects(client_id, created_at desc);
create index if not exists projects_provider_id_idx on public.projects(provider_id, created_at desc);
create index if not exists project_files_project_id_idx on public.project_files(project_id);
create index if not exists products_active_idx on public.products(active, created_at desc);
create index if not exists orders_buyer_id_idx on public.orders(buyer_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.services enable row level security;
alter table public.projects enable row level security;
alter table public.project_files enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;

drop policy if exists "public read active services" on public.services;
create policy "public read active services" on public.services for select using (active = true);

drop policy if exists "users read own profile" on public.profiles;
create policy "users read own profile" on public.profiles for select using (id = auth.uid());
drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "clients and providers read authorized projects" on public.projects;
create policy "clients and providers read authorized projects" on public.projects for select using (client_id = auth.uid() or provider_id = auth.uid());
drop policy if exists "clients create own projects" on public.projects;
create policy "clients create own projects" on public.projects for insert with check (client_id = auth.uid());
drop policy if exists "authorized users update projects" on public.projects;
create policy "authorized users update projects" on public.projects for update using (client_id = auth.uid() or provider_id = auth.uid()) with check (client_id = auth.uid() or provider_id = auth.uid());

drop policy if exists "authorized users read project files" on public.project_files;
create policy "authorized users read project files" on public.project_files for select using (exists (select 1 from public.projects p where p.id = project_id and (p.client_id = auth.uid() or p.provider_id = auth.uid())));
drop policy if exists "authorized users add project files" on public.project_files;
create policy "authorized users add project files" on public.project_files for insert with check (uploaded_by = auth.uid() and exists (select 1 from public.projects p where p.id = project_id and (p.client_id = auth.uid() or p.provider_id = auth.uid())));

drop policy if exists "public read active products" on public.products;
create policy "public read active products" on public.products for select using (active = true or creator_id = auth.uid());
drop policy if exists "creators manage own products" on public.products;
create policy "creators manage own products" on public.products for insert with check (creator_id = auth.uid());
create policy "creators update own products" on public.products for update using (creator_id = auth.uid()) with check (creator_id = auth.uid());

drop policy if exists "buyers read own orders" on public.orders;
create policy "buyers read own orders" on public.orders for select using (buyer_id = auth.uid());
-- Orders must be created by a verified server/payment webhook, never by the browser.

insert into public.services (title, slug, description, scope, deliverables, starting_price)
values
('Website Security Assessment','website-security-assessment','A focused review of your public website and its security posture.','Authorized review of headers, TLS, exposed services, common misconfigurations, and visible attack surface.','Prioritized findings, risk context, and practical remediation guidance.','4999'),
('Web Application Security Assessment','web-application-security-assessment','A structured assessment of an authorized web application.','Review of authentication, authorization, input handling, sessions, and common application risks.','Executive summary, technical findings, evidence, and remediation plan.','7999'),
('Vulnerability Assessment','vulnerability-assessment','Identify and prioritize vulnerabilities across an authorized environment.','Authenticated or unauthenticated assessment based on agreed scope and access.','Risk-ranked vulnerability report with remediation priorities.','5999'),
('Security Hardening','security-hardening','Reduce avoidable exposure across your approved infrastructure or application.','Configuration review and hardening recommendations for the agreed target.','Hardening checklist, change plan, and validation notes.','4999'),
('Security Review','security-review','An expert review of a product, architecture, or security control.','Targeted review of the agreed code, architecture, process, or control.','Review notes, material risks, and actionable next steps.','3999'),
('Retesting','retesting','Validate fixes after an earlier authorized assessment.','Retest of agreed findings and affected components only.','Retest result with remaining-risk notes.','2999'),
('Security Consultation','security-consultation','Practical guidance for a specific cybersecurity decision.','One focused consultation covering the agreed question or decision.','Written recommendations and a clear action plan.','1999')
on conflict (slug) do nothing;

insert into storage.buckets (id, name, public) values ('project-files','project-files',false) on conflict (id) do nothing;

drop policy if exists "authorized users access project storage" on storage.objects;
create policy "authorized users access project storage" on storage.objects for all using (
  bucket_id = 'project-files' and exists (
    select 1 from public.project_files f join public.projects p on p.id = f.project_id
    where f.storage_path = name and (p.client_id = auth.uid() or p.provider_id = auth.uid())
  )
) with check (bucket_id = 'project-files');
