'use client'

import { createContext, FocusEvent, FormEvent, KeyboardEvent as ReactKeyboardEvent, ReactNode, useCallback, useContext, useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  AlertCircle, ArrowLeft, ArrowRight, BriefcaseBusiness, CalendarDays, Check,
  CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Clock3, ExternalLink,
  FileText, Filter, Info, LayoutDashboard, Link2, ListTodo, Mail, MapPin, Menu,
  NotebookPen, PanelLeftClose, PanelLeftOpen, Pencil, Phone, Plus, Search, Settings, Sparkles, Trash2, UserRound, Video, X,
} from 'lucide-react'
import { fetchApplications, isDemoApplication, normalizeApplication, saveApplications } from './lib/applications'
import { deletePersonalTask, fetchPersonalTasks, savePersonalTask } from './lib/personalTasks'
import { ensureAnonymousSession } from './lib/supabase'
import { Application, Interview, JobTask, Note, PersonalTask, Status, STATUSES, STATUS_META } from './types'

const STORAGE_KEY = 'trackly-applications-v1'
const SIDEBAR_STORAGE_KEY = 'trackly-sidebar-collapsed'
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
const dateFormatter = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
const dateTimeFormatter = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
const pad2 = (value: number) => String(value).padStart(2, '0')
/** Local calendar date as yyyy-MM-dd (never the UTC date). */
const calendarDateKey = (value: Date | string) => {
  const date = typeof value === 'string' ? new Date(value) : value
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}
/** Today's local date as yyyy-MM-dd; use it for date-input max values and future-date checks. */
const todayKey = () => calendarDateKey(new Date())
const subscribeNever = () => () => {}
/** todayKey() for render output: '' during SSR and hydration (the server's time zone may differ), the local date after. */
const useTodayKey = () => useSyncExternalStore(subscribeNever, todayKey, () => '')
const formatDate = (value?: string) => value ? dateFormatter.format(new Date(`${value.length === 10 ? `${value}T00:00:00` : value}`)) : '—'
const formatDateTime = (value?: string) => value ? dateTimeFormatter.format(new Date(value)) : '—'
const toInputDateTime = (value?: string) => value ? new Date(new Date(value).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''

// Relative date helpers. Callers pass `now` explicitly and only call these on the client after `ready`, never during SSR.
// formatDueLabel and formatTimeAgo are exported so they stay available to the dashboard and detail work that consumes them.
const WEEKDAY_SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
const toDate = (value: Date | string) => typeof value === 'string' ? new Date(value) : value
/** Whole local calendar days from `now` to `value` (negative in the past). */
const calendarDayDiff = (value: Date | string, now: Date) => {
  const date = toDate(value)
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((start.getTime() - today.getTime()) / 864e5)
}
/** 'HH:mm' in local time. */
const formatTime = (value: Date | string) => { const date = toDate(value); return `${pad2(date.getHours())}:${pad2(date.getMinutes())}` }
/** 'Hôm nay' | 'Ngày mai' | 'Hôm qua' | 'T5 15/10' (the year is added when it differs from `now`). */
const formatRelativeDay = (value: Date | string, now: Date) => {
  const date = toDate(value)
  const diff = calendarDayDiff(date, now)
  if (diff === 0) return 'Hôm nay'
  if (diff === 1) return 'Ngày mai'
  if (diff === -1) return 'Hôm qua'
  const year = date.getFullYear() === now.getFullYear() ? '' : `/${date.getFullYear()}`
  return `${WEEKDAY_SHORT[date.getDay()]} ${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}${year}`
}
/** 'Quá hạn 2 ngày' | 'Quá hạn từ 09:00' | 'Hôm nay 16:00' | 'Ngày mai 09:00' | 'T5 15/10 · 16:00'. */
export const formatDueLabel = (iso: string, now: Date) => {
  const due = new Date(iso)
  const diff = calendarDayDiff(due, now)
  if (due.getTime() < now.getTime()) return diff < 0 ? `Quá hạn ${-diff} ngày` : `Quá hạn từ ${formatTime(iso)}`
  if (diff === 0 || diff === 1) return `${formatRelativeDay(due, now)} ${formatTime(iso)}`
  return `${formatRelativeDay(due, now)} · ${formatTime(iso)}`
}
/** 'Vừa xong' | '5 phút trước' | '2 giờ trước' | 'Hôm qua 16:00' | 'dd/MM/yyyy HH:mm'. */
export const formatTimeAgo = (iso: string, now: Date) => {
  const date = new Date(iso)
  const minutes = Math.floor((now.getTime() - date.getTime()) / 60000)
  if (minutes < 1) return 'Vừa xong'
  if (minutes < 60) return `${minutes} phút trước`
  const diff = calendarDayDiff(date, now)
  if (diff === 0) return `${Math.floor(minutes / 60)} giờ trước`
  if (diff === -1) return `Hôm qua ${formatTime(iso)}`
  return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()} ${formatTime(iso)}`
}

type Route = { page: 'dashboard' | 'applications' | 'calendar' | 'new' | 'detail' | 'edit' | 'account'; id?: string }
type SyncState = 'connecting' | 'connected' | 'offline'
type ToastTone = 'success' | 'error' | 'info'
type ToastOptions = { tone?: ToastTone; actionLabel?: string; onAction?: () => void }
type ToastFn = (message: string, options?: ToastOptions) => void
type ToastState = { id: number; message: string; tone: ToastTone; actionLabel?: string; onAction?: () => void }
type UpdateApplicationFn = (id: string, updater: (application: Application) => Application) => void

/** Statuses that only make sense once the application has been sent, so they require an applied date. */
const NEEDS_APPLIED_DATE: Status[] = ['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER']

/** The one status-change rule: new status, optional applied date, and an appended (never rewritten) STATUS_CHANGED activity. */
function applyStatusChange(app: Application, status: Status, appliedAt?: string): Application {
  const now = new Date().toISOString()
  return {
    ...app,
    status,
    appliedAt: appliedAt || app.appliedAt,
    updatedAt: now,
    activities: [{ id: uid(), type: 'STATUS_CHANGED', createdAt: now, label: `Chuyển sang ${STATUS_META[status].label}`, detail: `Từ ${STATUS_META[app.status].label}` }, ...app.activities],
  }
}

function routeFromPathname(pathname: string): Route {
  const path = pathname.replace(/\/$/, '') || '/'
  if (path === '/applications/new') return { page: 'new' }
  if (path === '/calendar') return { page: 'calendar' }
  const detail = path.match(/^\/applications\/([^/]+)$/)
  const edit = path.match(/^\/applications\/([^/]+)\/edit$/)
  if (edit) return { page: 'edit', id: edit[1] }
  if (detail) return { page: 'detail', id: detail[1] }
  if (path === '/applications') return { page: 'applications' }
  if (path === '/account') return { page: 'account' }
  return { page: 'dashboard' }
}

function useNavigate() {
  const router = useRouter()
  return useCallback((to: string) => {
    router.push(to)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [router])
}

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

function useAppData() {
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
        setSyncState('offline')
        toast('Chưa kết nối được database — dữ liệu vẫn được lưu trên thiết bị', { tone: 'info' })
      }
    }

    void connectDatabase()
    return () => { active = false }
  }, [toast])
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

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const navigate = useNavigate()
  const route = routeFromPathname(pathname)
  const [mobileNav, setMobileNav] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    const collapsed = localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true'
    queueMicrotask(() => setSidebarCollapsed(collapsed))
  }, [])
  useEffect(() => localStorage.setItem(SIDEBAR_STORAGE_KEY, String(sidebarCollapsed)), [sidebarCollapsed])

  return (
    <div className="app-shell">
      <Sidebar route={route} navigate={navigate} open={mobileNav} close={() => setMobileNav(false)} collapsed={sidebarCollapsed} toggleCollapsed={() => setSidebarCollapsed(value => !value)} />
      <div className={`app-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Topbar onMenu={() => setMobileNav(true)} navigate={navigate} />
        <main>{children}</main>
      </div>
    </div>
  )
}

export function DashboardRoute() {
  const { applications } = useAppData()
  return <Dashboard applications={applications} navigate={useNavigate()} />
}

/** Soft-deletes an application (the caller has already confirmed) and offers an undo that clears deletedAt again. */
function softDeleteApplication(id: string, updateApplication: UpdateApplicationFn, toast: ToastFn) {
  const now = new Date().toISOString()
  updateApplication(id, application => ({ ...application, deletedAt: now, updatedAt: now }))
  toast('Đã xóa đơn ứng tuyển', {
    actionLabel: 'Hoàn tác',
    onAction: () => {
      updateApplication(id, application => ({ ...application, deletedAt: undefined, updatedAt: new Date().toISOString() }))
      toast('Đã khôi phục đơn ứng tuyển')
    },
  })
}

/**
 * The shared status-change flow. requestStatusChange commits at once with an undo toast, or first asks for an
 * applied date when the target status needs one. Undo is a reverse transition appended to the immutable history.
 * Render `statusModal` at page level, never inside a clickable row/card or a <form>.
 */
function useStatusChange(updateApplication: UpdateApplicationFn, toast: ToastFn) {
  const [request, setRequest] = useState<{ application: Application; status: Status } | null>(null)

  const commitStatusChange = useCallback((application: Application, status: Status, appliedAt?: string) => {
    const captured: { previous?: Pick<Application, 'status' | 'appliedAt'> } = {}
    updateApplication(application.id, current => {
      captured.previous = { status: current.status, appliedAt: current.appliedAt }
      return applyStatusChange(current, status, appliedAt)
    })
    const previous = captured.previous
    if (!previous) return
    toast(`Đã chuyển sang ${STATUS_META[status].label}`, {
      actionLabel: 'Hoàn tác',
      onAction: () => {
        updateApplication(application.id, current => ({ ...applyStatusChange(current, previous.status), appliedAt: previous.appliedAt }))
        toast(`Đã hoàn tác, trạng thái trở lại ${STATUS_META[previous.status].label}`)
      },
    })
  }, [updateApplication, toast])

  const requestStatusChange = useCallback((application: Application, status: Status) => {
    if (status === application.status) return
    if (NEEDS_APPLIED_DATE.includes(status) && !application.appliedAt) {
      setRequest({ application, status })
      return
    }
    commitStatusChange(application, status)
  }, [commitStatusChange])

  const statusModal = request ? <StatusModal
    application={request.application}
    initialStatus={request.status}
    onClose={() => setRequest(null)}
    onSave={(status, appliedAt) => {
      setRequest(null)
      commitStatusChange(request.application, status, appliedAt)
    }}
  /> : null

  return { requestStatusChange, commitStatusChange, statusModal }
}

/**
 * Finds a live application for a detail/edit route. While the local cache has not been read yet, or the id is
 * unknown and Supabase is still connecting, it reports `loading` (at most 5s) instead of a false "not found".
 */
