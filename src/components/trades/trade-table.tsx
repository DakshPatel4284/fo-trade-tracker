'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Trade } from '@/types'
import { formatCurrency, formatDate, getPnlColor, getSymbolLabel } from '@/utils/trade'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Pencil, Trash2, Eye, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

interface TradeTableProps {
  trades: Trade[]
  onDelete: (id: string) => Promise<boolean>
}

type SortField = 'entry_date' | 'symbol' | 'net_pnl' | 'status'
type SortDir = 'asc' | 'desc'

export function TradeTable({ trades, onDelete }: TradeTableProps) {
  const [sort, setSort] = useState<{ field: SortField; dir: SortDir }>({ field: 'entry_date', dir: 'desc' })
  const [page, setPage] = useState(1)
  const pageSize = 20

  const sorted = [...trades].sort((a, b) => {
    const mul = sort.dir === 'asc' ? 1 : -1
    if (sort.field === 'entry_date') return mul * (new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime())
    if (sort.field === 'symbol') return mul * a.symbol.localeCompare(b.symbol)
    if (sort.field === 'net_pnl') return mul * ((a.net_pnl ?? 0) - (b.net_pnl ?? 0))
    if (sort.field === 'status') return mul * a.status.localeCompare(b.status)
    return 0
  })

  const total = sorted.length
  const pages = Math.ceil(total / pageSize)
  const paginated = sorted.slice((page - 1) * pageSize, page * pageSize)

  const toggleSort = (field: SortField) =>
    setSort(s => s.field === field ? { field, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { field, dir: 'desc' })

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sort.field !== field) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />
    return sort.dir === 'asc' ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />
  }

  const Th = ({ children, field, className }: { children: React.ReactNode; field?: SortField; className?: string }) => (
    <th
      className={cn('px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider', field && 'cursor-pointer hover:text-foreground select-none', className)}
      onClick={field ? () => toggleSort(field) : undefined}
    >
      <span className="inline-flex items-center">
        {children}
        {field && <SortIcon field={field} />}
      </span>
    </th>
  )

  return (
    <div className="space-y-3">
      <div className="rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <Th field="entry_date">Date</Th>
                <Th field="symbol">Symbol</Th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Dir</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Entry</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Exit</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Qty</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Strategy</th>
                <Th field="net_pnl">Net P&L</Th>
                <Th field="status">Status</Th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-muted-foreground">
                    No trades found. <Link href="/trades/new" className="text-primary hover:underline">Add a trade</Link>
                  </td>
                </tr>
              )}
              {paginated.map(trade => (
                <tr key={trade.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{formatDate(trade.entry_date, 'dd MMM yy')}</td>
                  <td className="px-4 py-3 font-medium whitespace-nowrap">{getSymbolLabel(trade)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={trade.direction === 'BUY' ? 'default' : 'secondary'} className="text-xs">
                      {trade.direction}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">₹{trade.entry_price}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{trade.exit_price ? `₹${trade.exit_price}` : '—'}</td>
                  <td className="px-4 py-3">{trade.quantity} × {trade.lot_size}</td>
                  <td className="px-4 py-3 text-muted-foreground">{trade.strategy?.name ?? '—'}</td>
                  <td className={cn('px-4 py-3 font-semibold whitespace-nowrap', getPnlColor(trade.net_pnl))}>
                    {trade.net_pnl !== null ? formatCurrency(trade.net_pnl) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={trade.status === 'open' ? 'outline' : trade.status === 'closed' ? 'secondary' : 'default'}
                      className={cn('text-xs capitalize', trade.status === 'open' && 'border-blue-500 text-blue-600')}
                    >
                      {trade.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                        <Link href={`/trades/${trade.id}`}><Eye className="h-3.5 w-3.5" /></Link>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                        <Link href={`/trades/${trade.id}/edit`}><Pencil className="h-3.5 w-3.5" /></Link>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete trade?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete {getSymbolLabel(trade)}. This cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => onDelete(trade.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total} trades
          </p>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
            {Array.from({ length: Math.min(pages, 5) }, (_, i) => i + 1).map(p => (
              <Button key={p} variant={page === p ? 'default' : 'outline'} size="sm" onClick={() => setPage(p)}>
                {p}
              </Button>
            ))}
            <Button variant="outline" size="sm" disabled={page === pages} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  )
}
