'use client'

import { useTrades } from '@/hooks/use-trades'
import { useTradeStore } from '@/store/trade-store'
import { formatCurrency, formatPercent, computeStats } from '@/utils/trade'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import { TrendingUp, TrendingDown, Target, Activity } from 'lucide-react'

export default function StrategyAnalysisPage() {
  const { trades, isLoading } = useTrades()
  const strategies = useTradeStore(s => s.strategies)

  if (isLoading) return (
    <div className="p-6 space-y-4">
      <Skeleton className="h-8 w-48" />
      {[1,2,3].map(i => <Skeleton key={i} className="h-40" />)}
    </div>
  )

  const closed = trades.filter(t => t.status === 'closed' && t.net_pnl !== null)

  // Group trades by strategy
  const strategyGroups: Record<string, typeof closed> = { 'No Strategy': [] }
  strategies.forEach(s => { strategyGroups[s.name] = [] })
  closed.forEach(t => {
    const name = t.strategy?.name ?? 'No Strategy'
    if (!strategyGroups[name]) strategyGroups[name] = []
    strategyGroups[name].push(t)
  })

  // Group by trade type
  const futuresTrades = closed.filter(t => t.trade_type === 'futures')
  const optionsTrades = closed.filter(t => t.trade_type === 'options')
  const intradayTrades = closed.filter(t => t.strategy?.type === 'intraday')
  const positionalTrades = closed.filter(t => t.strategy?.type === 'positional')

  const stratStats = Object.entries(strategyGroups)
    .filter(([, ts]) => ts.length > 0)
    .map(([name, ts]) => {
      const stats = computeStats(ts)
      return { name, ...stats, trade_count: ts.length }
    })
    .sort((a, b) => b.total_pnl - a.total_pnl)

  const chartData = stratStats.map(s => ({ name: s.name.length > 12 ? s.name.slice(0,12)+'…' : s.name, pnl: s.total_pnl, trades: s.trade_count }))

  const StatCard = ({ label, value, sub, positive }: { label: string; value: string; sub?: string; positive?: boolean }) => (
    <div className="bg-muted/30 rounded-lg p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn('text-xl font-bold mt-1', positive === true && 'text-profit', positive === false && 'text-loss')}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  )

  const TypeSection = ({ label, trades: ts }: { label: string; trades: typeof closed }) => {
    if (ts.length === 0) return null
    const s = computeStats(ts)
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{label}</CardTitle>
            <Badge variant="outline">{ts.length} trades</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Net P&L" value={formatCurrency(s.total_pnl)} positive={s.total_pnl >= 0} />
            <StatCard label="Win Rate" value={formatPercent(s.win_rate)} positive={s.win_rate >= 50} />
            <StatCard label="Profit Factor" value={isFinite(s.profit_factor) ? s.profit_factor.toFixed(2) : '∞'} />
            <StatCard label="Avg Trade" value={formatCurrency(s.total_pnl / s.closed_trades)} positive={s.total_pnl >= 0} />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Strategy Analysis</h1>
        <p className="text-muted-foreground text-sm">Performance breakdown by strategy and trade type</p>
      </div>

      <Tabs defaultValue="by-strategy">
        <TabsList>
          <TabsTrigger value="by-strategy">By Strategy</TabsTrigger>
          <TabsTrigger value="by-type">By Trade Type</TabsTrigger>
        </TabsList>

        {/* ── By Strategy ── */}
        <TabsContent value="by-strategy" className="mt-4 space-y-4">
          {stratStats.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No closed trades with strategies yet.</CardContent></Card>
          ) : (
            <>
              {/* Chart */}
              <Card>
                <CardHeader><CardTitle className="text-base">P&L by Strategy</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={chartData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                      <Tooltip formatter={(v: any, name) => name === 'pnl' ? formatCurrency(v) : v} />
                      <Bar dataKey="pnl" name="Net P&L" radius={[0,4,4,0]}>
                        {chartData.map((entry, i) => (
                          <Cell key={i} fill={entry.pnl >= 0 ? '#16a34a' : '#dc2626'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Strategy table */}
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 border-b">
                        <tr>
                          {['Strategy','Trades','Win Rate','Gross Profit','Gross Loss','Net P&L','Profit Factor','Avg Trade'].map(h => (
                            <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {stratStats.map(s => (
                          <tr key={s.name} className="hover:bg-muted/20">
                            <td className="px-4 py-3 font-medium">{s.name}</td>
                            <td className="px-4 py-3 text-muted-foreground">{s.trade_count}</td>
                            <td className={cn('px-4 py-3 font-medium', s.win_rate >= 50 ? 'text-profit' : 'text-loss')}>
                              {formatPercent(s.win_rate)}
                            </td>
                            <td className="px-4 py-3 text-profit">{formatCurrency(s.gross_profit)}</td>
                            <td className="px-4 py-3 text-loss">{formatCurrency(s.gross_loss)}</td>
                            <td className={cn('px-4 py-3 font-semibold', s.total_pnl >= 0 ? 'text-profit' : 'text-loss')}>
                              {formatCurrency(s.total_pnl)}
                            </td>
                            <td className="px-4 py-3">{isFinite(s.profit_factor) ? s.profit_factor.toFixed(2) : '∞'}</td>
                            <td className={cn('px-4 py-3', s.total_pnl >= 0 ? 'text-profit' : 'text-loss')}>
                              {formatCurrency(s.closed_trades > 0 ? s.total_pnl / s.closed_trades : 0)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* ── By Trade Type ── */}
        <TabsContent value="by-type" className="mt-4 space-y-4">
          <TypeSection label="Futures Trading" trades={futuresTrades} />
          <TypeSection label="Options Trading" trades={optionsTrades} />
          <TypeSection label="Intraday" trades={intradayTrades} />
          <TypeSection label="Positional" trades={positionalTrades} />
          {futuresTrades.length === 0 && optionsTrades.length === 0 && (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No closed trades yet.</CardContent></Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
