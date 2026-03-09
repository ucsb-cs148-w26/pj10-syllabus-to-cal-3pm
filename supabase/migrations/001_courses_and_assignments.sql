-- Drop existing tables (clears old data — run only on fresh setup)
drop table if exists assignments;
drop table if exists courses;

-- Courses table
create table courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  class_name text not null,
  teacher text default '',
  academic_term text,
  created_at timestamptz default now()
);

-- Assignments / Events table
create table assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  course_id uuid references courses(id) on delete cascade not null,
  event_name text not null,
  due_date date not null,
  time text,
  type text check (type in ('assignment', 'exam')) not null default 'assignment',
  completed boolean default false,
  created_at timestamptz default now()
);

-- Row Level Security (users can only access their own data)
alter table courses enable row level security;
alter table assignments enable row level security;

create policy "Users can CRUD own courses"
  on courses for all using (auth.uid() = user_id);

create policy "Users can CRUD own assignments"
  on assignments for all using (auth.uid() = user_id);

-- Indexes for performance
create index idx_courses_user on courses(user_id);
create index idx_assignments_user on assignments(user_id);
create index idx_assignments_course on assignments(course_id);

-- Prevent duplicate assignments (same event_name + due_date + course)
create unique index idx_assignments_no_dupes
  on assignments(user_id, course_id, event_name, due_date);
