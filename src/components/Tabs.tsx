import { useState, type ReactNode, type KeyboardEvent } from 'react'

export type TabDef = {
  id: string
  label: string
  content: ReactNode
}

type TabsProps = {
  tabs: TabDef[]
  ariaLabel: string
}

export function Tabs({ tabs, ariaLabel }: TabsProps) {
  const [activeId, setActiveId] = useState(tabs[0]?.id ?? '')
  const activeTab = tabs.find((tab) => tab.id === activeId)

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex: number | null = null
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length
    if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length
    if (event.key === 'Home') nextIndex = 0
    if (event.key === 'End') nextIndex = tabs.length - 1
    if (nextIndex === null) return
    event.preventDefault()
    const next = tabs[nextIndex]
    if (!next) return
    setActiveId(next.id)
    document.getElementById(`tab-${next.id}`)?.focus()
  }

  return (
    <div>
      <div
        role="tablist"
        aria-label={ariaLabel}
        className="mb-3 flex gap-4 border-b border-surface-rule"
      >
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={tab.id === activeId}
            aria-controls={`panel-${tab.id}`}
            tabIndex={tab.id === activeId ? 0 : -1}
            onClick={() => setActiveId(tab.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={
              tab.id === activeId
                ? 'border-b-2 border-accent pb-2 text-xs font-semibold uppercase tracking-widest text-ink-primary'
                : 'border-b-2 border-transparent pb-2 text-xs font-semibold uppercase tracking-widest text-ink-muted'
            }
          >
            {tab.label}
          </button>
        ))}
      </div>
      {activeTab && (
        <div role="tabpanel" id={`panel-${activeTab.id}`} aria-labelledby={`tab-${activeTab.id}`}>
          {activeTab.content}
        </div>
      )}
    </div>
  )
}
