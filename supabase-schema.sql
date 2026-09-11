-- ============================================================
-- SMART SWACHH — Supabase Schema
-- Run this whole file once in: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. PROFILES (extends auth.users with role + points)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  role text not null check (role in ('citizen','worker','admin')),
  points int not null default 0,
  phone text,
  created_at timestamptz not null default now()
);

-- 2. REPORTS (citizen complaints)
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  citizen_id uuid not null references public.profiles(id) on delete cascade,
  photo_url text not null,
  after_photo_url text,
  description text,
  ai_waste_type text,
  ai_category text,
  ai_suggested_bin text,
  ai_tips text,
  location_lat double precision,
  location_lng double precision,
  location_address text,
  status text not null default 'pending' check (status in ('pending','assigned','in_progress','completed')),
  assigned_worker_id uuid references public.profiles(id),
  points_awarded int not null default 10,
  created_at timestamptz not null default now(),
  assigned_at timestamptz,
  completed_at timestamptz
);

-- 3. WITHDRAWALS (points → money requests)
create table if not exists public.withdrawals (
  id uuid primary key default gen_random_uuid(),
  citizen_id uuid not null references public.profiles(id) on delete cascade,
  points int not null,
  amount_inr numeric not null,
  status text not null default 'requested' check (status in ('requested','approved','rejected','paid')),
  created_at timestamptz not null default now()
);

-- 4. STORAGE BUCKET for report photos
insert into storage.buckets (id, name, public)
values ('waste-photos', 'waste-photos', true)
on conflict (id) do nothing;

-- ============================================================
-- Helper: get current user's role without recursive RLS issues
-- ============================================================
create or replace function public.current_role_name()
returns text
language sql
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ============================================================
-- Function: worker completes a task -> updates report + pays out points
-- (security definer so a worker, who cannot normally edit a citizen's
--  profile, can still credit their points as part of finishing the job)
-- ============================================================
create or replace function public.complete_report(p_report_id uuid, p_after_photo_url text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_citizen_id uuid;
  v_points int;
begin
  update public.reports
    set status = 'completed',
        after_photo_url = p_after_photo_url,
        completed_at = now()
    where id = p_report_id
      and assigned_worker_id = auth.uid()
    returning citizen_id, points_awarded into v_citizen_id, v_points;

  if v_citizen_id is null then
    raise exception 'Report not found or not assigned to you';
  end if;

  update public.profiles
    set points = points + v_points
    where id = v_citizen_id;
end;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles enable row level security;
alter table public.reports enable row level security;
alter table public.withdrawals enable row level security;

-- PROFILES policies
create policy "profiles: user can read own" on public.profiles
  for select using (auth.uid() = id or public.current_role_name() = 'admin');

create policy "profiles: workers/citizens visible to admin" on public.profiles
  for select using (public.current_role_name() = 'admin');

create policy "profiles: user can insert own on signup" on public.profiles
  for insert with check (auth.uid() = id);

create policy "profiles: user can update own" on public.profiles
  for update using (auth.uid() = id or public.current_role_name() = 'admin');

-- everyone signed in can see the worker list (needed for admin assignment UI)
create policy "profiles: authenticated can read workers" on public.profiles
  for select using (role = 'worker' and auth.role() = 'authenticated');

-- REPORTS policies
create policy "reports: citizen can insert own" on public.reports
  for insert with check (citizen_id = auth.uid());

create policy "reports: citizen can read own" on public.reports
  for select using (citizen_id = auth.uid());

create policy "reports: worker can read assigned" on public.reports
  for select using (assigned_worker_id = auth.uid());

create policy "reports: admin full read" on public.reports
  for select using (public.current_role_name() = 'admin');

create policy "reports: admin can update (assign)" on public.reports
  for update using (public.current_role_name() = 'admin');

create policy "reports: worker can update own assigned task" on public.reports
  for update using (assigned_worker_id = auth.uid());

-- WITHDRAWALS policies
create policy "withdrawals: citizen insert own" on public.withdrawals
  for insert with check (citizen_id = auth.uid());

create policy "withdrawals: citizen read own" on public.withdrawals
  for select using (citizen_id = auth.uid());

create policy "withdrawals: admin read all" on public.withdrawals
  for select using (public.current_role_name() = 'admin');

create policy "withdrawals: admin update" on public.withdrawals
  for update using (public.current_role_name() = 'admin');

-- STORAGE policies (public bucket, but only logged-in users can upload)
create policy "waste-photos: public read" on storage.objects
  for select using (bucket_id = 'waste-photos');

create policy "waste-photos: authenticated upload" on storage.objects
  for insert with check (bucket_id = 'waste-photos' and auth.role() = 'authenticated');

-- ============================================================
-- DONE. Next step: create your admin account.
-- 1. Sign up once from the website's login screen using:
--       email:    amansingh28888@gmail.com
--       password: Aman@2004
--    (use the "Citizen" or "Worker" tab, role does not matter here —
--     you will fix it below.)
-- 2. Then run this (only once, after signup):
--
--    update public.profiles
--    set role = 'admin'
--    where email = 'amansingh28888@gmail.com';
--
-- 3. Log out and log back in — you'll now land on the Admin dashboard.
-- ============================================================
