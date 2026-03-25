-- ============================================================
-- Multiplayer Chess App — Supabase Schema
-- Run this in: Supabase Dashboard > SQL Editor
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ── USERS ────────────────────────────────────────────────────
create table if not exists public.users (
  id          uuid primary key default gen_random_uuid(),
  auth_id     uuid unique,                          -- links to auth.users
  username    text unique not null,
  email       text unique not null,
  avatar_url  text,
  wins        integer not null default 0,
  losses      integer not null default 0,
  draws       integer not null default 0,
  created_at  timestamptz not null default now()
);

alter table public.users enable row level security;

create policy "Users can read all profiles"
  on public.users for select using (true);

create policy "Users can update own profile"
  on public.users for update using (auth.uid() = auth_id);

create policy "Users can insert own profile"
  on public.users for insert with check (auth.uid() = auth_id);

-- ── GAMES ────────────────────────────────────────────────────
create table if not exists public.games (
  id               uuid primary key default gen_random_uuid(),
  invite_code      text unique not null default substr(md5(random()::text), 1, 8),
  white_player_id  uuid references public.users(id) on delete set null,
  black_player_id  uuid references public.users(id) on delete set null,
  status           text not null default 'waiting'
                   check (status in ('waiting','active','paused','check','checkmate','draw','abandoned')),
  current_fen      text not null default 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  winner_id        uuid references public.users(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.games enable row level security;

create policy "Anyone can read games"
  on public.games for select using (true);

create policy "Authenticated users can create games"
  on public.games for insert with check (auth.role() = 'authenticated');

create policy "Players can update their games"
  on public.games for update using (
    auth.uid() in (
      select auth_id from public.users where id = white_player_id or id = black_player_id
    )
  );

-- ── MOVES ────────────────────────────────────────────────────
create table if not exists public.moves (
  id           uuid primary key default gen_random_uuid(),
  game_id      uuid not null references public.games(id) on delete cascade,
  player_id    uuid not null references public.users(id) on delete cascade,
  move_san     text not null,   -- Standard Algebraic Notation  e.g. "Nf3"
  move_uci     text not null,   -- UCI format  e.g. "g1f3"
  fen_after    text not null,   -- FEN after this move
  move_number  integer not null,
  created_at   timestamptz not null default now()
);

alter table public.moves enable row level security;

create policy "Anyone can read moves"
  on public.moves for select using (true);

create policy "Players can insert moves"
  on public.moves for insert with check (auth.role() = 'authenticated');

-- ── REALTIME ─────────────────────────────────────────────────
-- Enable realtime for live move broadcasting
alter publication supabase_realtime add table public.games;
alter publication supabase_realtime add table public.moves;

-- ── TRIGGER: update games.updated_at ─────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_games_updated_at
  before update on public.games
  for each row execute procedure public.set_updated_at();

-- ── INDEXES ──────────────────────────────────────────────────
create index if not exists idx_games_invite_code  on public.games(invite_code);
create index if not exists idx_moves_game_id      on public.moves(game_id);
create index if not exists idx_moves_game_order   on public.moves(game_id, move_number);
create index if not exists idx_users_auth_id      on public.users(auth_id);
