'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { deletePersonalTask, deletePersonalTasks, fetchPersonalTasks, savePersonalTask, savePersonalTasks } from '../lib/personalTasks'
import { ensureAnonymousSession } from '../lib/supabase'
import { PersonalTask } from '../types'
import type { ToastFn, ToastOptions } from '../context/AppDataContext'

/** Personal calendar tasks. `silentLoadError` logs a failed load instead of toasting it (for pages where these tasks are secondary). */
export function usePersonalTasks(toast: ToastFn, silentLoadError = false) {
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
        if (active && !silentLoadError) toast('Không tải được công việc cá nhân từ database', { tone: 'error' })
      })
    return () => { active = false }
  }, [toast, silentLoadError])

  // Shows the change immediately and rolls it back if the database rejects it. `successOptions` (e.g. a 'Hoàn tác'
  // action) only go to the success toast; a failure always shows the plain error toast.
  const change = useCallback(async (next: PersonalTask[], request: () => Promise<void>, success: string, successOptions?: ToastOptions) => {
    const previous = latest.current
    setTasks(next)
    try {
      await ensureAnonymousSession()
      await request()
      toast(success, successOptions)
    } catch (error) {
      console.error('Saving personal task failed', error)
      setTasks(previous)
      toast('Không lưu được công việc vào database', { tone: 'error' })
    }
  }, [toast])

  // The colour column is written only when the colour changed (chosen or cleared); otherwise a task with no colour
  // saves without it, so saving keeps working on a database that has not run the colour migration yet.
  const save = useCallback((task: PersonalTask, success: string, toastOptions?: ToastOptions) => {
    const items = latest.current
    const existing = items.find(item => item.id === task.id)
    const next = existing ? items.map(item => item.id === task.id ? task : item) : [...items, task]
    const writeColor = (existing?.color ?? null) !== (task.color ?? null)
    return change(next, () => savePersonalTask(task, { writeColor }), success, toastOptions)
  }, [change])

  const remove = useCallback((id: string) => change(latest.current.filter(item => item.id !== id), () => deletePersonalTask(id), 'Đã xóa công việc'), [change])

  // New tasks in one go (the copies of 'Nhân bản'): all appear at once, are saved in one request and all roll back if
  // it fails.
  const addMany = useCallback((added: PersonalTask[], success: string, toastOptions?: ToastOptions) => {
    const ids = new Set(added.map(task => task.id))
    return change([...latest.current.filter(item => !ids.has(item.id)), ...added], () => savePersonalTasks(added), success, toastOptions)
  }, [change])

  // Removes exactly these tasks (those still present), e.g. to undo `addMany`.
  const removeMany = useCallback((ids: string[], success: string) => {
    const present = latest.current.filter(item => ids.includes(item.id)).map(item => item.id)
    if (!present.length) return Promise.resolve()
    return change(latest.current.filter(item => !present.includes(item.id)), () => deletePersonalTasks(present), success)
  }, [change])

  return { tasks, save, remove, addMany, removeMany }
}
