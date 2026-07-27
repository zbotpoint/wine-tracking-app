-- Subregions (per-region, user-addable, same immutable pattern as regions),
-- and relaxed requirements: colour and rating become optional.

create table subregions (
  id uuid not null default gen_random_uuid() primary key,
  region_id uuid not null references regions (id),
  name text not null check (length(trim(name)) > 0),
  created_by uuid references auth.users,
  created_at timestamptz not null default now(),
  -- Referenced by the composite FK on wines so a subregion always belongs to
  -- the wine's selected region.
  unique (id, region_id)
);

create unique index subregions_region_name_uniq on subregions (region_id, lower(name));

alter table wines add column subregion_id uuid;
alter table wines
  add constraint wines_subregion_id_region_id_fkey
  foreign key (subregion_id, region_id) references subregions (id, region_id);

create index wines_subregion_idx on wines (subregion_id);

alter table wines alter column colour drop not null;
alter table tastings alter column rating drop not null;

create function get_or_create_subregion(p_region uuid, p_name text)
returns subregions
language plpgsql
security invoker
set search_path = public
as $$
declare
  s subregions;
begin
  if length(trim(p_name)) = 0 then
    raise exception 'subregion name must not be empty';
  end if;

  insert into subregions (region_id, name, created_by)
  values (p_region, trim(p_name), auth.uid())
  on conflict (region_id, lower(name)) do nothing;

  select * into strict s
  from subregions
  where region_id = p_region and lower(name) = lower(trim(p_name));

  return s;
end;
$$;

revoke execute on function get_or_create_subregion (uuid, text) from anon;

alter table subregions enable row level security;

create policy "subregions are readable" on subregions
  for select to authenticated using (true);
create policy "add subregions" on subregions
  for insert to authenticated with check (created_by = auth.uid());
