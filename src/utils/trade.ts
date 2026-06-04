import { Trade, TradeStats, DailyPnl } from '@/types'
import { format, isToday, isThisMonth, parseISO } from 'date-fns'

// ── Formatting ──────────────────────────────────────────────
export function formatCurrency(value: number | null | undefined, decimals = 2): string {
  if (value === null || value === undefined) return '₹0.00'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

export function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

export function formatDate(date: string | Date, fmt = 'dd MMM yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, fmt)
}

export function formatDateTime(date: string | Date): string {
  return formatDate(date, 'dd MMM yyyy, HH:mm')
}

// ── P&L ─────────────────────────────────────────────────────
export function calcGrossPnl(trade: Partial<Trade>): number {
  if (!trade.exit_price || !trade.entry_price) return 0
  const diff = trade.direction === 'BUY'
    ? trade.exit_price - trade.entry_price
    : trade.entry_price - trade.exit_price
  return diff * (trade.quantity ?? 1) * (trade.lot_size ?? 1)
}

export function calcNetPnl(trade: Partial<Trade>): number {
  return calcGrossPnl(trade) - (trade.charges ?? 0)
}

// ── Stats computation ───────────────────────────────────────
export function computeStats(trades: Trade[]): TradeStats {
  const closed = trades.filter(t => t.status === 'closed' && t.net_pnl !== null)
  const open = trades.filter(t => t.status === 'open')
  const winners = closed.filter(t => (t.net_pnl ?? 0) > 0)
  const losers = closed.filter(t => (t.net_pnl ?? 0) <= 0)

  const totalPnl = closed.reduce((s, t) => s + (t.net_pnl ?? 0), 0)
  const grossProfit = winners.reduce((s, t) => s + (t.net_pnl ?? 0), 0)
  const grossLoss = Math.abs(losers.reduce((s, t) => s + (t.net_pnl ?? 0), 0))

  const avgProfit = winners.length ? grossProfit / winners.length : 0
  const avgLoss   = losers.length  ? grossLoss  / losers.length  : 0
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0

  // Max drawdown
  let peak = 0, maxDrawdown = 0, running = 0
  for (const t of closed.sort((a, b) =>
    new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime()
  )) {
    running += t.net_pnl ?? 0
    if (running > peak) peak = running
    const dd = peak - running
    if (dd > maxDrawdown) maxDrawdown = dd
  }

  // Consecutive wins/losses
  let maxWins = 0, maxLosses = 0, curWins = 0, curLosses = 0
  for (const t of closed) {
    if ((t.net_pnl ?? 0) > 0) {
      curWins++; curLosses = 0
      if (curWins > maxWins) maxWins = curWins
    } else {
      curLosses++; curWins = 0
      if (curLosses > maxLosses) maxLosses = curLosses
    }
  }

  const today = closed.filter(t => isToday(parseISO(t.entry_date)))
  const thisMonth = closed.filter(t => isThisMonth(parseISO(t.entry_date)))

  return {
    total_trades: trades.length,
    open_trades: open.length,
    closed_trades: closed.length,
    winning_trades: winners.length,
    losing_trades: losers.length,
    win_rate: closed.length ? (winners.length / closed.length) * 100 : 0,
    total_pnl: totalPnl,
    gross_profit: grossProfit,
    gross_loss: grossLoss,
    average_profit: avgProfit,
    average_loss: avgLoss,
    profit_factor: profitFactor,
    max_drawdown: maxDrawdown,
    max_consecutive_wins: maxWins,
    max_consecutive_losses: maxLosses,
    best_trade: winners.length ? Math.max(...winners.map(t => t.net_pnl ?? 0)) : 0,
    worst_trade: losers.length  ? Math.min(...losers.map(t => t.net_pnl ?? 0))  : 0,
    today_pnl: today.reduce((s, t) => s + (t.net_pnl ?? 0), 0),
    month_pnl: thisMonth.reduce((s, t) => s + (t.net_pnl ?? 0), 0),
  }
}

// ── Equity curve ────────────────────────────────────────────
export function buildEquityCurve(trades: Trade[]) {
  const closed = trades
    .filter(t => t.status === 'closed' && t.net_pnl !== null)
    .sort((a, b) => new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime())

  let cumulative = 0
  return closed.map(t => {
    cumulative += t.net_pnl ?? 0
    return { date: formatDate(t.entry_date, 'dd MMM'), pnl: cumulative, trade_pnl: t.net_pnl }
  })
}

// ── Helpers ──────────────────────────────────────────────────
export function getPnlColor(value: number | null | undefined): string {
  if (!value) return 'text-muted-foreground'
  return value > 0 ? 'text-profit' : 'text-loss'
}

export function getPnlBg(value: number | null | undefined): string {
  if (!value) return ''
  return value > 0 ? 'bg-profit/10 text-profit' : 'bg-loss/10 text-loss'
}

export function getSymbolLabel(trade: Trade): string {
  if (trade.trade_type === 'futures') {
    return `${trade.symbol} ${formatDate(trade.expiry_date, 'MMM yy')} FUT`
  }
  return `${trade.symbol} ${formatDate(trade.expiry_date, 'MMM yy')} ${trade.strike_price} ${trade.option_type}`
}

export const POPULAR_SYMBOLS = [
  'NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY',
  'RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK',
  'SBIN', 'TATAMOTORS', 'BAJFINANCE', 'AXISBANK', 'WIPRO',
]

export const EXCHANGES = ['NSE', 'BSE', 'MCX']

export const LOT_SIZES: Record<string, number> = {
  NIFTY: 25, BANKNIFTY: 15, FINNIFTY: 40, MIDCPNIFTY: 75,
  RELIANCE: 250, TCS: 150, INFY: 300, HDFCBANK: 550,
}
