-- Wine tracking app: initial schema, RLS, RPCs, seeds, storage.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type wine_colour as enum ('red', 'white', 'rose', 'orange', 'sparkling', 'fortified', 'dessert');
create type vessel_type as enum ('bottle', 'glass', 'taster');
create type serving_temp as enum ('chilled', 'with_ice', 'room_temp', 'hot');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);

create table countries (
  code char(2) primary key, -- ISO 3166-1 alpha-2
  name text not null unique
);

create table regions (
  id uuid not null default gen_random_uuid() primary key,
  country_code char(2) not null references countries (code),
  name text not null check (length(trim(name)) > 0),
  created_by uuid references auth.users,
  created_at timestamptz not null default now(),
  -- Referenced by the composite FK on wines so a region always belongs to
  -- the wine's selected country.
  unique (id, country_code)
);

create unique index regions_country_name_uniq on regions (country_code, lower(name));

create table varietals (
  id uuid not null default gen_random_uuid() primary key,
  name text not null check (length(trim(name)) > 0),
  created_by uuid references auth.users,
  created_at timestamptz not null default now()
);

create unique index varietals_name_uniq on varietals (lower(name));

-- A wine's identity. Occasions on which it was drunk live in tastings.
create table wines (
  id uuid not null default gen_random_uuid() primary key,
  name text not null check (length(trim(name)) > 0),
  producer text,
  vintage smallint check (vintage between 1900 and extract(year from now())::int + 1), -- null = NV
  country_code char(2) references countries (code),
  region_id uuid,
  colour wine_colour not null,
  -- References profiles (not auth.users) so PostgREST can embed the owner's
  -- display name; a profile exists for every user via the signup trigger.
  created_by uuid not null default auth.uid() references profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (region_id, country_code) references regions (id, country_code)
);

create index wines_country_idx on wines (country_code);
create index wines_region_idx on wines (region_id);

create table wine_varietals (
  wine_id uuid not null references wines (id) on delete cascade,
  varietal_id uuid not null references varietals (id),
  primary key (wine_id, varietal_id)
);

create index wine_varietals_varietal_idx on wine_varietals (varietal_id);

