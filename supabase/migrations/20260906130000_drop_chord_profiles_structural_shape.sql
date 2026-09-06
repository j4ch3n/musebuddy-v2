drop index if exists public.chord_profiles_structural_shape_idx;

alter table public.chord_profiles
  drop column if exists "structuralShapeId";
