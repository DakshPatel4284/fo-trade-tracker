-- ============================================================
-- F&O Trade Tracker - Supabase Schema
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  broker_name text,
  trading_capital numeric(15,2) default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- STRATEGIES
-- ============================================================
create table public.strategies (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  description text,
  type text check (type in ('option_buying','option_selling','futures','intraday','positional','custom')) not null,
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table public.strategies enable row level security;
create policy "Users manage own strategies" on public.strategies for all using (auth.uid() = user_id);

-- Insert default strategies
create or replace function public.create_default_strategies()
returns trigger as $$
begin
  insert into public.strategies (user_id, name, type) values
    (new.id, 'Option Buying',   'option_buying'),
    (new.id, 'Option Selling',  'option_selling'),
    (new.id, 'Futures Trading', 'futures'),
    (new.id, 'Intraday',        'intraday'),
    (new.id, 'Positional',      'positional');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_profile_created
  after insert on public.profiles
  for each row execute procedure public.create_default_strategies();

-- ============================================================
-- TRADES
-- ============================================================
create table public.trades (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  strategy_id uuid references public.strategies(id) on delete set null,

  -- Instrument
  trade_type text check (trade_type in ('futures','options')) not null,
  symbol text not null,
  exchange text default 'NSE',
  expiry_date date not null,

  -- Options specific
  option_type text check (option_type in ('CE','PE') or option_type is null),
  strike_price numeric(10,2),

  -- Direction
  direction text check (direction in ('BUY','SELL')) not null,

  -- Entry
  entry_date timestamptz not null,
  entry_price numeric(10,2) not null,
  quantity integer not null,
  lot_size integer not null default 1,

  -- Exit
  exit_date timestamptz,
  exit_price numeric(10,2),

  -- Computed (can also be done in DB)
  gross_pnl numeric(15,2),
  charges numeric(10,2) default 0,
  net_pnl numeric(15,2),

  -- Status
  status text check (status in ('open','closed','rolled')) default 'open',

  -- Meta
  notes text,
  tags text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.trades enable row level security;
create policy "Users manage own trades" on public.trades for all using (auth.uid() = user_id);

-- Indexes
create index idx_trades_user_id on public.trades(user_id);
create index idx_trades_entry_date on public.trades(entry_date);
create index idx_trades_status on public.trades(status);
create index idx_trades_symbol on public.trades(symbol);

-- Auto-compute P&L on insert/update
create or replace function public.compute_trade_pnl()
returns trigger as $$
begin
  if new.exit_price is not null then
    if new.direction = 'BUY' then
      new.gross_pnl := (new.exit_price - new.entry_price) * new.quantity * new.lot_size;
    else
      new.gross_pnl := (new.entry_price - new.exit_price) * new.quantity * new.lot_size;
    end if;
    new.net_pnl := new.gross_pnl - coalesce(new.charges, 0);
    new.status := coalesce(new.status, 'closed');
  end if;
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

create trigger compute_pnl_on_trade
  before insert or update on public.trades
  for each row execute procedure public.compute_trade_pnl();

-- ============================================================
-- ROLLOVER CHAINS
-- ============================================================
create table public.rollover_chains (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  symbol text not null,
  trade_type text check (trade_type in ('futures','options')) not null,
  direction text check (direction in ('BUY','SELL')) not null,
  started_at date not null,
  closed_at date,
  total_pnl numeric(15,2) default 0,
  total_rollover_cost numeric(15,2) default 0,
  notes text,
  created_at timestamptz default now()
);

alter table public.rollover_chains enable row level security;
create policy "Users manage own rollover chains" on public.rollover_chains for all using (auth.uid() = user_id);

-- ============================================================
-- ROLLOVERS (individual rollover events within a chain)
-- ============================================================
create table public.rollovers (
  id uuid default uuid_generate_v4() primary key,
  chain_id uuid references public.rollover_chains(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,

  -- Outgoing leg (trade being closed)
  from_trade_id uuid references public.trades(id) on delete set null,
  from_expiry date not null,
  exit_price numeric(10,2) not null,

  -- Incoming leg (new trade being opened)
  to_trade_id uuid references public.trades(id) on delete set null,
  to_expiry date not null,
  entry_price numeric(10,2) not null,

  -- Cost of rolling
  rollover_cost numeric(10,2),
  rollover_date date not null,
  notes text,
  created_at timestamptz default now()
);

alter table public.rollovers enable row level security;
create policy "Users manage own rollovers" on public.rollovers for all using (auth.uid() = user_id);

create index idx_rollovers_chain_id on public.rollovers(chain_id);

-- ============================================================
-- TRADE JOURNALS
-- ============================================================
create table public.trade_journals (
  id uuid default uuid_generate_v4() primary key,
  trade_id uuid references public.trades(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  entry_reason text,
  exit_reason text,
  mistakes text,
  lessons text,
  emotions text,
  screenshots text[],
  rating integer check (rating between 1 and 5),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.trade_journals enable row level security;
create policy "Users manage own journals" on public.trade_journals for all using (auth.uid() = user_id);

-- ============================================================
-- USER SETTINGS
-- ============================================================
create table public.user_settings (
  id uuid references public.profiles(id) on delete cascade primary key,
  default_lot_size integer default 1,
  default_exchange text default 'NSE',
  currency text default 'INR',
  timezone text default 'Asia/Kolkata',
  theme text default 'light',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.user_settings enable row level security;
create policy "Users manage own settings" on public.user_settings for all using (auth.uid() = id);

-- ============================================================
-- STORAGE BUCKET for journal screenshots
-- ============================================================
insert into storage.buckets (id, name, public) values ('journal-screenshots', 'journal-screenshots', false);
create policy "Users can upload own screenshots" on storage.objects for insert with check (
  bucket_id = 'journal-screenshots' and auth.uid()::text = (storage.foldername(name))[1]
);
create policy "Users can view own screenshots" on storage.objects for select using (
  bucket_id = 'journal-screenshots' and auth.uid()::text = (storage.foldername(name))[1]
);
create policy "Users can delete own screenshots" on storage.objects for delete using (
  bucket_id = 'journal-screenshots' and auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================================
-- USEFUL VIEWS
-- ============================================================

-- Daily P&L summary
create or replace view public.daily_pnl as
select
  user_id,
  date_trunc('day', entry_date)::date as trade_date,
  count(*) filter (where status = 'closed') as total_trades,
  count(*) filter (where status = 'closed' and net_pnl > 0) as winning_trades,
  count(*) filter (where status = 'closed' and net_pnl <= 0) as losing_trades,
  coalesce(sum(net_pnl) filter (where status = 'closed'), 0) as daily_pnl,
  coalesce(sum(net_pnl) filter (where status = 'closed' and net_pnl > 0), 0) as gross_profit,
  coalesce(sum(net_pnl) filter (where status = 'closed' and net_pnl < 0), 0) as gross_loss
from public.trades
group by user_id, date_trunc('day', entry_date)::date;

-- Monthly P&L summary
create or replace view public.monthly_pnl as
select
  user_id,
  date_trunc('month', entry_date)::date as month,
  count(*) filter (where status = 'closed') as total_trades,
  count(*) filter (where status = 'closed' and net_pnl > 0) as winning_trades,
  coalesce(sum(net_pnl) filter (where status = 'closed'), 0) as monthly_pnl,
  coalesce(sum(net_pnl) filter (where status = 'closed' and net_pnl > 0), 0) as gross_profit,
  coalesce(sum(net_pnl) filter (where status = 'closed' and net_pnl < 0), 0) as gross_loss
from public.trades
group by user_id, date_trunc('month', entry_date)::date;
