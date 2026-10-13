import { CSSProperties } from 'react'
import { monogramFor } from '../../utils/monogram'

/** Decorative 32px company initial on a soft tint; the hue is hashed from the name so a company keeps its colour. */
export function Monogram({ name }: { name: string }) {
  const { initial, hue } = monogramFor(name)
  return <span className="monogram" aria-hidden="true" style={{ '--mono-h': hue } as CSSProperties}>{initial}</span>
}
