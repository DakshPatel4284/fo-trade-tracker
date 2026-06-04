'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTrades } from '@/hooks/use-trades'
import { useTradeStore } from '@/store/trade-store'
import { TradeJournal } from '@/types'
import { getSymbolLabel, formatDate, formatCurrency, getPnlColor } from '@/utils/trade'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { BookOpen, Star, ChevronDown, ChevronRight, Save, Loader2 } from 'lucide-react'

export default function JournalPage() {
  const { trades } = useTrades()
  const { toast } = useToast()
  const supabase = createClient()
  const [journals, setJournals] = useState<Record<string, TradeJournal>>({})
  const [expanded, setExpanded] = useState<string | null>(null)
  const [saving, setSaving] = useState<string | null>(null)
  const [form, setForm] = useState<Record<string, Partial<TradeJournal>>>({})

  useEffect(() => {
    const fetchJournals = async () => {
      const { data } = await supabase.from('trade_journals').select('*')
      if (data) {
        const map: Record<string, TradeJournal> = {}
        data.forEach(j => { map[j.trade_id] = j })
        setJournals(map)
      }
    }
    fetchJournals()
  }, [])

  const closedTrades = trades.filter(t => t.status === 'closed')

  const handleSave = async (tradeId: string) => {
    setSaving(tradeId)
    const values = form[tradeId] ?? {}
    const existing = journals[tradeId]
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let result
    if (existing) {
      result = await supabase.from('trade_journals').update(values).eq('id', existing.id).select().single()
    } else {
      result = await supabase.from('trade_journals').insert({ ...values, trade_id: tradeId, user_id: user.id }).select().single()
    }

    setSaving(null)
    if (result.error) {
      toast({ title: 'Save failed', description: result.error.message, variant: 'destructive' })
    } else {
      setJournals(j => ({ ...j, [tradeId]: result.data }))
      toast({ title: 'Journal saved!' })
    }
  }

  const updateForm = (tradeId: string, field: keyof TradeJournal, value: any) => {
    setForm(f => ({
      ...f,
      [tradeId]: { ...(f[tradeId] ?? journals[tradeId] ?? {}), [field]: value }
    }))
  }

  const getField = (tradeId: string, field: keyof TradeJournal): string => {
    return (form[tradeId]?.[field] ?? journals[tradeId]?.[field] ?? '') as string
  }

  const getRating = (tradeId: string): number => {
    return (form[tradeId]?.rating ?? journals[tradeId]?.rating ?? 0) as number
  }

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Trade Journal</h1>
        <p className="text-muted-foreground text-sm">{closedTrades.length} closed trades to review</p>
      </div>

      {closedTrades.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No closed trades to journal yet.</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {closedTrades.map(trade => {
          const journal = journals[trade.id]
          const isOpen = expanded === trade.id
          const hasJournal = !!journal

          return (
            <Card key={trade.id} className={cn(hasJournal && 'border-primary/30')}>
              <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpanded(isOpen ? null : trade.id)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{getSymbolLabel(trade)}</span>
                        <Badge variant={trade.direction === 'BUY' ? 'default' : 'secondary'} className="text-xs">{trade.direction}</Badge>
                        {hasJournal && <Badge variant="outline" className="text-xs border-primary text-primary">Journaled</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatDate(trade.entry_date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {/* Star rating display */}
                    {hasJournal && journal.rating && (
                      <div className="flex">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} className={cn('h-3 w-3', s <= journal.rating! ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground')} />
                        ))}
                      </div>
                    )}
                    <span className={cn('font-semibold text-sm', getPnlColor(trade.net_pnl))}>
                      {formatCurrency(trade.net_pnl)}
                    </span>
                  </div>
                </div>
              </CardHeader>

              {isOpen && (
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs">Entry Reason</Label>
                      <Textarea
                        placeholder="Why did you enter this trade? Setup, signal, thesis..."
                        rows={3}
                        value={getField(trade.id, 'entry_reason')}
                        onChange={e => updateForm(trade.id, 'entry_reason', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Exit Reason</Label>
                      <Textarea
                        placeholder="Why did you exit? Target hit, stop loss, thesis change..."
                        rows={3}
                        value={getField(trade.id, 'exit_reason')}
                        onChange={e => updateForm(trade.id, 'exit_reason', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Mistakes</Label>
                      <Textarea
                        placeholder="What did you do wrong? Entry too early, position size..."
                        rows={3}
                        value={getField(trade.id, 'mistakes')}
                        onChange={e => updateForm(trade.id, 'mistakes', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Lessons Learned</Label>
                      <Textarea
                        placeholder="What will you do differently next time?"
                        rows={3}
                        value={getField(trade.id, 'lessons')}
                        onChange={e => updateForm(trade.id, 'lessons', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Emotions / Market Conditions</Label>
                    <Textarea
                      placeholder="How were you feeling? Market context, news events..."
                      rows={2}
                      value={getField(trade.id, 'emotions')}
                      onChange={e => updateForm(trade.id, 'emotions', e.target.value)}
                    />
                  </div>

                  {/* Rating */}
                  <div className="space-y-2">
                    <Label className="text-xs">Trade Rating</Label>
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(s => (
                        <button key={s} type="button" onClick={() => updateForm(trade.id, 'rating', s)}>
                          <Star className={cn('h-6 w-6 transition-colors', s <= getRating(trade.id) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground hover:text-amber-300')} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button onClick={() => handleSave(trade.id)} disabled={saving === trade.id} size="sm">
                    {saving === trade.id ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Save className="mr-2 h-3 w-3" />}
                    Save Journal
                  </Button>
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
