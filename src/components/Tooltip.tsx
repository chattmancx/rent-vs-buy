import { useState, useId } from 'react'

type TooltipProps = {
  text: string
  children: React.ReactNode
}

export function Tooltip({ text, children }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const tooltipId = useId()

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
      aria-describedby={isVisible ? tooltipId : undefined}
    >
      {children}
      {isVisible && (
        <div
          id={tooltipId}
          role="tooltip"
          className="absolute left-0 top-full z-10 mt-1 w-56 rounded bg-gray-800 p-2 text-xs text-white shadow-lg"
        >
          {text}
        </div>
      )}
    </div>
  )
}
