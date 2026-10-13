'use client'

import { useEffect, useState } from 'react'

export type ScrollEdges = { start: boolean; end: boolean }

/**
 * Whether a horizontal scroller has more content before (`start`) or after (`end`) what is visible, kept current on
 * scroll and resize. Pass the returned callback as the element's ref.
 */
export function useScrollEdges<T extends HTMLElement>() {
  const [node, setNode] = useState<T | null>(null)
  const [edges, setEdges] = useState<ScrollEdges>({ start: false, end: false })

  useEffect(() => {
    if (!node) return
    const update = () => {
      const start = node.scrollLeft > 1
      const end = node.scrollLeft < node.scrollWidth - node.clientWidth - 1
      setEdges(current => current.start === start && current.end === end ? current : { start, end })
    }
    // The observer also reports once right after observe(), which sets the initial state.
    const observer = new ResizeObserver(update)
    observer.observe(node)
    node.addEventListener('scroll', update, { passive: true })
    return () => {
      observer.disconnect()
      node.removeEventListener('scroll', update)
    }
  }, [node])

  return [setNode, edges] as const
}
