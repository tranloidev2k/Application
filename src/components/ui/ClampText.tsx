'use client'

import { CSSProperties, useEffect, useId, useRef, useState } from 'react'

/**
 * Plain text clamped to `lines` lines, with a 'Xem thêm' / 'Thu gọn' toggle that only appears when the text overflows.
 * The overflow check runs in a ResizeObserver callback, so it follows width changes and never sets state during render.
 */
export function ClampText({ text, lines = 6, className }: { text: string; lines?: number; className?: string }) {
  const [expanded, setExpanded] = useState(false)
  const [overflowing, setOverflowing] = useState(false)
  const textRef = useRef<HTMLParagraphElement>(null)
  const textId = useId()

  useEffect(() => {
    const element = textRef.current
    if (!element || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => {
      // Only a clamped paragraph can tell whether it overflows; while expanded the toggle stays visible anyway.
      if (element.classList.contains('clamped')) setOverflowing(element.scrollHeight > element.clientHeight + 1)
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [text])

  return <div className={`clamp-text ${className ?? ''}`}>
    <p ref={textRef} id={textId} className={expanded ? undefined : 'clamped'} style={{ '--clamp-lines': lines } as CSSProperties}>{text}</p>
    {(overflowing || expanded) && <button type="button" className="show-more" aria-expanded={expanded} aria-controls={textId} onClick={() => setExpanded(value => !value)}>
      {expanded ? 'Thu gọn' : 'Xem thêm'}
    </button>}
  </div>
}
