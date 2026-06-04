'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RolloverChain } from '@/types'

export function useRollovers() {
  const [chains, setChains] = useState<RolloverChain[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchChains = useCallback(async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('rollover_chains')
      .select('*, rollovers(*)')
      .order('created_at', { ascending: false })
    setIsLoading(false)
    if (error) setError(error.message)
    else setChains(data as RolloverChain[])
  }, [])

  useEffect(() => { fetchChains() }, [fetchChains])

  const createChain = async (values: Partial<RolloverChain>) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data, error } = await supabase
      .from('rollover_chains')
      .insert({ ...values, user_id: user.id })
      .select()
      .single()
    if (error) { setError(error.message); return null }
    await fetchChains()
    return data
  }

  const addRollover = async (chainId: string, values: any) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data, error } = await supabase
      .from('rollovers')
      .insert({ ...values, chain_id: chainId, user_id: user.id })
      .select()
      .single()
    if (error) { setError(error.message); return null }
    await fetchChains()
    return data
  }

  const deleteChain = async (id: string) => {
    const { error } = await supabase.from('rollover_chains').delete().eq('id', id)
    if (error) { setError(error.message); return false }
    setChains(c => c.filter(ch => ch.id !== id))
    return true
  }

  return { chains, isLoading, error, fetchChains, createChain, addRollover, deleteChain }
}
