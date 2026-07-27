-- Seed common regions for Canada, Argentina, France, and Italy, plus
-- Canadian subregions. Canadian regions are provinces; subregions are the
-- wine areas within them. All seeded rows have created_by null.

insert into regions (country_code, name) values
  -- Canada: provinces
  ('CA', 'British Columbia'),
  ('CA', 'Ontario'),
  ('CA', 'Quebec'),
  ('CA', 'Nova Scotia'),
  -- Argentina
  ('AR', 'Mendoza'),
  ('AR', 'Salta'),
  ('AR', 'San Juan'),
  ('AR', 'La Rioja'),
  ('AR', 'Patagonia'),
  -- France
  ('FR', 'Bordeaux'),
  ('FR', 'Burgundy'),
  ('FR', 'Champagne'),
  ('FR', 'Loire Valley'),
  ('FR', 'Rhône Valley'),
  ('FR', 'Alsace'),
  ('FR', 'Provence'),
  ('FR', 'Languedoc-Roussillon'),
  ('FR', 'Beaujolais'),
  ('FR', 'Jura'),
  ('FR', 'Savoie'),
  ('FR', 'South West'),
  ('FR', 'Corsica'),
  -- Italy
  ('IT', 'Tuscany'),
  ('IT', 'Piedmont'),
  ('IT', 'Veneto'),
  ('IT', 'Sicily'),
  ('IT', 'Puglia'),
  ('IT', 'Abruzzo'),
  ('IT', 'Friuli-Venezia Giulia'),
  ('IT', 'Trentino-Alto Adige'),
  ('IT', 'Lombardy'),
  ('IT', 'Emilia-Romagna'),
  ('IT', 'Umbria'),
  ('IT', 'Marche'),
  ('IT', 'Campania'),
  ('IT', 'Sardinia')
on conflict (country_code, lower(name)) do nothing;

insert into subregions (region_id, name)
select r.id, s.name
from (
  values
    -- British Columbia
    ('British Columbia', 'Okanagan Valley'),
    ('British Columbia', 'Naramata Bench'),
    ('British Columbia', 'Similkameen Valley'),
    ('British Columbia', 'Fraser Valley'),
    ('British Columbia', 'Vancouver Island'),
    ('British Columbia', 'Gulf Islands'),
    -- Ontario
    ('Ontario', 'Niagara Peninsula'),
    ('Ontario', 'Niagara-on-the-Lake'),
    ('Ontario', 'Twenty Mile Bench'),
    ('Ontario', 'Beamsville Bench'),
    ('Ontario', 'Prince Edward County'),
    ('Ontario', 'Lake Erie North Shore'),
    -- Quebec
    ('Quebec', 'Eastern Townships'),
    ('Quebec', 'Montérégie'),
    -- Nova Scotia
    ('Nova Scotia', 'Annapolis Valley'),
    ('Nova Scotia', 'Gaspereau Valley')
) as s(region, name)
join regions r on r.country_code = 'CA' and lower(r.name) = lower(s.region)
on conflict (region_id, lower(name)) do nothing;
