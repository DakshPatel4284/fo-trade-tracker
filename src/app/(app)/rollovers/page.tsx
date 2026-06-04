'use client'

import { useRollovers } from '@/hooks/use-rollovers'
import { formatCurrency, formatDate, getPnlColor } from '@/utils/trade'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Plus, Trash2, ChevronDown, ChevronRight, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'

export default function RolloversPage() {
  const { chains, isLoading, deleteChain } = useRollovers()
  const { toast } = useToast()
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const toggle = (id: string) => setExpanded(s => {
    const n = new Set(s)
    n.has(id) ? n.delete(id) : n.add(id)
    return n
  })

  const handleDelete = async (id: string) => {
    const ok = await deleteChain(id)
    if (ok) toast({ title: 'Rollover chain deleted' })
    else toast({ title: 'Delete failed', variant: 'destructive' })
  }

  if (isLoading) return (
    <div className="p-6 space-y-4">
      <Skeleton className="h-8 w-48" />
      {[1,2,3].map(i => <Skeleton key={i} className="h-24" />)}
    </div>
  )

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Rollover Management</h1>
          <p className="text-muted-foreground text-sm">{chains.length} position chain{chains.length !== 1 ? 's' : ''}</p>
        </div>
        <Button asChild>
          <Link href="/rollovers/new"><Plus className="h-4 w-4 mr-2" />New Chain</Link>
        </Button>
      </div>

      {chains.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <RefreshCw className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No rollover chains yet.</p>
            <Button variant="link" asChild><Link href="/rollovers/new">Create your first chain</Link></Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {chains.map(chain => (
          <Card key={chain.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => toggle(chain.id)}>
                  {expanded.has(chain.id) ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">{chain.symbol}</CardTitle>
                      <Badge variant="outline">{chain.trade_type.toUpperCase()}</Badge>
                      <Badge variant={chain.direction === 'BUY' ? 'default' : 'secondary'}>{chain.direction}</Badge>
                      <Badge variant={chain.closed_at ? 'secondary' : 'outline'} className={cn(!chain.closed_at && 'border-blue-500 text-blue-600')}>
                        {chain.closed_at ? 'Closed' : 'Active'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Started {formatDate(chain.started_at)} · {chain.rollovers?.length ?? 0} rollover{(chain.rollovers?.length ?? 0) !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Total P&L</p>
                    <p className={cn('font-semibold', getPnlColor(chain.total_pnl))}>{formatCurrency(chain.total_pnl)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Rollover Cost</p>
                    <p className="font-semibold text-muted-foreground">{formatCurrency(chain.total_rollover_cost)}</p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive h-8 w-8">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete chain?</AlertDialogTitle>
                        <AlertDialogDescription>All rollovers in this chain will also be deleted.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={() => handleDelete(chain.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>

            {expanded.has(chain.id) && chain.rollovers && chain.rollovers.length > 0 && (
              <CardContent>
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs text-muted-foreground font-medium">Rollover Date</th>
                        <th className="px-3 py-2 text-left text-xs text-muted-foreground font-medium">From Expiry</th>
                        <th className="px-3 py-2 text-left text-xs text-muted-foreground font-medium">Exit Price</th>
                        <th className="px-3 py-2 text-left text-xs text-muted-foreground font-medium">To Expiry</th>
                        <th className="px-3 py-2 text-left text-xs text-muted-foreground font-medium">Entry Price</th>
                        <th className="px-3 py-2 text-left text-xs text-muted-foreground font-medium">Rollover Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {chain.rollovers.map((r, i) => (
                        <tr key={r.id} className="hover:bg-muted/20">
                          <td className="px-3 py-2 text-muted-foreground">{formatDate(r.rollover_date)}</td>
                          <td className="px-3 py-2">{formatDate(r.from_expiry, 'MMM yy')}</td>
                          <td className="px-3 py-2">₹{r.exit_price}</td>
                          <td className="px-3 py-2">{formatDate(r.to_expiry, 'MMM yy')}</td>
                          <td className="px-3 py-2">₹{r.entry_price}</td>
                          <td className={cn('px-3 py-2 font-medium', r.rollover_cost && r.rollover_cost < 0 ? 'text-loss' : 'text-profit')}>
                            {r.rollover_cost !== null ? formatCurrency(r.rollover_cost) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {chain.notes && <p className="text-xs text-muted-foreground mt-2">{chain.notes}</p>}
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
