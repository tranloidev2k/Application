/** A copy of `list` with `item` inserted at `index`, clamped to the list bounds (used to undo a removal in place). */
export function insertAt<T>(list: T[], index: number, item: T): T[] {
  const at = Math.max(0, Math.min(index, list.length))
  return [...list.slice(0, at), item, ...list.slice(at)]
}
