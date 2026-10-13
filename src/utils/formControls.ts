import { scrollBehavior } from './motion'

const TABBABLE = 'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), summary, a[href], [tabindex]'

/** Focuses the control named `name` inside `form` and scrolls it to the middle of the screen (smooth unless reduced motion is on). */
export function focusFormControl(form: HTMLFormElement, name: string) {
  const control = form.querySelector<HTMLElement>(`[name="${name}"]`)
  if (!control) return
  control.focus({ preventScroll: true })
  control.scrollIntoView({ behavior: scrollBehavior(), block: 'center' })
}

/** Moves focus from `from` to the next visible, tabbable form control in `container` (skipping links). Returns false at the end. */
export function focusNextControl(container: HTMLElement, from: HTMLElement) {
  const controls = Array.from(container.querySelectorAll<HTMLElement>(TABBABLE))
    .filter(element => element.tabIndex >= 0 && !(element instanceof HTMLAnchorElement) && element.getClientRects().length > 0)
  const index = controls.indexOf(from)
  const next = index >= 0 ? controls[index + 1] : undefined
  if (!next) return false
  next.focus()
  return true
}
