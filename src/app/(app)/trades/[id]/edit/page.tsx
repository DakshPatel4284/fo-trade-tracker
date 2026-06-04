'use client'

import { useRouter } from 'next/navigation'
import { useTrades } from '@/hooks/use-trades'
import { useTradeStore } from '@/store/trade-store'
import { TradeForm } from '@/components/trades/trade-form'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function EditTradePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { editTrade, isLoading } = useTrades()
  const { toast } = useToast()
  const trade = useTradeStore(s => s.trades.find(t => t.id === params.id))

  if (!trade) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Trade not found.</p>
        <Button variant="link" asChild><Link href="/trades">Back to trades</Link></Button>
      </div>
    )
  }

  const handleSubmit = async (values: any) => {
    const ok = await editTrade(trade.id, values)
    if (ok) {
      toast({ title: 'Trade updated!' })
      router.push('/trades')
    } else {
      toast({ title: 'Update failed', variant: 'destructive' })
    }
    return ok
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/trades"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit Trade</h1>
          <p className="text-muted-foreground text-sm">{trade.symbol} · {trade.trade_type}</p>
        </div>
      </div>
      <TradeForm trade={trade} onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  )
}
