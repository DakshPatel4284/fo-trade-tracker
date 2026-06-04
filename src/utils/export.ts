import * as XLSX from 'xlsx'
import { Trade, TradeStats, MonthlyPnl } from '@/types'
import { formatCurrency, formatDate, formatPercent, getSymbolLabel } from './trade'

// ── Excel Export ─────────────────────────────────────────────
export function exportTradesToExcel(trades: Trade[], stats: TradeStats, monthlyPnl: MonthlyPnl[]) {
  const wb = XLSX.utils.book_new()

  // Sheet 1: All Trades
  const tradesData = trades.map(t => ({
    'Date':           formatDate(t.entry_date),
    'Symbol':         getSymbolLabel(t),
    'Type':           t.trade_type.toUpperCase(),
    'Direction':      t.direction,
    'Strategy':       t.strategy?.name ?? '-',
    'Qty':            t.quantity,
    'Lot Size':       t.lot_size,
    'Entry Price':    t.entry_price,
    'Exit Price':     t.exit_price ?? '-',
    'Exit Date':      t.exit_date ? formatDate(t.exit_date) : '-',
    'Gross P&L':      t.gross_pnl ?? '-',
    'Charges':        t.charges,
    'Net P&L':        t.net_pnl ?? '-',
    'Status':         t.status.toUpperCase(),
    'Tags':           (t.tags ?? []).join(', '),
  }))
  const wsT = XLSX.utils.json_to_sheet(tradesData)
  styleExcelSheet(wsT, tradesData.length)
  XLSX.utils.book_append_sheet(wb, wsT, 'All Trades')

  // Sheet 2: Monthly Summary
  const monthlyData = monthlyPnl.map(m => ({
    'Month':          formatDate(m.month, 'MMM yyyy'),
    'Total Trades':   m.total_trades,
    'Winning':        m.winning_trades,
    'Win Rate':       formatPercent((m.winning_trades / m.total_trades) * 100),
    'Gross Profit':   m.gross_profit,
    'Gross Loss':     m.gross_loss,
    'Net P&L':        m.monthly_pnl,
  }))
  const wsM = XLSX.utils.json_to_sheet(monthlyData)
  XLSX.utils.book_append_sheet(wb, wsM, 'Monthly Summary')

  // Sheet 3: Statistics
  const statsData = [
    { 'Metric': 'Total Trades',          'Value': stats.total_trades },
    { 'Metric': 'Closed Trades',         'Value': stats.closed_trades },
    { 'Metric': 'Open Trades',           'Value': stats.open_trades },
    { 'Metric': 'Win Rate',              'Value': formatPercent(stats.win_rate) },
    { 'Metric': 'Total Net P&L',         'Value': formatCurrency(stats.total_pnl) },
    { 'Metric': 'Gross Profit',          'Value': formatCurrency(stats.gross_profit) },
    { 'Metric': 'Gross Loss',            'Value': formatCurrency(stats.gross_loss) },
    { 'Metric': 'Average Profit',        'Value': formatCurrency(stats.average_profit) },
    { 'Metric': 'Average Loss',          'Value': formatCurrency(stats.average_loss) },
    { 'Metric': 'Profit Factor',         'Value': stats.profit_factor.toFixed(2) },
    { 'Metric': 'Max Drawdown',          'Value': formatCurrency(stats.max_drawdown) },
    { 'Metric': 'Best Trade',            'Value': formatCurrency(stats.best_trade) },
    { 'Metric': 'Worst Trade',           'Value': formatCurrency(stats.worst_trade) },
    { 'Metric': 'Max Consecutive Wins',  'Value': stats.max_consecutive_wins },
    { 'Metric': 'Max Consecutive Losses','Value': stats.max_consecutive_losses },
  ]
  const wsS = XLSX.utils.json_to_sheet(statsData)
  wsS['!cols'] = [{ wch: 28 }, { wch: 18 }]
  XLSX.utils.book_append_sheet(wb, wsS, 'Statistics')

  XLSX.writeFile(wb, `fo-trades-${formatDate(new Date(), 'yyyy-MM-dd')}.xlsx`)
}

