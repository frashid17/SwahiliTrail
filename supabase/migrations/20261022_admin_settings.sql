-- Ops console settings (single-row, service-role writes from admin APIs)

create table if not exists public.admin_settings (
  id text primary key default 'default',
  maintenance_mode boolean not null default false,
  trail_plus_sales_enabled boolean not null default true,
  free_ai_monthly_cap integer
    check (free_ai_monthly_cap is null or free_ai_monthly_cap >= 0),
  ops_note text,
  updated_at timestamptz not null default now(),
  updated_by text
);

insert into public.admin_settings (id)
values ('default')
on conflict (id) do nothing;

alter table public.admin_settings enable row level security;

-- No client policies: only service role (admin APIs) may read/write.
