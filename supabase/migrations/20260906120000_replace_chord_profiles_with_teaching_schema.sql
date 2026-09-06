-- Local course data is disposable. Clear rows that reference chord profile ids first.
truncate table public.piano_pattern_notes, public.companinon_arrangements_keys;

drop table public.chord_profiles cascade;

create table public.chord_profiles (
  id text primary key,
  "normalizedSymbol" text not null,
  "displayTokens" jsonb not null check (jsonb_typeof("displayTokens") = 'array'),
  "structuralShapeId" text not null,
  tones jsonb not null check (jsonb_typeof(tones) = 'array' and jsonb_array_length(tones) > 0)
);

create index chord_profiles_normalized_symbol_idx on public.chord_profiles ("normalizedSymbol");
create index chord_profiles_structural_shape_idx on public.chord_profiles ("structuralShapeId");

alter table public.companinon_arrangements_keys
  add constraint companinon_arrangements_keys_chord_fkey
  foreign key (chord) references public.chord_profiles(id);

alter table public.piano_pattern_notes
  add constraint piano_pattern_notes_chord_fkey
  foreign key (chord) references public.chord_profiles(id);

alter table public.chord_profiles enable row level security;
create policy "Chord profiles are publicly readable" on public.chord_profiles for select using (true);
