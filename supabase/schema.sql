-- Run in Supabase SQL editor. Safe to re-run.
create table if not exists ilg_challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  points int not null check (points > 0 and points <= 1000),
  is_active boolean not null default true,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists ilg_points_ledger (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  challenge_id uuid references ilg_challenges(id) on delete set null,
  points int not null,
  reason text,
  created_at timestamptz not null default now()
);
-- one completion per user per challenge (race-safe)
create unique index if not exists ilg_ledger_user_challenge on ilg_points_ledger (user_id, challenge_id) where challenge_id is not null;
create index if not exists ilg_ledger_user on ilg_points_ledger (user_id);

alter table ilg_challenges enable row level security;
alter table ilg_points_ledger enable row level security;

-- Clients may read only. No insert/update/delete policies => only the API (service role) can grant points.
drop policy if exists "read active challenges" on ilg_challenges;
create policy "read active challenges" on ilg_challenges for select using (is_active);
drop policy if exists "read ledger" on ilg_points_ledger;
create policy "read ledger" on ilg_points_ledger for select using (true);

-- sample data
insert into ilg_challenges (title, description, points) values
  ('أنهِ درسًا كاملًا', 'شاهد درسًا حتى النهاية وحلّ تمارينه', 50),
  ('حل 10 أسئلة تدريبية', 'أجب عن 10 أسئلة في أي مادة', 30)
on conflict do nothing;
