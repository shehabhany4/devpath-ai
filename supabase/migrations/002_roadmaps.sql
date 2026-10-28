-- جدول الخطط
create table public.roadmaps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  goal text not null,
  created_at timestamptz not null default now()
);

-- جدول المواضيع
create table public.roadmap_topics (
  id uuid primary key default gen_random_uuid(),
  roadmap_id uuid not null references public.roadmaps (id) on delete cascade,
  position integer not null,
  title text not null,
  description text,
  status text not null default 'todo'
    check (status in ('todo', 'in_progress', 'done')),
  created_at timestamptz not null default now(),
  unique (roadmap_id, position)
);

create index on public.roadmaps (user_id);
create index on public.roadmap_topics (roadmap_id);

-- تفعيل RLS
alter table public.roadmaps enable row level security;
alter table public.roadmap_topics enable row level security;

-- Policies للـ roadmaps: المستخدم يتحكم في خططه بس
create policy "Users manage own roadmaps"
  on public.roadmaps for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Policies للـ topics: المستخدم يتحكم في topics الخطط اللي يملكها
create policy "Users manage own topics"
  on public.roadmap_topics for all
  using (
    exists (
      select 1 from public.roadmaps r
      where r.id = roadmap_id and r.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.roadmaps r
      where r.id = roadmap_id and r.user_id = auth.uid()
    )
  );