function useApplicationById(id: string) {
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

export function ApplicationsRoute() {
  const { applications, updateApplication, toast } = useAppData()
  return <ApplicationsPage applications={applications} navigate={useNavigate()} onDelete={id => softDeleteApplication(id, updateApplication, toast)} />
}

function usePersonalTasks(toast: ToastFn) {
  const [tasks, setTasks] = useState<PersonalTask[]>([])
  const latest = useRef(tasks)
  useEffect(() => { latest.current = tasks }, [tasks])
  useEffect(() => {
    let active = true
    ensureAnonymousSession()
      .then(fetchPersonalTasks)
      .then(remote => { if (active) setTasks(remote) })
      .catch(error => {
        console.error('Loading personal tasks failed', error)
        if (active) toast('Không tải được công việc cá nhân từ database', { tone: 'error' })
      })
    return () => { active = false }
  }, [toast])

  // Shows the change immediately and rolls it back if the database rejects it.
  const change = useCallback(async (next: PersonalTask[], request: () => Promise<void>, success: string) => {
    const previous = latest.current
    setTasks(next)
    try {
      await ensureAnonymousSession()
      await request()
      toast(success)
    } catch (error) {
      console.error('Saving personal task failed', error)
      setTasks(previous)
      toast('Không lưu được công việc vào database', { tone: 'error' })
    }
  }, [toast])

  const save = useCallback((task: PersonalTask, success: string) => {
    const items = latest.current
    const next = items.some(item => item.id === task.id) ? items.map(item => item.id === task.id ? task : item) : [...items, task]
    return change(next, () => savePersonalTask(task), success)
  }, [change])

  const remove = useCallback((id: string) => change(latest.current.filter(item => item.id !== id), () => deletePersonalTask(id), 'Đã xóa công việc'), [change])

  return { tasks, save, remove }
}

export function CalendarRoute() {
  const { applications, updateApplication, toast } = useAppData()
  return <CalendarPage applications={applications} navigate={useNavigate()} updateApplication={updateApplication} toast={toast} />
}

export function NewApplicationRoute() {
  const navigate = useNavigate()
  const { applications, createApplication, toast } = useAppData()
  return <ApplicationForm applications={applications} onCancel={() => navigate('/applications')} onSave={application => {
    createApplication(application)
    toast('Đã tạo đơn ứng tuyển')
    navigate(`/applications/${application.id}`)
  }} />
}

export function EditApplicationRoute({ id }: { id: string }) {
  const navigate = useNavigate()
  const { applications, replaceApplication, toast } = useAppData()
  const { application, loading } = useApplicationById(id)
  if (!application) return loading ? <DetailSkeleton /> : <NotFound navigate={navigate} />
  return <ApplicationForm application={application} applications={applications} onCancel={() => navigate(`/applications/${id}`)} onSave={next => {
    replaceApplication(next)
    toast('Đã lưu thay đổi')
    navigate(`/applications/${next.id}`)
  }} />
}

export function ApplicationDetailRoute({ id }: { id: string }) {
  const navigate = useNavigate()
  const { updateApplication, toast } = useAppData()
  const { application, loading } = useApplicationById(id)
  const { commitStatusChange, statusModal } = useStatusChange(updateApplication, toast)
  // Set on delete so the frame before navigation lands shows the skeleton, not "Không tìm thấy".
  const [leaving, setLeaving] = useState(false)
  if (!application) return loading || leaving ? <DetailSkeleton /> : <NotFound navigate={navigate} />
  return <>
    <ApplicationDetail
      application={application}
      update={updater => updateApplication(id, updater)}
      onChangeStatus={(status, appliedAt) => commitStatusChange(application, status, appliedAt)}
      onDelete={() => {
        setLeaving(true)
        softDeleteApplication(id, updateApplication, toast)
        navigate('/applications')
      }}
      navigate={navigate}
      toast={toast}
    />
    {statusModal}
  </>
}

export function AccountRoute() {
  return <AccountPage syncState={useAppData().syncState} />
}

function Logo() {
  return <div className="logo"><span className="logo-mark"><BriefcaseBusiness size={19} /></span><span>trackly</span></div>
}

function Sidebar({ route, navigate, open, close, collapsed, toggleCollapsed }: { route: Route; navigate: (s: string) => void; open: boolean; close: () => void; collapsed: boolean; toggleCollapsed: () => void }) {
  const items = [
    { label: 'Tổng quan', icon: LayoutDashboard, path: '/', active: route.page === 'dashboard' },
    { label: 'Đơn ứng tuyển', icon: BriefcaseBusiness, path: '/applications', active: ['applications', 'detail', 'edit'].includes(route.page) },
    { label: 'Lịch công việc', icon: CalendarDays, path: '/calendar', active: route.page === 'calendar' },
  ]
  const go = (path: string) => { navigate(path); close() }
  return <>
    {open && <button className="nav-scrim" onClick={close} aria-label="Đóng menu" />}
    <aside className={`sidebar ${open ? 'open' : ''} ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-head">
        <Logo />
        <button
          type="button"
          className="sidebar-collapse-button desktop-only"
          onClick={toggleCollapsed}
          aria-label={collapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên'}
          aria-expanded={!collapsed}
          title={collapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên'}
        >
          {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
        </button>
        <button className="icon-button mobile-only" onClick={close}><X size={20} /></button>
      </div>
      <nav aria-label="Điều hướng chính">
        {items.map(item => <button key={item.path} className={`nav-item ${item.active ? 'active' : ''}`} onClick={() => go(item.path)} title={collapsed ? item.label : undefined}><item.icon size={19} /><span>{item.label}</span></button>)}
      </nav>
      <div className="sidebar-grow" />
      <button className={`nav-item ${route.page === 'account' ? 'active' : ''}`} onClick={() => go('/account')} title={collapsed ? 'Tài khoản' : undefined}><Settings size={19} /><span>Tài khoản</span></button>
    </aside>
  </>
}

function Topbar({ onMenu, navigate }: { onMenu: () => void; navigate: (s: string) => void }) {
  return <header className="topbar">
    <button className="icon-button mobile-only" onClick={onMenu} aria-label="Mở menu"><Menu size={22} /></button>
    <div className="topbar-title" />
    <button className="primary compact" onClick={() => navigate('/applications/new')}><Plus size={18} /> Thêm đơn</button>
  </header>
}

function PageHeader({ title, action }: { title: string; action?: ReactNode }) {
  return <div className="page-header"><div><h1>{title}</h1></div>{action}</div>
}

function Dashboard({ applications, navigate }: { applications: Application[]; navigate: (s: string) => void }) {
  const apps = applications.filter(a => !a.deletedAt)
  const now = new Date()
  const nextWeek = new Date(now.getTime() + 7 * 864e5)
  const interviews = apps.flatMap(a => a.interviews.filter(i => !i.cancelledAt && new Date(i.startsAt) >= now && new Date(i.startsAt) <= nextWeek).map(i => ({ ...i, app: a }))).sort((a, b) => a.startsAt.localeCompare(b.startsAt))
  const tasks = apps.flatMap(a => a.tasks.filter(t => !t.completedAt && t.dueAt && new Date(t.dueAt) <= nextWeek).map(t => ({ ...t, app: a }))).sort((a, b) => (a.dueAt || '').localeCompare(b.dueAt || ''))
  return <div className="page dashboard-page">
    <PageHeader title="Tổng quan" action={<button className="primary" onClick={() => navigate('/applications/new')}><Plus size={18} /> Thêm đơn ứng tuyển</button>} />
    <section className="dashboard-overview" aria-label="Tổng quan ứng tuyển">
      <StatusChart applications={apps} navigate={navigate} />
      <div className="priority-metrics">
        <Metric label="Cần xử lý" value={tasks.length} onClick={() => navigate(`/calendar?view=week&date=${calendarDateKey(now)}`)} />
        <Metric label="Phỏng vấn" value={apps.filter(a => a.status === 'INTERVIEW').length} onClick={() => navigate('/applications?status=INTERVIEW')} />
      </div>
    </section>
    <div className="dashboard-grid">
      <section className="panel schedule-panel">
        <PanelHeader title="Lịch sắp tới" action="Xem tất cả" onAction={() => navigate('/applications?status=INTERVIEW')} />
        {interviews.length ? interviews.map(item => <button key={item.id} className="schedule-item" onClick={() => navigate(`/applications/${item.app.id}`)}>
          <span className="schedule-date"><CalendarDays size={18} /><strong>{formatDate(item.startsAt)}</strong></span>
          <span className="schedule-copy"><strong>{item.title}</strong><small>{item.app.companyName}</small></span>
          <time>{formatTime(item.startsAt)} – {formatTime(item.endsAt)}</time>
          <ChevronRight size={19} />
        </button>) : <EmptyMini icon={<CalendarDays />} text="Chưa có lịch phỏng vấn trong 7 ngày tới." />}
      </section>
      <section className="panel task-panel">
        <PanelHeader title="Việc cần làm" action="Đến danh sách" onAction={() => navigate('/applications')} />
        {tasks.length ? tasks.map(item => {
          const overdue = new Date(item.dueAt!) < now
          return <button key={item.id} className="task-row" onClick={() => navigate(`/applications/${item.app.id}`)}>
            <span className={`task-check ${overdue ? 'overdue' : ''}`} />
            <span><strong>{item.title}</strong><small>{item.app.companyName}</small></span>
            <em className={overdue ? 'danger-text' : ''}>{overdue ? 'Quá hạn' : formatDateTime(item.dueAt)}</em>
          </button>
        }) : <EmptyMini icon={<CheckCircle2 />} text="Tuyệt! Không có việc nào sắp đến hạn." />}
      </section>
    </div>
  </div>
}

type CalendarView = 'month' | 'week'
type CalendarEvent = {
  id: string
  kind: 'task' | 'interview' | 'personal'
  title: string
  startsAt: string
  endsAt?: string
  completedAt?: string
  note?: string
  application?: Application
  task?: JobTask
  personal?: PersonalTask
}

const startOfCalendarWeek = (value: Date) => {
  const date = new Date(value)
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() - date.getDay())
  return date
}
const addCalendarDays = (value: Date, amount: number) => {
  const date = new Date(value)
  date.setDate(date.getDate() + amount)
  return date
}
const calendarStateFromParams = (params: { get: (name: string) => string | null }) => {
  const view: CalendarView = params.get('view') === 'month' ? 'month' : 'week'
  const dateValue = params.get('date')
  const parsedDate = dateValue ? new Date(`${dateValue}T12:00:00`) : new Date()
  const cursor = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate
  return { view, cursor }
}

function CalendarPage({ applications, navigate, updateApplication, toast }: {
  applications: Application[]
  navigate: (path: string) => void
  updateApplication: UpdateApplicationFn
  toast: ToastFn
}) {
  const searchParams = useSearchParams()
  const [cursor, setCursor] = useState(() => calendarStateFromParams(searchParams).cursor)
  const [view, setView] = useState<CalendarView>(() => calendarStateFromParams(searchParams).view)
  const [createDate, setCreateDate] = useState<Date | null>(null)
  const [createEndDate, setCreateEndDate] = useState<Date | null>(null)
  const [draggingEvent, setDraggingEvent] = useState<CalendarEvent | null>(null)
  const [dropTarget, setDropTarget] = useState('')
  const [weekMovePreview, setWeekMovePreview] = useState<{ event: CalendarEvent; start: Date; end: Date } | null>(null)
  const [weekCreatePreview, setWeekCreatePreview] = useState<{ day: Date; start: Date; end: Date } | null>(null)
  const [eventContext, setEventContext] = useState<{ event: CalendarEvent; x: number; y: number } | null>(null)
  const weekColumnsRef = useRef<HTMLDivElement>(null)
  const weekDragRef = useRef<{ event: CalendarEvent; grabOffset: number; originX: number; originY: number; started: boolean } | null>(null)
  const weekCreateRef = useRef<{ day: Date; originMinute: number; originX: number; originY: number; started: boolean } | null>(null)
  const weekPreviewRef = useRef<{ event: CalendarEvent; start: Date; end: Date } | null>(null)
  const weekCreatePreviewRef = useRef<{ day: Date; start: Date; end: Date } | null>(null)
  const didWeekDragRef = useRef(false)
  const didWeekCreateRef = useRef(false)
  const [editingTask, setEditingTask] = useState<PersonalTask | null>(null)
  const [deletingTask, setDeletingTask] = useState<PersonalTask | null>(null)
  const personalTasks = usePersonalTasks(toast)
  const activeApplications = applications.filter(application => !application.deletedAt)
  const currentDayKey = calendarDateKey(new Date())
  const events = useMemo<CalendarEvent[]>(() => [
    ...personalTasks.tasks.map(personal => ({
      id: personal.id,
      kind: 'personal' as const,
      title: personal.title,
      startsAt: personal.startsAt,
      endsAt: personal.endsAt,
      completedAt: personal.completedAt,
      note: personal.note,
      personal,
    })),
    ...activeApplications.flatMap(application => [
    ...application.tasks.filter(task => task.dueAt).map(task => ({
      id: task.id,
      kind: 'task' as const,
      title: task.title,
      startsAt: task.dueAt!,
      endsAt: task.endsAt,
      completedAt: task.completedAt,
      note: task.note,
      application,
      task,
    })),
    ...application.interviews.filter(interview => !interview.cancelledAt).map(interview => ({
      id: interview.id,
      kind: 'interview' as const,
      title: interview.title,
      startsAt: interview.startsAt,
      endsAt: interview.endsAt,
      application,
    })),
  ])].sort((a, b) => a.startsAt.localeCompare(b.startsAt)), [activeApplications, personalTasks.tasks])

  const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
  const gridStart = startOfCalendarWeek(monthStart)
  const monthDays = Array.from({ length: 42 }, (_, index) => addCalendarDays(gridStart, index))
  const weekStart = startOfCalendarWeek(cursor)
  const weekDays = Array.from({ length: 7 }, (_, index) => addCalendarDays(weekStart, index))
  const visibleDays = view === 'month' ? monthDays : weekDays
  const title = view === 'month'
    ? new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' }).format(cursor)
    : `${formatDate(weekDays[0].toISOString())} – ${formatDate(weekDays[6].toISOString())}`
  const setCalendarUrl = (nextView: CalendarView, nextCursor: Date) => {
    const params = new URLSearchParams()
    params.set('view', nextView)
    params.set('date', calendarDateKey(nextCursor))
    window.history.pushState({}, '', `/calendar?${params}`)
    setView(nextView)
    setCursor(nextCursor)
  }
  const move = (direction: number) => {
    const next = new Date(cursor)
    if (view === 'month') next.setMonth(next.getMonth() + direction)
    else next.setDate(next.getDate() + direction * 7)
    setCalendarUrl(view, next)
  }
  const goToday = () => setCalendarUrl(view, new Date())
  const changeView = (nextView: CalendarView) => {
    if (nextView === view) return
    setCalendarUrl(nextView, cursor)
  }

  useEffect(() => {
    const restoreCalendarState = () => {
      const state = calendarStateFromParams(new URLSearchParams(window.location.search))
      setView(state.view)
      setCursor(state.cursor)
    }
    window.addEventListener('popstate', restoreCalendarState)
    return () => window.removeEventListener('popstate', restoreCalendarState)
  }, [])
  useEffect(() => {
    if (!eventContext) return
    const closeOnEscape = (keyboard: KeyboardEvent) => {
      if (keyboard.key === 'Escape') setEventContext(null)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [eventContext])

  const openCreate = useCallback((date = new Date(), endDate?: Date) => {
    const due = new Date(date)
    if (due.getHours() === 0) due.setHours(9)
    setCreateDate(due)
    setCreateEndDate(endDate ?? new Date(due.getTime() + 45 * 60000))
  }, [])
  const toggleTask = (event: CalendarEvent) => {
    if (event.personal) {
      const completedAt = event.personal.completedAt ? undefined : new Date().toISOString()
      void personalTasks.save({ ...event.personal, completedAt, updatedAt: new Date().toISOString() }, completedAt ? 'Đã hoàn thành công việc' : 'Đã mở lại công việc')
      return
    }
    if (!event.task || !event.application) return
    const completedAt = event.task.completedAt ? undefined : new Date().toISOString()
    updateApplication(event.application.id, application => ({
      ...application,
      updatedAt: new Date().toISOString(),
      tasks: application.tasks.map(task => task.id === event.id ? { ...task, completedAt } : task),
    }))
    toast(completedAt ? 'Đã hoàn thành công việc' : 'Đã mở lại công việc')
  }

  const weekStartHour = 7
  const weekEndHour = 22
  const weekHourHeight = 64
  const weekHours = Array.from({ length: weekEndHour - weekStartHour + 1 }, (_, index) => weekStartHour + index)
  const now = new Date()
  const nowInVisibleWeek = calendarDateKey(now) >= calendarDateKey(weekDays[0]) && calendarDateKey(now) <= calendarDateKey(weekDays[6])
  const nowTop = ((now.getHours() + now.getMinutes() / 60) - weekStartHour) * weekHourHeight
  const openWeekSlot = (day: Date, offsetY: number) => {
    const minutes = Math.max(0, Math.min((weekEndHour - weekStartHour) * 60, Math.round(offsetY / weekHourHeight * 4) * 15))
    const due = new Date(day)
    due.setHours(weekStartHour + Math.floor(minutes / 60), minutes % 60, 0, 0)
    openCreate(due)
  }
  const moveCalendarEvent = useCallback((event: CalendarEvent, target: Date) => {
    const originalStart = new Date(event.startsAt)
    const application = event.application
    if (event.personal) {
      const duration = new Date(event.personal.endsAt).getTime() - originalStart.getTime()
      void personalTasks.save({ ...event.personal, startsAt: target.toISOString(), endsAt: new Date(target.getTime() + duration).toISOString(), updatedAt: new Date().toISOString() }, 'Đã chuyển lịch công việc')
    } else if (!application) {
      return
    } else if (event.kind === 'task') {
      const duration = event.endsAt ? new Date(event.endsAt).getTime() - originalStart.getTime() : 45 * 60000
      updateApplication(application.id, application => ({
        ...application,
        updatedAt: new Date().toISOString(),
        tasks: application.tasks.map(task => task.id === event.id ? { ...task, dueAt: target.toISOString(), endsAt: new Date(target.getTime() + duration).toISOString() } : task),
      }))
    } else {
      const duration = event.endsAt ? new Date(event.endsAt).getTime() - originalStart.getTime() : 60 * 60000
      updateApplication(application.id, application => ({
        ...application,
        updatedAt: new Date().toISOString(),
        interviews: application.interviews.map(interview => interview.id === event.id ? {
          ...interview,
          startsAt: target.toISOString(),
          endsAt: new Date(target.getTime() + duration).toISOString(),
        } : interview),
      }))
    }
    setDraggingEvent(null)
    setDropTarget('')
    if (!event.personal) toast(event.kind === 'task' ? 'Đã chuyển lịch công việc' : 'Đã chuyển lịch phỏng vấn')
  }, [personalTasks, toast, updateApplication])
  const moveToMonthDay = (event: CalendarEvent, day: Date) => {
    const source = new Date(event.startsAt)
    const target = new Date(day)
    target.setHours(source.getHours(), source.getMinutes(), 0, 0)
    moveCalendarEvent(event, target)
  }
  const weekDaysRef = useRef(weekDays)
  const moveCalendarEventRef = useRef(moveCalendarEvent)
  const openCreateRef = useRef(openCreate)
  useEffect(() => { weekDaysRef.current = weekDays }, [weekDays])
  useEffect(() => { moveCalendarEventRef.current = moveCalendarEvent }, [moveCalendarEvent])
  useEffect(() => { openCreateRef.current = openCreate }, [openCreate])

  useEffect(() => {
    const clearWeekDrag = () => {
      weekDragRef.current = null
      weekPreviewRef.current = null
      setWeekMovePreview(null)
    }
    const clearWeekCreate = () => {
      weekCreateRef.current = null
      weekCreatePreviewRef.current = null
      setWeekCreatePreview(null)
    }
    const cancelWeekDrag = () => {
      clearWeekDrag()
      clearWeekCreate()
      didWeekDragRef.current = false
      didWeekCreateRef.current = false
    }
    const onPointerMove = (pointer: PointerEvent) => {
      const active = weekDragRef.current
      const createActive = weekCreateRef.current
      const area = weekColumnsRef.current
      if ((!active && !createActive) || !area) return
      if (createActive) {
        const distance = Math.hypot(pointer.clientX - createActive.originX, pointer.clientY - createActive.originY)
        if (!createActive.started && distance <= 4) return
        createActive.started = true
        didWeekCreateRef.current = true
        pointer.preventDefault()
        const columns = Array.from(area.querySelectorAll<HTMLElement>('[data-week-column]'))
        const originColumn = columns.find(column => column.dataset.date === calendarDateKey(createActive.day))
        if (!originColumn) return
        const firstMinute = weekStartHour * 60
        const lastMinute = weekEndHour * 60
        const pointerMinute = firstMinute + (pointer.clientY - originColumn.getBoundingClientRect().top) / weekHourHeight * 60
        const snappedMinute = Math.max(firstMinute, Math.min(lastMinute, Math.round(pointerMinute / 15) * 15))
        const startMinute = Math.min(createActive.originMinute, snappedMinute)
        const endMinute = Math.min(lastMinute, Math.max(createActive.originMinute + 15, snappedMinute))
        const start = new Date(createActive.day)
        const end = new Date(createActive.day)
        start.setHours(0, startMinute, 0, 0)
        end.setHours(0, endMinute, 0, 0)
        const preview = { day: createActive.day, start, end }
        weekCreatePreviewRef.current = preview
        setWeekCreatePreview(preview)
        return
      }
      if (!active) return
      const distance = Math.hypot(pointer.clientX - active.originX, pointer.clientY - active.originY)
      if (!active.started && distance <= 4) return
      active.started = true
      didWeekDragRef.current = true
      pointer.preventDefault()

      const columns = Array.from(area.querySelectorAll<HTMLElement>('[data-week-column]'))
      const index = columns.findIndex(column => {
        const rect = column.getBoundingClientRect()
        return pointer.clientX >= rect.left && pointer.clientX <= rect.right
      })
      if (index < 0) return

      const column = columns[index]
      const columnTop = column.getBoundingClientRect().top
      const durationMinutes = Math.max(15, Math.round(((active.event.endsAt ? new Date(active.event.endsAt).getTime() : new Date(active.event.startsAt).getTime() + 45 * 60000) - new Date(active.event.startsAt).getTime()) / 60000))
      const firstMinute = weekStartHour * 60
      const lastMinute = weekEndHour * 60
      const pointerMinute = firstMinute + (pointer.clientY - columnTop - active.grabOffset) / weekHourHeight * 60
      const snappedMinute = Math.round(pointerMinute / 15) * 15
      const startMinute = Math.max(firstMinute, Math.min(snappedMinute, Math.max(firstMinute, lastMinute - durationMinutes)))
      const start = new Date(weekDaysRef.current[index])
      start.setHours(0, startMinute, 0, 0)
      const preview = { event: active.event, start, end: new Date(start.getTime() + durationMinutes * 60000) }
      weekPreviewRef.current = preview
      setWeekMovePreview(preview)
    }
    const onPointerUp = () => {
      const active = weekDragRef.current
      const preview = weekPreviewRef.current
      const createActive = weekCreateRef.current
      let createPreview = weekCreatePreviewRef.current
      if (createActive?.started && !createPreview) {
        const start = new Date(createActive.day)
        start.setHours(0, createActive.originMinute, 0, 0)
        createPreview = { day: createActive.day, start, end: new Date(start.getTime() + 15 * 60000) }
      }
      if (active?.started && preview) moveCalendarEventRef.current(preview.event, preview.start)
      if (createActive?.started && createPreview) openCreateRef.current(createPreview.start, createPreview.end)
      clearWeekDrag()
      clearWeekCreate()
    }
    const onKeyDown = (keyboard: KeyboardEvent) => {
      if (keyboard.key === 'Escape') cancelWeekDrag()
    }

    window.addEventListener('pointermove', onPointerMove, { passive: false })
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', cancelWeekDrag)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', cancelWeekDrag)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  return <div className="page calendar-page">
    <section className="calendar-shell">
      <div className="calendar-toolbar">
        <div className="calendar-navigation">
          <button className="secondary today-button" onClick={goToday}>Hôm nay</button>
          <button className="icon-button" onClick={() => move(-1)} aria-label="Kỳ trước"><ChevronLeft size={20} /></button>
          <button className="icon-button" onClick={() => move(1)} aria-label="Kỳ sau"><ChevronRight size={20} /></button>
          {view === 'month' && <h2>{title}</h2>}
        </div>
        <div className="calendar-toolbar-actions">
          <div className="calendar-view-switch" aria-label="Kiểu hiển thị">
            <button className={view === 'month' ? 'active' : ''} onClick={() => changeView('month')}>Tháng</button>
            <button className={view === 'week' ? 'active' : ''} onClick={() => changeView('week')}>Tuần</button>
          </div>
          <button className="primary" onClick={() => openCreate()}><Plus size={18} /> Thêm việc</button>
        </div>
      </div>
      {view === 'month' ? <>
        <div className="calendar-weekdays" aria-hidden="true">
          {['CN', 'THỨ 2', 'THỨ 3', 'THỨ 4', 'THỨ 5', 'THỨ 6', 'THỨ 7'].map(day => <span key={day}>{day}</span>)}
        </div>
        <div className="calendar-grid month">
          {visibleDays.map(day => {
          const dayKey = calendarDateKey(day)
          const dayEvents = events.filter(event => calendarDateKey(event.startsAt) === dayKey)
          const outsideMonth = day.getMonth() !== cursor.getMonth()
          return <button key={dayKey} className={`calendar-day ${outsideMonth ? 'outside' : ''} ${dayKey === currentDayKey ? 'today' : ''} ${dropTarget === `month-${dayKey}` ? 'drop-target' : ''}`} onClick={() => openCreate(day)} onDragOver={drag => { if (!draggingEvent) return; drag.preventDefault(); drag.dataTransfer.dropEffect = 'move'; setDropTarget(`month-${dayKey}`) }} onDrop={drop => { drop.preventDefault(); if (draggingEvent) moveToMonthDay(draggingEvent, day) }}>
            <span className="calendar-day-number">{day.getDate()}</span>
            <span className="calendar-day-events">
              {dayEvents.slice(0, 4).map(event => <span
                key={`${event.kind}-${event.id}`}
                className={`calendar-event ${event.kind} ${event.completedAt ? 'completed' : ''} ${draggingEvent?.id === event.id && draggingEvent.kind === event.kind ? 'dragging' : ''}`}
                onClick={click => { click.stopPropagation(); setEventContext({ event, x: click.clientX, y: click.clientY }) }}
                draggable
                onDragStart={drag => { drag.stopPropagation(); drag.dataTransfer.effectAllowed = 'move'; drag.dataTransfer.setData('text/plain', `${event.kind}:${event.id}`); setDraggingEvent(event) }}
                onDragEnd={() => { setDraggingEvent(null); setDropTarget('') }}
              >
                {event.kind !== 'interview' && <span className={`calendar-check ${event.completedAt ? 'checked' : ''}`} onClick={click => { click.stopPropagation(); toggleTask(event) }}>{event.completedAt && <Check size={11} />}</span>}
                <time>{formatTime(event.startsAt)}</time>
                <strong>{event.title}</strong>
              </span>)}
              {dayEvents.length > 4 && <span className="calendar-more">+{dayEvents.length - 4} công việc</span>}
            </span>
          </button>
          })}
        </div>
      </> : <div className="week-calendar">
        <div className="week-header">
          <span className="week-timezone">GMT+7</span>
          {weekDays.map((day, index) => <button key={calendarDateKey(day)} className={calendarDateKey(day) === currentDayKey ? 'today' : ''} onClick={() => openCreate(day)}>
            <small>{['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][index]}</small><strong>{day.getDate()}</strong>
          </button>)}
        </div>
        <div className="week-scroll">
          <div className="week-time-axis">
            {weekHours.map(hour => <span key={hour} style={{ top: (hour - weekStartHour) * weekHourHeight }}>{String(hour).padStart(2, '0')}:00</span>)}
          </div>
          <div ref={weekColumnsRef} className="week-columns" style={{ height: (weekEndHour - weekStartHour) * weekHourHeight }}>
            {weekDays.map(day => {
              const dayKey = calendarDateKey(day)
              const previewOnDay = weekMovePreview && calendarDateKey(weekMovePreview.start) === dayKey ? weekMovePreview : null
              const createPreviewOnDay = weekCreatePreview && calendarDateKey(weekCreatePreview.day) === dayKey ? weekCreatePreview : null
              const dayEvents = events.filter(event => calendarDateKey(event.startsAt) === dayKey && !(weekMovePreview && weekMovePreview.event.id === event.id && weekMovePreview.event.kind === event.kind))
              return <div data-week-column data-date={dayKey} key={dayKey} className={`week-column ${dayKey === currentDayKey ? 'today' : ''} ${previewOnDay || createPreviewOnDay ? 'drop-target' : ''}`} onPointerDown={pointer => {
                if (pointer.target !== pointer.currentTarget || (pointer.pointerType === 'mouse' && pointer.button !== 0)) return
                const firstMinute = weekStartHour * 60
                const lastMinute = weekEndHour * 60
                const offset = pointer.clientY - pointer.currentTarget.getBoundingClientRect().top
                const minute = Math.max(firstMinute, Math.min(lastMinute - 15, Math.round((firstMinute + offset / weekHourHeight * 60) / 15) * 15))
                const start = new Date(day)
                start.setHours(0, minute, 0, 0)
                const preview = { day, start, end: new Date(start.getTime() + 15 * 60000) }
                didWeekDragRef.current = false
                didWeekCreateRef.current = false
                weekCreateRef.current = { day, originMinute: minute, originX: pointer.clientX, originY: pointer.clientY, started: false }
                weekCreatePreviewRef.current = preview
                setWeekCreatePreview(preview)
              }} onClick={click => { if (!didWeekDragRef.current && !didWeekCreateRef.current) openWeekSlot(day, click.clientY - click.currentTarget.getBoundingClientRect().top) }}>
                {weekHours.slice(0, -1).map(hour => <span key={hour} className="week-hour-line" style={{ top: (hour - weekStartHour) * weekHourHeight }} />)}
                {dayEvents.map(event => {
                  const start = new Date(event.startsAt)
                  const end = event.endsAt ? new Date(event.endsAt) : new Date(start.getTime() + 45 * 60000)
                  const top = Math.max(0, ((start.getHours() + start.getMinutes() / 60) - weekStartHour) * weekHourHeight)
                  const height = Math.max(38, Math.min(120, (end.getTime() - start.getTime()) / 3600000 * weekHourHeight))
                  if (start.getHours() < weekStartHour || start.getHours() >= weekEndHour) return null
                  return <button key={`${event.kind}-${event.id}`} className={`week-event ${event.kind} ${event.completedAt ? 'completed' : ''}`} style={{ top, height }} onPointerDown={pointer => { if (pointer.pointerType === 'mouse' && pointer.button !== 0) return; pointer.stopPropagation(); const rect = pointer.currentTarget.getBoundingClientRect(); didWeekDragRef.current = false; weekDragRef.current = { event, grabOffset: pointer.clientY - rect.top, originX: pointer.clientX, originY: pointer.clientY, started: false } }} onClick={click => { click.stopPropagation(); if (!didWeekDragRef.current) setEventContext({ event, x: click.clientX, y: click.clientY }) }}>
                    <strong>{event.title}</strong><time>{formatTime(start)}</time><small>{event.application?.companyName ?? 'Việc cá nhân'}</small>
                  </button>
                })}
                {previewOnDay && (() => {
                  const top = ((previewOnDay.start.getHours() + previewOnDay.start.getMinutes() / 60) - weekStartHour) * weekHourHeight
                  const height = Math.max(38, Math.min(120, (previewOnDay.end.getTime() - previewOnDay.start.getTime()) / 3600000 * weekHourHeight))
                  return <span className={`week-event ${previewOnDay.event.kind} move-preview`} style={{ top, height }}><strong>{previewOnDay.event.title}</strong><time>{formatTime(previewOnDay.start)}</time><small>{previewOnDay.event.application?.companyName ?? 'Việc cá nhân'}</small></span>
                })()}
                {createPreviewOnDay && (() => {
                  const top = ((createPreviewOnDay.start.getHours() + createPreviewOnDay.start.getMinutes() / 60) - weekStartHour) * weekHourHeight
                  const height = Math.max(18, (createPreviewOnDay.end.getTime() - createPreviewOnDay.start.getTime()) / 3600000 * weekHourHeight)
                  return <span className="week-event create-preview" style={{ top, height }}><strong>Công việc mới</strong><time>{formatTime(createPreviewOnDay.start)} – {formatTime(createPreviewOnDay.end)}</time></span>
                })()}
              </div>
            })}
            {nowInVisibleWeek && nowTop >= 0 && nowTop <= (weekEndHour - weekStartHour) * weekHourHeight && <span className="current-time-line" style={{ top: nowTop, left: `calc(${now.getDay() * (100 / 7)}% + 1px)`, width: `${100 / 7}%` }} />}
          </div>
        </div>
      </div>}
    </section>
    {eventContext && <>
      <button className="calendar-context-scrim" aria-label="Đóng thông tin sự kiện" onClick={() => setEventContext(null)} onContextMenu={menu => { menu.preventDefault(); setEventContext(null) }} />
      <div className="calendar-context-menu" role="dialog" aria-label="Chi tiết sự kiện" style={{ left: Math.max(12, Math.min(eventContext.x, window.innerWidth - 348)), top: Math.max(12, Math.min(eventContext.y, window.innerHeight - 390)) }} onContextMenu={menu => menu.preventDefault()}>
        <div className="calendar-context-heading">
          <span className={`calendar-context-icon ${eventContext.event.kind}`}>{eventContext.event.kind === 'interview' ? <Video size={18} /> : <ListTodo size={18} />}</span>
          <div><small>{eventContext.event.kind === 'interview' ? 'PHỎNG VẤN' : eventContext.event.kind === 'personal' ? 'VIỆC CÁ NHÂN' : 'CÔNG VIỆC'}</small><h3>{eventContext.event.title}</h3></div>
          <button className="icon-button" onClick={() => setEventContext(null)} aria-label="Đóng"><X size={18} /></button>
        </div>
        <div className="calendar-context-details">
          <p><Clock3 size={17} /><span><small>Thời gian</small><strong>{formatDateTime(eventContext.event.startsAt)}{eventContext.event.endsAt ? ` – ${formatTime(eventContext.event.endsAt)}` : ''}</strong></span></p>
          {eventContext.event.application && <>
            <p><BriefcaseBusiness size={17} /><span><small>Ứng tuyển</small><strong>{eventContext.event.application.jobTitle}</strong><em>{eventContext.event.application.companyName}</em></span></p>
            <p><Sparkles size={17} /><span><small>Trạng thái</small><StatusBadge status={eventContext.event.application.status} /></span></p>
          </>}
          {eventContext.event.note && <p><NotebookPen size={17} /><span><small>Ghi chú</small><em>{eventContext.event.note}</em></span></p>}
        </div>
        {eventContext.event.personal ? <div className="calendar-context-buttons">
          <button className="secondary" onClick={() => { setEditingTask(eventContext.event.personal!); setEventContext(null) }}><Pencil size={16} /> Sửa</button>
          <button className="secondary danger-hover" onClick={() => { setDeletingTask(eventContext.event.personal!); setEventContext(null) }}><Trash2 size={16} /> Xóa</button>
        </div> : eventContext.event.application && <button className="primary calendar-context-action" onClick={() => { const applicationId = eventContext.event.application!.id; setEventContext(null); navigate(`/applications/${applicationId}`) }}>Mở trang chi tiết <ArrowRight size={17} /></button>}
      </div>
    </>}
    {createDate && <CalendarTaskModal initialDate={createDate} initialEndDate={createEndDate ?? new Date(createDate.getTime() + 45 * 60000)} onClose={() => { setCreateDate(null); setCreateEndDate(null) }} onSave={values => {
      void personalTasks.save({ id: uid(), ...values, updatedAt: new Date().toISOString() }, 'Đã thêm công việc vào lịch')
      setCreateDate(null)
      setCreateEndDate(null)
    }} />}
    {editingTask && <CalendarTaskModal editing={editingTask} initialDate={new Date(editingTask.startsAt)} initialEndDate={new Date(editingTask.endsAt)} onClose={() => setEditingTask(null)} onSave={values => {
      void personalTasks.save({ ...editingTask, ...values, updatedAt: new Date().toISOString() }, 'Đã cập nhật công việc')
      setEditingTask(null)
    }} />}
    {deletingTask && <Modal title="Xóa công việc?" description={`Công việc “${deletingTask.title}” sẽ bị xóa khỏi lịch.`} onClose={() => setDeletingTask(null)} footer={<><button className="secondary" onClick={() => setDeletingTask(null)}>Giữ lại</button><button className="danger-button" onClick={() => { void personalTasks.remove(deletingTask.id); setDeletingTask(null) }}><Trash2 size={17} /> Xóa công việc</button></>}><div className="confirm-warning"><AlertCircle size={22} /><p>Thao tác này không thể hoàn tác.</p></div></Modal>}
  </div>
}

function CalendarTaskModal({ initialDate, initialEndDate, editing, onClose, onSave }: {
  initialDate: Date
  initialEndDate: Date
  editing?: PersonalTask
  onClose: () => void
  onSave: (values: Pick<PersonalTask, 'title' | 'note' | 'startsAt' | 'endsAt'>) => void
}) {
  const [title, setTitle] = useState(editing?.title ?? '')
  const [dueAt, setDueAt] = useState(toInputDateTime(initialDate.toISOString()))
  const [endsAt, setEndsAt] = useState(toInputDateTime(initialEndDate.toISOString()))
  const [note, setNote] = useState(editing?.note ?? '')
  const invalid = !title.trim() || !dueAt || !endsAt || new Date(endsAt) <= new Date(dueAt)
  const dirty = title !== (editing?.title ?? '') || note !== (editing?.note ?? '')
  const submit = () => {
    if (invalid) return
    onSave({ title: title.trim(), note: note.trim() || undefined, startsAt: new Date(dueAt).toISOString(), endsAt: new Date(endsAt).toISOString() })
  }
  return <Modal title={editing ? 'Sửa công việc' : 'Thêm công việc'} onClose={onClose} onSubmit={submit} dirty={dirty} footer={<><button type="button" className="secondary" onClick={onClose}>Hủy</button><button type="submit" className="primary" disabled={invalid}>Lưu công việc</button></>}>
    <div className="form-grid">
      <Field label="Tên công việc" required><input autoFocus value={title} onChange={event => setTitle(event.target.value)} placeholder="Ví dụ: Gửi portfolio cập nhật" /></Field>
      <div className="form-grid two"><Field label="Bắt đầu" required><input type="datetime-local" value={dueAt} onChange={event => setDueAt(event.target.value)} /></Field><Field label="Kết thúc" required error={dueAt && endsAt && new Date(endsAt) <= new Date(dueAt) ? 'Giờ kết thúc phải sau giờ bắt đầu' : undefined}><input type="datetime-local" value={endsAt} onChange={event => setEndsAt(event.target.value)} /></Field></div>
      <Field label="Ghi chú"><textarea rows={3} value={note} onChange={event => setNote(event.target.value)} placeholder="Thông tin cần chuẩn bị..." /></Field>
    </div>
  </Modal>
}

function Metric({ label, value, onClick }: { label: string; value: number; onClick?: () => void }) {
  return <button className="metric-card action-metric" onClick={onClick}><span><small>{label}</small><strong>{value}</strong></span></button>
}

const STATUS_CHART_COLORS: Record<Status, string> = {
  SAVED: 'var(--status-saved-fg)', APPLIED: 'var(--status-applied-fg)', SCREENING: 'var(--status-screening-fg)', INTERVIEW: 'var(--status-interview-fg)', OFFER: 'var(--status-offer-fg)', REJECTED: 'var(--status-rejected-fg)', WITHDRAWN: 'var(--status-withdrawn-fg)',
}

function StatusChart({ applications, navigate }: { applications: Application[]; navigate: (path: string) => void }) {
  const total = applications.length
  const data = STATUSES.map(status => ({ status, count: applications.filter(application => application.status === status).length })).filter(item => item.count > 0)
  let offset = 0
  const segments = data.map(item => {
    const start = offset
    offset += total ? item.count / total * 100 : 0
    return `${STATUS_CHART_COLORS[item.status]} ${start}% ${offset}%`
  })
  const chartBackground = total ? `conic-gradient(${segments.join(', ')})` : 'conic-gradient(var(--line) 0 100%)'
  return <section className="status-chart-card">
    <div className="status-chart-copy"><h2>Tiến độ ứng tuyển</h2></div>
    <div className="status-chart-body">
      <button className="status-donut" style={{ background: chartBackground }} onClick={() => navigate('/applications')} aria-label={`${total} đơn ứng tuyển`}>
        <span><strong>{total}</strong><small>Tổng đơn</small></span>
      </button>
      <div className="status-chart-legend">
        {data.map(item => <button key={item.status} onClick={() => navigate(`/applications?status=${item.status}`)}><i style={{ background: STATUS_CHART_COLORS[item.status] }} /><span>{STATUS_META[item.status].label}</span><strong>{item.count}</strong></button>)}
        {!data.length && <p>Chưa có dữ liệu ứng tuyển.</p>}
      </div>
    </div>
  </section>
}

function PanelHeader({ title, action, onAction }: { title: string; action: string; onAction: () => void }) {
  return <div className="panel-head"><h2>{title}</h2><button className="text-button" onClick={onAction}>{action}<ArrowRight size={16} /></button></div>
}

function EmptyMini({ icon, text }: { icon: ReactNode; text: string }) { return <div className="empty-mini"><span>{icon}</span><p>{text}</p></div> }

function ApplicationsPage({ applications, navigate, onDelete }: { applications: Application[]; navigate: (s: string) => void; onDelete: (id: string) => void }) {
  const params = useSearchParams()
  const [query, setQuery] = useState(params.get('q') || '')
  const [status, setStatus] = useState(params.get('status') || '')
  const [source, setSource] = useState(params.get('source') || '')
  const [sort, setSort] = useState(params.get('sort') || 'updated')
  const [page, setPage] = useState(Number(params.get('page') || 1))
  const [deleteTarget, setDeleteTarget] = useState<Application | null>(null)
  const pageSize = 8
  const sources = [...new Set(applications.map(a => a.source).filter(Boolean))] as string[]

  useEffect(() => {
    const p = new URLSearchParams()
    if (query) p.set('q', query)
    if (status) p.set('status', status)
    if (source) p.set('source', source)
    if (sort !== 'updated') p.set('sort', sort)
    if (page > 1) p.set('page', String(page))
    window.history.replaceState({}, '', `/applications${p.size ? `?${p}` : ''}`)
  }, [query, status, source, sort, page])

  const filtered = useMemo(() => applications.filter(a => !a.deletedAt)
    .filter(a => !query || `${a.companyName} ${a.jobTitle}`.toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi')))
    .filter(a => !status || status.split(',').includes(a.status))
    .filter(a => !source || a.source === source)
    .sort((a, b) => sort === 'company' ? a.companyName.localeCompare(b.companyName) : sort === 'applied' ? (b.appliedAt || '').localeCompare(a.appliedAt || '') : b.updatedAt.localeCompare(a.updatedAt)), [applications, query, status, source, sort])
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize)
  const clear = () => { setQuery(''); setStatus(''); setSource(''); setSort('updated'); setPage(1) }

  return <div className="page applications-page">
    <PageHeader title="Đơn ứng tuyển" action={<button className="primary" onClick={() => navigate('/applications/new')}><Plus size={18} /> Thêm đơn mới</button>} />
    <div className="filter-bar">
      <label className="search-box"><Search size={18} /><input aria-label="Tìm kiếm" placeholder="Tìm công ty hoặc vị trí..." value={query} onChange={e => { setQuery(e.target.value); setPage(1) }} /></label>
      <label className="select-control"><Filter size={17} /><select aria-label="Lọc trạng thái" value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}><option value="">Mọi trạng thái</option>{STATUSES.map(s => <option key={s} value={s}>{STATUS_META[s].label}</option>)}</select><ChevronDown size={15} /></label>
      <label className="select-control"><select aria-label="Lọc nguồn" value={source} onChange={e => { setSource(e.target.value); setPage(1) }}><option value="">Mọi nguồn</option>{sources.map(s => <option key={s}>{s}</option>)}</select><ChevronDown size={15} /></label>
      <label className="select-control"><select aria-label="Sắp xếp" value={sort} onChange={e => setSort(e.target.value)}><option value="updated">Mới cập nhật</option><option value="applied">Ngày ứng tuyển</option><option value="company">Tên công ty</option></select><ChevronDown size={15} /></label>
    </div>
    {(query || status || source || sort !== 'updated') && <div className="active-filter"><span>{filtered.length} kết quả phù hợp</span><button onClick={clear}><X size={14} /> Xóa bộ lọc</button></div>}
    <section className="table-panel">
      {pageItems.length ? <>
        <div className="application-table">
          <div className="table-row table-header"><span>Vị trí</span><span>Công ty</span><span>Trạng thái</span><span>Việc tiếp theo</span><span>Hạn nộp</span><span>Thao tác</span></div>
          {pageItems.map(app => {
            const deadlineDays = app.deadlineAt ? Math.ceil((new Date(`${app.deadlineAt}T23:59:59`).getTime() - new Date().getTime()) / 864e5) : null
            const openTask = app.tasks.find(task => !task.completedAt)
            const nextInterview = app.interviews.filter(interview => !interview.cancelledAt && new Date(interview.startsAt) >= new Date()).sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0]
            return <div className="table-row" role="button" tabIndex={0} key={app.id} onClick={() => navigate(`/applications/${app.id}`)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') navigate(`/applications/${app.id}`) }}>
              <span className="position-cell" data-label="Vị trí"><strong>{app.jobTitle}</strong></span>
              <span className="company-cell" data-label="Công ty"><strong>{app.companyName}</strong></span>
              <span className="status-cell" data-label="Trạng thái"><StatusBadge status={app.status} /></span>
              <span className="next-action-cell" data-label="Việc tiếp theo">{nextInterview ? <><strong><CalendarDays size={14} /> Phỏng vấn</strong><small>{formatDateTime(nextInterview.startsAt)}</small></> : openTask ? <><strong><ListTodo size={14} /> {openTask.title}</strong><small>{openTask.dueAt ? formatDateTime(openTask.dueAt) : 'Chưa có thời hạn'}</small></> : <em>Chưa có việc tiếp theo</em>}</span>
              <span data-label="Hạn nộp" className={`deadline-cell ${deadlineDays !== null && deadlineDays <= 3 ? 'urgent' : ''}`}><strong>{formatDate(app.deadlineAt)}</strong><small>{deadlineDays === null ? 'Không có hạn' : deadlineDays < 0 ? 'Đã quá hạn' : deadlineDays === 0 ? 'Hết hạn hôm nay' : `Còn ${deadlineDays} ngày`}</small></span>
              <span className="row-actions"><button onClick={event => { event.stopPropagation(); navigate(`/applications/${app.id}/edit`) }} aria-label={`Sửa đơn ${app.jobTitle}`} title="Sửa"><Pencil size={15} /></button><button className="delete" onClick={event => { event.stopPropagation(); setDeleteTarget(app) }} aria-label={`Xóa đơn ${app.jobTitle}`} title="Xóa"><Trash2 size={15} /></button></span>
            </div>
          })}
        </div>
        <div className="pagination"><span>Hiển thị {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} trong {filtered.length}</span><div><button disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={17} /></button><span>Trang {page}/{totalPages}</span><button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight size={17} /></button></div></div>
      </> : <div className="empty-state"><span><Search /></span><h2>Không tìm thấy đơn phù hợp</h2><p>Thử thay đổi từ khóa hoặc xóa bớt bộ lọc.</p><button className="secondary" onClick={clear}>Xóa bộ lọc</button></div>}
    </section>
    {deleteTarget && <ConfirmModal title="Xóa đơn ứng tuyển?" description={`Đơn “${deleteTarget.jobTitle}” tại ${deleteTarget.companyName} sẽ không còn xuất hiện trong danh sách và dashboard.`} onClose={() => setDeleteTarget(null)} onConfirm={() => { onDelete(deleteTarget.id); setDeleteTarget(null) }} />}
  </div>
}

function StatusBadge({ status }: { status: Status }) { const meta = STATUS_META[status]; return <span className={`status-badge ${meta.tone}`}>{meta.label}</span> }

function StatusPicker({ value, onChange, autoFocusSelected = false }: { value: Status; onChange: (status: Status) => void; autoFocusSelected?: boolean }) {
  return <div className="status-picker" role="radiogroup" aria-label="Trạng thái đơn ứng tuyển">
    {STATUSES.map(status => {
      const meta = STATUS_META[status]
      const selected = value === status
      return <button type="button" role="radio" aria-checked={selected} key={status} data-autofocus={autoFocusSelected && selected ? '' : undefined} className={`status-choice ${meta.tone} ${selected ? 'selected' : ''}`} onClick={() => onChange(status)}>
        <strong>{meta.label}</strong>
        {selected && <Check size={16} />}
      </button>
    })}
  </div>
}

type ApplicationDraft = Omit<Application, 'id' | 'createdAt' | 'updatedAt' | 'activities' | 'appNotes' | 'interviews' | 'tasks'>

function ApplicationForm({ application, applications, onSave, onCancel }: { application?: Application; applications: Application[]; onSave: (a: Application) => void; onCancel: () => void }) {
  const [draft, setDraft] = useState<ApplicationDraft>({
    companyName: application?.companyName || '', jobTitle: application?.jobTitle || '', status: application?.status || 'SAVED',
    jobUrl: application?.jobUrl || '', location: application?.location || '', source: application?.source || '', salaryText: application?.salaryText || '',
    description: application?.description || '', appliedAt: application?.appliedAt || '', deadlineAt: application?.deadlineAt || '',
    cvContent: application?.cvContent || '', contactName: application?.contactName || '', contactEmail: application?.contactEmail || '', notes: application?.notes || '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const set = (key: keyof ApplicationDraft, value: string) => setDraft(v => ({ ...v, [key]: value || undefined }))
  const duplicate = draft.jobUrl && applications.find(a => a.id !== application?.id && !a.deletedAt && a.jobUrl === draft.jobUrl)
  const needsAppliedDate = NEEDS_APPLIED_DATE.includes(draft.status)
  const today = useTodayKey()

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const next: Record<string, string> = {}
    if (!draft.companyName?.trim()) next.companyName = 'Vui lòng nhập tên công ty'
    if (!draft.jobTitle?.trim()) next.jobTitle = 'Vui lòng nhập vị trí ứng tuyển'
    if (draft.jobUrl && !/^https?:\/\//i.test(draft.jobUrl)) next.jobUrl = 'URL phải bắt đầu bằng http:// hoặc https://'
    if (draft.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.contactEmail)) next.contactEmail = 'Email chưa đúng định dạng'
    if (draft.appliedAt && draft.appliedAt > todayKey()) next.appliedAt = 'Ngày ứng tuyển không thể ở tương lai'
    if (needsAppliedDate && !draft.appliedAt) next.appliedAt = 'Trạng thái này cần ngày ứng tuyển'
    setErrors(next)
    if (Object.keys(next).length) { document.querySelector('.field-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); return }
    const now = new Date().toISOString()
    const edited: Application | undefined = application && { ...application, ...draft, companyName: draft.companyName!.trim(), jobTitle: draft.jobTitle!.trim(), updatedAt: now }
    // A status edit goes through the shared rule, so it appends the same STATUS_CHANGED entry as every other path.
    const base: Application = application && edited ? (application.status !== draft.status ? applyStatusChange({ ...edited, status: application.status }, draft.status) : edited) : {
      ...draft, companyName: draft.companyName!.trim(), jobTitle: draft.jobTitle!.trim(), id: uid(), createdAt: now, updatedAt: now,
      activities: [{ id: uid(), type: 'CREATED', createdAt: now, label: 'Đã tạo đơn ứng tuyển' }], appNotes: [], interviews: [], tasks: [],
    }
    onSave(base)
  }

  return <div className="page form-page">
    <button className="back-button" onClick={onCancel}><ArrowLeft size={17} /> Quay lại</button>
    <PageHeader title={application ? 'Cập nhật đơn ứng tuyển' : 'Thêm đơn ứng tuyển'} />
    <form onSubmit={submit} noValidate>
      <FormSection number="01" title="Thông tin cơ bản">
        <div className="form-grid two">
          <Field label="Tên công ty" required error={errors.companyName}><input autoFocus maxLength={120} value={draft.companyName || ''} onChange={e => set('companyName', e.target.value)} placeholder="Ví dụ: VNG Corporation" /></Field>
          <Field label="Vị trí ứng tuyển" required error={errors.jobTitle}><input maxLength={160} value={draft.jobTitle || ''} onChange={e => set('jobTitle', e.target.value)} placeholder="Ví dụ: Product Designer" /></Field>
          <Field label="URL tin tuyển dụng" error={errors.jobUrl}><div className="input-icon"><Link2 size={17} /><input type="url" value={draft.jobUrl || ''} onChange={e => set('jobUrl', e.target.value)} placeholder="https://..." /></div>{duplicate && <button type="button" className="duplicate-warning" onClick={() => window.location.assign(`/applications/${duplicate.id}`)}><AlertCircle size={15} /> URL này đã có trong đơn “{duplicate.jobTitle}”</button>}</Field>
          <Field label="Địa điểm"><div className="input-icon"><MapPin size={17} /><input maxLength={160} value={draft.location || ''} onChange={e => set('location', e.target.value)} placeholder="TP. Hồ Chí Minh" /></div></Field>
        </div>
      </FormSection>
      <FormSection number="02" title="Quá trình ứng tuyển">
        <div className="form-grid three">
          <Field label="Trạng thái"><select value={draft.status} onChange={event => set('status', event.target.value)}>{STATUSES.map(status => <option key={status} value={status}>{STATUS_META[status].label}</option>)}</select></Field>
          <Field label="Ngày ứng tuyển" required={needsAppliedDate} error={errors.appliedAt}><input type="date" max={today || undefined} value={draft.appliedAt || ''} onChange={e => set('appliedAt', e.target.value)} /></Field>
          <Field label="Hạn nộp hồ sơ"><input type="date" value={draft.deadlineAt || ''} onChange={e => set('deadlineAt', e.target.value)} /></Field>
          <Field label="Nguồn ứng tuyển"><input list="sources" value={draft.source || ''} onChange={e => set('source', e.target.value)} placeholder="LinkedIn, giới thiệu..." /><datalist id="sources"><option value="LinkedIn" /><option value="Website công ty" /><option value="Referral" /><option value="TopCV" /></datalist></Field>
          <Field label="Mức lương"><input maxLength={100} value={draft.salaryText || ''} onChange={e => set('salaryText', e.target.value)} placeholder="Ví dụ: 30–40 triệu" /></Field>
          <Field label="Nội dung CV đã sử dụng" wide><textarea rows={10} maxLength={50000} value={draft.cvContent || ''} onChange={e => set('cvContent', e.target.value)} placeholder="Dán toàn bộ nội dung CV đã gửi cho vị trí này..." /></Field>
        </div>
      </FormSection>
      <FormSection number="03" title="Thông tin thêm">
        <div className="form-grid two">
          <Field label="Người liên hệ"><input maxLength={120} value={draft.contactName || ''} onChange={e => set('contactName', e.target.value)} placeholder="Tên recruiter / hiring manager" /></Field>
          <Field label="Email liên hệ" error={errors.contactEmail}><div className="input-icon"><Mail size={17} /><input type="email" value={draft.contactEmail || ''} onChange={e => set('contactEmail', e.target.value)} placeholder="recruiter@company.com" /></div></Field>
          <Field label="Mô tả công việc" wide><textarea rows={4} maxLength={3000} value={draft.description || ''} onChange={e => set('description', e.target.value)} placeholder="Yêu cầu chính, trách nhiệm, điều bạn quan tâm..." /></Field>
          <Field label="Ghi chú nhanh" wide><textarea rows={3} maxLength={2000} value={draft.notes || ''} onChange={e => set('notes', e.target.value)} placeholder="Bất kỳ điều gì bạn muốn ghi nhớ..." /></Field>
        </div>
      </FormSection>
      <div className="form-actions"><button type="button" className="secondary" onClick={onCancel}>Hủy</button><button className="primary" type="submit"><Check size={18} />{application ? 'Lưu thay đổi' : 'Tạo đơn ứng tuyển'}</button></div>
    </form>
  </div>
}

function FormSection({ number, title, children }: { number: string; title: string; children: ReactNode }) {
  return <section className="form-section"><div className="section-title"><span>{number}</span><h2>{title}</h2></div><div className="section-fields">{children}</div></section>
}

function Field({ label, required, error, wide, children }: { label: string; required?: boolean; error?: string; wide?: boolean; children: ReactNode }) {
  return <label className={`field ${wide ? 'wide' : ''} ${error ? 'field-error' : ''}`}><span>{label}{required && <b> *</b>}</span>{children}{error && <em><AlertCircle size={14} />{error}</em>}</label>
}

function ApplicationDetail({ application, update, onChangeStatus, onDelete, navigate, toast }: { application: Application; update: (fn: (a: Application) => Application) => void; onChangeStatus: (status: Status, appliedAt?: string) => void; onDelete: () => void; navigate: (s: string) => void; toast: ToastFn }) {
  const [tab, setTab] = useState<'timeline' | 'interviews' | 'tasks'>('timeline')
  const [modal, setModal] = useState<'status' | 'note' | 'interview' | 'task' | 'delete' | null>(null)
  const info = [
    { icon: MapPin, label: 'Địa điểm', value: application.location || 'Chưa cập nhật' },
    { icon: CalendarDays, label: 'Ngày ứng tuyển', value: formatDate(application.appliedAt) },
    { icon: Clock3, label: 'Hạn nộp', value: formatDate(application.deadlineAt) },
    { icon: Link2, label: 'Nguồn', value: application.source || 'Chưa cập nhật' },
  ]

  // applyStatusChange via useStatusChange: appends STATUS_CHANGED and shows the 'Hoàn tác' toast.
  const changeStatus = (status: Status, appliedAt?: string) => { setModal(null); onChangeStatus(status, appliedAt) }
  const addNote = (content: string) => {
    const now = new Date().toISOString(); const note: Note = { id: uid(), content, createdAt: now, updatedAt: now }
    update(a => ({ ...a, updatedAt: now, appNotes: [note, ...a.appNotes], activities: [{ id: uid(), type: 'NOTE_ADDED', createdAt: now, label: 'Đã thêm ghi chú', detail: content }, ...a.activities] }))
    setModal(null); toast('Đã thêm ghi chú')
  }
  const addInterview = (interview: Interview) => {
    const now = new Date().toISOString()
    update(a => ({ ...a, updatedAt: now, interviews: [interview, ...a.interviews], activities: [{ id: uid(), type: 'INTERVIEW_CREATED', createdAt: now, label: 'Đã lên lịch phỏng vấn', detail: interview.title }, ...a.activities] }))
    setModal(null); setTab('interviews'); toast('Đã tạo lịch phỏng vấn')
  }
  const addTask = (task: JobTask) => { update(a => ({ ...a, updatedAt: new Date().toISOString(), tasks: [task, ...a.tasks] })); setModal(null); setTab('tasks'); toast('Đã thêm việc cần làm') }

  return <div className="page detail-page">
    <button className="back-button" onClick={() => navigate('/applications')}><ArrowLeft size={17} /> Tất cả đơn ứng tuyển</button>
    <div className="detail-hero">
      <div><div className="eyebrow">{application.companyName}</div><h1>{application.jobTitle}</h1><div className="hero-meta"><StatusBadge status={application.status} /></div></div>
      <div className="detail-actions"><button className="secondary" onClick={() => navigate(`/applications/${application.id}/edit`)}><Pencil size={17} /> Chỉnh sửa</button><button className="primary" onClick={() => setModal('status')}>Đổi trạng thái <ChevronDown size={16} /></button><button className="icon-button danger-hover" onClick={() => setModal('delete')} aria-label="Xóa đơn"><Trash2 size={18} /></button></div>
    </div>
    <div className="detail-layout">
      <div className="detail-main">
        <section className="panel info-panel">
          <div className="info-grid">{info.map(item => <div className="info-item" key={item.label}><span><item.icon size={17} /></span><div><small>{item.label}</small><strong>{item.value}</strong></div></div>)}</div>
          {application.jobUrl && <a className="job-link" href={application.jobUrl} target="_blank" rel="noreferrer"><ExternalLink size={16} /> Mở tin tuyển dụng gốc</a>}
          {application.description && <div className="description"><h3>Mô tả công việc</h3><p>{application.description}</p></div>}
          {application.cvContent && <div className="description cv-content"><h3><FileText size={17} /> Nội dung CV đã sử dụng</h3><p>{application.cvContent}</p></div>}
        </section>
        <section className="panel activity-panel">
          <div className="tabs" role="tablist">
            <button className={tab === 'timeline' ? 'active' : ''} onClick={() => setTab('timeline')}>Dòng thời gian <span>{application.activities.length}</span></button>
            <button className={tab === 'interviews' ? 'active' : ''} onClick={() => setTab('interviews')}>Phỏng vấn <span>{application.interviews.length}</span></button>
            <button className={tab === 'tasks' ? 'active' : ''} onClick={() => setTab('tasks')}>Việc cần làm <span>{application.tasks.filter(t => !t.completedAt).length}</span></button>
          </div>
          {tab === 'timeline' && <Timeline application={application} addNote={() => setModal('note')} update={update} />}
          {tab === 'interviews' && <Interviews application={application} onAdd={() => setModal('interview')} update={update} toast={toast} />}
          {tab === 'tasks' && <Tasks application={application} onAdd={() => setModal('task')} update={update} toast={toast} />}
        </section>
      </div>
      <aside className="detail-aside">
        <section className="panel next-step">
          <span className="aside-icon"><Sparkles size={20} /></span><h3>Bước tiếp theo</h3>
          <button className="secondary full" onClick={() => setModal('task')}><Plus size={16} />{application.status === 'INTERVIEW' ? 'Thêm việc chuẩn bị' : 'Thêm việc cần làm'}</button>
        </section>
        <section className="panel contact-card"><h3>Liên hệ</h3>{application.contactName || application.contactEmail ? <><div className="contact-person"><span><UserRound size={19} /></span><div><strong>{application.contactName || 'Nhà tuyển dụng'}</strong></div></div>{application.contactEmail && <a href={`mailto:${application.contactEmail}`}><Mail size={15} />{application.contactEmail}</a>}</> : <p>Chưa có thông tin người liên hệ.</p>}</section>
        {application.notes && <section className="panel quick-note"><h3>Ghi chú nhanh</h3><p>{application.notes}</p></section>}
      </aside>
    </div>
    {modal === 'status' && <StatusModal application={application} onClose={() => setModal(null)} onSave={changeStatus} />}
    {modal === 'note' && <NoteModal onClose={() => setModal(null)} onSave={addNote} />}
    {modal === 'interview' && <InterviewModal onClose={() => setModal(null)} onSave={addInterview} />}
    {modal === 'task' && <TaskModal onClose={() => setModal(null)} onSave={addTask} />}
    {modal === 'delete' && <ConfirmModal title="Xóa đơn ứng tuyển?" description={`Đơn “${application.jobTitle}” tại ${application.companyName} sẽ không còn xuất hiện trong danh sách và dashboard.`} onClose={() => setModal(null)} onConfirm={onDelete} />}
  </div>
}

function Timeline({ application, addNote, update }: { application: Application; addNote: () => void; update: (fn: (a: Application) => Application) => void }) {
  const entries: Array<{ id: string; type: string; createdAt: string; label: string; detail?: string; note?: Note }> = [...application.activities, ...application.appNotes.map(n => ({ id: n.id, type: 'NOTE_ADDED', createdAt: n.createdAt, label: 'Ghi chú', detail: n.content, note: n }))].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const deleteNote = (id: string) => update(a => ({ ...a, appNotes: a.appNotes.filter(n => n.id !== id), activities: a.activities.filter(x => !(x.type === 'NOTE_ADDED' && x.detail === a.appNotes.find(n => n.id === id)?.content)), updatedAt: new Date().toISOString() }))
  return <div className="tab-content"><div className="tab-toolbar"><h3>Hoạt động gần đây</h3><button className="secondary compact" onClick={addNote}><NotebookPen size={17} /> Thêm ghi chú</button></div>
    <div className="timeline">{entries.map((entry, index) => <div className="timeline-item" key={`${entry.id}-${index}`}>
      <span className={`timeline-icon ${entry.type === 'STATUS_CHANGED' ? 'status' : entry.type === 'NOTE_ADDED' ? 'note' : entry.type.includes('INTERVIEW') ? 'interview' : ''}`}>{entry.type === 'NOTE_ADDED' ? <NotebookPen size={16} /> : entry.type.includes('INTERVIEW') ? <CalendarDays size={16} /> : entry.type === 'CREATED' ? <Plus size={16} /> : <ArrowRight size={16} />}</span>
      <div className="timeline-copy"><div><strong>{entry.label}</strong><time>{formatDateTime(entry.createdAt)}</time></div>{entry.detail && <p>{entry.detail}</p>}{entry.note && <button className="note-delete" onClick={() => deleteNote(entry.note!.id)} aria-label="Xóa ghi chú"><Trash2 size={14} /></button>}</div>
    </div>)}</div>
  </div>
}

function Interviews({ application, onAdd, update, toast }: { application: Application; onAdd: () => void; update: (fn: (a: Application) => Application) => void; toast: ToastFn }) {
  const cancel = (item: Interview) => {
    const now = new Date().toISOString()
    update(a => ({ ...a, interviews: a.interviews.map(i => i.id === item.id ? { ...i, cancelledAt: now } : i), activities: [{ id: uid(), type: 'INTERVIEW_CANCELLED', createdAt: now, label: 'Đã hủy lịch phỏng vấn', detail: item.title }, ...a.activities] })); toast('Đã hủy lịch phỏng vấn')
  }
  return <div className="tab-content"><div className="tab-toolbar"><h3>Các buổi phỏng vấn</h3><button className="secondary compact" onClick={onAdd}><Plus size={17} /> Tạo lịch</button></div>
    {application.interviews.length ? <div className="interview-list">{application.interviews.map(i => <div className={`interview-card ${i.cancelledAt ? 'cancelled' : ''}`} key={i.id}><span className="interview-format">{i.format === 'online' ? <Video /> : i.format === 'phone' ? <Phone /> : <MapPin />}</span><div><div><strong>{i.title}</strong>{i.cancelledAt && <span className="cancelled-label">Đã hủy</span>}</div><p><CalendarDays size={15} />{formatDateTime(i.startsAt)} – {formatTime(i.endsAt)}</p>{i.interviewer && <small>Với {i.interviewer}</small>}</div>{!i.cancelledAt && <button className="icon-button danger-hover" onClick={() => cancel(i)} aria-label="Hủy lịch"><X size={17} /></button>}</div>)}</div> : <EmptyTab icon={<CalendarDays />} title="Chưa có lịch phỏng vấn" text="Tạo lịch để luôn chủ động cho vòng tiếp theo." action="Tạo lịch phỏng vấn" onAction={onAdd} />}
  </div>
}

function Tasks({ application, onAdd, update, toast }: { application: Application; onAdd: () => void; update: (fn: (a: Application) => Application) => void; toast: ToastFn }) {
  const toggle = (task: JobTask) => { update(a => ({ ...a, tasks: a.tasks.map(t => t.id === task.id ? { ...t, completedAt: t.completedAt ? undefined : new Date().toISOString() } : t), activities: task.completedAt ? a.activities : [{ id: uid(), type: 'TASK_COMPLETED', createdAt: new Date().toISOString(), label: 'Đã hoàn thành công việc', detail: task.title }, ...a.activities] })); toast(task.completedAt ? 'Đã mở lại công việc' : 'Đã hoàn thành công việc') }
  const remove = (id: string) => update(a => ({ ...a, tasks: a.tasks.filter(t => t.id !== id) }))
  return <div className="tab-content"><div className="tab-toolbar"><h3>Việc cần làm</h3><button className="secondary compact" onClick={onAdd}><Plus size={17} /> Thêm việc</button></div>
    {application.tasks.length ? <div className="detail-task-list">{application.tasks.map(t => <div className={`detail-task ${t.completedAt ? 'done' : ''}`} key={t.id}><button className="round-check" onClick={() => toggle(t)} aria-label={t.completedAt ? 'Mở lại' : 'Hoàn thành'}>{t.completedAt && <Check size={15} />}</button><div><strong>{t.title}</strong>{t.note && <p>{t.note}</p>}<small className={t.dueAt && !t.completedAt && new Date(t.dueAt) < new Date() ? 'danger-text' : ''}>{t.dueAt ? `${new Date(t.dueAt) < new Date() && !t.completedAt ? 'Quá hạn · ' : ''}${formatDateTime(t.dueAt)}` : 'Không có hạn'}</small></div><button className="icon-button danger-hover" onClick={() => remove(t.id)}><Trash2 size={16} /></button></div>)}</div> : <EmptyTab icon={<ListTodo />} title="Chưa có việc cần làm" text="Thêm một hành động nhỏ để giữ đà tiến lên." action="Thêm việc đầu tiên" onAction={onAdd} />}
  </div>
}

function EmptyTab({ icon, title, text, action, onAction }: { icon: ReactNode; title: string; text: string; action: string; onAction: () => void }) { return <div className="empty-tab"><span>{icon}</span><h3>{title}</h3><p>{text}</p><button className="secondary" onClick={onAction}><Plus size={16} />{action}</button></div> }

const MODAL_FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Accessible dialog. With `onSubmit`, body and footer are wrapped in a <form>: the footer's primary button must be
 * type="submit" and every other footer button type="button". Never render a Modal with onSubmit inside another <form>.
 * `dirty` ignores backdrop clicks so typed input is not lost; Escape still closes.
 */
function Modal({ title, description, onClose, onSubmit, dirty = false, children, footer }: {
  title: string
  description?: string
  onClose: () => void
  onSubmit?: () => void
  dirty?: boolean
  children: ReactNode
  footer: ReactNode
}) {
  const titleId = useId()
  const descriptionId = useId()
  const modalRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const onCloseRef = useRef(onClose)
  // Read during the first render, before React applies autoFocus inside the dialog, so focus can return to the opener.
  const [opener] = useState(() => typeof document === 'undefined' ? null : document.activeElement)
  useEffect(() => { onCloseRef.current = onClose }, [onClose])

  // Mount-only: a parent re-render with a fresh onClose never re-runs this, so focus never jumps.
  useEffect(() => {
    const modal = modalRef.current
    if (!modal) return
    const body = document.body
    const previousOverflow = body.style.overflow
    const previousPaddingRight = body.style.paddingRight
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    body.style.overflow = 'hidden'
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`

    if (!modal.contains(document.activeElement)) {
      const initial = modal.querySelector<HTMLElement>('[autofocus], [data-autofocus]')
        ?? modal.querySelector<HTMLElement>('.modal-body :is(input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]))')
        ?? closeRef.current
      initial?.focus()
    }

    const onKeyDown = (event: KeyboardEvent) => {
      const modals = document.querySelectorAll('.modal')
      if (modals[modals.length - 1] !== modal) return
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
        return
      }
      if (event.key !== 'Tab') return
      const focusable = Array.from(modal.querySelectorAll<HTMLElement>(MODAL_FOCUSABLE)).filter(element => element.getClientRects().length > 0)
      if (!focusable.length) { event.preventDefault(); return }
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement
      if (event.shiftKey ? active === first || !modal.contains(active) : active === last || !modal.contains(active)) {
        event.preventDefault()
        ;(event.shiftKey ? last : first).focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      body.style.overflow = previousOverflow
      body.style.paddingRight = previousPaddingRight
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus({ preventScroll: true })
    }
  }, [opener])

  // Ctrl/Cmd+Enter in a textarea submits, unless the submit button is disabled.
  const submitFromTextarea = (event: ReactKeyboardEvent<HTMLFormElement>) => {
    if (event.key !== 'Enter' || !(event.ctrlKey || event.metaKey) || event.nativeEvent.isComposing || !(event.target instanceof HTMLTextAreaElement)) return
    event.preventDefault()
    const submitter = event.currentTarget.querySelector<HTMLButtonElement>('button[type="submit"]')
    if (submitter?.disabled) return
    event.currentTarget.requestSubmit(submitter ?? undefined)
  }

  const content = <>
    <div className="modal-body">{children}</div>
    <div className="modal-footer">{footer}</div>
  </>
  return <div className="modal-backdrop" role="presentation" onMouseDown={event => {
    if (event.target !== event.currentTarget) return
    event.preventDefault() // keep focus inside the dialog when the click is ignored
    if (!dirty) onClose()
  }}>
    <div ref={modalRef} className="modal" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined}>
      <div className="modal-head">
        <div><h2 id={titleId}>{title}</h2>{description && <p id={descriptionId}>{description}</p>}</div>
        <button ref={closeRef} type="button" className="icon-button" onClick={onClose} aria-label="Đóng"><X size={20} /></button>
      </div>
      {onSubmit ? <form noValidate onSubmit={event => { event.preventDefault(); onSubmit() }} onKeyDown={submitFromTextarea}>{content}</form> : content}
    </div>
  </div>
}

