create function public.get_daily_training_session_candidate()
returns table (
  arrangement jsonb,
  bar_index integer,
  beat_index integer,
  chord text,
  chord_display_tokens jsonb,
  chord_normalized_symbol text,
  chord_quality_base_formula public.chord_degree[],
  chord_root text,
  chord_tones jsonb,
  song_id text,
  velocity jsonb
)
language sql
stable
security definer
set search_path = public
as $$
  with eligible_starts as (
    select
      candidate_starts.song_id,
      candidate_starts.bar_index,
      candidate_starts.beat_index as start_beat_index
    from (
      select
        arrangements.song_id,
        arrangements.bar_index,
        arrangements.beat_index,
        lead(arrangements.beat_index) over (
          partition by arrangements.song_id, arrangements.bar_index
          order by arrangements.beat_index
        ) as next_beat_index
      from public.companinon_arrangements_keys as arrangements
    ) as candidate_starts
    where candidate_starts.next_beat_index = candidate_starts.beat_index + 1
  ),
  numbered_candidates as (
    select
      eligible_starts.song_id,
      eligible_starts.bar_index,
      eligible_starts.start_beat_index,
      row_number() over (
        order by
          eligible_starts.song_id,
          eligible_starts.bar_index,
          eligible_starts.start_beat_index
      ) - 1 as candidate_index,
      count(*) over () as candidate_count
    from eligible_starts
  ),
  daily_candidate as (
    select
      numbered_candidates.song_id,
      numbered_candidates.bar_index,
      numbered_candidates.start_beat_index
    from numbered_candidates
    where numbered_candidates.candidate_index = (
      (
        hashtextextended(current_date::text, 0)
        % numbered_candidates.candidate_count
      ) + numbered_candidates.candidate_count
    ) % numbered_candidates.candidate_count
  )
  select
    arrangements.arrangement,
    arrangements.bar_index,
    arrangements.beat_index,
    arrangements.chord,
    profiles."displayTokens" as chord_display_tokens,
    profiles."normalizedSymbol" as chord_normalized_symbol,
    profiles."quality_baseFormula" as chord_quality_base_formula,
    profiles.root::text as chord_root,
    (
      select jsonb_agg(jsonb_build_object('explanation', tone ->> 'explanation'))
      from jsonb_array_elements(profiles.tones) as tone
    ) as chord_tones,
    arrangements.song_id,
    arrangements.velocity
  from daily_candidate
  join public.companinon_arrangements_keys as arrangements
    on arrangements.song_id = daily_candidate.song_id
    and arrangements.bar_index = daily_candidate.bar_index
    and arrangements.beat_index between
      daily_candidate.start_beat_index
      and daily_candidate.start_beat_index + 1
  join public.chord_profiles as profiles
    on profiles.id = arrangements.chord
  order by arrangements.beat_index;
$$;

grant execute on function public.get_daily_training_session_candidate() to anon;
grant execute on function public.get_daily_training_session_candidate() to authenticated;
grant execute on function public.get_daily_training_session_candidate() to service_role;
