'use client'

import { Trade } from '@/types'
import { buildEquityCurve } from '@/utils/trade'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/utils/trade'

interface EquityCurveProps { trades: Trade[] }

export function EquityCurve({ trades }: EquityCurveProps) {
  const data = buildEquityCurve(trades)
  const isPositive = data.length > 0 && (data[data.length - 1]?.pnl ?? 0) >= 0

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null
    const d = payload[0].payload
    return (
      <div className="bg-card border rounded-lg shadow-lg p-3 text-sm">
        <p className="font-medium">{d.date}</p>
        <p className={d.pnl >= 0 ? 'text-profit' : 'text-loss'}>
          Cumulative: {formatCurrency(d.pnl)}
        </p>
        <p className={d.trade_pnl >= 0 ? 'text-profit' : 'text-loss'}>
          Trade: {formatCurrency(d.trade_pnl)}
        </p>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Equity Curve</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
            No closed trades yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"   stopColor={isPositive ? '#16a34a' : '#dc2626'} stopOpacity={0.3} />
                  <stop offset="95%"  stopColor={isPositive ? '#16a34a' : '#dc2626'} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis
                tick={{ fontSize: 11 }} tickLine={false} axisLine={false}
                tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone" dataKey="pnl"
                stroke={isPositive ? '#16a34a' : '#dc2626'}
                fill="url(#pnlGrad)" strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
