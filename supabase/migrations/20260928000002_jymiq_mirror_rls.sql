do $$
declare t text;
begin
  foreach t in array array['exercises','exercise_muscles','routines','routine_exercises','programs',
    'program_days','sessions','session_exercises','sets','personal_records','body_weights','check_ins']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format($p$create policy %I on public.%I for all to authenticated
      using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)$p$, t || '_owner', t);
    -- anon never reads or writes; TRUNCATE is the one statement RLS cannot gate.
    execute format('revoke all on public.%I from anon', t);
    execute format('revoke truncate on public.%I from authenticated', t);
  end loop;
end $$;
