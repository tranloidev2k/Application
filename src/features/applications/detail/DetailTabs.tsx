'use client'

import { KeyboardEvent, ReactNode, useId, useRef } from 'react'

export type DetailTab = 'timeline' | 'interviews' | 'tasks'

/**
 * WAI-ARIA tabs: one tab stop (roving tabIndex), ArrowLeft/ArrowRight/Home/End move and activate, and each tab
 * controls its own tabpanel. Inactive panels stay mounted but hidden, so every aria-controls target exists.
 */
export function DetailTabs({ tabs, active, onChange, label }: {
  tabs: Array<{ id: DetailTab; label: string; count: number; panel: ReactNode }>
  active: DetailTab
  onChange: (tab: DetailTab) => void
  label: string
}) {
  const baseId = useId()
  const tabRefs = useRef<Partial<Record<DetailTab, HTMLButtonElement | null>>>({})
  const tabId = (id: DetailTab) => `${baseId}-${id}-tab`
  const panelId = (id: DetailTab) => `${baseId}-${id}-panel`

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = tabs.findIndex(tab => tab.id === active)
    let next: number
    switch (event.key) {
      case 'ArrowRight': next = (index + 1) % tabs.length; break
      case 'ArrowLeft': next = (index - 1 + tabs.length) % tabs.length; break
      case 'Home': next = 0; break
      case 'End': next = tabs.length - 1; break
      default: return
    }
    event.preventDefault()
    const target = tabs[next].id
    onChange(target)
    tabRefs.current[target]?.focus()
  }

  return <>
    <div className="tabs" role="tablist" aria-label={label} onKeyDown={onKeyDown}>
      {tabs.map(tab => {
        const selected = tab.id === active
        return <button
          key={tab.id}
          ref={element => { tabRefs.current[tab.id] = element }}
          type="button"
          role="tab"
          id={tabId(tab.id)}
          aria-selected={selected}
          aria-controls={panelId(tab.id)}
          tabIndex={selected ? 0 : -1}
          className={selected ? 'active' : ''}
          onClick={() => onChange(tab.id)}
        >{tab.label} <span className="tab-count">{tab.count}</span></button>
      })}
    </div>
    {tabs.map(tab => <div key={tab.id} role="tabpanel" id={panelId(tab.id)} aria-labelledby={tabId(tab.id)} hidden={tab.id !== active}>{tab.panel}</div>)}
  </>
}
