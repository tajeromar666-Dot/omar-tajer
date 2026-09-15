-- CIA site — Supabase setup for the "Projets" and "Plans 3D" sections.
--
-- Run this once in the Supabase dashboard: Project -> SQL Editor -> New query
-- -> paste this whole file -> Run. The app's code (src/data/seedData.js,
-- src/data/supabaseSync.js) already expects exactly this shape and already
-- talks to these tables — it was silently falling back to per-browser
-- localStorage because the tables/publication below did not exist yet in
-- this project, which is why edits never synced across devices.
--
-- id is TEXT (not uuid) because the app generates its own ids client-side,
-- e.g. "p_1699999999999" / "pl_1699999999999" — see ProjectForm.jsx /
-- Plans3DForm.jsx.

-- ---------------------------------------------------------------------------
-- 1. Tables
-- ---------------------------------------------------------------------------

create table if not exists public.cia_projects (
  id text primary key,
  title text not null default '',
  category text not null default '',
  client text not null default '',
  year text not null default '',
  description text not null default '',
  images jsonb not null default '[]'::jsonb,
  video text,
  video_type text,
  featured boolean not null default false,
  visible boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.cia_plans3d (
  id text primary key,
  title text not null default '',
  type text not null default '',
  description text not null default '',
  software text not null default '',
  images jsonb not null default '[]'::jsonb,
  video text,
  video_type text,
  featured boolean not null default false,
  visible boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 2. Row Level Security
--
-- This site has no backend server — the browser talks to Supabase directly
-- with the public anon/publishable key for both the public pages AND the
-- admin dashboard (the admin dashboard is gated by the app's own login
-- screen, not by a real Supabase Auth session in most setups). To keep the
-- write-through-from-the-admin-dashboard feature working out of the box,
-- these policies allow anyone with that public key to read AND write —
-- i.e. security is enforced at the app's login screen, not at the database.
--
-- If you'd rather enforce this at the database level too, create real
-- Supabase Auth users for your admins and change the INSERT/UPDATE/DELETE
-- policies below to `using (auth.role() = 'authenticated')` instead of
-- `using (true)` — but note the current admin login falls back to a local
-- (non-Supabase-Auth) check whenever Supabase sign-in fails, so every admin
-- would need a real Supabase Auth account for writes to keep working.
-- ---------------------------------------------------------------------------

alter table public.cia_projects enable row level security;
alter table public.cia_plans3d enable row level security;

-- cia_projects: one explicit policy per command (read/insert/update/delete)
-- rather than a single combined "for all", so each permission shows up as
-- its own row in Supabase Dashboard -> Authentication -> Policies.
drop policy if exists "cia_projects_public_read" on public.cia_projects;
create policy "cia_projects_public_read" on public.cia_projects
  for select using (true);
drop policy if exists "cia_projects_public_insert" on public.cia_projects;
create policy "cia_projects_public_insert" on public.cia_projects
  for insert with check (true);
drop policy if exists "cia_projects_public_update" on public.cia_projects;
create policy "cia_projects_public_update" on public.cia_projects
  for update using (true) with check (true);
drop policy if exists "cia_projects_public_delete" on public.cia_projects;
create policy "cia_projects_public_delete" on public.cia_projects
  for delete using (true);

-- cia_plans3d: same 4 explicit policies.
drop policy if exists "cia_plans3d_public_read" on public.cia_plans3d;
create policy "cia_plans3d_public_read" on public.cia_plans3d
  for select using (true);
drop policy if exists "cia_plans3d_public_insert" on public.cia_plans3d;
create policy "cia_plans3d_public_insert" on public.cia_plans3d
  for insert with check (true);
drop policy if exists "cia_plans3d_public_update" on public.cia_plans3d;
create policy "cia_plans3d_public_update" on public.cia_plans3d
  for update using (true) with check (true);
drop policy if exists "cia_plans3d_public_delete" on public.cia_plans3d;
create policy "cia_plans3d_public_delete" on public.cia_plans3d
  for delete using (true);

-- ---------------------------------------------------------------------------
-- 3. Realtime — required for the postgres_changes subscriptions in
--    src/data/supabaseSync.js to actually receive insert/update/delete
--    events. Without this, the site would still work but edits would only
--    show up on other devices after their next full page reload.
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'cia_projects'
  ) then
    alter publication supabase_realtime add table public.cia_projects;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'cia_plans3d'
  ) then
    alter publication supabase_realtime add table public.cia_plans3d;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 4. Storage bucket for uploaded images/video (src/data/mediaStorage.js).
--    Skip this if you only ever paste image URLs instead of uploading files
--    — but it costs nothing to create and the admin form supports both.
--    Public bucket: uploaded media is meant to be shown on the public site.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('cia-media', 'cia-media', true)
on conflict (id) do nothing;

drop policy if exists "cia_media_public_read" on storage.objects;
create policy "cia_media_public_read" on storage.objects
  for select using (bucket_id = 'cia-media');
drop policy if exists "cia_media_public_write" on storage.objects;
create policy "cia_media_public_write" on storage.objects
  for all using (bucket_id = 'cia-media') with check (bucket_id = 'cia-media');

-- ---------------------------------------------------------------------------
-- Note: the app's data layer (seedData.js) defines this exact same pattern
-- for 4 more tables — cia_messages, cia_settings, cia_testimonials and
-- cia_team — which were found to be missing too when this was diagnosed.
-- They aren't in scope for this fix (Projets / Plans 3D only) but will hit
-- the identical "silently falls back to localStorage" behavior until they
-- get the same treatment. Ask if you'd like the equivalent script for those.
-- ---------------------------------------------------------------------------
