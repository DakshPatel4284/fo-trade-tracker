'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, TrendingUp, RefreshCw, BookOpen,
  BarChart2, FileText, Calendar, Settings, LogOut, ChevronLeft, Layers,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

const navItems = [
  { href: '/dashboard',  label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/trades',     label: 'Trades',       icon: TrendingUp },
  { href: '/rollovers',  label: 'Rollovers',    icon: RefreshCw },
  { href: '/journal',    label: 'Journal',      icon: BookOpen },
  { href: '/analytics',  label: 'Analytics',    icon: BarChart2 },
  { href: '/strategy',   label: 'Strategy',     icon: Layers },
  { href: '/reports',    label: 'Reports',      icon: FileText },
  { href: '/calendar',   label: 'Calendar',     icon: Calendar },
  { href: '/settings',   label: 'Settings',     icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className={cn(
      'relative flex flex-col border-r bg-card transition-all duration-300 h-screen sticky top-0',
      collapsed ? 'w-16' : 'w-60'
    )}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b">
        <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">F</span>
        </div>
        {!collapsed && (
          <div>
            <p className="font-semibold text-sm leading-tight">F&O Tracker</p>
            <p className="text-xs text-muted-foreground">Trade Journal</p>
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-3 top-6 h-6 w-6 rounded-full border bg-background shadow-sm"
        onClick={() => setCollapsed(c => !c)}
      >
        <ChevronLeft className={cn('h-3 w-3 transition-transform', collapsed && 'rotate-180')} />
      </Button>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                active
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Sign out */}
      <div className="px-2 py-3 border-t">
        <button
          onClick={handleSignOut}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive w-full transition-colors'
          )}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  )
}
