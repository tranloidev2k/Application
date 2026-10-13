'use client'

import { createContext, FocusEvent, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { fetchApplications, isDemoApplication, normalizeApplication, saveApplications } from '../lib/applications'
import { ensureAnonymousSession } from '../lib/supabase'
import { Application } from '../types'

const STORAGE_KEY = 'trackly-applications-v1'

export type SyncState = 'connecting' | 'connected' | 'offline'
export type ToastTone = 'success' | 'error' | 'info'
export type ToastOptions = { tone?: ToastTone; actionLabel?: string; onAction?: () => void }
export type ToastFn = (message: string, options?: ToastOptions) => void
type ToastState = { id: number; message: string; tone: ToastTone; actionLabel?: string; onAction?: () => void }
export type UpdateApplicationFn = (id: string, updater: (application: Application) => Application) => void

function loadApps(): Application[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved
      ? (JSON.parse(saved) as Application[]).map(normalizeApplication).filter(application => !isDemoApplication(application))
      : []
  } catch { return [] }
}

type AppDataContextValue = {
  applications: Application[]
  /** True once the local cache has been read on the client; before that `applications` is empty, not missing. */
  ready: boolean
  syncState: SyncState
  toast: ToastFn
  updateApplication: UpdateApplicationFn
  createApplication: (application: Application) => void
  replaceApplication: (application: Application) => void
}

const AppDataContext = createContext<AppDataContextValue | null>(null)

export function useAppData() {
  const context = useContext(AppDataContext)
  if (!context) throw new Error('useAppData must be used inside AppProvider')
  return context
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [applications, setApplications] = useState<Application[]>([])
  const [storageReady, setStorageReady] = useState(false)
  const [toastState, setToastState] = useState<ToastState | null>(null)
  const [databaseUserId, setDatabaseUserId] = useState('')
  const [syncState, setSyncState] = useState<SyncState>('connecting')
  const [pendingApplications, setPendingApplications] = useState<Record<string, Application>>({})
  // Mutators read the latest list from this ref, so two updates in one tick and undo closures fired later see current data.
  const applicationsRef = useRef(applications)
  const toastIdRef = useRef(0)

  // Must stay referentially stable: usePersonalTasks' load effect depends on it.
  const toast = useCallback<ToastFn>((message, options = {}) => {
    toastIdRef.current += 1
    setToastState({ id: toastIdRef.current, message, tone: options.tone ?? 'success', actionLabel: options.actionLabel, onAction: options.onAction })
  }, [])
  const dismissToast = useCallback((id: number) => setToastState(current => current?.id === id ? null : current), [])

  useEffect(() => { applicationsRef.current = applications }, [applications])
  useEffect(() => {
    const localApplications = loadApps()
    queueMicrotask(() => {
      setApplications(localApplications)
      setStorageReady(true)
    })
  }, [])
  useEffect(() => {
    if (storageReady) localStorage.setItem(STORAGE_KEY, JSON.stringify(applications))
  }, [applications, storageReady])
  useEffect(() => {
    let active = true

    const connectDatabase = async () => {
      try {
        const session = await ensureAnonymousSession()
        const remoteApplications = await fetchApplications()
        if (!active) return

        setApplications(remoteApplications)
        setDatabaseUserId(session.user.id)
        setSyncState('connected')
      } catch (error) {
        console.error('Supabase connection failed', error)
        if (!active) return
        // No toast: the topbar sync chip shows the offline state.
        setSyncState('offline')
      }
    }

    void connectDatabase()
    return () => { active = false }
  }, [])
  useEffect(() => {
    const pending = Object.values(pendingApplications)
    if (!databaseUserId || !pending.length) return
    const timer = window.setTimeout(() => {
      void saveApplications(pending, databaseUserId).then(() => {
        setPendingApplications(current => {
          const next = { ...current }
          pending.forEach(application => {
            if (next[application.id] === application) delete next[application.id]
          })
          return next
        })
        setSyncState('connected')
      }).catch(error => {
        console.error('Supabase sync failed', error)
        setSyncState('offline')
        toast('Không thể đồng bộ database — đã giữ bản sao trên thiết bị', { tone: 'error' })
      })
    }, 350)
    return () => window.clearTimeout(timer)
  }, [pendingApplications, databaseUserId, toast])

  const updateApplication = useCallback<UpdateApplicationFn>((id, updater) => {
    const existing = applicationsRef.current.find(item => item.id === id)
    if (!existing) return
    const next = updater(existing)
    applicationsRef.current = applicationsRef.current.map(item => item.id === id ? next : item)
    setApplications(items => items.map(item => item.id === id ? next : item))
    setPendingApplications(items => ({ ...items, [next.id]: next }))
  }, [])

  const createApplication = useCallback((application: Application) => {
    applicationsRef.current = [application, ...applicationsRef.current]
    setApplications(items => [application, ...items])
    setPendingApplications(items => ({ ...items, [application.id]: application }))
  }, [])

  const replaceApplication = useCallback((application: Application) => {
    applicationsRef.current = applicationsRef.current.map(item => item.id === application.id ? application : item)
    setApplications(items => items.map(item => item.id === application.id ? application : item))
    setPendingApplications(items => ({ ...items, [application.id]: application }))
  }, [])

  const value = useMemo<AppDataContextValue>(() => ({
    applications, ready: storageReady, syncState, toast, updateApplication, createApplication, replaceApplication,
  }), [applications, storageReady, syncState, toast, updateApplication, createApplication, replaceApplication])

  return <AppDataContext.Provider value={value}>
    {children}
    {toastState && <Toast key={toastState.id} toast={toastState} onDismiss={dismissToast} />}
  </AppDataContext.Provider>
}

const TOAST_ICONS = { success: CheckCircle2, error: AlertCircle, info: Info } as const

/** One toast at a time; a new one replaces it (keyed by id). The timer pauses while the toast is hovered or focused. */
function Toast({ toast, onDismiss }: { toast: ToastState; onDismiss: (id: number) => void }) {
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const paused = hovered || focused
  const remainingRef = useRef(toast.tone === 'error' || toast.actionLabel ? 6000 : 3500)
  const Icon = TOAST_ICONS[toast.tone]
  const { id } = toast

  useEffect(() => {
    if (paused) return
    const startedAt = Date.now()
    const timer = window.setTimeout(() => onDismiss(id), Math.max(0, remainingRef.current))
    return () => {
      window.clearTimeout(timer)
      remainingRef.current -= Date.now() - startedAt
    }
  }, [paused, id, onDismiss])

  const onBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false)
  }

  return <div
    className={`toast ${toast.tone}`}
    role={toast.tone === 'error' ? 'alert' : 'status'}
    aria-live={toast.tone === 'error' ? 'assertive' : 'polite'}
    onMouseEnter={() => setHovered(true)}
    onMouseLeave={() => setHovered(false)}
    onFocus={() => setFocused(true)}
    onBlur={onBlur}
  >
    <Icon size={18} aria-hidden="true" />
    <span className="toast-message">{toast.message}</span>
    {toast.actionLabel && toast.onAction && <button type="button" className="toast-action" onClick={() => { toast.onAction?.(); onDismiss(id) }}>{toast.actionLabel}</button>}
    <button type="button" className="toast-close" onClick={() => onDismiss(id)} aria-label="Đóng thông báo"><X size={16} /></button>
  </div>
}
