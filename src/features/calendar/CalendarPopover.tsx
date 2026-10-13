'use client'

import { KeyboardEvent as ReactKeyboardEvent, ReactNode, useEffect, useLayoutEffect, useRef } from 'react'
import { PopoverAnchor } from './calendarUtils'

const EDGE = 12
const FOCUSABLE = 'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
const FIRST_ACTION = '.calendar-context-buttons :is(a[href], button:not([disabled]))'

/**
 * The shell shared by the event and deadline popovers: a transparent scrim, then a dialog placed at `anchor` (below
 * it, or above it when there is no room, always inside the viewport). On open it focuses the first action (the dialog
 * itself when there is none) and keeps Tab inside; Escape (unless a modal is open), the scrim or a right click close
 * it. The caller returns focus to the element that opened it.
 */
export function CalendarPopover({ anchor, labelledBy, closeLabel, onClose, children }: {
  anchor: PopoverAnchor
  labelledBy: string
  /** Accessible name of the scrim, e.g. 'Đóng thông tin sự kiện'. */
  closeLabel: string
  onClose: () => void
  children: ReactNode
}) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose }, [onClose])

  // Placed from its measured size before the first paint, so it never flashes at the corner or runs off-screen.
  useLayoutEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const { width, height } = dialog.getBoundingClientRect()
    const maxLeft = window.innerWidth - width - EDGE
    const maxTop = window.innerHeight - height - EDGE
    let left = anchor.x
    let top = maxTop
    if (anchor.y <= maxTop) top = anchor.y
    else if (anchor.above - height >= EDGE) top = anchor.above - height
    else if (anchor.side) {
      // Too tall for either side of the element: open beside it (right, else left) instead of over it.
      top = Math.min(anchor.side.top, maxTop)
      left = anchor.side.right <= maxLeft ? anchor.side.right : anchor.side.left - width
    }
    dialog.style.left = `${Math.max(EDGE, Math.min(left, maxLeft))}px`
    dialog.style.top = `${Math.max(EDGE, top)}px`
  }, [anchor])

  useEffect(() => {
    const dialog = dialogRef.current
    ;(dialog?.querySelector<HTMLElement>(FIRST_ACTION) ?? dialog)?.focus({ preventScroll: true })
    const closeOnEscape = (keyboard: KeyboardEvent) => {
      if (keyboard.key !== 'Escape' || document.querySelector('.modal')) return
      keyboard.preventDefault()
      onCloseRef.current()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [])

  const trapTab = (keyboard: ReactKeyboardEvent<HTMLDivElement>) => {
    if (keyboard.key !== 'Tab') return
    const focusable = Array.from(keyboard.currentTarget.querySelectorAll<HTMLElement>(FOCUSABLE))
    if (!focusable.length) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    const active = document.activeElement
    if (keyboard.shiftKey ? active === first || active === keyboard.currentTarget : active === last) {
      keyboard.preventDefault()
      ;(keyboard.shiftKey ? last : first).focus()
    }
  }

  return <>
    <button type="button" tabIndex={-1} className="calendar-context-scrim" aria-label={closeLabel} onClick={onClose} onContextMenu={menu => { menu.preventDefault(); onClose() }} />
    <div
      ref={dialogRef}
      className="calendar-context-menu"
      role="dialog"
      aria-labelledby={labelledBy}
      tabIndex={-1}
      onKeyDown={trapTab}
      onContextMenu={menu => menu.preventDefault()}
    >
      {children}
    </div>
  </>
}
