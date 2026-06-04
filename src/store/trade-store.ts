import { create } from 'zustand'
import { Trade, TradeStats, TradeFilters, Strategy } from '@/types'
import { computeStats } from '@/utils/trade'

interface TradeStore {
  trades: Trade[]
  stats: TradeStats | null
  strategies: Strategy[]
  filters: TradeFilters
  isLoading: boolean
  error: string | null

  setTrades: (trades: Trade[]) => void
  addTrade: (trade: Trade) => void
  updateTrade: (id: string, trade: Partial<Trade>) => void
  deleteTrade: (id: string) => void
  setStrategies: (strategies: Strategy[]) => void
  setFilters: (filters: Partial<TradeFilters>) => void
  clearFilters: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  // Derived
  getFilteredTrades: () => Trade[]
  getOpenTrades: () => Trade[]
}

const defaultFilters: TradeFilters = {}

export const useTradeStore = create<TradeStore>((set, get) => ({
  trades: [],
  stats: null,
  strategies: [],
  filters: defaultFilters,
  isLoading: false,
  error: null,

  setTrades: (trades) => set({ trades, stats: computeStats(trades) }),

  addTrade: (trade) => set(s => {
    const trades = [trade, ...s.trades]
    return { trades, stats: computeStats(trades) }
  }),

  updateTrade: (id, updated) => set(s => {
    const trades = s.trades.map(t => t.id === id ? { ...t, ...updated } : t)
    return { trades, stats: computeStats(trades) }
  }),

  deleteTrade: (id) => set(s => {
    const trades = s.trades.filter(t => t.id !== id)
    return { trades, stats: computeStats(trades) }
  }),

  setStrategies: (strategies) => set({ strategies }),
  setFilters: (filters) => set(s => ({ filters: { ...s.filters, ...filters } })),
  clearFilters: () => set({ filters: defaultFilters }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  getFilteredTrades: () => {
    const { trades, filters } = get()
    return trades.filter(t => {
      if (filters.symbol && !t.symbol.toLowerCase().includes(filters.symbol.toLowerCase())) return false
      if (filters.trade_type && t.trade_type !== filters.trade_type) return false
      if (filters.direction && t.direction !== filters.direction) return false
      if (filters.status && t.status !== filters.status) return false
      if (filters.strategy_id && t.strategy_id !== filters.strategy_id) return false
      if (filters.date_from && t.entry_date < filters.date_from) return false
      if (filters.date_to && t.entry_date > filters.date_to) return false
      return true
    })
  },

  getOpenTrades: () => get().trades.filter(t => t.status === 'open'),
}))