function StatusModal({ application, initialStatus, onClose, onSave }: { application: Application; initialStatus?: Status; onClose: () => void; onSave: (status: Status, appliedAt?: string) => void }) {
  const [status, setStatus] = useState<Status>(initialStatus ?? application.status)
  const [date, setDate] = useState(() => application.appliedAt || todayKey())
  const hintId = useId()
  const today = todayKey()
  const needsDate = NEEDS_APPLIED_DATE.includes(status)
  const unchanged = status === application.status
  const futureDate = needsDate && date > today
  const invalid = unchanged || (needsDate && (!date || futureDate))
  const submit = () => { if (!invalid) onSave(status, needsDate ? date : undefined) }
  return <Modal title="Cập nhật trạng thái" description="Chọn giai đoạn hiện tại của đơn ứng tuyển." onClose={onClose} onSubmit={submit} dirty={status !== (initialStatus ?? application.status)} footer={<><button type="button" className="secondary" onClick={onClose}>Hủy</button><button type="submit" className="primary" disabled={invalid} aria-describedby={unchanged ? hintId : undefined}>Lưu trạng thái</button></>}>
    <StatusPicker value={status} onChange={setStatus} autoFocusSelected={!initialStatus} />
    {needsDate && <Field label="Ngày ứng tuyển" required error={futureDate ? 'Ngày ứng tuyển không thể ở tương lai' : undefined}><input type="date" autoFocus={Boolean(initialStatus)} max={today} value={date} onChange={e => setDate(e.target.value)} /></Field>}
    {unchanged && <p className="modal-hint" id={hintId}>Chọn trạng thái khác với hiện tại</p>}
  </Modal>
}

