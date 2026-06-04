import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface StatCardProps {
  title: string
  value: string
  sub?: string
  icon: LucideIcon
  trend?: 'up' | 'down' | 'neutral'
  className?: string
  iconClassName?: string
}

export function StatCard({ title, value, sub, icon: Icon, trend, className, iconClassName }: StatCardProps) {
  return (
    <Card className={cn('', className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground truncate">{title}</p>
            <p className={cn(
              'text-2xl font-bold mt-1 truncate',
              trend === 'up' && 'text-profit',
              trend === 'down' && 'text-loss',
            )}>{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className={cn(
            'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ml-3',
            iconClassName ?? 'bg-primary/10'
          )}>
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
