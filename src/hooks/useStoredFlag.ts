'use client'

import { useSyncExternalStore } from 'react'
import { readStoredFlag, subscribeStoredFlags } from '../utils/storedFlag'

/** A localStorage flag for render output: false during SSR and hydration, the stored value after, live across tabs. */
export const useStoredFlag = (key: string) => useSyncExternalStore(subscribeStoredFlags, () => readStoredFlag(key), () => false)
