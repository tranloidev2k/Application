'use client'

import { useEffect, useState } from 'react'

/** False on mount, true once `ms` milliseconds have passed (e.g. to cap how long a loading skeleton waits). */
export function useDelayElapsed(ms: number) {
  const [elapsed, setElapsed] = useState(false)
  useEffect(() => {
    const timer = window.setTimeout(() => setElapsed(true), ms)
    return () => window.clearTimeout(timer)
  }, [ms])
  return elapsed
}
