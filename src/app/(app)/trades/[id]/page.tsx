'use client'

import { use } from 'react'
import { useTrades } from '@/hooks/use-trades'
import { useTradeStore } from '@/store/trade-store'
import { formatCurrency, formatDateTime, getSymbolLabel, getPnlColor } from '@/utils/trade'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

export default function TradeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { removeTrade } = useTrades()
  const { toast } = useToast()
  const trade = useTradeStore(s => s.trades.find(t => t.id === id))

  if (!trade) return (
    <div className="p-6 text-center text-muted-foreground">Trade not found.</div>
  )

  const Row = ({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) => (
    <div className="flex justify-between items-center py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn('text-sm font-medium', className)}>{value}</span>
    </div>
  )

  const handleDelete = async () => {
    const ok = await removeTrade(trade.id)
    if (ok) { toast({ title: 'Trade deleted' }); router.push('/trades') }
    else toast({ title: 'Failed to delete', variant: 'destructive' })
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/trades"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold">{getSymbolLabel(trade)}</h1>
            <p className="text-muted-foreground text-sm">{formatDateTime(trade.entry_date)}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/trades/${trade.id}/edit`}><Pencil className="h-4 w-4 mr-1" />Edit</Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive border-destructive hover:bg-destructive/10">
                <Trash2 className="h-4 w-4 mr-1" />Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this trade?</AlertDialogTitle>
                <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Card className={cn('border-2', trade.net_pnl && trade.net_pnl >= 0 ? 'border-profit/30 bg-profit/5' : trade.net_pnl ? 'border-loss/30 bg-loss/5' : '')}>
        <CardContent className="pt-5">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground">Gross P&L</p>
              <p className={cn('text-lg font-bold', getPnlColor(trade.gross_pnl))}>{trade.gross_pnl !== null ? formatCurrency(trade.gross_pnl) : '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Charges</p>
              <p className="text-lg font-bold text-muted-foreground">{formatCurrency(trade.charges)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Net P&L</p>
              <p className={cn('text-lg font-bold', getPnlColor(trade.net_pnl))}>{trade.net_pnl !== null ? formatCurrency(trade.net_pnl) : '—'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Instrument</CardTitle></CardHeader>
          <CardContent className="divide-y">
            <Row label="Type" value={<Badge variant="outline">{trade.trade_type.toUpperCase()}</Badge>} />
            <Row label="Symbol" value={trade.symbol} />
            <Row label="Exchange" value={trade.exchange} />
            <Row label="Expiry" value={trade.expiry_date} />
            {trade.option_type && <Row label="Option Type" value={<Badge>{trade.option_type}</Badge>} />}
            {trade.strike_price && <Row label="Strike" value={`₹${trade.strike_price}`} />}
            <Row label="Direction" value={<Badge variant={trade.direction === 'BUY' ? 'default' : 'secondary'}>{trade.direction}</Badge>} />
            <Row label="Status" value={<Badge variant="outline" className="capitalize">{trade.status}</Badge>} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Execution</CardTitle></CardHeader>
          <CardContent className="divide-y">
            <Row label="Entry Date" value={formatDateTime(trade.entry_date)} />
            <Row label="Entry Price" value={`₹${trade.entry_price}`} />
            <Row label="Quantity" value={`${trade.quantity} lots`} />
            <Row label="Lot Size" value={trade.lot_size} />
            <Row label="Total Units" value={trade.quantity * trade.lot_size} />
            <Separator className="my-1" />
            <Row label="Exit Date" value={trade.exit_date ? formatDateTime(trade.exit_date) : '—'} />
            <Row label="Exit Price" value={trade.exit_price ? `₹${trade.exit_price}` : '—'} />
            <Row label="Strategy" value={trade.strategy?.name ?? '—'} />
          </CardContent>
        </Card>
      </div>

      {trade.notes && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Notes</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground whitespace-pre-wrap">{trade.notes}</p></CardContent>
        </Card>
      )}
    </div>
  )
}
