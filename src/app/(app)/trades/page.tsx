'use client'

import { useTrades } from '@/hooks/use-trades'
import { useTradeStore } from '@/store/trade-store'
import { TradeTable } from '@/components/trades/trade-table'
import { TradeFilterBar } from '@/components/trades/trade-filter-bar'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Plus, Download } from 'lucide-react'
import Link from 'next/link'
import { exportTradesToCSV } from '@/utils/export'

export default function TradesPage() {
  const { removeTrade, stats } = useTrades()
  const { toast } = useToast()
  const filteredTrades = useTradeStore(s => s.getFilteredTrades())

  const handleDelete = async (id: string) => {
    const ok = await removeTrade(id)
    if (ok) toast({ title: 'Trade deleted' })
    else toast({ title: 'Delete failed', variant: 'destructive' })
    return ok
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Trade Book</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {stats?.total_trades ?? 0} trades · {stats?.open_trades ?? 0} open · {stats?.closed_trades ?? 0} closed
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportTradesToCSV(filteredTrades)}>
            <Download className="h-4 w-4 mr-2" />CSV
          </Button>
          <Button asChild>
            <Link href="/trades/new"><Plus className="h-4 w-4 mr-2" />Add Trade</Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <TradeFilterBar />

      {/* Table */}
      <TradeTable trades={filteredTrades} onDelete={handleDelete} />
    </div>
  )
}
