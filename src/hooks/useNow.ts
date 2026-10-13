'use client'

import { useSyncExternalStore } from 'react'

const TICK_MS = 30_000
let current = 0
let timer: ReturnType<typeof setInterval> | undefined
const listeners = new Set<() => void>()

const tick = () => {
  current = Date.now()
  listeners.forEach(listener => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  if (listeners.size === 1) {
    // The shared clock may be stale after a while without subscribers; React re-reads the snapshot after subscribing.
    current = Date.now()
    timer = setInterval(tick, TICK_MS)
  }
  return () => {
    listeners.delete(listener)
    if (!listeners.size) clearInterval(timer)
  }
}

const getSnapshot = () => current || (current = Date.now())
const getServerSnapshot = () => 0

/** The current time in ms, refreshed every 30s while mounted. 0 during SSR and hydration, so clock-based text never mismatches. */
export const useNow = () => useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
