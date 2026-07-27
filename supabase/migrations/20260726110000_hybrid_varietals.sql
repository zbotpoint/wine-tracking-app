-- The original seed list only covered vinifera classics; add the
-- French-American hybrids and cool-climate crossings common in Canadian wine
-- (icewine, Ontario and Nova Scotia reds/whites, BC aromatics).

insert into varietals (name) values
  ('Vidal'),
  ('Baco Noir'),
  ('Maréchal Foch'),
  ('Seyval Blanc'),
  ('L''Acadie Blanc'),
  ('Ortega'),
  ('Marquette'),
  ('Frontenac')
on conflict (lower(name)) do nothing;
