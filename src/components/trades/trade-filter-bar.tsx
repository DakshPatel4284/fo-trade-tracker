'use client'

import { TradeFilters } from '@/types'
import { useTradeStore } from '@/store/trade-store'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

export function TradeFilterBar() {
  const { filters, strategies, setFilters, clearFilters } = useTradeStore()
  const hasFilters = Object.values(filters).some(Boolean)

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        placeholder="Search symbol..."
        className="w-40"
        value={filters.symbol ?? ''}
        onChange={e => setFilters({ symbol: e.target.value || undefined })}
      />

      <Select value={filters.trade_type ?? ''} onValueChange={v => setFilters({ trade_type: v as any || undefined })}>
        <SelectTrigger className="w-32"><SelectValue placeholder="Type" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="">All types</SelectItem>
          <SelectItem value="futures">Futures</SelectItem>
          <SelectItem value="options">Options</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.direction ?? ''} onValueChange={v => setFilters({ direction: v as any || undefined })}>
        <SelectTrigger className="w-28"><SelectValue placeholder="Direction" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="">All</SelectItem>
          <SelectItem value="BUY">BUY</SelectItem>
          <SelectItem value="SELL">SELL</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.status ?? ''} onValueChange={v => setFilters({ status: v as any || undefined })}>
        <SelectTrigger className="w-28"><SelectValue placeholder="Status" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="">All</SelectItem>
          <SelectItem value="open">Open</SelectItem>
          <SelectItem value="closed">Closed</SelectItem>
          <SelectItem value="rolled">Rolled</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.strategy_id ?? ''} onValueChange={v => setFilters({ strategy_id: v || undefined })}>
        <SelectTrigger className="w-36"><SelectValue placeholder="Strategy" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="">All strategies</SelectItem>
          {strategies.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
        </SelectContent>
      </Select>

      <Input
        type="date"
        className="w-36"
        value={filters.date_from ?? ''}
        onChange={e => setFilters({ date_from: e.target.value || undefined })}
      />
      <span className="text-muted-foreground text-sm">to</span>
      <Input
        type="date"
        className="w-36"
        value={filters.date_to ?? ''}
        onChange={e => setFilters({ date_to: e.target.value || undefined })}
      />

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="h-3 w-3 mr-1" /> Clear
        </Button>
      )}
    </div>
  )
}
