'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Trade, TradeFormValues } from '@/types'
import { POPULAR_SYMBOLS, EXCHANGES, LOT_SIZES } from '@/utils/trade'
import { useTradeStore } from '@/store/trade-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

const schema = z.object({
  trade_type:   z.enum(['futures', 'options']),
  symbol:       z.string().min(1, 'Required'),
  exchange:     z.string().default('NSE'),
  expiry_date:  z.string().min(1, 'Required'),
  option_type:  z.enum(['CE', 'PE']).optional(),
  strike_price: z.coerce.number().optional(),
  direction:    z.enum(['BUY', 'SELL']),
  entry_date:   z.string().min(1, 'Required'),
  entry_price:  z.coerce.number().min(0.01, 'Required'),
  quantity:     z.coerce.number().int().min(1, 'Required'),
  lot_size:     z.coerce.number().int().min(1, 'Required'),
  exit_price:   z.coerce.number().optional(),
  exit_date:    z.string().optional(),
  charges:      z.coerce.number().default(0),
  strategy_id:  z.string().optional(),
  notes:        z.string().optional(),
}).refine(d => d.trade_type === 'futures' || (d.option_type && d.strike_price), {
  message: 'Option type and strike price required for options',
  path: ['option_type'],
})

type FormValues = z.infer<typeof schema>

interface TradeFormProps {
  trade?: Trade
  onSubmit: (values: TradeFormValues) => Promise<boolean | null>
  isLoading?: boolean
}

export function TradeForm({ trade, onSubmit, isLoading }: TradeFormProps) {
  const strategies = useTradeStore(s => s.strategies)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: trade ? {
      trade_type:   trade.trade_type,
      symbol:       trade.symbol,
      exchange:     trade.exchange,
      expiry_date:  trade.expiry_date,
      option_type:  trade.option_type ?? undefined,
      strike_price: trade.strike_price ?? undefined,
      direction:    trade.direction,
      entry_date:   trade.entry_date?.slice(0, 16),
      entry_price:  trade.entry_price,
      quantity:     trade.quantity,
      lot_size:     trade.lot_size,
      exit_price:   trade.exit_price ?? undefined,
      exit_date:    trade.exit_date?.slice(0, 16),
      charges:      trade.charges,
      strategy_id:  trade.strategy_id ?? undefined,
      notes:        trade.notes ?? '',
    } : {
      trade_type: 'futures', direction: 'BUY', exchange: 'NSE',
      quantity: 1, lot_size: 25, charges: 0,
    },
  })

  const tradeType = watch('trade_type')
  const symbol = watch('symbol')

  const handleSymbolChange = (sym: string) => {
    setValue('symbol', sym)
    if (LOT_SIZES[sym]) setValue('lot_size', LOT_SIZES[sym])
  }

  const onFormSubmit = async (values: FormValues) => {
    await onSubmit(values as TradeFormValues)
  }

  const Field = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => (
    <div className="space-y-1">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Type & Symbol */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground">Instrument</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <Field label="Trade Type" error={errors.trade_type?.message}>
            <Select defaultValue={tradeType} onValueChange={v => setValue('trade_type', v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="futures">Futures</SelectItem>
                <SelectItem value="options">Options</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field label="Exchange" error={errors.exchange?.message}>
            <Select defaultValue="NSE" onValueChange={v => setValue('exchange', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {EXCHANGES.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Symbol" error={errors.symbol?.message}>
            <Select value={symbol} onValueChange={handleSymbolChange}>
              <SelectTrigger><SelectValue placeholder="Select symbol" /></SelectTrigger>
              <SelectContent>
                {POPULAR_SYMBOLS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Expiry Date" error={errors.expiry_date?.message}>
            <Input type="date" {...register('expiry_date')} />
          </Field>

          {tradeType === 'options' && (
            <>
              <Field label="Option Type" error={errors.option_type?.message}>
                <Select onValueChange={v => setValue('option_type', v as any)}>
                  <SelectTrigger><SelectValue placeholder="CE / PE" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CE">CE (Call)</SelectItem>
                    <SelectItem value="PE">PE (Put)</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Strike Price" error={errors.strike_price?.message}>
                <Input type="number" step="50" placeholder="e.g. 22000" {...register('strike_price')} />
              </Field>
            </>
          )}
        </CardContent>
      </Card>

      {/* Entry */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground">Entry Details</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <Field label="Direction" error={errors.direction?.message}>
            <Select defaultValue="BUY" onValueChange={v => setValue('direction', v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="BUY">BUY (Long)</SelectItem>
                <SelectItem value="SELL">SELL (Short)</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field label="Entry Date & Time" error={errors.entry_date?.message}>
            <Input type="datetime-local" {...register('entry_date')} />
          </Field>

          <Field label="Entry Price" error={errors.entry_price?.message}>
            <Input type="number" step="0.05" placeholder="0.00" {...register('entry_price')} />
          </Field>

          <Field label="Quantity (Lots)" error={errors.quantity?.message}>
            <Input type="number" min="1" {...register('quantity')} />
          </Field>

          <Field label="Lot Size" error={errors.lot_size?.message}>
            <Input type="number" min="1" {...register('lot_size')} />
          </Field>

          <Field label="Strategy" error={errors.strategy_id?.message}>
            <Select onValueChange={v => setValue('strategy_id', v)}>
              <SelectTrigger><SelectValue placeholder="Select strategy" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {strategies.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        </CardContent>
      </Card>

      {/* Exit (optional) */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground">Exit Details (optional)</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <Field label="Exit Price" error={errors.exit_price?.message}>
            <Input type="number" step="0.05" placeholder="Leave blank for open trade" {...register('exit_price')} />
          </Field>
          <Field label="Exit Date & Time" error={errors.exit_date?.message}>
            <Input type="datetime-local" {...register('exit_date')} />
          </Field>
          <Field label="Charges (₹)" error={errors.charges?.message}>
            <Input type="number" step="0.01" defaultValue={0} {...register('charges')} />
          </Field>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardContent className="pt-4">
          <Field label="Notes" error={errors.notes?.message}>
            <Textarea placeholder="Trade notes, setup details..." rows={3} {...register('notes')} />
          </Field>
        </CardContent>
      </Card>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {trade ? 'Update Trade' : 'Add Trade'}
      </Button>
    </form>
  )
}
