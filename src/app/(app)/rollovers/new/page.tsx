'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRollovers } from '@/hooks/use-rollovers'
import { useTradeStore } from '@/store/trade-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Loader2, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { POPULAR_SYMBOLS } from '@/utils/trade'

const chainSchema = z.object({
  symbol:     z.string().min(1),
  trade_type: z.enum(['futures','options']),
  direction:  z.enum(['BUY','SELL']),
  started_at: z.string().min(1),
  notes:      z.string().optional(),
})

const rolloverSchema = z.object({
  from_expiry:    z.string().min(1),
  exit_price:     z.coerce.number().min(0),
  to_expiry:      z.string().min(1),
  entry_price:    z.coerce.number().min(0),
  rollover_date:  z.string().min(1),
  rollover_cost:  z.coerce.number().optional(),
  notes:          z.string().optional(),
})

type ChainValues = z.infer<typeof chainSchema>
type RolloverValues = z.infer<typeof rolloverSchema>

export default function NewRolloverPage() {
  const router = useRouter()
  const { createChain, addRollover } = useRollovers()
  const { toast } = useToast()
  const [step, setStep] = useState<'chain' | 'rollovers'>('chain')
  const [chainId, setChainId] = useState<string | null>(null)
  const [rollovers, setRollovers] = useState<RolloverValues[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const chainForm = useForm<ChainValues>({ resolver: zodResolver(chainSchema) })
  const rolloverForm = useForm<RolloverValues>({ resolver: zodResolver(rolloverSchema) })

  const handleCreateChain = async (values: ChainValues) => {
    setIsLoading(true)
    const chain = await createChain(values)
    setIsLoading(false)
    if (chain) { setChainId(chain.id); setStep('rollovers') }
    else toast({ title: 'Failed to create chain', variant: 'destructive' })
  }

  const handleAddRollover = async (values: RolloverValues) => {
    if (!chainId) return
    setIsLoading(true)
    const ok = await addRollover(chainId, values)
    setIsLoading(false)
    if (ok) {
      setRollovers(r => [...r, values])
      rolloverForm.reset()
      toast({ title: 'Rollover added' })
    } else {
      toast({ title: 'Failed to add rollover', variant: 'destructive' })
    }
  }

  const handleFinish = () => {
    toast({ title: 'Rollover chain saved!' })
    router.push('/rollovers')
  }

  const F = ({ label, error, children }: any) => (
    <div className="space-y-1">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild><Link href="/rollovers"><ArrowLeft className="h-4 w-4" /></Link></Button>
        <div>
          <h1 className="text-2xl font-bold">New Rollover Chain</h1>
          <p className="text-muted-foreground text-sm">Track a position across multiple expiries</p>
        </div>
      </div>

      {/* Step 1: Chain */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Step 1: Position Details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={chainForm.handleSubmit(handleCreateChain)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <F label="Symbol" error={chainForm.formState.errors.symbol?.message}>
                <Select onValueChange={v => chainForm.setValue('symbol', v)}>
                  <SelectTrigger><SelectValue placeholder="Select symbol" /></SelectTrigger>
                  <SelectContent>{POPULAR_SYMBOLS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </F>
              <F label="Type" error={chainForm.formState.errors.trade_type?.message}>
                <Select onValueChange={v => chainForm.setValue('trade_type', v as any)}>
                  <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="futures">Futures</SelectItem>
                    <SelectItem value="options">Options</SelectItem>
                  </SelectContent>
                </Select>
              </F>
              <F label="Direction">
                <Select onValueChange={v => chainForm.setValue('direction', v as any)}>
                  <SelectTrigger><SelectValue placeholder="Direction" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BUY">BUY</SelectItem>
                    <SelectItem value="SELL">SELL</SelectItem>
                  </SelectContent>
                </Select>
              </F>
              <F label="Started At" error={chainForm.formState.errors.started_at?.message}>
                <Input type="date" {...chainForm.register('started_at')} />
              </F>
            </div>
            <F label="Notes">
              <Textarea placeholder="Optional notes..." rows={2} {...chainForm.register('notes')} />
            </F>
            <Button type="submit" disabled={isLoading || step === 'rollovers'} className="w-full">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {step === 'rollovers' ? '✓ Chain Created' : 'Create Chain'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Step 2: Rollovers */}
      {step === 'rollovers' && (
        <>
          <Card>
            <CardHeader><CardTitle className="text-sm">Step 2: Add Rollovers</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={rolloverForm.handleSubmit(handleAddRollover)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <F label="Rollover Date"><Input type="date" {...rolloverForm.register('rollover_date')} /></F>
                  <F label="From Expiry"><Input type="date" {...rolloverForm.register('from_expiry')} /></F>
                  <F label="Exit Price"><Input type="number" step="0.05" placeholder="0.00" {...rolloverForm.register('exit_price')} /></F>
                  <F label="To Expiry"><Input type="date" {...rolloverForm.register('to_expiry')} /></F>
                  <F label="Entry Price"><Input type="number" step="0.05" placeholder="0.00" {...rolloverForm.register('entry_price')} /></F>
                  <F label="Rollover Cost (₹)"><Input type="number" step="0.01" placeholder="0.00" {...rolloverForm.register('rollover_cost')} /></F>
                </div>
                <Button type="submit" variant="outline" disabled={isLoading} className="w-full">
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                  Add Rollover
                </Button>
              </form>
            </CardContent>
          </Card>

          {rollovers.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Added Rollovers ({rollovers.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {rollovers.map((r, i) => (
                    <div key={i} className="flex items-center justify-between text-sm bg-muted/50 rounded-lg px-3 py-2">
                      <span>{r.from_expiry} → {r.to_expiry}</span>
                      <span>₹{r.exit_price} → ₹{r.entry_price}</span>
                      <span className="text-muted-foreground">Cost: ₹{r.rollover_cost ?? 0}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Button onClick={handleFinish} className="w-full">
            Finish & Save Chain
          </Button>
        </>
      )}
    </div>
  )
}
