'use client'

import { Trade } from '@/types'
import { formatCurrency, formatDate, getPnlColor, getSymbolLabel } from '@/utils/trade'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

interface RecentTradesProps { trades: Trade[] }

export function RecentTrades({ trades }: RecentTradesProps) {
  const recent = trades.slice(0, 8)

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base">Recent Trades</CardTitle>
        <Link href="/trades" className="text-xs text-primary flex items-center gap-1 hover:underline">
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {recent.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No trades yet. <Link href="/trades/new" className="text-primary hover:underline">Add your first trade</Link>
            </div>
          )}
          {recent.map(trade => (
            <Link
              key={trade.id}
              href={`/trades/${trade.id}`}
              className="flex items-center justify-between px-5 py-3 hover:bg-accent/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">{getSymbolLabel(trade)}</span>
                  <Badge variant={trade.direction === 'BUY' ? 'default' : 'secondary'} className="text-xs">
                    {trade.direction}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{formatDate(trade.entry_date)}</p>
              </div>
              <div className="text-right flex-shrink-0 ml-4">
                <p className={cn('font-semibold text-sm', getPnlColor(trade.net_pnl))}>
                  {trade.net_pnl !== null ? formatCurrency(trade.net_pnl) : '—'}
                </p>
                <Badge
                  variant="outline"
                  className={cn('text-xs', trade.status === 'open' && 'border-primary text-primary')}
                >
                  {trade.status}
                </Badge>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
