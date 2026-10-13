'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { deletePersonalTask, fetchPersonalTasks, savePersonalTask } from '../lib/personalTasks'
import { ensureAnonymousSession } from '../lib/supabase'
import { PersonalTask } from '../types'
import type { ToastFn } from '../context/AppDataContext'

export function usePersonalTasks(toast: ToastFn) {
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
