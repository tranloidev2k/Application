-- Optional colour for a personal calendar task (application tasks and interviews keep
-- theirs inside applications.data). Null means the default look for the event kind.
alter table public.personal_tasks add column if not exists color text check (color is null or color in ('blue','green','amber','red','violet','pink','teal','gray'));
