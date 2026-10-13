'use client'

import { Children, cloneElement, isValidElement, ReactElement, ReactNode, useId } from 'react'
import { AlertCircle } from 'lucide-react'

/** Props a field's control needs: spread them on the input when it sits inside a wrapper such as .input-icon. */
export type FieldControlProps = {
  id: string
  'aria-invalid'?: boolean
  'aria-describedby'?: string
  'aria-required'?: boolean
}

type NativeControlProps = { id?: string; 'aria-describedby'?: string }
const NATIVE_CONTROLS = ['input', 'select', 'textarea']
const isNativeControl = (node: ReactNode): node is ReactElement<NativeControlProps> =>
  isValidElement(node) && typeof node.type === 'string' && NATIVE_CONTROLS.includes(node.type)
const joinIds = (...ids: (string | undefined)[]) => ids.filter(Boolean).join(' ') || undefined

/**
 * A labelled form field with an optional hint and an inline error. The first native <input>, <select> or <textarea>
 * child gets the label's id, aria-invalid and aria-describedby (hint + error) injected. A control nested in a wrapper
 * (e.g. .input-icon) is not reached by that injection: pass a function child and spread its props on the control.
 * The hint and error sit outside the <label>, so they describe the control instead of becoming part of its name.
 */
export function Field({ label, required, error, hint, wide, children }: {
  label: string
  required?: boolean
  error?: string
  hint?: ReactNode
  wide?: boolean
  children: ReactNode | ((control: FieldControlProps) => ReactNode)
}) {
  const baseId = useId()
  const hintId = `${baseId}-hint`
  const errorId = `${baseId}-error`
  const items = typeof children === 'function' ? [] : Children.toArray(children)
  const nativeIndex = items.findIndex(isNativeControl)
  const native = nativeIndex >= 0 ? items[nativeIndex] as ReactElement<NativeControlProps> : undefined
  const control: FieldControlProps = {
    id: native?.props.id ?? `${baseId}-control`,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': joinIds(native?.props['aria-describedby'], hint ? hintId : undefined, error ? errorId : undefined),
    'aria-required': required || undefined,
  }
  const content = typeof children === 'function'
    ? children(control)
    : items.map((child, index) => index === nativeIndex ? cloneElement(child as ReactElement<NativeControlProps>, control) : child)
  return <div className={`field ${wide ? 'wide' : ''} ${error ? 'field-error' : ''}`}>
    <label htmlFor={control.id}>{label}{required && <b aria-hidden="true"> *</b>}</label>
    {content}
    {hint && <small className="field-hint" id={hintId}>{hint}</small>}
    {error && <em id={errorId}><AlertCircle size={14} aria-hidden="true" />{error}</em>}
  </div>
}
