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
      <summary className="cursor-pointer select-none py-2 text-sm font-semibold text-gray-800">
        {title}
      </summary>
      <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </details>
  )
}