function NoteModal({ onClose, onSave }: { onClose: () => void; onSave: (s: string) => void }) {
  const [text, setText] = useState('')
  const submit = () => { if (text.trim()) onSave(text.trim()) }
  return <Modal title="Thêm ghi chú" onClose={onClose} onSubmit={submit} dirty={Boolean(text.trim())} footer={<><button type="button" className="secondary" onClick={onClose}>Hủy</button><button type="submit" className="primary" disabled={!text.trim()}>Thêm ghi chú</button></>}>
    <Field label="Nội dung" required><textarea autoFocus rows={5} maxLength={2000} value={text} onChange={e => setText(e.target.value)} placeholder="Ghi lại nội dung trao đổi, điều cần nhớ..." /></Field>
  </Modal>
}

function InterviewModal({ onClose, onSave }: { onClose: () => void; onSave: (i: Interview) => void }) {
  const [defaults] = useState(() => ({ start: toInputDateTime(new Date(Date.now() + 864e5).toISOString()), end: toInputDateTime(new Date(Date.now() + 90000000).toISOString()) }))
  const [title, setTitle] = useState('Phỏng vấn vòng chuyên môn')
  const [start, setStart] = useState(defaults.start)
  const [end, setEnd] = useState(defaults.end)
  const [format, setFormat] = useState<Interview['format']>('online')
  const [place, setPlace] = useState('')
  const [interviewer, setInterviewer] = useState('')
  const invalid = !title.trim() || !start || !end || new Date(end) <= new Date(start)
  const dirty = title !== 'Phỏng vấn vòng chuyên môn' || start !== defaults.start || end !== defaults.end || format !== 'online' || Boolean(place || interviewer)
  const submit = () => {
    if (invalid) return
    onSave({ id: uid(), title: title.trim(), startsAt: new Date(start).toISOString(), endsAt: new Date(end).toISOString(), timeZone: 'Asia/Ho_Chi_Minh', format, locationOrMeetingUrl: place, interviewer })
  }
  return <Modal title="Tạo lịch phỏng vấn" onClose={onClose} onSubmit={submit} dirty={dirty} footer={<><button type="button" className="secondary" onClick={onClose}>Hủy</button><button type="submit" className="primary" disabled={invalid}>Tạo lịch</button></>}>
    <div className="form-grid two"><Field label="Tên buổi phỏng vấn" required wide><input value={title} onChange={e => setTitle(e.target.value)} /></Field><Field label="Bắt đầu" required><input type="datetime-local" value={start} onChange={e => setStart(e.target.value)} /></Field><Field label="Kết thúc" required error={start && end && new Date(end) <= new Date(start) ? 'Giờ kết thúc phải sau giờ bắt đầu' : undefined}><input type="datetime-local" value={end} onChange={e => setEnd(e.target.value)} /></Field><Field label="Hình thức"><select value={format} onChange={e => setFormat(e.target.value as Interview['format'])}><option value="online">Trực tuyến</option><option value="onsite">Tại văn phòng</option><option value="phone">Điện thoại</option></select></Field><Field label="Địa điểm / Link họp"><input value={place} onChange={e => setPlace(e.target.value)} placeholder="Link Meet hoặc địa chỉ" /></Field><Field label="Người phỏng vấn" wide><input value={interviewer} onChange={e => setInterviewer(e.target.value)} placeholder="Tên và chức danh (nếu có)" /></Field></div>
  </Modal>
}

