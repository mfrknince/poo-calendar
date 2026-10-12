import { useState, useEffect, useCallback } from 'react'

const PAGE = 1000 // Supabase caps responses at 1000 rows; the matrix has up to 1440

const toEntry = (row) => [row.id, { pee_count: row.pee_count, poop_count: row.poop_count }]

/**
 * Shared team matrix: every user's minutes summed per 'HH:mm' (team_matrix view).
 * Each user still writes only their own rows, so concurrent clicks never clobber each other.
 */
export function useMinutesMatrixWithClient(supabaseClient, session) {
  // Store matrix as a Map for O(1) lookups: key = "HH:mm", value = { pee_count, poop_count }
  const [matrix, setMatrix] = useState(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchMatrix = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const map = new Map()
      for (let from = 0; ; from += PAGE) {
        const { data, error: fetchError } = await supabaseClient
          .from('team_matrix')
          .select('id, pee_count, poop_count')
          .order('id')
          .range(from, from + PAGE - 1)
        if (fetchError) throw fetchError
        data.forEach((row) => map.set(...toEntry(row)))
        if (data.length < PAGE) break
      }
      setMatrix(map)
    } catch (err) {
      console.error('Failed to fetch matrix:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [supabaseClient])

  // Initial fetch + realtime: any teammate's change re-reads that minute's team total
  useEffect(() => {
    if (!supabaseClient || !session) return

    fetchMatrix()

    const channel = supabaseClient
      .channel('minutes-matrix-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'minutes_matrix' }, async (payload) => {
        const id = payload.new?.id || payload.old?.id
        if (!id) return
        const { data } = await supabaseClient
          .from('team_matrix')
          .select('id, pee_count, poop_count')
          .eq('id', id)
        setMatrix((prev) => {
          const next = new Map(prev)
          if (data?.[0]) next.set(...toEntry(data[0]))
          else next.delete(id)
          return next
        })
      })
      .subscribe()

    return () => {
      supabaseClient.removeChannel(channel)
    }
  }, [supabaseClient, session, fetchMatrix])

  // Atomic +1 on the user's own row and activity_log entry (log_minute RPC)
  const log = useCallback(async (timeStr, kind) => {
    const { error: rpcError } = await supabaseClient.rpc('log_minute', { minute_id: timeStr, kind })
    if (rpcError) throw rpcError

    // Optimistic update; realtime replaces it with the exact team total
    const field = `${kind}_count`
    setMatrix((prev) => {
      const next = new Map(prev)
      const current = prev.get(timeStr) || { pee_count: 0, poop_count: 0 }
      next.set(timeStr, { ...current, [field]: current[field] + 1 })
      return next
    })
  }, [supabaseClient])

  const logPee = useCallback((timeStr) => log(timeStr, 'pee'), [log])
  const logPoop = useCallback((timeStr) => log(timeStr, 'poop'), [log])

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
    logPee,
    logPoop,
  }
}
