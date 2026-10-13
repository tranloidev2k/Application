-- Calendar tasks that are not tied to a job application. Access mirrors the
-- applications table: any signed-in (including anonymous) session can use it.
create table if not exists public.personal_tasks (
  id text primary key,
  user_id uuid default auth.uid() references auth.users (id) on delete set null,
  title text not null check (char_length(btrim(title)) between 1 and 200),
  note text check (note is null or char_length(note) <= 2000),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint personal_tasks_time_order check (ends_at > starts_at)
);

create index if not exists personal_tasks_starts_at on public.personal_tasks (starts_at);

alter table public.personal_tasks enable row level security;

drop policy if exists "Personal workspace access" on public.personal_tasks;
create policy "Personal workspace access" on public.personal_tasks
  for all to authenticated using (true) with check (true);
