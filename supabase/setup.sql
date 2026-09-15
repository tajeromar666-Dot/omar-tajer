-- CIA site — full Supabase setup for every admin-editable domain.
--
-- Run this once in the Supabase dashboard: Project -> SQL Editor -> New query
-- -> paste this whole file -> Run. The app's code (src/data/seedData.js,
-- src/data/supabaseSync.js) already expects exactly this shape and already
-- talks to these tables — every device (including the deployed Netlify
-- site) has been silently falling back to its OWN per-browser localStorage
-- because these tables did not exist yet in this project. That is the
-- actual reason edits made in one place never appeared anywhere else —
-- no amount of code or deploy-pipeline fixing can work around a database
-- that doesn't have the tables it's trying to read/write. This script is
-- the fix; run it before testing anything else.
--
-- Safe to re-run: every statement below is idempotent (create-if-missing,
-- drop-then-create for policies, guarded publication adds).
--
-- id is TEXT (not uuid) because the app generates its own ids client-side,
-- e.g. "p_1699999999999" — see the various *Form.jsx / *Tab.jsx files.

-- ---------------------------------------------------------------------------
-- 1. Tables — one per admin-editable domain.
-- ---------------------------------------------------------------------------

-- Réalisations / Projets
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

-- Plans 3D & Études Techniques
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

-- Contact form submissions (Messages tab)
create table if not exists public.cia_messages (
  id text primary key,
  name text not null default '',
  email text not null default '',
  phone text not null default '',
  message text not null default '',
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Site settings — key/value pairs (company name, phone, email, hero
-- title/subtitle, logo...). One row per setting key.
create table if not exists public.cia_settings (
  key text primary key,
  value text
);

-- Témoignages
create table if not exists public.cia_testimonials (
  id text primary key,
  client_name text not null default '',
  company text not null default '',
  role text not null default '',
  text text not null default '',
  rating integer not null default 5,
  avatar text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Notre Équipe
create table if not exists public.cia_team (
  id text primary key,
  name text not null default '',
  role text not null default '',
  photo text,
  linkedin text not null default '',
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- Hero — slideshow
create table if not exists public.cia_hero_slides (
  id text primary key,
  image text,
  title text not null default '',
  subtitle text not null default '',
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- À Propos — single row, id is always the literal string 'about'.
-- (`values` is a reserved SQL word, hence `value_items` for the 4
-- icon/title/text mini-cards shown in this section.)
create table if not exists public.cia_about (
  id text primary key,
  title text not null default '',
  title_accent text not null default '',
  media_type text not null default 'image',
  image text,
  video text,
  video_type text,
  badge_number text not null default '',
  badge_label text not null default '',
  description text not null default '',
  value_items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- Services
create table if not exists public.cia_services (
  id text primary key,
  icon text not null default '',
  title text not null default '',
  description text not null default '',
  created_at timestamptz not null default now()
);

-- Partenaires
create table if not exists public.cia_partners (
  id text primary key,
  name text not null default '',
  logo text,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- Excellence Industrielle / Pourquoi Nous — advantage cards
create table if not exists public.cia_whyus_items (
  id text primary key,
  icon text not null default '',
  title text not null default '',
  text text not null default '',
  created_at timestamptz not null default now()
);

-- Excellence Industrielle — slideshow
create table if not exists public.cia_whyus_slides (
  id text primary key,
  media_type text not null default 'image',
  image text,
  video text,
  video_type text,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 2. Row Level Security — same policy shape on every table above.
--
-- This site has no backend server — the browser talks to Supabase directly
-- with the public anon/publishable key for both the public pages AND the
-- admin dashboard (the admin dashboard is gated by the app's own login
-- screen, not necessarily by a real Supabase Auth session). To keep the
-- write-through-from-the-admin-dashboard feature working out of the box,
-- these policies allow anyone with that public key to read AND write —
-- i.e. security is enforced at the app's login screen, not the database.
--
-- If you'd rather enforce this at the database level too, create real
-- Supabase Auth users for your admins and change the insert/update/delete
-- policies to `using (auth.role() = 'authenticated')` instead of
-- `using (true)` — but the current admin login falls back to a local
-- (non-Supabase-Auth) check whenever Supabase sign-in fails, so every admin
-- would need a real Supabase Auth account for writes to keep working.
--
-- Applied via a loop (rather than 4 policies x 12 tables repeated by hand)
-- so it stays correct and easy to extend if more tables are added later.
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
  content_tables text[] := array[
    'cia_projects', 'cia_plans3d', 'cia_messages', 'cia_settings',
    'cia_testimonials', 'cia_team', 'cia_hero_slides', 'cia_about',
    'cia_services', 'cia_partners', 'cia_whyus_items', 'cia_whyus_slides'
  ];
begin
  foreach t in array content_tables loop
    execute format('alter table public.%I enable row level security', t);

    execute format('drop policy if exists %I on public.%I', t || '_public_read', t);
    execute format('create policy %I on public.%I for select using (true)', t || '_public_read', t);

    execute format('drop policy if exists %I on public.%I', t || '_public_insert', t);
    execute format('create policy %I on public.%I for insert with check (true)', t || '_public_insert', t);

    execute format('drop policy if exists %I on public.%I', t || '_public_update', t);
    execute format('create policy %I on public.%I for update using (true) with check (true)', t || '_public_update', t);

    execute format('drop policy if exists %I on public.%I', t || '_public_delete', t);
    execute format('create policy %I on public.%I for delete using (true)', t || '_public_delete', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 3. Realtime — required for the postgres_changes subscriptions in
--    src/data/supabaseSync.js to actually receive insert/update/delete
--    events. Without this, the site would still work but edits made
--    elsewhere would only show up after this browser's next full reload,
--    not "within seconds" as intended.
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
  content_tables text[] := array[
    'cia_projects', 'cia_plans3d', 'cia_messages', 'cia_settings',
    'cia_testimonials', 'cia_team', 'cia_hero_slides', 'cia_about',
    'cia_services', 'cia_partners', 'cia_whyus_items', 'cia_whyus_slides'
  ];
begin
  foreach t in array content_tables loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 4. Storage bucket for uploaded images/video (src/data/mediaStorage.js).
--    Skip this if you only ever paste image URLs instead of uploading files
--    — but it costs nothing to create and every admin form supports both.
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
