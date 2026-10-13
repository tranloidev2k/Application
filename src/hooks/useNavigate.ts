'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'

export function useNavigate() {
  const router = useRouter()
  return useCallback((to: string) => {
    router.push(to)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [router])
}
