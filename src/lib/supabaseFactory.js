import { createClient } from '@supabase/supabase-js'

const URL_KEY = 'poo-calendar-supabase-url'
const ANON_KEY = 'poo-calendar-supabase-key'

let defaults = { url: '', key: '' }

/** Loads default DB config from public/appsettings.json (editable after deploy, no rebuild). */
export async function loadAppSettings() {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}appsettings.json`, { cache: 'no-cache' })
    const { Supabase } = await res.json()
    defaults = { url: Supabase?.Url || '', key: Supabase?.AnonKey || '' }
  } catch {
    // No/invalid appsettings → setup screen asks for credentials
  }
}

/**
 * Active DB config: admin override (saved on this device) wins over appsettings.json.
 */
export function getConfig() {
  return {
    url: localStorage.getItem(URL_KEY) || defaults.url,
    key: localStorage.getItem(ANON_KEY) || defaults.key,
    isOverride: !!localStorage.getItem(URL_KEY),
    hasDefault: !!defaults.url,
  }
}

export function saveConfig(url, key) {
  localStorage.setItem(URL_KEY, url)
  localStorage.setItem(ANON_KEY, key)
}

export function resetConfig() {
  localStorage.removeItem(URL_KEY)
  localStorage.removeItem(ANON_KEY)
}

/** Client from the active config, or null if none/invalid (→ setup screen). */
export function createConfiguredClient() {
  const { url, key } = getConfig()
  if (!url || !key) return null
  try {
    return createDynamicClient(url, key)
  } catch {
    return null
  }
}

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
