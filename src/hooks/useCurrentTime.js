import { useState, useEffect } from 'react'

/**
 * Returns the current time string in "HH:mm" format, updated every second.
 */
export function useCurrentTime() {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  const timeStr = `${hours}:${minutes}`
  const fullTime = `${hours}:${minutes}:${seconds}`

  return { now, timeStr, fullTime, hours, minutes, seconds }
}
