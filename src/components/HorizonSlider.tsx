import type { SharedInput } from '../engine'

type HorizonSliderProps = {
  horizonYears: number
  updateShared: (patch: Partial<SharedInput>) => void
}

export function HorizonSlider({ horizonYears, updateShared }: HorizonSliderProps) {
  return (
    <div className="mt-3 px-4">
      <div className="mb-1 flex items-center justify-between text-xs text-ink-muted">
        <span>1 yr</span>
        <span className="font-medium text-ink-secondary">Horizon: {horizonYears} years</span>
        <span>40 yrs</span>
      </div>
      <input
        type="range"
        min={1}
        max={40}
        step={1}
        value={horizonYears}
        onChange={(e) => updateShared({ horizon_years: parseInt(e.target.value, 10) })}
        className="w-full accent-accent"
        aria-label="Chart horizon in years"
      />
    </div>
  )
}
