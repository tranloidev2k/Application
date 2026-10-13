'use client'

import { useEffect, useState } from 'react'
import { useAppData } from '../context/AppDataContext'

/**
 * Finds a live application for a detail/edit route. While the local cache has not been read yet, or the id is
 * unknown and Supabase is still connecting, it reports `loading` (at most 5s) instead of a false "not found".
 */
export function useApplicationById(id: string) {
  const { applications, ready, syncState } = useAppData()
  const application = applications.find(item => item.id === id && !item.deletedAt)
  const known = applications.some(item => item.id === id)
  const waiting = !application && (!ready || (!known && syncState === 'connecting'))
  const [timedOutId, setTimedOutId] = useState<string | null>(null)
  useEffect(() => {
    if (!waiting) return
    const timer = window.setTimeout(() => setTimedOutId(id), 5000)
    return () => window.clearTimeout(timer)
  }, [waiting, id])
  return { application, loading: waiting && timedOutId !== id }
}
