import { useEffect, useId, useRef, useState } from 'react'
import { Tooltip } from './Tooltip'

type InputFieldProps = {
  label: string
  value: number
  onChange: (value: number) => void
  tooltip?: string
  min?: number
  max?: number
  step?: number
  prefix?: string
  suffix?: string
}

export function InputField({
  label,
  value,
  onChange,
  tooltip,
  min,
  max,
  step,
  prefix,
  suffix,
}: InputFieldProps) {
  const inputId = useId()
  const [raw, setRaw] = useState(() => String(value))
  const prevValueRef = useRef(value)

  // Sync display when value changes from outside (import, URL state).
  // Guard with prevValueRef so user-initiated clearing isn't overwritten mid-edit.
  useEffect(() => {
    if (prevValueRef.current !== value) {
      prevValueRef.current = value
      setRaw(String(value))
    }
  }, [value])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setRaw(e.target.value)
    const parsed = parseFloat(e.target.value)
    if (isFinite(parsed)) {
      onChange(parsed)
    }
  }

  function handleBlur() {
    if (!isFinite(parseFloat(raw))) {
      setRaw(String(value))
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center text-sm font-medium text-ink-secondary">
        <label htmlFor={inputId}>{label}</label>
        {tooltip !== undefined && (
          <Tooltip text={tooltip}>
            <button
              type="button"
              aria-label={`More information about ${label}`}
              className="ml-1 text-ink-muted hover:text-ink-secondary"
            >
              ?
            </button>
          </Tooltip>
        )}
      </div>
      <div className="flex items-center gap-1">
        {prefix !== undefined && <span className="text-sm text-ink-muted">{prefix}</span>}
        <input
          id={inputId}
          type="number"
          value={raw}
          min={min}
          max={max}
          step={step ?? 'any'}
          onChange={handleChange}
          onBlur={handleBlur}
          className="w-full rounded border border-surface-rule bg-surface-panel px-3 py-2 font-mono text-sm text-ink-primary placeholder-ink-muted focus:outline-none focus:ring-1 focus:ring-accent"
        />
        {suffix !== undefined && <span className="text-sm text-ink-muted">{suffix}</span>}
      </div>
    </div>
  )
}
