'use client'

import { useState } from 'react'
import { useTrades } from '@/hooks/use-trades'
import { useRollovers } from '@/hooks/use-rollovers'
import { exportTradesToExcel, exportTradesToCSV, exportTradesToPDF } from '@/utils/export'
import { formatCurrency, formatPercent } from '@/utils/trade'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { FileSpreadsheet, FileText, FileCsv, Download, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { format, startOfMonth, parseISO } from 'date-fns'

export default function ReportsPage() {
  const { trades, stats, isLoading } = useTrades()
  const { chains } = useRollovers()
  const { toast } = useToast()
  const [exportingPdf, setExportingPdf] = useState(false)

  if (isLoading) return (
    <div className="p-6 space-y-4">
      <Skeleton className="h-8 w-48" />
      {[1,2,3].map(i => <Skeleton key={i} className="h-36" />)}
    </div>
  )

  // Build monthly P&L for Excel
  const monthlyMap: Record<string, any> = {}
  trades.filter(t => t.status === 'closed').forEach(t => {
    const key = format(startOfMonth(parseISO(t.entry_date)), 'yyyy-MM-dd')
    if (!monthlyMap[key]) monthlyMap[key] = { month: key, total_trades: 0, winning_trades: 0, monthly_pnl: 0, gross_profit: 0, gross_loss: 0 }
    monthlyMap[key].total_trades++
    if ((t.net_pnl ?? 0) > 0) { monthlyMap[key].winning_trades++; monthlyMap[key].gross_profit += t.net_pnl ?? 0 }
    else monthlyMap[key].gross_loss += t.net_pnl ?? 0
    monthlyMap[key].monthly_pnl += t.net_pnl ?? 0
  })
  const monthlyPnl = Object.values(monthlyMap)

  const handleExcel = () => {
    try {
      exportTradesToExcel(trades, stats!, monthlyPnl)
      toast({ title: 'Excel exported!', description: 'Check your downloads folder.' })
    } catch (e: any) {
      toast({ title: 'Export failed', description: e.message, variant: 'destructive' })
    }
  }

  const handleCSV = () => {
    try {
      exportTradesToCSV(trades)
      toast({ title: 'CSV exported!' })
    } catch (e: any) {
      toast({ title: 'Export failed', description: e.message, variant: 'destructive' })
    }
  }

  const handlePDF = async () => {
    setExportingPdf(true)
    try {
      await exportTradesToPDF(trades, stats!)
      toast({ title: 'PDF exported!' })
    } catch (e: any) {
      toast({ title: 'Export failed', description: e.message, variant: 'destructive' })
    } finally {
      setExportingPdf(false)
    }
  }

  const SummaryRow = ({ label, value, className }: { label: string; value: string; className?: string }) => (
    <div className="flex justify-between py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium ${className ?? ''}`}>{value}</span>
    </div>
  )

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports & Export</h1>
        <p className="text-muted-foreground text-sm">Download your trade data in multiple formats</p>
      </div>

      {/* Summary */}
      <Card>
        <CardHeader><CardTitle className="text-base">Performance Summary</CardTitle></CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="divide-y">
              <SummaryRow label="Total Trades" value={String(stats?.total_trades ?? 0)} />
              <SummaryRow label="Closed Trades" value={String(stats?.closed_trades ?? 0)} />
              <SummaryRow label="Open Trades" value={String(stats?.open_trades ?? 0)} />
              <SummaryRow label="Win Rate" value={formatPercent(stats?.win_rate ?? 0)} />
              <SummaryRow label="Profit Factor" value={isFinite(stats?.profit_factor ?? 0) ? (stats?.profit_factor ?? 0).toFixed(2) : '∞'} />
            </div>
            <div className="divide-y">
              <SummaryRow label="Total Net P&L" value={formatCurrency(stats?.total_pnl ?? 0)} className={stats?.total_pnl && stats.total_pnl >= 0 ? 'text-profit' : 'text-loss'} />
              <SummaryRow label="Gross Profit" value={formatCurrency(stats?.gross_profit ?? 0)} className="text-profit" />
              <SummaryRow label="Gross Loss" value={formatCurrency(stats?.gross_loss ?? 0)} className="text-loss" />
              <SummaryRow label="Max Drawdown" value={formatCurrency(stats?.max_drawdown ?? 0)} />
              <SummaryRow label="Rollover Chains" value={String(chains.length)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Options */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Excel */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <FileSpreadsheet className="h-5 w-5 text-green-700" />
              </div>
              <div>
                <CardTitle className="text-base">Excel (.xlsx)</CardTitle>
                <CardDescription className="text-xs">Full workbook</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• All trades sheet</li>
              <li>• Monthly summary sheet</li>
              <li>• Strategy breakdown</li>
              <li>• Statistics summary</li>
            </ul>
            <Separator />
            <Button onClick={handleExcel} className="w-full bg-green-700 hover:bg-green-800" disabled={!stats}>
              <Download className="h-4 w-4 mr-2" />Export Excel
            </Button>
          </CardContent>
        </Card>

        {/* PDF */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-red-700" />
              </div>
              <div>
                <CardTitle className="text-base">PDF Report</CardTitle>
                <CardDescription className="text-xs">Printable report</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Performance summary</li>
              <li>• Complete trade table</li>
              <li>• Color-coded P&L</li>
              <li>• Landscape A4 format</li>
            </ul>
            <Separator />
            <Button onClick={handlePDF} variant="destructive" className="w-full" disabled={!stats || exportingPdf}>
              {exportingPdf ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
              Export PDF
            </Button>
          </CardContent>
        </Card>

        {/* CSV */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-700" />
              </div>
              <div>
                <CardTitle className="text-base">CSV (.csv)</CardTitle>
                <CardDescription className="text-xs">Raw data</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• All trade fields</li>
              <li>• Import into any tool</li>
              <li>• Zerodha/Groww compatible</li>
              <li>• UTF-8 encoded</li>
            </ul>
            <Separator />
            <Button onClick={handleCSV} variant="outline" className="w-full border-blue-500 text-blue-600 hover:bg-blue-50">
              <Download className="h-4 w-4 mr-2" />Export CSV
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Monthly breakdown */}
      {monthlyPnl.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Monthly Breakdown</CardTitle></CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs text-muted-foreground font-medium">Month</th>
                    <th className="px-4 py-2 text-right text-xs text-muted-foreground font-medium">Trades</th>
                    <th className="px-4 py-2 text-right text-xs text-muted-foreground font-medium">Winners</th>
                    <th className="px-4 py-2 text-right text-xs text-muted-foreground font-medium">Profit</th>
                    <th className="px-4 py-2 text-right text-xs text-muted-foreground font-medium">Loss</th>
                    <th className="px-4 py-2 text-right text-xs text-muted-foreground font-medium">Net P&L</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {monthlyPnl.sort((a,b) => b.month.localeCompare(a.month)).map(m => (
                    <tr key={m.month} className="hover:bg-muted/20">
                      <td className="px-4 py-2 font-medium">{format(parseISO(m.month), 'MMM yyyy')}</td>
                      <td className="px-4 py-2 text-right text-muted-foreground">{m.total_trades}</td>
                      <td className="px-4 py-2 text-right text-muted-foreground">{m.winning_trades}</td>
                      <td className="px-4 py-2 text-right text-profit">{formatCurrency(m.gross_profit)}</td>
                      <td className="px-4 py-2 text-right text-loss">{formatCurrency(Math.abs(m.gross_loss))}</td>
                      <td className={`px-4 py-2 text-right font-semibold ${m.monthly_pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                        {formatCurrency(m.monthly_pnl)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
