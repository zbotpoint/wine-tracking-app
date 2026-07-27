-- Revised vessel and serving-temperature option sets.
-- vessel: glass, bottle, sampler, cup, other (taster -> sampler)
-- serving_temp: cool, ambient, hot, freezing, on_ice
--   (chilled -> cool, room_temp -> ambient, with_ice -> on_ice)

create type vessel_type_new as enum ('glass', 'bottle', 'sampler', 'cup', 'other');

alter table tastings
  alter column vessel type vessel_type_new
  using (
    case vessel::text
      when 'taster' then 'sampler'
      else vessel::text
    end
  )::vessel_type_new;

drop type vessel_type;
alter type vessel_type_new rename to vessel_type;

create type serving_temp_new as enum ('cool', 'ambient', 'hot', 'freezing', 'on_ice');

alter table tastings
  alter column serving_temp type serving_temp_new
  using (
    case serving_temp::text
      when 'chilled' then 'cool'
      when 'room_temp' then 'ambient'
      when 'with_ice' then 'on_ice'
      else serving_temp::text
    end
  )::serving_temp_new;

drop type serving_temp;
alter type serving_temp_new rename to serving_temp;
