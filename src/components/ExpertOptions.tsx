import type { ScenarioInput, SharedInput, TaxInput } from '../engine'
import { toPercent } from '../lib/format'
import { InputField } from './InputField'
import { InputSection } from './InputSection'
import { TaxInputs } from './TaxInputs'

type ExpertOptionsProps = {
  input: ScenarioInput
  updateTax: (patch: Partial<TaxInput>) => void
  updateShared: (patch: Partial<SharedInput>) => void
}

export function ExpertOptions({ input, updateTax, updateShared }: ExpertOptionsProps) {
  return (
    <>
      <InputSection title="Tax & Income">
        <TaxInputs input={input} updateTax={updateTax} />
      </InputSection>

      <InputSection title="Capital Gains">
        <div className={input.tax.taxes_enabled ? '' : 'pointer-events-none opacity-50'}>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={input.tax.include_capital_gains}
              onChange={(e) => updateTax({ include_capital_gains: e.target.checked })}
              disabled={!input.tax.taxes_enabled}
              aria-label="Include capital gains tax on sale"
              className="h-4 w-4 accent-accent"
            />
            <span className="font-medium text-ink-secondary">
              Include capital gains tax on sale
            </span>
          </label>
        </div>
      </InputSection>

      <InputSection title="Display Options">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={input.shared.real_dollars}
            onChange={(e) => updateShared({ real_dollars: e.target.checked })}
            aria-label="Show in today's dollars"
            className="h-4 w-4 accent-accent"
          />
          <span className="font-medium text-ink-secondary">Show in today's dollars</span>
        </label>
        {input.shared.real_dollars && (
          <InputField
            label="Inflation rate assumption"
            value={toPercent(input.shared.inflation_rate)}
            onChange={(v) => updateShared({ inflation_rate: v / 100 })}
            min={0}
            max={50}
            step={0.1}
            suffix="%/yr"
          />
        )}
      </InputSection>
    </>
  )
}
