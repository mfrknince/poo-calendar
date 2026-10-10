import { createClient } from '@supabase/supabase-js'

/**
 * Creates a Supabase client dynamically with provided credentials.
 * Used when the user inputs their own Supabase URL and key.
 */
export function createDynamicClient(url, anonKey) {
  return createClient(url, anonKey, {
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  })
}

/**
 * Tests the Supabase connection by attempting to read from minutes_matrix.
 */
export async function testConnection(url, anonKey) {
  const client = createDynamicClient(url, anonKey)

  const { data, error } = await client
    .from('minutes_matrix')
    .select('id')
    .limit(1)

  if (error) {
    throw new Error(`Connection failed: ${error.message}`)
  }

  return client
}
