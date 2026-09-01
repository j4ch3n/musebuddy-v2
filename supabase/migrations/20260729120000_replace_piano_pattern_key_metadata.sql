alter table public.piano_patterns
  add column name text default null,
  add column key_signature_display text not null default 'C major / A minor',
  add column progression_in_major_scale jsonb not null default
    '{"mode":"major","tonic":"C","tonic_circle_of_fifths_index":0,"display":[],"active_circle_of_fifths_indices":[]}'::jsonb,
  add column progression_in_minor_scale jsonb not null default
    '{"mode":"minor","tonic":"A","tonic_circle_of_fifths_index":3,"display":[],"active_circle_of_fifths_indices":[]}'::jsonb,
  add constraint piano_patterns_major_progression_shape_check check (
    jsonb_typeof(progression_in_major_scale) = 'object'
    and progression_in_major_scale ->> 'mode' = 'major'
    and jsonb_typeof(progression_in_major_scale -> 'tonic') = 'string'
    and jsonb_typeof(
      progression_in_major_scale -> 'tonic_circle_of_fifths_index'
    ) = 'number'
    and jsonb_typeof(progression_in_major_scale -> 'display') = 'array'
    and jsonb_typeof(
      progression_in_major_scale -> 'active_circle_of_fifths_indices'
    ) = 'array'
  ),
  add constraint piano_patterns_minor_progression_shape_check check (
    jsonb_typeof(progression_in_minor_scale) = 'object'
    and progression_in_minor_scale ->> 'mode' = 'minor'
    and jsonb_typeof(progression_in_minor_scale -> 'tonic') = 'string'
    and jsonb_typeof(
      progression_in_minor_scale -> 'tonic_circle_of_fifths_index'
    ) = 'number'
    and jsonb_typeof(progression_in_minor_scale -> 'display') = 'array'
    and jsonb_typeof(
      progression_in_minor_scale -> 'active_circle_of_fifths_indices'
    ) = 'array'
  ),
  drop column key_signature_fifths,
  drop column key_signature_major_scale,
  drop column key_signature_relative_minor_scale;
