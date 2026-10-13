/** One-way boolean flags kept in localStorage ('1' when set). Every access is guarded: storage can be blocked or full. */
export const CALENDAR_VISITED_FLAG = 'trackly-calendar-visited'
export const ONBOARDING_DISMISSED_FLAG = 'trackly-onboarding-dismissed'

const FLAG_EVENT = 'trackly-flag-change'
// Fallback when storage is unavailable, so a flag set in this page view still reads back as set.
const memory = new Set<string>()

export function readStoredFlag(key: string) {
  if (memory.has(key)) return true
  try { return localStorage.getItem(key) === '1' } catch { return false }
}

export function writeStoredFlag(key: string) {
  memory.add(key)
  try { localStorage.setItem(key, '1') } catch { /* storage unavailable: the in-memory flag still applies */ }
  window.dispatchEvent(new Event(FLAG_EVENT))
}

/** Notifies on flag writes in this tab and on storage changes from other tabs. */
export function subscribeStoredFlags(listener: () => void) {
  window.addEventListener(FLAG_EVENT, listener)
  window.addEventListener('storage', listener)
  return () => {
    window.removeEventListener(FLAG_EVENT, listener)
    window.removeEventListener('storage', listener)
  }
}
