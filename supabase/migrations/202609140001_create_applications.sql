create table if not exists public.applications (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null,
  company_name text not null,
  job_title text not null,
  status text not null check (status in ('SAVED', 'APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN')),
  job_url text,
  source text,
  applied_at date,
  cv_content text,
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  data jsonb not null,
  primary key (user_id, id)
);

create index if not exists applications_user_updated_idx
  on public.applications (user_id, updated_at desc);

alter table public.applications enable row level security;

revoke all on table public.applications from anon;
grant select, insert, update, delete on table public.applications to authenticated;

drop policy if exists "Users can read their applications" on public.applications;
create policy "Users can read their applications"
  on public.applications for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their applications" on public.applications;
create policy "Users can create their applications"
  on public.applications for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their applications" on public.applications;
create policy "Users can update their applications"
  on public.applications for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their applications" on public.applications;
create policy "Users can delete their applications"
  on public.applications for delete to authenticated
  using ((select auth.uid()) = user_id);
