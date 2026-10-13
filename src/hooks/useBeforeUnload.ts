'use client'

import { useEffect } from 'react'

/**
 * While `active`, asks the browser to confirm a reload, tab close or full-page navigation.
 * Client-side navigation (Next.js links) does not fire beforeunload, so it is not covered.
 */
export function useBeforeUnload(active: boolean) {
  useEffect(() => {
    if (!active) return
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = '' // still required by some browsers to show the prompt
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [active])
}
