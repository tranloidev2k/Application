alter table public.applications
  add column if not exists cv_content text;

alter table public.applications
  drop column if exists work_mode,
  drop column if exists employment_type,
  drop column if exists cv_reference;

update public.applications
set cv_content = nullif(data ->> 'cvContent', '')
where cv_content is null
  and data ? 'cvContent';

update public.applications
set data = data - 'workMode' - 'employmentType' - 'cvReference'
where data ?| array['workMode', 'employmentType', 'cvReference'];
