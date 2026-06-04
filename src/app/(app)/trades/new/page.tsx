'use client'

import { useRouter } from 'next/navigation'
import { useTrades } from '@/hooks/use-trades'
import { TradeForm } from '@/components/trades/trade-form'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NewTradePage() {
  const router = useRouter()
  const { createTrade, isLoading } = useTrades()
  const { toast } = useToast()

  const handleSubmit = async (values: any) => {
    const trade = await createTrade(values)
    if (trade) {
      toast({ title: 'Trade added successfully!' })
      router.push('/trades')
    } else {
      toast({ title: 'Failed to add trade', variant: 'destructive' })
    }
    return !!trade
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/trades"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Add Trade</h1>
          <p className="text-muted-foreground text-sm">Log a new futures or options trade</p>
        </div>
      </div>
      <TradeForm onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  )
}
