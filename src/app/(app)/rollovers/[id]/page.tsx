'use client'

import { use, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RolloverChain } from '@/types'
import { formatCurrency, formatDate, getPnlColor } from '@/utils/trade'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export default function RolloverDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const supabase = createClient()
  const [chain, setChain] = useState<RolloverChain | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchChain = async () => {
      const { data } = await supabase
        .from('rollover_chains')
        .select('*, rollovers(*)')
        .eq('id', id)
        .single()
      setChain(data)
      setLoading(false)
    }
    fetchChain()
  }, [id])

  if (loading) return (
    <div className="p-6 space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-32" />
      <Skeleton className="h-64" />
    </div>
  )

  if (!chain) return (
    <div className="p-6 text-center text-muted-foreground">
      <p>Rollover chain not found.</p>
      <Button variant="link" asChild><Link href="/rollovers">Back to rollovers</Link></Button>
    </div>
  )

  const Row = ({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) => (
    <div className="flex justify-between items-center py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn('font-medium', className)}>{value}</span>
    </div>
  )

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/rollovers"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{chain.symbol}</h1>
            <Badge variant="outline">{chain.trade_type.toUpperCase()}</Badge>
            <Badge variant={chain.direction === 'BUY' ? 'default' : 'secondary'}>{chain.direction}</Badge>
            <Badge variant={chain.closed_at ? 'secondary' : 'outline'} className={cn(!chain.closed_at && 'border-blue-500 text-blue-600')}>
              {chain.closed_at ? 'Closed' : 'Active'}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">Rollover Chain · Started {formatDate(chain.started_at)}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-xs text-muted-foreground">Total P&L</p>
            <p className={cn('text-2xl font-bold mt-1', getPnlColor(chain.total_pnl))}>{formatCurrency(chain.total_pnl)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-xs text-muted-foreground">Rollover Cost</p>
            <p className="text-2xl font-bold mt-1 text-muted-foreground">{formatCurrency(chain.total_rollover_cost)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-xs text-muted-foreground">Rollovers</p>
            <p className="text-2xl font-bold mt-1">{chain.rollovers?.length ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Chain Details</CardTitle></CardHeader>
        <CardContent className="divide-y">
          <Row label="Symbol" value={chain.symbol} />
          <Row label="Type" value={<Badge variant="outline">{chain.trade_type.toUpperCase()}</Badge>} />
          <Row label="Direction" value={<Badge variant={chain.direction === 'BUY' ? 'default' : 'secondary'}>{chain.direction}</Badge>} />
          <Row label="Started" value={formatDate(chain.started_at)} />
          <Row label="Closed" value={chain.closed_at ? formatDate(chain.closed_at) : '—'} />
          {chain.notes && <Row label="Notes" value={chain.notes} />}
        </CardContent>
      </Card>

      {chain.rollovers && chain.rollovers.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />Position Chain Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {chain.rollovers
                .sort((a, b) => new Date(a.rollover_date).getTime() - new Date(b.rollover_date).getTime())
                .map((r, i) => (
                  <div key={r.id} className="relative pl-6">
                    <div className="absolute left-0 top-2 w-3 h-3 rounded-full bg-primary border-2 border-background ring-2 ring-primary/30" />
                    {i < (chain.rollovers?.length ?? 0) - 1 && (
                      <div className="absolute left-1.5 top-5 bottom-0 w-px bg-border" />
                    )}
                    <div className="bg-muted/30 rounded-lg p-3 ml-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          Rollover #{i + 1} · {formatDate(r.rollover_date)}
                        </span>
                        {r.rollover_cost !== null && (
                          <span className={cn('text-xs font-semibold', r.rollover_cost < 0 ? 'text-loss' : 'text-profit')}>
                            Cost: {formatCurrency(r.rollover_cost)}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">Closed expiry</p>
                          <p className="font-medium">{formatDate(r.from_expiry, 'MMM yy')}</p>
                          <p className="text-xs text-muted-foreground">@ ₹{r.exit_price}</p>
                        </div>
                        <div className="flex items-center justify-center">
                          <RefreshCw className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Opened expiry</p>
                          <p className="font-medium">{formatDate(r.to_expiry, 'MMM yy')}</p>
                          <p className="text-xs text-muted-foreground">@ ₹{r.entry_price}</p>
                        </div>
                      </div>
                      {r.notes && <p className="text-xs text-muted-foreground mt-2">{r.notes}</p>}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
