'use client'

import { useEffect, useState } from 'react'

/**
 * The current time as a Date, refreshed at the start of every minute while mounted.
 * Only for client-rendered views: the first value is the render-time clock, so SSR output would not match the client.
 */
export function useMinuteClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined
    const tick = () => setNow(new Date())
    // Align to the next minute boundary so a 'HH:mm' label never lags by most of a minute.
    const timeout = setTimeout(() => {
      tick()
      interval = setInterval(tick, 60_000)
    }, 60_000 - (Date.now() % 60_000))
    return () => {
      clearTimeout(timeout)
      clearInterval(interval)
    }
  }, [])
  return now
}
