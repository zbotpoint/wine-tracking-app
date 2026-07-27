-- Flavour descriptors: a shared, user-addable lookup tagged onto tastings
-- (per-tasting, not per-wine — two people can taste different things in the
-- same bottle). Same immutable get-or-create pattern as varietals.

create table flavours (
  id uuid not null default gen_random_uuid() primary key,
  name text not null check (length(trim(name)) > 0),
  created_by uuid references auth.users,
  created_at timestamptz not null default now()
);

create unique index flavours_name_uniq on flavours (lower(name));

create table tasting_flavours (
  tasting_id uuid not null references tastings (id) on delete cascade,
  flavour_id uuid not null references flavours (id),
  primary key (tasting_id, flavour_id)
);

create index tasting_flavours_flavour_idx on tasting_flavours (flavour_id);

create function get_or_create_flavour(p_name text)
returns flavours
language plpgsql
security invoker
set search_path = public
as $$
declare
  f flavours;
begin
  if length(trim(p_name)) = 0 then
    raise exception 'flavour name must not be empty';
  end if;

  insert into flavours (name, created_by)
  values (trim(p_name), auth.uid())
  on conflict (lower(name)) do nothing;

  select * into strict f
  from flavours
  where lower(name) = lower(trim(p_name));

  return f;
end;
$$;

revoke execute on function get_or_create_flavour (text) from anon;

alter table flavours enable row level security;
alter table tasting_flavours enable row level security;

create policy "flavours are readable" on flavours
  for select to authenticated using (true);
create policy "add flavours" on flavours
  for insert to authenticated with check (created_by = auth.uid());

create policy "tasting flavours are readable" on tasting_flavours
  for select to authenticated using (true);
create policy "write own tasting flavours" on tasting_flavours
  for all to authenticated
  using (exists (select 1 from tastings t where t.id = tasting_id and t.user_id = auth.uid()))
  with check (exists (select 1 from tastings t where t.id = tasting_id and t.user_id = auth.uid()));

-- Curated seed (duplicates, synonyms, and lab jargon removed from the
-- source list; anything missing can be added through the app).
insert into flavours (name) values
  -- black and blue fruit
  ('blackberry'), ('cassis'), ('blueberry'), ('elderberry'), ('mulberry'),
  ('boysenberry'), ('black fruit'),
  -- red fruit
  ('raspberry'), ('strawberry'), ('cranberry'), ('currant'), ('cherry'),
  ('pomegranate'), ('red fruit'),
  -- orchard and stone fruit
  ('plum'), ('prune'), ('apple'), ('pear'), ('quince'), ('peach'),
  ('nectarine'), ('apricot'), ('stone fruit'),
  -- dried and cooked fruit
  ('fig'), ('raisin'), ('date'), ('dried fruit'), ('fruitcake'), ('jammy'),
  ('stewed'), ('baked'), ('candied'),
  -- tropical
  ('pineapple'), ('mango'), ('passionfruit'), ('guava'), ('papaya'),
  ('melon'), ('watermelon'), ('kiwi'), ('lychee'), ('banana'), ('coconut'),
  ('tropical'),
  -- citrus
  ('lemon'), ('lime'), ('grapefruit'), ('orange'), ('blood orange'),
  ('mandarin'), ('kumquat'), ('yuzu'), ('bergamot'), ('marmalade'),
  ('lemon curd'), ('zesty'),
  -- other fruit and veg
  ('gooseberry'), ('rhubarb'), ('olive'), ('tomato'), ('capsicum'),
  ('jalapeño'), ('beetroot'), ('asparagus'), ('pea'), ('cucumber'),
  ('celery'),
  -- herbs and greens
  ('thyme'), ('rosemary'), ('sage'), ('oregano'), ('basil'), ('mint'),
  ('eucalyptus'), ('fennel'), ('dill'), ('anise'), ('licorice'),
  ('tarragon'), ('bay'), ('grass'), ('hay'), ('straw'), ('nettle'),
  ('herbal'), ('grassy'), ('vegetal'), ('green'), ('garrigue'), ('juniper'),
  -- earth and forest
  ('mushroom'), ('truffle'), ('earth'), ('forest floor'), ('undergrowth'),
  ('petrichor'),
  -- mineral
  ('graphite'), ('slate'), ('flint'), ('chalk'), ('limestone'), ('mineral'),
  ('saline'), ('sea spray'), ('oyster shell'), ('iodine'), ('iron'),
  ('struck match'), ('seaweed'),
  -- smoke, wood, and savoury
  ('smoke'), ('ash'), ('tar'), ('tobacco'), ('cigar box'), ('cedar'),
  ('sandalwood'), ('oak'), ('pine'), ('resin'), ('leather'), ('suede'),
  ('game'), ('bacon'), ('cured meat'), ('savoury'), ('umami'), ('smoky'),
  ('toasty'), ('roasted'), ('charred'), ('soy'),
  -- spice
  ('pepper'), ('clove'), ('cinnamon'), ('nutmeg'), ('allspice'),
  ('star anise'), ('cardamom'), ('coriander'), ('cumin'), ('ginger'),
  ('saffron'), ('spicy'), ('peppery'),
  -- dairy, bakery, nuts, and sweets
  ('vanilla'), ('butter'), ('cream'), ('yoghurt'), ('brioche'), ('bread'),
  ('toast'), ('biscuit'), ('pastry'), ('marzipan'), ('almond'), ('hazelnut'),
  ('walnut'), ('pecan'), ('pistachio'), ('chestnut'), ('sesame'), ('cocoa'),
  ('chocolate'), ('mocha'), ('coffee'), ('caramel'), ('toffee'),
  ('butterscotch'), ('molasses'), ('maple'), ('honey'), ('beeswax'),
  ('nougat'), ('custard'), ('crème brûlée'),
  -- floral and tea
  ('orange blossom'), ('honeysuckle'), ('jasmine'), ('rose'), ('violet'),
  ('lavender'), ('elderflower'), ('acacia'), ('chamomile'), ('hibiscus'),
  ('geranium'), ('tea'), ('earl grey'), ('incense'), ('perfumed'),
  ('lifted'), ('lanolin'),
  -- winemaking and faults
  ('yeast'), ('lees'), ('malt'), ('wax'), ('oxidative'), ('reductive'),
  ('volatile acidity'), ('nail polish'), ('vinegar'), ('petrol'), ('rubber'),
  -- structure and texture
  ('tannic'), ('astringent'), ('grippy'), ('chalky'), ('silky'), ('velvety'),
  ('creamy'), ('lean'), ('rich'), ('round'), ('structured'), ('concentrated'),
  ('elegant'), ('fresh'), ('vibrant'), ('juicy'), ('tart'), ('ripe'),
  ('lingering')
on conflict (lower(name)) do nothing;
