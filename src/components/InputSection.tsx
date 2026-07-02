import { useState } from 'react'

type InputSectionProps = {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}

export function InputSection({ title, children, defaultOpen }: InputSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen ?? false)

  return (
    <details
      open={isOpen}
      onToggle={(e) => {
        // Guard against bubbled toggle events from nested <details> elements.
        // React makes the toggle event bubble even though the native DOM event does not.
        if (e.target === e.currentTarget) {
          setIsOpen((e.target as HTMLDetailsElement).open)
        }
      }}
    >
      <summary className="mb-4 block w-full cursor-pointer select-none border-b border-surface-rule pb-2 text-xs font-semibold uppercase tracking-widest text-ink-muted">
        {title}
      </summary>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </details>
  )
}
