-- Reverts 20260726110000_hybrid_varietals.sql. Only removes the seeded rows
-- (created_by is null) that no wine references.

delete from varietals
where created_by is null
  and lower(name) in (
    'vidal',
    'baco noir',
    'maréchal foch',
    'seyval blanc',
    'l''acadie blanc',
    'ortega',
    'marquette',
    'frontenac'
  )
  and id not in (select varietal_id from wine_varietals);
