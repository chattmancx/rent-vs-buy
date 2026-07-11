import type { OwnershipInput, ScenarioInput, SharedInput, TaxInput } from '../engine'
import { toPercent } from '../lib/format'
import { InputField } from './InputField'
import { InputSection } from './InputSection'
import { TaxInputs } from './TaxInputs'

type ExpertOptionsProps = {
  input: ScenarioInput
  updateTax: (patch: Partial<TaxInput>) => void
  updateShared: (patch: Partial<SharedInput>) => void
  updateOwnership: (patch: Partial<OwnershipInput>) => void
}

export function ExpertOptions({
  input,
  updateTax,
  updateShared,
  updateOwnership,
}: ExpertOptionsProps) {
  return (
    <>
      <InputSection title="Tax & Income">
        <div className="col-span-full">
          <TaxInputs input={input} updateTax={updateTax} />
        </div>
      </InputSection>

      <InputSection title="Capital Gains">
        <div
          className={`col-span-full ${input.tax.taxes_enabled ? '' : 'pointer-events-none opacity-50'}`}
        >
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
        <div className="col-span-full space-y-4">
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
        </div>
      </InputSection>

      <InputSection title="Refinancing">
        <div className="col-span-full space-y-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={input.ownership.refinance_enabled}
              onChange={(e) => updateOwnership({ refinance_enabled: e.target.checked })}
              aria-label="Enable refinance"
              className="h-4 w-4 accent-accent"
            />
            <span className="font-medium text-ink-secondary">Enable refinance</span>
          </label>
          <div
            className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${input.ownership.refinance_enabled ? '' : 'pointer-events-none opacity-50'}`}
          >
            <InputField
              label="Trigger Month"
              value={input.ownership.refinance_trigger_month}
              onChange={(v) => updateOwnership({ refinance_trigger_month: Math.round(v) })}
              min={1}
              max={600}
              step={1}
              tooltip="The month within the analysis horizon when the refinance takes effect."
            />
            <InputField
              label="New Interest Rate"
              value={input.ownership.refinance_new_interest_rate}
              onChange={(v) => updateOwnership({ refinance_new_interest_rate: v })}
              min={0}
              max={100}
              step={0.05}
              suffix="%/yr"
            />
            <InputField
              label="New Loan Term"
              value={input.ownership.refinance_new_loan_term_years}
              onChange={(v) => updateOwnership({ refinance_new_loan_term_years: Math.round(v) })}
              min={1}
              max={50}
              step={1}
              suffix="yrs"
            />
            <InputField
              label="New Closing Costs"
              value={input.ownership.refinance_closing_costs_pct}
              onChange={(v) => updateOwnership({ refinance_closing_costs_pct: v })}
              min={0}
              max={20}
              step={0.1}
              suffix="%"
            />
          </div>
        </div>
      </InputSection>
    </>
  )
}
