'use client'

import { useSyncExternalStore } from 'react'
import { todayKey } from '../utils/date'

const subscribeNever = () => () => {}
/** todayKey() for render output: '' during SSR and hydration (the server's time zone may differ), the local date after. */
export const useTodayKey = () => useSyncExternalStore(subscribeNever, todayKey, () => '')
