import type { EventColor } from '../types'

/** Vietnamese names of the event colours, in palette order (the swatch row and screen-reader labels use them). */
export const EVENT_COLOR_LABEL: Record<EventColor, string> = {
  blue: 'Xanh dương',
  green: 'Xanh lá',
  amber: 'Vàng',
  red: 'Đỏ',
  violet: 'Tím',
  pink: 'Hồng',
  teal: 'Xanh ngọc',
  gray: 'Xám',
}
export const EVENT_COLORS = Object.keys(EVENT_COLOR_LABEL) as EventColor[]
/** The name of 'no colour': the event keeps its kind's look. */
export const DEFAULT_EVENT_COLOR_LABEL = 'Mặc định'

export const isEventColor = (value: unknown): value is EventColor =>
  typeof value === 'string' && Object.prototype.hasOwnProperty.call(EVENT_COLOR_LABEL, value)
/** A stored value as a colour, or undefined for anything else (stale or hand-edited data falls back to the default look). */
export const toEventColor = (value: unknown): EventColor | undefined => isEventColor(value) ? value : undefined
export const eventColorLabel = (color?: EventColor) => color ? EVENT_COLOR_LABEL[color] : DEFAULT_EVENT_COLOR_LABEL

/** Classes for an element tinted by an event colour ('event-color event-color-red'), or '' for the default look. */
export const eventColorClass = (color?: EventColor) => color ? `event-color event-color-${color}` : ''

/** `item` with `color` set, or with the key removed when there is none (so cleared colours leave no trace in the JSON). */
export function withEventColor<T extends { color?: EventColor }>(item: T, color: EventColor | undefined): T {
  if (color) return { ...item, color }
  const next = { ...item }
  delete next.color
  return next
}
