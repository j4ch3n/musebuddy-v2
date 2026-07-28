create table public.piano_patterns (
  id text primary key,
  time_signature text not null check (time_signature = '4/4'),
  key_signature_fifths smallint not null check (
    key_signature_fifths between -7 and 7
  ),
  key_signature_major_scale text not null,
  key_signature_relative_minor_scale text not null
);

create table public.piano_pattern_notes (
  id text primary key,
  pattern_id text not null references public.piano_patterns(id) on delete cascade,
  bar_index integer not null check (bar_index >= 0),
  beat_index integer not null check (beat_index between 0 and 1),
  chord text not null references public.chord_profiles(id),
  treble_arrangement jsonb not null check (
    jsonb_typeof(treble_arrangement) = 'array'
  ),
  treble_velocity jsonb not null check (
    jsonb_typeof(treble_velocity) = 'array'
  ),
  bass_arrangement jsonb not null check (
    jsonb_typeof(bass_arrangement) = 'array'
  ),
  bass_velocity jsonb not null check (
    jsonb_typeof(bass_velocity) = 'array'
  ),
  constraint piano_pattern_notes_pattern_beat_unique unique (
    pattern_id,
    bar_index,
    beat_index
  )
);

create table public.piano_pattern_scores (
  pattern_id text primary key references public.piano_patterns(id) on delete cascade,
  format text not null check (format = 'vexflow'),
  format_version integer not null check (format_version > 0),
  time_signature text not null check (time_signature = '4/4'),
  key_signature text not null,
  measures jsonb not null check (jsonb_typeof(measures) = 'array'),
  ties jsonb not null check (jsonb_typeof(ties) = 'array')
);

create index piano_pattern_notes_pattern_id_idx
  on public.piano_pattern_notes (pattern_id);

create index piano_pattern_notes_chord_idx
  on public.piano_pattern_notes (chord);

alter table public.piano_patterns enable row level security;
alter table public.piano_pattern_notes enable row level security;
alter table public.piano_pattern_scores enable row level security;
