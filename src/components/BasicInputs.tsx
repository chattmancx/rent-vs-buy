import type { ScenarioInput, OwnershipInput, RentalInput, SharedInput } from '../engine'
import { toPercent } from '../lib/format'
import { InputField } from './InputField'
import { Tooltip } from './Tooltip'

type BasicInputsProps = {
  input: ScenarioInput
  updateOwnership: (patch: Partial<OwnershipInput>) => void
  updateRental: (patch: Partial<RentalInput>) => void
  updateShared: (patch: Partial<SharedInput>) => void
}

export function BasicInputs({
  input,
  updateOwnership,
  updateRental,
  updateShared,
}: BasicInputsProps) {
  const { ownership, rental, shared } = input

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <InputField
        label="Purchase Price"
        value={ownership.purchase_price}
        onChange={(v) => updateOwnership({ purchase_price: v })}
        prefix="$"
        min={0}
        step={1000}
        tooltip="The total price you will pay for the home, not including closing costs."
      />
      <InputField
        label="Down Payment"
        value={ownership.down_payment_pct}
        onChange={(v) => updateOwnership({ down_payment_pct: v })}
        suffix="%"
        min={0}
        max={100}
        step={0.5}
      />
      <InputField
        label="Interest Rate"
        value={ownership.interest_rate}
        onChange={(v) => updateOwnership({ interest_rate: v })}
        suffix="%/yr"
        min={0}
        max={30}
        step={0.05}
        tooltip="Your annual mortgage interest rate. Check current rates from your lender or Bankrate."
      />
      <InputField
        label="Monthly Rent"
        value={rental.base_rent_monthly}
        onChange={(v) => updateRental({ base_rent_monthly: v })}
        prefix="$"
        min={0}
        step={50}
        tooltip="Your base monthly rent, not including parking, pet fees, or utilities."
      />

      {/* Horizon slider */}
      <div className="col-span-full flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm font-medium text-ink-secondary">
            <span>Analysis Horizon</span>
            <Tooltip text="How many years to model. Longer horizons tend to favor buying; shorter ones often favor renting.">
              <button
                type="button"
                aria-label="More information about Analysis Horizon"
                className="ml-1 text-ink-muted hover:text-ink-secondary"
              >
                ?
              </button>
            </Tooltip>
          </div>
          <span className="text-sm text-ink-muted">{shared.horizon_years} years</span>
        </div>
        <input
          type="range"
          min={1}
          max={40}
          step={1}
          value={shared.horizon_years}
          onChange={(e) => updateShared({ horizon_years: parseInt(e.target.value, 10) })}
          className="w-full accent-accent"
          aria-label="Analysis horizon in years"
        />
      </div>

      <InputField
        label="Investment Return"
        value={toPercent(shared.investment_return_rate)}
        onChange={(v) => updateShared({ investment_return_rate: v / 100 })}
        suffix="%/yr"
        min={0}
        max={50}
        step={0.25}
        tooltip="Expected annual return on investments. The S&P 500 has averaged about 7% after inflation historically."
      />

      {/* Invest vs spend slider */}
      <div className="col-span-full flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm font-medium text-ink-secondary">
            <span>Invest vs. Spend</span>
            <Tooltip text="When one option is cheaper monthly, what fraction of the savings gets invested vs. spent. 50% is a reasonable middle ground.">
              <button
                type="button"
                aria-label="More information about Invest vs. Spend ratio"
                className="ml-1 text-ink-muted hover:text-ink-secondary"
              >
                ?
              </button>
            </Tooltip>
          </div>
          <span className="text-sm text-ink-muted">
            {(shared.invest_vs_spend_ratio * 100).toFixed(0)}% invested
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={shared.invest_vs_spend_ratio}
          onChange={(e) => updateShared({ invest_vs_spend_ratio: parseFloat(e.target.value) })}
          className="w-full accent-accent"
          aria-label="Fraction of monthly savings to invest"
        />
      </div>
    </div>
  )
}
