-- The four tables added locally after the mirror was first built (programs, program_days,
-- body_weights, check_ins). Same conventions as the original eight: (user_id, id) keys,
-- composite FKs carrying user_id, deleted_at tombstones, one owner policy, no anon access.
-- Applied to project apmzkqejwmhctaldbzgv. The original eight came from earlier migrations
-- that were applied there directly and were never kept in the repo.

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
create unique index programs_one_active_idx on public.programs (user_id) where status = 'active' and deleted_at is null;

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
create index program_days_routine_idx on public.program_days (user_id, routine_id);

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
create index body_weights_measured_idx on public.body_weights (user_id, measured_at);

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
create index check_ins_at_idx on public.check_ins (user_id, at);

do $$
declare t text;
begin
  foreach t in array array['programs','program_days','body_weights','check_ins'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format($p$create policy %I on public.%I for all to authenticated
      using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)$p$, t || '_owner', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('revoke truncate on public.%I from authenticated', t);
  end loop;
end $$;
