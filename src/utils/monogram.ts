/** A company's monogram: its first letter and a stable hue (0–359) hashed from the whole name. */
export function monogramFor(name: string) {
  const trimmed = name.trim()
  const initial = Array.from(trimmed)[0]?.toLocaleUpperCase('vi') || '?'
  let hash = 0
  for (const char of trimmed.toLocaleLowerCase('vi')) hash = (hash * 31 + (char.codePointAt(0) ?? 0)) >>> 0
  return { initial, hue: hash % 360 }
}
