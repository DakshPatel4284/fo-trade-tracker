// ============================================================
// F&O Trade Tracker - Core Types
// ============================================================

export type TradeType = 'futures' | 'options'
export type OptionType = 'CE' | 'PE'
export type Direction = 'BUY' | 'SELL'
export type TradeStatus = 'open' | 'closed' | 'rolled'
export type StrategyType = 'option_buying' | 'option_selling' | 'futures' | 'intraday' | 'positional' | 'custom'

// ── Profile ────────────────────────────────────────────────
export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  broker_name: string | null
  trading_capital: number
  created_at: string
  updated_at: string
}

// ── Strategy ───────────────────────────────────────────────
export interface Strategy {
  id: string
  user_id: string
  name: string
  description: string | null
  type: StrategyType
  is_active: boolean
  created_at: string
}

// ── Trade ──────────────────────────────────────────────────
export interface Trade {
  id: string
  user_id: string
  strategy_id: string | null
  trade_type: TradeType
  symbol: string
  exchange: string
  expiry_date: string
  option_type: OptionType | null
  strike_price: number | null
  direction: Direction
  entry_date: string
  entry_price: number
  quantity: number
  lot_size: number
  exit_date: string | null
  exit_price: number | null
  gross_pnl: number | null
  charges: number
  net_pnl: number | null
  status: TradeStatus
  notes: string | null
  tags: string[]
  created_at: string
  updated_at: string
  // joined
  strategy?: Strategy
  journal?: TradeJournal
}

export interface TradeFormValues {
  trade_type: TradeType
  symbol: string
  exchange: string
  expiry_date: string
  option_type?: OptionType
  strike_price?: number
  direction: Direction
  entry_date: string
  entry_price: number
  quantity: number
  lot_size: number
  exit_date?: string
  exit_price?: number
  charges?: number
  strategy_id?: string
  notes?: string
  tags?: string[]
}

// ── Rollover ───────────────────────────────────────────────
export interface RolloverChain {
  id: string
  user_id: string
  symbol: string
  trade_type: TradeType
  direction: Direction
  started_at: string
  closed_at: string | null
  total_pnl: number
  total_rollover_cost: number
  notes: string | null
  created_at: string
  rollovers?: Rollover[]
}

export interface Rollover {
  id: string
  chain_id: string
  user_id: string
  from_trade_id: string | null
  from_expiry: string
  exit_price: number
  to_trade_id: string | null
  to_expiry: string
  entry_price: number
  rollover_cost: number | null
  rollover_date: string
  notes: string | null
  created_at: string
  from_trade?: Trade
  to_trade?: Trade
}

// ── Journal ────────────────────────────────────────────────
export interface TradeJournal {
  id: string
  trade_id: string
  user_id: string
  entry_reason: string | null
  exit_reason: string | null
  mistakes: string | null
  lessons: string | null
  emotions: string | null
  screenshots: string[]
  rating: number | null
  created_at: string
  updated_at: string
}

// ── Analytics ──────────────────────────────────────────────
export interface DailyPnl {
  trade_date: string
  total_trades: number
  winning_trades: number
  losing_trades: number
  daily_pnl: number
  gross_profit: number
  gross_loss: number
}

export interface MonthlyPnl {
  month: string
  total_trades: number
  winning_trades: number
  monthly_pnl: number
  gross_profit: number
  gross_loss: number
}

export interface TradeStats {
  total_trades: number
  open_trades: number
  closed_trades: number
  winning_trades: number
  losing_trades: number
  win_rate: number
  total_pnl: number
  gross_profit: number
  gross_loss: number
  average_profit: number
  average_loss: number
  profit_factor: number
  max_drawdown: number
  max_consecutive_wins: number
  max_consecutive_losses: number
  best_trade: number
  worst_trade: number
  today_pnl: number
  month_pnl: number
}

// ── User Settings ──────────────────────────────────────────
export interface UserSettings {
  id: string
  default_lot_size: number
  default_exchange: string
  currency: string
  timezone: string
  theme: string
}

// ── Filters ────────────────────────────────────────────────
export interface TradeFilters {
  symbol?: string
  trade_type?: TradeType
  direction?: Direction
  status?: TradeStatus
  strategy_id?: string
  date_from?: string
  date_to?: string
  tags?: string[]
}

export interface PaginationState {
  page: number
  pageSize: number
  total: number
}
