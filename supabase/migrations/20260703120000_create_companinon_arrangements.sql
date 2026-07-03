create type public.companinon_arrangements_time_signature as enum (
  '4/4',
  '6/8'
);

create table public.companinon_arrangements_songs (
  id text primary key,
  name text not null,
  artist text not null,
  time_signature public.companinon_arrangements_time_signature not null
);

create table public.companinon_arrangements_keys (
  id text primary key,
  song_id text not null references public.companinon_arrangements_songs(id) on delete cascade,
  bar_index integer not null check (bar_index >= 0),
  beat_index integer not null check (beat_index >= 0),
  arrangement jsonb not null,
  velocity jsonb not null,
  chord text not null references public.chord_profiles(id),
  constraint companinon_arrangements_keys_song_beat_unique unique (
    song_id,
    bar_index,
    beat_index
  )
);

create index companinon_arrangements_keys_song_id_idx
  on public.companinon_arrangements_keys (song_id);

create index companinon_arrangements_keys_chord_idx
  on public.companinon_arrangements_keys (chord);

create index companinon_arrangements_keys_arrangement_idx
  on public.companinon_arrangements_keys using gin (arrangement);

create index companinon_arrangements_keys_velocity_idx
  on public.companinon_arrangements_keys using gin (velocity);

alter table public.companinon_arrangements_songs enable row level security;
alter table public.companinon_arrangements_keys enable row level security;

create policy "Companinon arrangement songs are publicly readable"
  on public.companinon_arrangements_songs
  for select
  using (true);

create policy "Companinon arrangement keys are publicly readable"
  on public.companinon_arrangements_keys
  for select
  using (true);
