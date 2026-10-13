'use client'

import { useState } from 'react'
import { useBeforeUnload } from './useBeforeUnload'

/**
 * Protects unsaved input. `guard(action)` runs `action` right away when nothing is dirty; otherwise it holds the
 * action until the user confirms (`discard`) or backs out (`keepEditing`). While dirty, reloads and tab closes
 * also ask first (beforeunload). Pass `dirty = false` once the data is saved to drop that listener.
 */
export function useUnsavedChangesGuard(dirty: boolean) {
  const [pending, setPending] = useState<{ run: () => void } | null>(null)
  useBeforeUnload(dirty)
  const guard = (action: () => void) => {
    if (dirty) setPending({ run: action })
    else action()
  }
  const keepEditing = () => setPending(null)
  const discard = () => {
    setPending(null)
    pending?.run()
  }
  return { guard, confirming: pending !== null, keepEditing, discard }
}
