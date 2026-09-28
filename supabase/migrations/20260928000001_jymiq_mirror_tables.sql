-- Mirror of src/data/schema.ts. See claudedocs/build-log.md, "The Supabase mirror".
-- user_id is the RLS subject; every key is (user_id, id) and every FK carries user_id,
-- so the id namespace is per tenant and a parent in another tenant cannot be referenced.
-- Built-in exercises are not mirrored: exercise_id columns that may name one carry no FK.

create table public.exercises (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null,
  name text not null,
  equipment text not null check (equipment in ('barbell','dumbbell','machine','cable','bodyweight','other')),
  kind text not null check (kind in ('compound','isolation')),
  is_custom boolean not null default false,
  is_favorite boolean not null default false,
  bar_weight_kg double precision,
  default_rest_sec integer,
  track_rpe boolean not null default false,
  description text,
  cues jsonb,
  mistakes jsonb,
  archived_at bigint,
  created_at bigint not null,
  updated_at bigint not null,
  deleted_at bigint,
  primary key (user_id, id)
);

create table public.exercise_muscles (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  exercise_id text not null,
  muscle text not null,
  role text not null check (role in ('prime','assist')),
  deleted_at bigint,
  primary key (user_id, exercise_id, muscle),
  foreign key (user_id, exercise_id) references public.exercises (user_id, id) on delete cascade
);

create table public.routines (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null,
  name text not null,
  note text,
  position integer not null default 0,
  archived_at bigint,
  created_at bigint not null,
  updated_at bigint not null,
  deleted_at bigint,
  primary key (user_id, id)
);

create table public.routine_exercises (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null,
  routine_id text not null,
  exercise_id text not null,
  position integer not null,
  target_sets integer not null,
  target_reps integer,
  target_weight_kg double precision,
  rest_sec integer,
  note text,
  deleted_at bigint,
  primary key (user_id, id),
  foreign key (user_id, routine_id) references public.routines (user_id, id) on delete cascade
);

create table public.programs (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null,
  name text not null,
  note text,
  status text not null default 'paused' check (status in ('active','paused')),
  started_at bigint,
  created_at bigint not null,
  updated_at bigint not null,
  deleted_at bigint,
  primary key (user_id, id)
);
create unique index idx_programs_one_active on public.programs (user_id) where status = 'active' and deleted_at is null;

create table public.program_days (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  program_id text not null,
  weekday integer not null check (weekday between 0 and 6),
  routine_id text not null,
  deleted_at bigint,
  primary key (user_id, program_id, weekday),
  foreign key (user_id, program_id) references public.programs (user_id, id) on delete cascade,
  foreign key (user_id, routine_id) references public.routines (user_id, id) on delete cascade
);

create table public.sessions (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null,
  routine_id text,
  name text not null,
  status text not null default 'in_progress' check (status in ('in_progress','completed','abandoned')),
  started_at bigint not null,
  ended_at bigint,
  paused_ms bigint not null default 0,
  note text,
  rest_until bigint,
  current_session_exercise_id text,
  current_set_id text,
  total_volume_kg double precision,
  total_sets integer,
  duration_sec integer,
  deleted_at bigint,
  primary key (user_id, id),
  foreign key (user_id, routine_id) references public.routines (user_id, id) on delete set null (routine_id)
);
create unique index idx_sessions_one_live on public.sessions (user_id) where status = 'in_progress' and deleted_at is null;

create table public.session_exercises (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null,
  session_id text not null,
  exercise_id text not null,
  routine_exercise_id text,
  position integer not null,
  planned_sets integer,
  planned_reps integer,
  planned_weight_kg double precision,
  rest_sec integer not null,
  added_mid_session boolean not null default false,
  removed_at bigint,
  note text,
  deleted_at bigint,
  primary key (user_id, id),
  foreign key (user_id, session_id) references public.sessions (user_id, id) on delete cascade,
  foreign key (user_id, routine_exercise_id) references public.routine_exercises (user_id, id) on delete set null (routine_exercise_id)
);

create table public.sets (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null,
  session_exercise_id text not null,
  position integer not null,
  kind text not null default 'working' check (kind in ('warmup','working','drop','failure')),
  planned_weight_kg double precision,
  planned_reps integer,
  weight_kg double precision,
  reps integer,
  rpe double precision,
  completed_at bigint,
  e1rm_kg double precision,
  created_at bigint not null,
  updated_at bigint not null,
  deleted_at bigint,
  primary key (user_id, id),
  foreign key (user_id, session_exercise_id) references public.session_exercises (user_id, id) on delete cascade
);

create table public.personal_records (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null,
  exercise_id text not null,
  category text not null check (category in ('heaviest','best_e1rm','most_reps_at_weight','best_set_volume','best_session_volume')),
  value double precision not null,
  weight_kg double precision,
  reps integer,
  previous_value double precision,
  set_id text,
  session_id text not null,
  achieved_at bigint not null,
  deleted_at bigint,
  primary key (user_id, id),
  foreign key (user_id, set_id) references public.sets (user_id, id) on delete cascade,
  foreign key (user_id, session_id) references public.sessions (user_id, id) on delete cascade
);

create table public.body_weights (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null,
  measured_at bigint not null,
  weight_kg double precision not null,
  created_at bigint not null,
  updated_at bigint not null,
  deleted_at bigint,
  primary key (user_id, id)
);

create table public.check_ins (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null,
  at bigint not null,
  sleep text not null check (sleep in ('poor','ok','good')),
  soreness text not null check (soreness in ('none','some','a_lot')),
  energy text not null check (energy in ('low','ok','good')),
  created_at bigint not null,
  updated_at bigint not null,
  deleted_at bigint,
  primary key (user_id, id)
);

-- FK columns are indexed: composite FKs lead with user_id, which the PKs already cover for the
-- parent side, but the child side needs its own index for cascades and joins.
create index on public.routine_exercises (user_id, routine_id);
create index on public.program_days (user_id, routine_id);
create index on public.sessions (user_id, routine_id);
create index on public.session_exercises (user_id, session_id);
create index on public.session_exercises (user_id, routine_exercise_id);
create index on public.sets (user_id, session_exercise_id);
create index on public.personal_records (user_id, set_id);
create index on public.personal_records (user_id, session_id);
create index on public.sessions (user_id, started_at);
create index on public.body_weights (user_id, measured_at);
create index on public.check_ins (user_id, at);
