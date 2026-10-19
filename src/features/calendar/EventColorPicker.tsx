'use client'

import { FocusEvent, KeyboardEvent, useState } from 'react'
import { Check } from 'lucide-react'
import { EventColor } from '../../types'
import { EVENT_COLORS, eventColorLabel } from '../../utils/eventColors'

/** 'Mặc định' (no colour: the kind's look) first, then the palette. */
const OPTIONS: (EventColor | undefined)[] = [undefined, ...EVENT_COLORS]
const STEP = new Map([['ArrowRight', 1], ['ArrowDown', 1], ['ArrowLeft', -1], ['ArrowUp', -1]])

/**
 * The colour swatches of one event, as a radio group with a single tab stop (the selected swatch). Each swatch is named
 * in Vietnamese and the selected one carries a ring and a check mark. Arrow keys, Home and End move between swatches;
 * with `selectOnFocus` (in a form) they also select, as in a native radio group. Where a choice is saved at once (the
 * event popover) pass `selectOnFocus={false}`: arrows only move focus and Space or Enter applies the focused colour,
 * so stepping through the row does not save (and toast) every colour on the way. The tab stop follows the focused
 * swatch while focus is in the row, and goes back to the selected one when focus leaves it.
 */
export function EventColorPicker({ value, onChange, labelledBy, selectOnFocus = true }: {
  value?: EventColor
  onChange: (color: EventColor | undefined) => void
  /** Id of the visible label of the group. */
  labelledBy: string
  selectOnFocus?: boolean
}) {
  const selectedIndex = Math.max(0, OPTIONS.indexOf(value))
  const [focusIndex, setFocusIndex] = useState<number | null>(null)
  const tabStop = focusIndex ?? selectedIndex
  const onKeyDown = (keyboard: KeyboardEvent<HTMLDivElement>) => {
    if (keyboard.altKey || keyboard.ctrlKey || keyboard.metaKey) return
    const swatches = Array.from(keyboard.currentTarget.querySelectorAll<HTMLElement>('[role="radio"]'))
    const focused = swatches.indexOf(document.activeElement as HTMLElement)
    const from = focused >= 0 ? focused : selectedIndex
    const step = STEP.get(keyboard.key)
    const index = keyboard.key === 'Home' ? 0
      : keyboard.key === 'End' ? OPTIONS.length - 1
        : step ? (from + step + OPTIONS.length) % OPTIONS.length
          : -1
    if (index < 0) return
    keyboard.preventDefault()
    setFocusIndex(index)
    swatches[index]?.focus()
    if (selectOnFocus && index !== selectedIndex) onChange(OPTIONS[index])
  }

  const onBlur = (blur: FocusEvent<HTMLDivElement>) => {
    if (!blur.currentTarget.contains(blur.relatedTarget as Node | null)) setFocusIndex(null)
  }

  return <div className="event-color-picker" role="radiogroup" aria-labelledby={labelledBy} onKeyDown={onKeyDown} onBlur={onBlur}>
    {OPTIONS.map((color, index) => {
      const selected = index === selectedIndex
      const label = eventColorLabel(color)
      return <button
        key={color ?? 'default'}
        type="button"
        role="radio"
        aria-checked={selected}
        aria-label={label}
        title={label}
        tabIndex={index === tabStop ? 0 : -1}
        className={`event-color-swatch ${color ? `event-color-${color}` : 'default'}`}
        onClick={() => {
          setFocusIndex(null)
          if (!selected) onChange(color)
        }}
      >
        {selected && <Check size={14} strokeWidth={3} aria-hidden="true" />}
      </button>
    })}
  </div>
}
