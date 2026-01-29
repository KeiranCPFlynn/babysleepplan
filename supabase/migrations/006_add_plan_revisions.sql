-- Add plan revisions to support living plans with history

create table plan_revisions (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid references plans(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  revision_number integer not null,
  plan_content text not null,
  summary text,
  source text default 'weekly-review' check (source in ('initial', 'weekly-review', 'manual')),
  week_start date,
  week_end date,
  created_at timestamp with time zone default now(),

  unique(plan_id, revision_number)
);

create index idx_plan_revisions_plan_id on plan_revisions(plan_id);
create index idx_plan_revisions_plan_week on plan_revisions(plan_id, week_start);

alter table plan_revisions enable row level security;

create policy "Users can view own plan revisions"
  on plan_revisions for select
  using (auth.uid() = user_id);

create policy "Users can insert own plan revisions"
  on plan_revisions for insert
  with check (auth.uid() = user_id);
