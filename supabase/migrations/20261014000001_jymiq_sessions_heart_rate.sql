-- Average and maximum heart rate over a finished workout, read from Health Connect.
-- Additive and nullable, so builds that do not know the columns keep working.
-- Apply to project apmzkqejwmhctaldbzgv BEFORE shipping a build that has the columns.
alter table public.sessions
  add column if not exists avg_hr integer,
  add column if not exists max_hr integer;
