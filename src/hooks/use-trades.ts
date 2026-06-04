'use client'

import { useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTradeStore } from '@/store/trade-store'
import { Trade, TradeFormValues } from '@/types'

export function useTrades() {
  const { trades, stats, strategies, isLoading, error, setTrades, setStrategies,
          addTrade, updateTrade, deleteTrade, setLoading, setError } = useTradeStore()
  const supabase = createClient()

  const fetchTrades = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('trades')
        .select('*, strategy:strategies(*)')
        .order('entry_date', { ascending: false })

      if (error) throw error
      setTrades(data as Trade[])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchStrategies = useCallback(async () => {
    const { data } = await supabase
      .from('strategies')
      .select('*')
      .eq('is_active', true)
      .order('name')
    if (data) setStrategies(data)
  }, [])

  useEffect(() => {
    fetchTrades()
    fetchStrategies()
  }, [])

  const createTrade = async (values: TradeFormValues): Promise<Trade | null> => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('trades')
        .insert({ ...values, user_id: user.id })
        .select('*, strategy:strategies(*)')
        .single()

      if (error) throw error
      addTrade(data as Trade)
      return data as Trade
    } catch (e: any) {
      setError(e.message)
      return null
    } finally {
      setLoading(false)
    }
  }

  const editTrade = async (id: string, values: Partial<TradeFormValues>): Promise<boolean> => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('trades')
        .update(values)
        .eq('id', id)
        .select('*, strategy:strategies(*)')
        .single()

      if (error) throw error
      updateTrade(id, data as Trade)
      return true
    } catch (e: any) {
      setError(e.message)
      return false
    } finally {
      setLoading(false)
    }
  }

  const removeTrade = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from('trades').delete().eq('id', id)
      if (error) throw error
      deleteTrade(id)
      return true
    } catch (e: any) {
      setError(e.message)
      return false
    }
  }

  const closeTrade = async (id: string, exitPrice: number, exitDate: string, charges?: number): Promise<boolean> => {
    return editTrade(id, { exit_price: exitPrice, exit_date: exitDate, charges, status: 'closed' } as any)
  }

  return {
    trades, stats, strategies, isLoading, error,
    fetchTrades, createTrade, editTrade, removeTrade, closeTrade,
  }
}
