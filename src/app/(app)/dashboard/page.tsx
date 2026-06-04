'use client'

import { useTrades } from '@/hooks/use-trades'
import { StatCard } from '@/components/dashboard/stat-card'
import { EquityCurve } from '@/components/dashboard/equity-curve'
import { RecentTrades } from '@/components/dashboard/recent-trades'
import { formatCurrency, formatPercent } from '@/utils/trade'
import {
  TrendingUp, TrendingDown, Activity, Target,
  BarChart2, AlertTriangle, Plus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardPage() {
  const { trades, stats, isLoading } = useTrades()

  if (isLoading) return <DashboardSkeleton />

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Your trading performance at a glance</p>
        </div>
        <Button asChild>
          <Link href="/trades/new"><Plus className="h-4 w-4 mr-2" />Add Trade</Link>
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's P&L"
          value={formatCurrency(stats?.today_pnl ?? 0)}
          icon={stats?.today_pnl && stats.today_pnl >= 0 ? TrendingUp : TrendingDown}
          trend={stats?.today_pnl && stats.today_pnl >= 0 ? 'up' : 'down'}
        />
        <StatCard
          title="Month P&L"
          value={formatCurrency(stats?.month_pnl ?? 0)}
          sub={`${stats?.closed_trades ?? 0} closed trades`}
          icon={BarChart2}
          trend={stats?.month_pnl && stats.month_pnl >= 0 ? 'up' : 'down'}
        />
        <StatCard
          title="Win Rate"
          value={formatPercent(stats?.win_rate ?? 0)}
          sub={`${stats?.winning_trades ?? 0}W / ${stats?.losing_trades ?? 0}L`}
          icon={Target}
        />
        <StatCard
          title="Profit Factor"
          value={isFinite(stats?.profit_factor ?? 0) ? (stats?.profit_factor ?? 0).toFixed(2) : '∞'}
          sub="Gross profit / loss"
          icon={Activity}
        />
      </div>

      {/* Second row stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Net P&L"
          value={formatCurrency(stats?.total_pnl ?? 0)}
          icon={TrendingUp}
          trend={stats?.total_pnl && stats.total_pnl >= 0 ? 'up' : 'down'}
        />
        <StatCard
          title="Max Drawdown"
          value={formatCurrency(stats?.max_drawdown ?? 0)}
          icon={AlertTriangle}
          iconClassName="bg-loss/10"
        />
        <StatCard
          title="Avg Profit"
          value={formatCurrency(stats?.average_profit ?? 0)}
          icon={TrendingUp}
          trend="up"
        />
        <StatCard
          title="Avg Loss"
          value={formatCurrency(stats?.average_loss ?? 0)}
          icon={TrendingDown}
          trend="down"
        />
      </div>

      {/* Charts + Recent */}
      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <EquityCurve trades={trades} />
        </div>
        <div className="lg:col-span-2">
          <RecentTrades trades={trades} />
        </div>
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
      </div>
      <div className="grid lg:grid-cols-5 gap-6">
        <Skeleton className="lg:col-span-3 h-64" />
        <Skeleton className="lg:col-span-2 h-64" />
      </div>
    </div>
  )
}
