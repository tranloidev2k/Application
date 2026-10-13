'use client'

import { KeyboardEvent, MouseEvent, useCallback, useEffect, useId, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { Status, STATUSES, STATUS_META } from '../../types'
import { isInteractiveTarget } from '../../utils/interactive'
import { StatusBadge } from './StatusBadge'

const ITEM_HEIGHT = 36
const MENU_CHROME = 14 // padding and border around the items
const MENU_WIDTH = 210
const GAP = 4
const EDGE = 8

type MenuPosition = { left: number; top?: number; bottom?: number }

/** Below the trigger when the menu fits there (or there is more room below), otherwise above it, kept inside the viewport. */
function menuPosition(trigger: DOMRect, itemCount: number): MenuPosition {
  const height = itemCount * ITEM_HEIGHT + MENU_CHROME
  const left = Math.max(EDGE, Math.min(trigger.left, window.innerWidth - MENU_WIDTH - EDGE))
  const below = window.innerHeight - trigger.bottom - GAP - EDGE
  if (below >= height || below >= trigger.top) return { left, top: trigger.bottom + GAP }
  return { left, bottom: window.innerHeight - trigger.top + GAP }
}

/**
 * The status badge as a menu button: one click opens a fixed menu of statuses, one more picks the new one.
 * `onSelect` only fires for a different status; route it through useStatusChange so the shared rule applies.
 * Clicks on the trigger and inside the menu never reach a clickable parent (row or card). An outside click only
 * dismisses the menu: it does not also activate a non-interactive parent such as a row.
 */
export function StatusMenu({ status, onSelect, statuses = STATUSES, contextLabel }: {
  status: Status
  onSelect: (status: Status) => void
  /** Limits the choices; defaults to every status. */
  statuses?: Status[]
  /** Appended to the trigger's accessible name, e.g. the job title, so many triggers on one page stay distinguishable. */
  contextLabel?: string
}) {
  const [position, setPosition] = useState<MenuPosition | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuId = useId()
  const open = position !== null

  const close = useCallback((returnFocus: boolean) => {
    setPosition(null)
    if (returnFocus) triggerRef.current?.focus({ preventScroll: true })
  }, [])

  useEffect(() => {
    const menu = menuRef.current
    if (!open || !menu) return
    const current = menu.querySelector<HTMLElement>('[aria-checked="true"]') ?? menu.querySelector<HTMLElement>('[role="menuitemradio"]')
    current?.focus({ preventScroll: true })

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (menu.contains(target) || triggerRef.current?.contains(target)) return
      setPosition(null)
      // Swallow the click that ends this press unless it lands on a control, so dismissing never opens a row.
      const swallow = (click: Event) => {
        if (isInteractiveTarget(click.target)) return
        click.preventDefault()
        click.stopPropagation()
      }
      // The guard outlives the menu and removes itself after the press ends (or after a safety timeout).
      const release = () => window.setTimeout(() => document.removeEventListener('click', swallow, true), 0)
      document.addEventListener('click', swallow, true)
      document.addEventListener('pointerup', release, { capture: true, once: true })
      document.addEventListener('pointercancel', release, { capture: true, once: true })
      window.setTimeout(release, 1500)
    }
    const onViewportChange = () => {
      const hadFocus = menu.contains(document.activeElement)
      setPosition(null)
      if (hadFocus) triggerRef.current?.focus({ preventScroll: true })
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    window.addEventListener('scroll', onViewportChange, true)
    window.addEventListener('resize', onViewportChange)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      window.removeEventListener('scroll', onViewportChange, true)
      window.removeEventListener('resize', onViewportChange)
    }
  }, [open])

  const openMenu = (trigger: HTMLElement) => setPosition(menuPosition(trigger.getBoundingClientRect(), statuses.length))

  const onTriggerClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    if (open) close(false)
    else openMenu(event.currentTarget)
  }

  const onTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
    event.preventDefault()
    event.stopPropagation()
    if (!open) openMenu(event.currentTarget)
  }

  const onMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('[role="menuitemradio"]'))
    const index = items.indexOf(document.activeElement as HTMLElement)
    let next: number
    switch (event.key) {
      case 'ArrowDown': next = (index + 1) % items.length; break
      case 'ArrowUp': next = (index - 1 + items.length) % items.length; break
      case 'Home': next = 0; break
      case 'End': next = items.length - 1; break
      case 'Escape':
        event.preventDefault()
        event.stopPropagation()
        close(true)
        return
      case 'Tab':
        // Focus goes back to the trigger first, so the browser's own Tab move continues from there.
        close(true)
        return
      default:
        return
    }
    event.preventDefault()
    event.stopPropagation()
    items[next]?.focus()
  }

  const choose = (next: Status) => {
    close(true)
    if (next !== status) onSelect(next)
  }

  return <>
    <button
      ref={triggerRef}
      type="button"
      className="status-trigger"
      aria-haspopup="menu"
      aria-expanded={open}
      aria-controls={open ? menuId : undefined}
      onClick={onTriggerClick}
      onKeyDown={onTriggerKeyDown}
    >
      <StatusBadge status={status} />
      <span className="sr-only">, đổi trạng thái{contextLabel ? ` đơn ${contextLabel}` : ''}</span>
      <ChevronDown className="status-trigger-chevron" size={15} aria-hidden="true" />
    </button>
    {position && <div
      ref={menuRef}
      id={menuId}
      className="menu status-menu"
      role="menu"
      aria-label="Đổi trạng thái"
      style={{ left: position.left, top: position.top, bottom: position.bottom }}
      onKeyDown={onMenuKeyDown}
      onClick={event => event.stopPropagation()}
    >
      {statuses.map(option => {
        const meta = STATUS_META[option]
        const checked = option === status
        return <button key={option} type="button" role="menuitemradio" aria-checked={checked} tabIndex={-1} className="menu-item" onClick={() => choose(option)}>
          <span className={`status-dot ${meta.tone}`} aria-hidden="true" />
          <span className="menu-item-label">{meta.label}</span>
          {checked && <Check className="menu-item-check" size={16} aria-hidden="true" />}
        </button>
      })}
    </div>}
  </>
}
