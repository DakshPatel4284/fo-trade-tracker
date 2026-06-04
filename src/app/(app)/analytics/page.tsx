'use client'

import { useTrades } from '@/hooks/use-trades'
import { formatCurrency, formatPercent, buildEquityCurve } from '@/utils/trade'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { format, parseISO, startOfMonth } from 'date-fns'
import { cn } from '@/lib/utils'

const COLORS = ['#16a34a', '#dc2626', '#2563eb', '#f59e0b', '#8b5cf6']

export default function AnalyticsPage() {
  const { trades, stats, isLoading } = useTrades()

  if (isLoading) return (
    <div className="p-6 space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{Array.from({length:8}).map((_,i)=><Skeleton key={i} className="h-20"/>)}</div>
      <Skeleton className="h-72" />
    </div>
  )

  const closed = trades.filter(t => t.status === 'closed' && t.net_pnl !== null)

  // Monthly P&L
  const monthlyMap: Record<string, { profit: number; loss: number; trades: number }> = {}
  closed.forEach(t => {
    const key = format(startOfMonth(parseISO(t.entry_date)), 'MMM yy')
    if (!monthlyMap[key]) monthlyMap[key] = { profit: 0, loss: 0, trades: 0 }
    monthlyMap[key].trades++
    if ((t.net_pnl ?? 0) > 0) monthlyMap[key].profit += t.net_pnl ?? 0
    else monthlyMap[key].loss += Math.abs(t.net_pnl ?? 0)
  })
  const monthlyData = Object.entries(monthlyMap).map(([month, v]) => ({ month, ...v, net: v.profit - v.loss }))

  // Strategy breakdown
  const stratMap: Record<string, number> = {}
  closed.forEach(t => {
    const name = t.strategy?.name ?? 'No Strategy'
    stratMap[name] = (stratMap[name] ?? 0) + (t.net_pnl ?? 0)
  })
  const stratData = Object.entries(stratMap).map(([name, pnl]) => ({ name, pnl }))

  // Win/Loss pie
  const pieData = [
    { name: 'Winners', value: stats?.winning_trades ?? 0 },
    { name: 'Losers', value: stats?.losing_trades ?? 0 },
  ]

  const equityCurve = buildEquityCurve(trades)

  const StatBox = ({ label, value, sub, className }: { label: string; value: string; sub?: string; className?: string }) => (
    <div className="bg-muted/30 rounded-lg p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn('text-xl font-bold mt-1', className)}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  )

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground text-sm">Deep dive into your trading performance</p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatBox label="Win Rate" value={formatPercent(stats?.win_rate ?? 0)} sub={`${stats?.winning_trades}W / ${stats?.losing_trades}L`} className={stats?.win_rate && stats.win_rate >= 50 ? 'text-profit' : 'text-loss'} />
        <StatBox label="Profit Factor" value={isFinite(stats?.profit_factor ?? 0) ? (stats?.profit_factor ?? 0).toFixed(2) : '∞'} sub="Gross profit / loss" />
        <StatBox label="Avg Profit" value={formatCurrency(stats?.average_profit ?? 0)} className="text-profit" />
        <StatBox label="Avg Loss" value={formatCurrency(stats?.average_loss ?? 0)} className="text-loss" />
        <StatBox label="Best Trade" value={formatCurrency(stats?.best_trade ?? 0)} className="text-profit" />
        <StatBox label="Worst Trade" value={formatCurrency(stats?.worst_trade ?? 0)} className="text-loss" />
        <StatBox label="Max Consec. Wins" value={String(stats?.max_consecutive_wins ?? 0)} />
        <StatBox label="Max Consec. Losses" value={String(stats?.max_consecutive_losses ?? 0)} />
      </div>

      <Tabs defaultValue="equity">
        <TabsList>
          <TabsTrigger value="equity">Equity Curve</TabsTrigger>
          <TabsTrigger value="monthly">Monthly P&L</TabsTrigger>
          <TabsTrigger value="strategy">By Strategy</TabsTrigger>
          <TabsTrigger value="winloss">Win/Loss</TabsTrigger>
        </TabsList>

        <TabsContent value="equity">
          <Card>
            <CardHeader><CardTitle className="text-base">Cumulative P&L</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={equityCurve}>
                  <defs>
                    <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: any) => formatCurrency(v)} />
                  <Area type="monotone" dataKey="pnl" stroke="#2563eb" fill="url(#eqGrad)" strokeWidth={2} name="Cumulative P&L" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly">
          <Card>
            <CardHeader><CardTitle className="text-base">Monthly Profit & Loss</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: any) => formatCurrency(v)} />
                  <Legend />
                  <Bar dataKey="profit" name="Profit" fill="#16a34a" radius={[3,3,0,0]} />
                  <Bar dataKey="loss" name="Loss" fill="#dc2626" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="strategy">
          <Card>
            <CardHeader><CardTitle className="text-base">P&L by Strategy</CardTitle></CardHeader>
            <CardContent>
              {stratData.length === 0 ? (
                <p className="text-center text-muted-foreground py-12">No strategy data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={stratData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
                    <Tooltip formatter={(v: any) => formatCurrency(v)} />
                    <Bar dataKey="pnl" name="Net P&L" radius={[0,3,3,0]}>
                      {stratData.map((entry, i) => (
                        <Cell key={i} fill={entry.pnl >= 0 ? '#16a34a' : '#dc2626'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="winloss">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Win/Loss Distribution</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}>
                      {pieData.map((_, i) => <Cell key={i} fill={i === 0 ? '#16a34a' : '#dc2626'} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Trade Type Split</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Futures', value: closed.filter(t => t.trade_type === 'futures').length },
                        { name: 'Options', value: closed.filter(t => t.trade_type === 'options').length },
                      ]}
                      cx="50%" cy="50%" outerRadius={100} dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}
                    >
                      <Cell fill="#2563eb" />
                      <Cell fill="#8b5cf6" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
