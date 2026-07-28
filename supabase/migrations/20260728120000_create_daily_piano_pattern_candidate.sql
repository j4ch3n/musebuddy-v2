create function public.get_daily_piano_pattern_candidate()
returns text
language sql
stable
security definer
set search_path = public
as $$
  with eligible_patterns as (
    select patterns.id
    from public.piano_patterns as patterns
    join public.piano_pattern_scores as scores
      on scores.pattern_id = patterns.id
    where jsonb_array_length(scores.measures) between 1 and 4
      and (
        select count(*)
        from public.piano_pattern_notes as notes
        where notes.pattern_id = patterns.id
      ) = jsonb_array_length(scores.measures) * 2
      and (
        select count(distinct notes.chord)
        from public.piano_pattern_notes as notes
        where notes.pattern_id = patterns.id
      ) between 1 and 8
      and not exists (
        select 1
        from generate_series(
          0,
          jsonb_array_length(scores.measures) - 1
        ) as expected_bar(bar_index)
        cross join generate_series(0, 1) as expected_beat(beat_index)
        where not exists (
          select 1
          from public.piano_pattern_notes as notes
          where notes.pattern_id = patterns.id
            and notes.bar_index = expected_bar.bar_index
            and notes.beat_index = expected_beat.beat_index
        )
      )
  ),
  numbered_patterns as (
    select
      eligible_patterns.id,
      row_number() over (order by eligible_patterns.id) - 1 as pattern_index,
      count(*) over () as pattern_count
    from eligible_patterns
  )
  select numbered_patterns.id
  from numbered_patterns
  where numbered_patterns.pattern_index = (
    (
      hashtextextended(
        ((now() at time zone 'utc')::date)::text,
        0
      )
      % numbered_patterns.pattern_count
    ) + numbered_patterns.pattern_count
  ) % numbered_patterns.pattern_count;
$$;

revoke all on function public.get_daily_piano_pattern_candidate() from public;
revoke all on function public.get_daily_piano_pattern_candidate() from anon;
revoke all on function public.get_daily_piano_pattern_candidate() from authenticated;
grant execute on function public.get_daily_piano_pattern_candidate() to service_role;
