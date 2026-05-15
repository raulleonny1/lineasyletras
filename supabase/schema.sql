-- Supabase schema for Archivo Nocturno

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  patron_tier text,
  created_at timestamptz default now()
);

create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  synopsis text,
  genre text,
  status text,
  cover_gradient text,
  cover_accent text,
  featured boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.seasons (
  id uuid primary key default gen_random_uuid(),
  story_id uuid references public.stories(id) on delete cascade,
  number int not null,
  title text not null,
  synopsis text
);

create table if not exists public.episodes (
  id uuid primary key default gen_random_uuid(),
  season_id uuid references public.seasons(id) on delete cascade,
  slug text not null,
  title text not null,
  number int not null,
  kind text not null,
  access text not null,
  reading_minutes int,
  excerpt text,
  content text,
  published_at timestamptz,
  scheduled_for timestamptz
);

create table if not exists public.reading_progress (
  user_id uuid references auth.users(id) on delete cascade,
  story_slug text not null,
  episode_slug text not null,
  percent int default 0,
  updated_at timestamptz default now(),
  primary key (user_id, story_slug)
);

create table if not exists public.favorites (
  user_id uuid references auth.users(id) on delete cascade,
  story_slug text not null,
  created_at timestamptz default now(),
  primary key (user_id, story_slug)
);

create table if not exists public.theories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  story_slug text not null,
  title text not null,
  body text not null,
  votes int default 0,
  created_at timestamptz default now()
);

create table if not exists public.marginal_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  story_slug text not null,
  episode_slug text not null,
  body text not null,
  emotion text,
  created_at timestamptz default now()
);

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  stripe_session_id text,
  story_slug text,
  tier_id text,
  amount int,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
alter table public.reading_progress enable row level security;
alter table public.favorites enable row level security;
alter table public.theories enable row level security;
alter table public.marginal_notes enable row level security;
alter table public.purchases enable row level security;

-- App auth, records, and role-based access

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text,
  membership_level text not null default 'free' check (membership_level in ('free', 'supporter', 'premium')),
  role text not null default 'reader' check (role in ('reader', 'writer', 'superuser')),
  created_at timestamptz not null default now()
);

create table if not exists public.records (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  synopsis text,
  content text,
  season int not null default 1,
  episode int not null default 1,
  story_title text not null default '',
  story_slug text not null default '',
  season_title text not null default '',
  is_premium boolean not null default false,
  published boolean not null default false,
  featured boolean not null default false,
  tags text[] not null default '{}',
  cover_url text,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  record_id uuid not null references public.records(id) on delete cascade,
  progress_percent int not null default 0,
  last_position int not null default 0,
  primary key (user_id, record_id)
);

alter table public.users enable row level security;
alter table public.records add column if not exists featured boolean not null default false;
alter table public.records add column if not exists tags text[] not null default '{}';
alter table public.records add column if not exists cover_url text;
alter table public.records add column if not exists story_title text not null default '';
alter table public.records add column if not exists story_slug text not null default '';
alter table public.records add column if not exists season_title text not null default '';
alter table public.records add column if not exists created_by uuid references public.users(id) on delete set null;

create table if not exists public.season_characters (
  id uuid primary key default gen_random_uuid(),
  season int not null,
  story_slug text not null default '',
  name text not null,
  role text,
  description text,
  published boolean not null default false,
  image_url text,
  created_at timestamptz not null default now()
);

create index if not exists season_characters_season_idx on public.season_characters (season);
create index if not exists season_characters_story_slug_idx on public.season_characters (story_slug);

alter table public.season_characters add column if not exists story_slug text not null default '';

alter table public.season_characters add column if not exists image_url text;

alter table public.season_characters enable row level security;

drop policy if exists "Public can read published season characters" on public.season_characters;
create policy "Public can read published season characters"
on public.season_characters
for select
using (
  published = true
  and exists (
    select 1
    from public.records
    where records.season = season_characters.season
      and records.published = true
      and (
        season_characters.story_slug = ''
        or records.story_slug = season_characters.story_slug
      )
  )
);

drop policy if exists "Staff can manage season characters" on public.season_characters;
create policy "Staff can manage season characters"
on public.season_characters
for all
using (public.is_staff())
with check (public.is_staff());

alter table public.progress enable row level security;

create or replace function public.is_superuser()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users
    where id = auth.uid() and role = 'superuser'
  );
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users
    where id = auth.uid() and role in ('superuser', 'writer')
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    nullif(new.raw_user_meta_data->>'name', ''),
    'reader'
  )
  on conflict (id) do update
  set email = excluded.email,
      name = coalesce(excluded.name, public.users.name);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

drop policy if exists "Users can read own profile" on public.users;
create policy "Users can read own profile"
on public.users
for select
using (auth.uid() = id or public.is_superuser());

drop policy if exists "Superusers can update roles" on public.users;
create policy "Superusers can update roles"
on public.users
for update
using (public.is_superuser())
with check (public.is_superuser());

drop policy if exists "Public can read published records" on public.records;
create policy "Public can read published records"
on public.records
for select
using (published = true or public.is_staff());

drop policy if exists "Staff can manage records" on public.records;
create policy "Staff can manage records"
on public.records
for all
using (public.is_staff())
with check (public.is_staff());

drop policy if exists "Users can manage own progress" on public.progress;
create policy "Users can manage own progress"
on public.progress
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('record-covers', 'record-covers', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Public can read record covers" on storage.objects;
create policy "Public can read record covers"
on storage.objects
for select
using (bucket_id = 'record-covers');

drop policy if exists "Staff can upload record covers" on storage.objects;
create policy "Staff can upload record covers"
on storage.objects
for insert
with check (bucket_id = 'record-covers' and public.is_staff());

drop policy if exists "Staff can update record covers" on storage.objects;
create policy "Staff can update record covers"
on storage.objects
for update
using (bucket_id = 'record-covers' and public.is_staff())
with check (bucket_id = 'record-covers' and public.is_staff());

drop policy if exists "Staff can delete record covers" on storage.objects;
create policy "Staff can delete record covers"
on storage.objects
for delete
using (bucket_id = 'record-covers' and public.is_staff());

insert into storage.buckets (id, name, public)
values ('character-portraits', 'character-portraits', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Public can read character portraits" on storage.objects;
create policy "Public can read character portraits"
on storage.objects
for select
using (bucket_id = 'character-portraits');

drop policy if exists "Staff can upload character portraits" on storage.objects;
create policy "Staff can upload character portraits"
on storage.objects
for insert
with check (bucket_id = 'character-portraits' and public.is_staff());

drop policy if exists "Staff can update character portraits" on storage.objects;
create policy "Staff can update character portraits"
on storage.objects
for update
using (bucket_id = 'character-portraits' and public.is_staff())
with check (bucket_id = 'character-portraits' and public.is_staff());

drop policy if exists "Staff can delete character portraits" on storage.objects;
create policy "Staff can delete character portraits"
on storage.objects
for delete
using (bucket_id = 'character-portraits' and public.is_staff());
