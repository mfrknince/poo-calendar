import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Custom hook for managing the minutes matrix data with a dynamic Supabase client.
 * Fetches all 1440 minutes on mount and subscribes to realtime changes.
 */
// Timestamped log for the profile page's daily/weekly stats; failure must not block the matrix update
function logActivity(client, type) {
  client.from('activity_log').insert({ type }).then(({ error }) => {
    if (error) console.error('Activity log failed:', error)
  })
}

export function useMinutesMatrixWithClient(supabaseClient, session) {
  // Store matrix as a Map for O(1) lookups: key = "HH:mm", value = { pee_count, poop_count }
  const [matrix, setMatrix] = useState(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)
  const channelRef = useRef(null)

  // Fetch initial data
  const fetchMatrix = useCallback(async () => {
    if (!supabaseClient || !session) return

    try {
      setIsLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabaseClient
        .from('minutes_matrix')
        .select('id, pee_count, poop_count')
        // if user_id is in schema, RLS will filter, but we explicitly filter just in case
        .eq('user_id', session.user.id)
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
  }, [supabaseClient, session])

  // Subscribe to realtime updates
  useEffect(() => {
    if (!supabaseClient || !session) return

    fetchMatrix()

    // Set up realtime subscription
    const channel = supabaseClient
      .channel('minutes-matrix-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'minutes_matrix',
          // Admin can read every row via RLS; only merge our own minutes
          filter: `user_id=eq.${session.user.id}`,
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
        supabaseClient.removeChannel(channelRef.current)
      }
    }
  }, [supabaseClient, session, fetchMatrix])

  // Increment pee count for a given minute
  const logPee = useCallback(async (timeStr) => {
    if (!supabaseClient || !session) return
    const current = matrix.get(timeStr) || { pee_count: 0, poop_count: 0 }

    const { error: updateError } = await supabaseClient
      .from('minutes_matrix')
      .upsert({
        id: timeStr,
        user_id: session.user.id,
        pee_count: current.pee_count + 1,
        poop_count: current.poop_count,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id,user_id' })

    if (updateError) throw updateError
    logActivity(supabaseClient, 'pee')

    // Optimistic update
    setMatrix((prev) => {
      const next = new Map(prev)
      next.set(timeStr, {
        ...current,
        pee_count: current.pee_count + 1,
      })
      return next
    })
  }, [supabaseClient, session, matrix])

  // Increment poop count for a given minute
  const logPoop = useCallback(async (timeStr) => {
    if (!supabaseClient || !session) return
    const current = matrix.get(timeStr) || { pee_count: 0, poop_count: 0 }

    const { error: updateError } = await supabaseClient
      .from('minutes_matrix')
      .upsert({
        id: timeStr,
        user_id: session.user.id,
        pee_count: current.pee_count,
        poop_count: current.poop_count + 1,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id,user_id' })

    if (updateError) throw updateError
    logActivity(supabaseClient, 'poop')

    // Optimistic update
    setMatrix((prev) => {
      const next = new Map(prev)
      next.set(timeStr, {
        ...current,
        poop_count: current.poop_count + 1,
      })
      return next
    })
  }, [supabaseClient, session, matrix])

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
