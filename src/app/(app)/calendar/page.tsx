'use client'

import { useTrades } from '@/hooks/use-trades'
import { formatCurrency } from '@/utils/trade'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameMonth, isToday, parseISO, startOfWeek, endOfWeek
} from 'date-fns'

export default function CalendarPage() {
  const { trades, isLoading } = useTrades()
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // Build daily P&L map
  const dailyPnl: Record<string, { pnl: number; trades: number }> = {}
  trades.filter(t => t.status === 'closed' && t.net_pnl !== null).forEach(t => {
    const day = t.entry_date.slice(0, 10)
    if (!dailyPnl[day]) dailyPnl[day] = { pnl: 0, trades: 0 }
    dailyPnl[day].pnl += t.net_pnl ?? 0
    dailyPnl[day].trades++
  })

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: calStart, end: calEnd })

  const monthDays = days.filter(d => isSameMonth(d, currentMonth))
  const profitDays = monthDays.filter(d => (dailyPnl[format(d, 'yyyy-MM-dd')]?.pnl ?? 0) > 0).length
  const lossDays = monthDays.filter(d => (dailyPnl[format(d, 'yyyy-MM-dd')]?.pnl ?? 0) < 0).length
  const monthPnl = monthDays.reduce((s, d) => s + (dailyPnl[format(d, 'yyyy-MM-dd')]?.pnl ?? 0), 0)

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Calendar View</h1>
        <p className="text-muted-foreground text-sm">Daily P&L overview</p>
      </div>

      {/* Month summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-xs text-muted-foreground">Month P&L</p>
            <p className={cn('text-2xl font-bold mt-1', monthPnl >= 0 ? 'text-profit' : 'text-loss')}>{formatCurrency(monthPnl)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-xs text-muted-foreground">Profit Days</p>
            <p className="text-2xl font-bold mt-1 text-profit">{profitDays}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-xs text-muted-foreground">Loss Days</p>
            <p className="text-2xl font-bold mt-1 text-loss">{lossDays}</p>
          </CardContent>
        </Card>
      </div>

      {/* Calendar */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle>{format(currentMonth, 'MMMM yyyy')}</CardTitle>
            <div className="flex gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth()-1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>Today</Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth()+1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Week headers */}
          <div className="grid grid-cols-7 mb-2">
            {weekDays.map(d => (
              <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map(day => {
              const key = format(day, 'yyyy-MM-dd')
              const data = dailyPnl[key]
              const inMonth = isSameMonth(day, currentMonth)
              const today = isToday(day)
              const hasData = data && data.trades > 0
              const isProfit = hasData && data.pnl > 0
              const isLoss = hasData && data.pnl < 0

              return (
                <div
                  key={key}
                  className={cn(
                    'min-h-[80px] rounded-lg p-2 border transition-colors',
                    !inMonth && 'opacity-30 bg-muted/20',
                    inMonth && !hasData && 'bg-background',
                    isProfit && 'bg-profit/10 border-profit/30',
                    isLoss && 'bg-loss/10 border-loss/30',
                    today && 'ring-2 ring-primary',
                  )}
                >
                  <span className={cn(
                    'text-xs font-medium',
                    today && 'text-primary',
                    !inMonth && 'text-muted-foreground',
                  )}>
                    {format(day, 'd')}
                  </span>
                  {hasData && (
                    <div className="mt-1">
                      <p className={cn('text-xs font-semibold leading-tight', isProfit ? 'text-profit' : 'text-loss')}>
                        {formatCurrency(data.pnl)}
                      </p>
                      <p className="text-xs text-muted-foreground">{data.trades}T</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-profit/20 border border-profit/40"/>Profit day</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-loss/20 border border-loss/40"/>Loss day</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded border-2 border-primary"/>Today</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