function TaskModal({ onClose, onSave }: { onClose: () => void; onSave: (t: JobTask) => void }) {
  const [title, setTitle] = useState('')
  const [due, setDue] = useState('')
  const [note, setNote] = useState('')
  const submit = () => {
    if (!title.trim()) return
    onSave({ id: uid(), title: title.trim(), dueAt: due ? new Date(due).toISOString() : undefined, note })
  }
  return <Modal title="Thêm việc cần làm" onClose={onClose} onSubmit={submit} dirty={Boolean(title.trim() || due || note.trim())} footer={<><button type="button" className="secondary" onClick={onClose}>Hủy</button><button type="submit" className="primary" disabled={!title.trim()}>Thêm việc</button></>}>
    <div className="form-grid"><Field label="Tên công việc" required><input autoFocus value={title} onChange={e => setTitle(e.target.value)} placeholder="Ví dụ: Chuẩn bị portfolio" /></Field><Field label="Thời hạn"><input type="datetime-local" value={due} onChange={e => setDue(e.target.value)} /></Field><Field label="Ghi chú"><textarea rows={3} value={note} onChange={e => setNote(e.target.value)} /></Field></div>
  </Modal>
}

/** Confirmation dialog; defaults to the application soft-delete ('Xóa đơn', danger). */
function ConfirmModal({ title, description, confirmLabel = 'Xóa đơn', tone = 'danger', body, onClose, onConfirm }: {
  title: string
  description: string
  confirmLabel?: string
  tone?: 'danger' | 'neutral'
  body?: ReactNode
  onClose: () => void
  onConfirm: () => void
}) {
  return <Modal title={title} description={description} onClose={onClose} footer={<><button type="button" className="secondary" onClick={onClose}>Giữ lại</button><button type="button" className={tone === 'danger' ? 'danger-button' : 'primary'} onClick={onConfirm}>{tone === 'danger' && <Trash2 size={17} />}{confirmLabel}</button></>}>
    {body ?? <div className="confirm-warning"><Info size={22} /><p>Bạn có thể hoàn tác ngay sau khi xóa.</p></div>}
  </Modal>
}

