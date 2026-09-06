alter table public.chord_profiles
  add column root text,
  add column bass text;

update public.chord_profiles
set root = "displayTokens" -> 0 ->> 'value',
    bass = (
      select token ->> 'value'
      from jsonb_array_elements("displayTokens") as token
      where token ->> 'type' = 'bass'
      limit 1
    );

alter table public.chord_profiles
  alter column root set not null;

create index chord_profiles_root_idx on public.chord_profiles (root);
