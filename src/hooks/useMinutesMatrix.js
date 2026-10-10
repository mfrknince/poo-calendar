import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Custom hook for managing the minutes matrix data with Supabase realtime.
 * Fetches all 1440 minutes on mount and subscribes to realtime changes.
 */
export function useMinutesMatrix() {
  // Store matrix as a Map for O(1) lookups: key = "HH:mm", value = { pee_count, poop_count }
  const [matrix, setMatrix] = useState(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)
  const channelRef = useRef(null)

  // Fetch initial data
  const fetchMatrix = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('minutes_matrix')
        .select('id, pee_count, poop_count')
        .order('id')

      if (fetchError) throw fetchError

      const map = new Map()
      data?.forEach((row) => {
        map.set(row.id, {
          pee_count: row.pee_count,
          poop_count: row.poop_count,
        })
      })

      setMatrix(map)
    } catch (err) {
      console.error('Failed to fetch matrix:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Subscribe to realtime updates
  useEffect(() => {
    fetchMatrix()

    // Set up realtime subscription
    const channel = supabase
      .channel('minutes-matrix-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'minutes_matrix',
        },
        (payload) => {
          const { id, pee_count, poop_count } = payload.new
          setMatrix((prev) => {
            const next = new Map(prev)
            next.set(id, { pee_count, poop_count })
            return next
          })
          setLastUpdate({ id, pee_count, poop_count, at: new Date() })
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [fetchMatrix])

  // Increment pee count for the current minute
  const logPee = useCallback(async (timeStr) => {
    const current = matrix.get(timeStr) || { pee_count: 0, poop_count: 0 }

    const { error: updateError } = await supabase
      .from('minutes_matrix')
      .update({
        pee_count: current.pee_count + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', timeStr)

    if (updateError) throw updateError

    // Optimistic update
    setMatrix((prev) => {
      const next = new Map(prev)
      next.set(timeStr, {
        ...current,
        pee_count: current.pee_count + 1,
      })
      return next
    })
  }, [matrix])

  // Increment poop count for the current minute
  const logPoop = useCallback(async (timeStr) => {
    const current = matrix.get(timeStr) || { pee_count: 0, poop_count: 0 }

    const { error: updateError } = await supabase
      .from('minutes_matrix')
      .update({
        poop_count: current.poop_count + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', timeStr)

    if (updateError) throw updateError

    // Optimistic update
    setMatrix((prev) => {
      const next = new Map(prev)
      next.set(timeStr, {
        ...current,
        poop_count: current.poop_count + 1,
      })
      return next
    })
  }, [matrix])

  // Computed stats
  const stats = {
    totalPee: 0,
    totalPoop: 0,
    filledMinutes: 0,
    totalMinutes: 1440,
  }

  matrix.forEach((val) => {
    stats.totalPee += val.pee_count
    stats.totalPoop += val.poop_count
    if (val.pee_count > 0 || val.poop_count > 0) {
      stats.filledMinutes++
    }
  })

  stats.fillRate = ((stats.filledMinutes / stats.totalMinutes) * 100).toFixed(1)

  return {
    matrix,
    stats,
    isLoading,
    error,
    lastUpdate,
    logPee,
    logPoop,
    refresh: fetchMatrix,
  }
}