function styleExcelSheet(ws: XLSX.WorkSheet, rowCount: number) {
  const cols = [
    { wch: 12 }, { wch: 28 }, { wch: 10 }, { wch: 10 },
    { wch: 16 }, { wch: 6  }, { wch: 8  }, { wch: 12 },
    { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 10 },
    { wch: 12 }, { wch: 10 }, { wch: 16 },
  ]
  ws['!cols'] = cols
}

// ── CSV Export ───────────────────────────────────────────────
export function exportTradesToCSV(trades: Trade[]) {
  const headers = [
    'Date','Symbol','Type','Direction','Strategy','Qty','Lot Size',
    'Entry Price','Exit Price','Exit Date','Gross P&L','Charges','Net P&L','Status'
  ]
  const rows = trades.map(t => [
    formatDate(t.entry_date),
    getSymbolLabel(t),
    t.trade_type.toUpperCase(),
    t.direction,
    t.strategy?.name ?? '',
    t.quantity,
    t.lot_size,
    t.entry_price,
    t.exit_price ?? '',
    t.exit_date ? formatDate(t.exit_date) : '',
    t.gross_pnl ?? '',
    t.charges,
    t.net_pnl ?? '',
    t.status.toUpperCase(),
  ])

  const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
  downloadFile(csv, `fo-trades-${formatDate(new Date(), 'yyyy-MM-dd')}.csv`, 'text/csv')
}

// ── PDF Export (uses jsPDF) ───────────────────────────────────
export async function exportTradesToPDF(trades: Trade[], stats: TradeStats) {
  const { jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  // Title
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('F&O Trade Report', 14, 16)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Generated: ${formatDate(new Date(), 'dd MMM yyyy, HH:mm')}`, 14, 22)

  // Stats summary
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Performance Summary', 14, 32)

  const summaryData = [
    ['Total Trades', String(stats.total_trades), 'Win Rate', formatPercent(stats.win_rate)],
    ['Total P&L', formatCurrency(stats.total_pnl), 'Profit Factor', stats.profit_factor.toFixed(2)],
    ['Gross Profit', formatCurrency(stats.gross_profit), 'Max Drawdown', formatCurrency(stats.max_drawdown)],
    ['Gross Loss', formatCurrency(stats.gross_loss), 'Best Trade', formatCurrency(stats.best_trade)],
  ]

  autoTable(doc, {
    startY: 35,
    head: [],
    body: summaryData,
    theme: 'grid',
    styles: { fontSize: 9 },
    columnStyles: { 0: { fontStyle: 'bold' }, 2: { fontStyle: 'bold' } },
    margin: { left: 14, right: 14 },
  })

  // Trades table
  const finalY = (doc as any).lastAutoTable?.finalY ?? 75
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Trade Book', 14, finalY + 10)

  autoTable(doc, {
    startY: finalY + 13,
    head: [['Date', 'Symbol', 'Dir', 'Entry', 'Exit', 'Qty', 'Charges', 'Net P&L', 'Status']],
    body: trades.map(t => [
      formatDate(t.entry_date, 'dd/MM/yy'),
      getSymbolLabel(t),
      t.direction,
      t.entry_price,
      t.exit_price ?? '-',
      t.quantity,
      t.charges,
      t.net_pnl !== null ? formatCurrency(t.net_pnl) : '-',
      t.status.toUpperCase(),
    ]),
    theme: 'striped',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [30, 64, 175] },
    didParseCell: (data) => {
      if (data.column.index === 7 && data.section === 'body') {
        const val = parseFloat(String(data.cell.raw).replace(/[^-\d.]/g, ''))
        if (!isNaN(val)) {
          data.cell.styles.textColor = val >= 0 ? [22, 163, 74] : [220, 38, 38]
        }
      }
    },
    margin: { left: 14, right: 14 },
  })

  doc.save(`fo-trades-${formatDate(new Date(), 'yyyy-MM-dd')}.pdf`)
}

function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}