function AccountPage({ syncState }: { syncState: SyncState }) {
  const storage = syncState === 'connected' ? 'Supabase + thiết bị này' : syncState === 'connecting' ? 'Đang kết nối Supabase' : 'Thiết bị này (chưa đồng bộ)'
  return <div className="page account-page"><PageHeader title="Không gian cá nhân" /><section className="panel account-card"><div className="profile-head"><span className="big-avatar">CN</span><h2>Chế độ cá nhân</h2><span className={`demo-chip ${syncState === 'connected' ? 'connected' : ''}`}>{syncState === 'connected' ? 'Đã kết nối' : 'Cục bộ'}</span></div><div className="account-row"><strong>Nơi lưu dữ liệu</strong><span>{storage}</span></div><div className="account-row"><strong>Múi giờ</strong><span>Asia/Ho_Chi_Minh (GMT+7)</span></div></section></div>
}

/** Placeholder for the detail/edit routes while data loads: hero line, 4 info blocks and the tab bar. */
function DetailSkeleton() {
  return <div className="page detail-page detail-skeleton" aria-busy="true">
    <p className="sr-only" role="status">Đang tải đơn ứng tuyển…</p>
    <span className="skeleton sk-back" />
    <div className="detail-hero" aria-hidden="true">
      <div><span className="skeleton sk-eyebrow" /><span className="skeleton sk-title" /><span className="skeleton sk-badge" /></div>
      <div className="detail-actions"><span className="skeleton sk-button" /><span className="skeleton sk-button" /></div>
    </div>
    <div className="detail-layout" aria-hidden="true">
      <div className="detail-main">
        <section className="panel info-panel">
          <div className="info-grid">{[0, 1, 2, 3].map(index => <div className="info-item" key={index}><span className="skeleton sk-icon" /><div><span className="skeleton sk-label" /><span className="skeleton sk-value" /></div></div>)}</div>
        </section>
        <section className="panel activity-panel">
          <div className="tabs sk-tabs">{[0, 1, 2].map(index => <span className="skeleton sk-tab" key={index} />)}</div>
          <div className="sk-rows">{[0, 1, 2].map(index => <span className="skeleton sk-row" key={index} />)}</div>
        </section>
      </div>
      <aside className="detail-aside"><section className="panel"><span className="skeleton sk-label" /><span className="skeleton sk-row" /></section></aside>
    </div>
  </div>
}

function NotFound({ navigate }: { navigate: (s: string) => void }) { return <div className="page"><div className="empty-state large"><span><AlertCircle /></span><h1>Không tìm thấy đơn ứng tuyển</h1><p>Đơn này không tồn tại hoặc đã được xóa.</p><button className="primary" onClick={() => navigate('/applications')}>Về danh sách</button></div></div> }
