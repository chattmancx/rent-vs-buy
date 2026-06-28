import type { ScenarioInput, TaxInput } from '../engine'
import { FEDERAL_TAX_AS_OF_DATE } from '../engine'
import { STATE_ABBREV_MAP } from '../lib/state-tax'

type TaxInputsProps = {
  input: ScenarioInput
  updateTax: (patch: Partial<TaxInput>) => void
}

const SORTED_STATES = Object.keys(STATE_ABBREV_MAP).sort()

export function TaxInputs({ input, updateTax }: TaxInputsProps) {
  const { tax } = input

  return (
    <div className="space-y-4">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={tax.taxes_enabled}
          onChange={(e) => updateTax({ taxes_enabled: e.target.checked })}
          aria-label="Enable federal tax effects"
          className="h-4 w-4"
        />
        <span className="font-medium text-gray-700">Include federal tax effects</span>
      </label>

      <div className={tax.taxes_enabled ? '' : 'pointer-events-none opacity-50'}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="filing-status" className="text-sm font-medium text-gray-700">
              Filing status
            </label>
            <select
              id="filing-status"
              value={tax.filing_status}
              onChange={(e) =>
                updateTax({ filing_status: e.target.value as TaxInput['filing_status'] })
              }
              disabled={!tax.taxes_enabled}
              className="rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="single">Single</option>
              <option value="married_filing_jointly">Married filing jointly</option>
              <option value="married_filing_separately">Married filing separately</option>
              <option value="head_of_household">Head of household</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="state-select" className="text-sm font-medium text-gray-700">
              State
            </label>
            <select
              id="state-select"
              value={tax.state}
              onChange={(e) => updateTax({ state: e.target.value })}
              disabled={!tax.taxes_enabled}
              className="rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" disabled>
                Select state…
              </option>
              {SORTED_STATES.map((name) => (
                <option key={name} value={name}>
                  {name === 'D.C.' ? 'District of Columbia' : name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="gross-income" className="text-sm font-medium text-gray-700">
              Gross annual income
            </label>
            <div className="flex items-center rounded border border-gray-300 focus-within:ring-2 focus-within:ring-blue-500">
              <span className="pl-3 text-sm text-gray-500">$</span>
              <input
                id="gross-income"
                type="number"
                min={0}
                step={1000}
                placeholder="0"
                value={tax.gross_annual_income === 0 ? '' : tax.gross_annual_income}
                onChange={(e) => updateTax({ gross_annual_income: Number(e.target.value) || 0 })}
                disabled={!tax.taxes_enabled}
                className="w-full rounded px-2 py-2 text-sm focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col justify-end">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={tax.itemizes}
                onChange={(e) => updateTax({ itemizes: e.target.checked })}
                disabled={!tax.taxes_enabled}
                className="h-4 w-4"
              />
              <span className="font-medium text-gray-700">Itemized mortgage expenses</span>
            </label>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-500">
        Federal tax calculations use {FEDERAL_TAX_AS_OF_DATE} IRS tables. Tax law changes are not
        automatically reflected.
      </p>
    </div>
  )
}
