'use client'

import { KeyboardEvent as ReactKeyboardEvent, ReactNode, useEffect, useId, useRef, useState } from 'react'
import { X } from 'lucide-react'

const MODAL_FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Accessible dialog. With `onSubmit`, body and footer are wrapped in a <form>: the footer's primary button must be
 * type="submit" and every other footer button type="button". Never render a Modal with onSubmit inside another <form>.
 * `dirty` ignores backdrop clicks so typed input is not lost; Escape still closes.
 */
export function Modal({ title, description, onClose, onSubmit, dirty = false, children, footer }: {
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
