alter table courses
  add column if not exists class_priority smallint not null default 3;

  -- Normalize any existing invalid values before enforcing constraint
  update courses
  set class_priority = 3
  where class_priority is null
     or class_priority < 1
     or class_priority > 5;

  -- Recreate constraint idempotently (safe for drifted DBs)
  alter table courses drop constraint if exists class_priority_check;

  alter table courses
  add constraint class_priority_check
  check (class_priority >= 1 and class_priority <= 5);