create table tastings (
  id uuid not null default gen_random_uuid() primary key,
  wine_id uuid not null references wines (id) on delete restrict,
  user_id uuid not null default auth.uid() references profiles (id),
  rating smallint not null check (rating between 1 and 10),
  notes text,
  location text,
  consumed_on date not null default current_date,
  vessel vessel_type,
  serving_temp serving_temp,
  price numeric(10, 2) check (price >= 0),
  currency char(3) check (currency ~ '^[A-Z]{3}$'),
  photo_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tastings_user_idx on tastings (user_id, consumed_on desc);
create index tastings_wine_idx on tastings (wine_id);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

create function set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger wines_set_updated_at
  before update on wines
  for each row execute function set_updated_at();

create trigger tastings_set_updated_at
  before update on tastings
  for each row execute function set_updated_at();

-- Auto-create a profile for every new auth user. Display name comes from
-- invite metadata when present, otherwise the email local part.
create function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------------------
-- RPCs: atomic select-or-create for user-addable lookups
-- ---------------------------------------------------------------------------

create function get_or_create_region(p_country char(2), p_name text)
returns regions
language plpgsql
security invoker
set search_path = public
as $$
declare
  r regions;
begin
  if length(trim(p_name)) = 0 then
    raise exception 'region name must not be empty';
  end if;

  insert into regions (country_code, name, created_by)
  values (p_country, trim(p_name), auth.uid())
  on conflict (country_code, lower(name)) do nothing;

  select * into strict r
  from regions
  where country_code = p_country and lower(name) = lower(trim(p_name));

  return r;
end;
$$;

create function get_or_create_varietal(p_name text)
returns varietals
language plpgsql
security invoker
set search_path = public
as $$
declare
  v varietals;
begin
  if length(trim(p_name)) = 0 then
    raise exception 'varietal name must not be empty';
  end if;

  insert into varietals (name, created_by)
  values (trim(p_name), auth.uid())
  on conflict (lower(name)) do nothing;

  select * into strict v
  from varietals
  where lower(name) = lower(trim(p_name));

  return v;
end;
$$;

revoke execute on function get_or_create_region (char, text) from anon;
revoke execute on function get_or_create_varietal (text) from anon;

-- ---------------------------------------------------------------------------
-- Row level security
-- Everyone authenticated can read everything; writes are owner-scoped.
-- No policies grant anything to anon.
-- ---------------------------------------------------------------------------

alter table profiles enable row level security;
alter table countries enable row level security;
alter table regions enable row level security;
alter table varietals enable row level security;
alter table wines enable row level security;
alter table wine_varietals enable row level security;
alter table tastings enable row level security;

create policy "profiles are readable" on profiles
  for select to authenticated using (true);
create policy "update own profile" on profiles
  for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy "countries are readable" on countries
  for select to authenticated using (true);

-- Lookup rows are insert-only: no update/delete policies, so nobody can
-- rename a region or varietal out from under someone else's wines.
create policy "regions are readable" on regions
  for select to authenticated using (true);
create policy "add regions" on regions
  for insert to authenticated with check (created_by = auth.uid());

create policy "varietals are readable" on varietals
  for select to authenticated using (true);
create policy "add varietals" on varietals
  for insert to authenticated with check (created_by = auth.uid());

-- Wines are communal to read; identity is editable by the creator only.
-- No delete policy: a wine may have other users' tastings attached.
create policy "wines are readable" on wines
  for select to authenticated using (true);
create policy "add wines" on wines
  for insert to authenticated with check (created_by = auth.uid());
create policy "update own wines" on wines
  for update to authenticated
  using (created_by = auth.uid()) with check (created_by = auth.uid());

create policy "wine varietals are readable" on wine_varietals
  for select to authenticated using (true);
create policy "write own wine varietals" on wine_varietals
  for all to authenticated
  using (exists (select 1 from wines w where w.id = wine_id and w.created_by = auth.uid()))
  with check (exists (select 1 from wines w where w.id = wine_id and w.created_by = auth.uid()));

create policy "tastings are readable" on tastings
  for select to authenticated using (true);
create policy "add own tastings" on tastings
  for insert to authenticated with check (user_id = auth.uid());
create policy "update own tastings" on tastings
  for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "delete own tastings" on tastings
  for delete to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Storage: private photo bucket, owner-scoped writes via {user_id}/... paths
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('wine-photos', 'wine-photos', false, 5242880, array['image/jpeg', 'image/webp']);

create policy "wine photos are readable" on storage.objects
  for select to authenticated using (bucket_id = 'wine-photos');
create policy "upload own wine photos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'wine-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "update own wine photos" on storage.objects
  for update to authenticated
  using (bucket_id = 'wine-photos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'wine-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "delete own wine photos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'wine-photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------------------
-- Seed data (in the migration, not seed.sql, so hosted and local never diverge)
-- ---------------------------------------------------------------------------

insert into countries (code, name) values
  ('AR', 'Argentina'),
  ('AU', 'Australia'),
  ('AT', 'Austria'),
  ('BR', 'Brazil'),
  ('BG', 'Bulgaria'),
  ('CA', 'Canada'),
  ('CL', 'Chile'),
  ('CN', 'China'),
  ('HR', 'Croatia'),
  ('FR', 'France'),
  ('GE', 'Georgia'),
  ('DE', 'Germany'),
  ('GR', 'Greece'),
  ('HU', 'Hungary'),
  ('IT', 'Italy'),
  ('JP', 'Japan'),
  ('LB', 'Lebanon'),
  ('MX', 'Mexico'),
  ('MD', 'Moldova'),
  ('NZ', 'New Zealand'),
  ('PT', 'Portugal'),
  ('RO', 'Romania'),
  ('SI', 'Slovenia'),
  ('ZA', 'South Africa'),
  ('ES', 'Spain'),
  ('CH', 'Switzerland'),
  ('GB', 'United Kingdom'),
  ('US', 'United States'),
  ('UY', 'Uruguay');

insert into varietals (name) values
  ('Aglianico'),
  ('Albariño'),
  ('Assyrtiko'),
  ('Barbera'),
  ('Blaufränkisch'),
  ('Cabernet Franc'),
  ('Cabernet Sauvignon'),
  ('Carignan'),
  ('Carmenère'),
  ('Chardonnay'),
  ('Chenin Blanc'),
  ('Cinsault'),
  ('Corvina'),
  ('Dolcetto'),
  ('Fiano'),
  ('Furmint'),
  ('Gamay'),
  ('Garganega'),
  ('Gewürztraminer'),
  ('Glera'),
  ('Grenache'),
  ('Grüner Veltliner'),
  ('Malbec'),
  ('Marsanne'),
  ('Melon de Bourgogne'),
  ('Merlot'),
  ('Montepulciano'),
  ('Mourvèdre'),
  ('Muscat'),
  ('Nebbiolo'),
  ('Nero d''Avola'),
  ('Palomino'),
  ('Pedro Ximénez'),
  ('Petit Verdot'),
  ('Petite Sirah'),
  ('Pinot Blanc'),
  ('Pinot Gris'),
  ('Pinot Noir'),
  ('Pinotage'),
  ('Primitivo'),
  ('Riesling'),
  ('Roussanne'),
  ('Sangiovese'),
  ('Saperavi'),
  ('Sauvignon Blanc'),
  ('Sémillon'),
  ('Silvaner'),
  ('Syrah'),
  ('Tempranillo'),
  ('Torrontés'),
  ('Touriga Nacional'),
  ('Trebbiano'),
  ('Verdejo'),
  ('Verdicchio'),
  ('Vermentino'),
  ('Viognier'),
  ('Zinfandel'),
  ('Zweigelt');
