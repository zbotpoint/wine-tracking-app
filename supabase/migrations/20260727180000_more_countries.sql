-- Wine-producing countries missing from the original curated seed.
insert into countries (code, name) values
  ('AM', 'Armenia'),
  ('BO', 'Bolivia'),
  ('CY', 'Cyprus'),
  ('CZ', 'Czechia'),
  ('IN', 'India'),
  ('MA', 'Morocco'),
  ('ME', 'Montenegro'),
  ('MK', 'North Macedonia'),
  ('PE', 'Peru'),
  ('RS', 'Serbia'),
  ('RU', 'Russia'),
  ('SK', 'Slovakia'),
  ('TR', 'Turkey'),
  ('UA', 'Ukraine')
on conflict (code) do nothing;
