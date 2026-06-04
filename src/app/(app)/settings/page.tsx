'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Profile, Strategy, UserSettings } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Plus, Trash2, Save, Download, Upload, User, Settings2, BookMarked, Database } from 'lucide-react'

const profileSchema = z.object({
  full_name: z.string().min(2),
  broker_name: z.string().optional(),
  trading_capital: z.coerce.number().min(0),
})

const strategySchema = z.object({
  name: z.string().min(1),
  type: z.enum(['option_buying','option_selling','futures','intraday','positional','custom']),
  description: z.string().optional(),
})

type ProfileValues = z.infer<typeof profileSchema>
type StrategyValues = z.infer<typeof strategySchema>

export default function SettingsPage() {
  const supabase = createClient()
  const { toast } = useToast()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [addingStrategy, setAddingStrategy] = useState(false)

  const profileForm = useForm<ProfileValues>({ resolver: zodResolver(profileSchema) })
  const stratForm = useForm<StrategyValues>({ resolver: zodResolver(strategySchema) })

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: prof }, { data: strats }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('strategies').select('*').eq('user_id', user.id).order('name'),
      ])
      if (prof) {
        setProfile(prof)
        profileForm.reset({
          full_name: prof.full_name ?? '',
          broker_name: prof.broker_name ?? '',
          trading_capital: prof.trading_capital ?? 0,
        })
      }
      if (strats) setStrategies(strats)
    }
    load()
  }, [])

  const saveProfile = async (values: ProfileValues) => {
    setLoadingProfile(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('profiles').update(values).eq('id', user.id)
    setLoadingProfile(false)
    if (error) toast({ title: 'Save failed', description: error.message, variant: 'destructive' })
    else toast({ title: 'Profile saved!' })
  }

  const addStrategy = async (values: StrategyValues) => {
    setAddingStrategy(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data, error } = await supabase
      .from('strategies')
      .insert({ ...values, user_id: user.id })
      .select()
      .single()
    setAddingStrategy(false)
    if (error) toast({ title: 'Failed', description: error.message, variant: 'destructive' })
    else {
      setStrategies(s => [...s, data])
      stratForm.reset()
      toast({ title: 'Strategy added!' })
    }
  }

  const toggleStrategy = async (id: string, is_active: boolean) => {
    await supabase.from('strategies').update({ is_active }).eq('id', id)
    setStrategies(s => s.map(st => st.id === id ? { ...st, is_active } : st))
  }

  const deleteStrategy = async (id: string) => {
    const { error } = await supabase.from('strategies').delete().eq('id', id)
    if (error) toast({ title: 'Delete failed', variant: 'destructive' })
    else setStrategies(s => s.filter(st => st.id !== id))
  }

  const exportBackup = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [{ data: trades }, { data: chains }, { data: journals }] = await Promise.all([
      supabase.from('trades').select('*').eq('user_id', user.id),
      supabase.from('rollover_chains').select('*, rollovers(*)').eq('user_id', user.id),
      supabase.from('trade_journals').select('*').eq('user_id', user.id),
    ])
    const backup = { exported_at: new Date().toISOString(), trades, rollover_chains: chains, journals }
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `fo-tracker-backup-${new Date().toISOString().slice(0,10)}.json`; a.click()
    URL.revokeObjectURL(url)
    toast({ title: 'Backup downloaded!' })
  }

  const F = ({ label, error, children }: any) => (
    <div className="space-y-1">
      <Label className="text-sm">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm">Manage your profile and preferences</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile"><User className="h-4 w-4 mr-2" />Profile</TabsTrigger>
          <TabsTrigger value="strategies"><BookMarked className="h-4 w-4 mr-2" />Strategies</TabsTrigger>
          <TabsTrigger value="backup"><Database className="h-4 w-4 mr-2" />Backup</TabsTrigger>
        </TabsList>

        {/* ── Profile Tab ── */}
        <TabsContent value="profile" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Profile Information</CardTitle>
              <CardDescription>Update your personal and trading details</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={profileForm.handleSubmit(saveProfile)} className="space-y-4 max-w-md">
                <F label="Full Name" error={profileForm.formState.errors.full_name?.message}>
                  <Input placeholder="Your name" {...profileForm.register('full_name')} />
                </F>
                <F label="Email">
                  <Input value={profile?.email ?? ''} disabled className="opacity-60" />
                </F>
                <F label="Broker" error={profileForm.formState.errors.broker_name?.message}>
                  <Select
                    defaultValue={profile?.broker_name ?? ''}
                    onValueChange={v => profileForm.setValue('broker_name', v)}
                  >
                    <SelectTrigger><SelectValue placeholder="Select broker" /></SelectTrigger>
                    <SelectContent>
                      {['Zerodha','Groww','Angel One','ICICI Direct','HDFC Securities','Upstox','Fyers','Dhan','5paisa','Other'].map(b => (
                        <SelectItem key={b} value={b}>{b}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </F>
                <F label="Trading Capital (₹)" error={profileForm.formState.errors.trading_capital?.message}>
                  <Input type="number" placeholder="e.g. 500000" {...profileForm.register('trading_capital')} />
                </F>
                <Button type="submit" disabled={loadingProfile}>
                  {loadingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Profile
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Strategies Tab ── */}
        <TabsContent value="strategies" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Strategy Master</CardTitle>
              <CardDescription>Manage your trading strategies. These appear when adding trades.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-6">
                {strategies.map(s => (
                  <div key={s.id} className="flex items-center justify-between px-4 py-3 rounded-lg border hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <Badge variant={s.is_active ? 'default' : 'secondary'} className="text-xs capitalize">{s.type.replace('_',' ')}</Badge>
                      <div>
                        <p className="text-sm font-medium">{s.name}</p>
                        {s.description && <p className="text-xs text-muted-foreground">{s.description}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline" size="sm"
                        onClick={() => toggleStrategy(s.id, !s.is_active)}
                        className="text-xs h-7"
                      >
                        {s.is_active ? 'Disable' : 'Enable'}
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => deleteStrategy(s.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
                {strategies.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No strategies yet</p>
                )}
              </div>

              <Separator className="mb-4" />
              <p className="text-sm font-medium mb-3">Add New Strategy</p>
              <form onSubmit={stratForm.handleSubmit(addStrategy)} className="space-y-3 max-w-md">
                <F label="Strategy Name" error={stratForm.formState.errors.name?.message}>
                  <Input placeholder="e.g. Iron Condor" {...stratForm.register('name')} />
                </F>
                <F label="Type" error={stratForm.formState.errors.type?.message}>
                  <Select onValueChange={v => stratForm.setValue('type', v as any)}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="option_buying">Option Buying</SelectItem>
                      <SelectItem value="option_selling">Option Selling</SelectItem>
                      <SelectItem value="futures">Futures</SelectItem>
                      <SelectItem value="intraday">Intraday</SelectItem>
                      <SelectItem value="positional">Positional</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </F>
                <F label="Description (optional)">
                  <Textarea placeholder="Brief description..." rows={2} {...stratForm.register('description')} />
                </F>
                <Button type="submit" variant="outline" disabled={addingStrategy} size="sm">
                  {addingStrategy ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Plus className="mr-2 h-3 w-3" />}
                  Add Strategy
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Backup Tab ── */}
        <TabsContent value="backup" className="mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Download className="h-4 w-4" />Export Backup
                </CardTitle>
                <CardDescription>Download all your trades, rollovers, and journal entries as JSON</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Your backup will include all trades, rollover chains, and journal entries. Store it safely.
                </p>
                <Button onClick={exportBackup} className="w-full">
                  <Download className="mr-2 h-4 w-4" />Download Backup (.json)
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Upload className="h-4 w-4" />Restore Backup
                </CardTitle>
                <CardDescription>Restore data from a previously exported backup file</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload a backup JSON file to restore your data. This will merge with existing data.
                </p>
                <Button variant="outline" className="w-full" onClick={() => toast({ title: 'Coming soon', description: 'Restore will be available in the next update.' })}>
                  <Upload className="mr-2 h-4 w-4" />Upload Backup File
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-4 border-destructive/30">
            <CardHeader>
              <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
              <CardDescription>Irreversible actions — proceed with caution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Delete all trades</p>
                  <p className="text-xs text-muted-foreground">Permanently remove all trade data from your account</p>
                </div>
                <Button
                  variant="destructive" size="sm"
                  onClick={() => toast({ title: 'Not implemented', description: 'Please contact support to delete all data.', variant: 'destructive' })}
                >
                  Delete All Trades
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
