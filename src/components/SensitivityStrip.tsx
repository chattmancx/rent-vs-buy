import { useMemo } from 'react'
import { computeScenario, EngineInputError } from '../engine'
import type { ScenarioInput, ScenarioResult } from '../engine'
import { formatDelta } from '../lib/format'

type SensitivityStripProps = {
  input: ScenarioInput
  result: ScenarioResult
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function deltaColorClass(delta: number | null): string {
  if (delta === null) return 'text-gray-400'
  if (delta > 0) return 'text-green-600'
  if (delta < 0) return 'text-red-600'
  return 'text-gray-600'
}

function formatSensitivityDelta(delta: number | null): string {
  if (delta === null) return 'N/A'
  return formatDelta(delta)
}

export function SensitivityStrip({ input, result }: SensitivityStripProps) {
  const sensitivities = useMemo(() => {
    const baseAdvantage = result.verdict.owner_net_worth - result.verdict.renter_net_worth

    function computeDelta(tweakedInput: ScenarioInput): number | null {
      try {
        const tweaked = computeScenario(tweakedInput)
        return tweaked.verdict.owner_net_worth - tweaked.verdict.renter_net_worth - baseAdvantage
      } catch (e) {
        if (e instanceof EngineInputError) return null
        throw e
      }
    }

    return [
      {
        label: 'Interest Rate',
        plus: computeDelta({
          ...input,
          ownership: {
            ...input.ownership,
            interest_rate: clamp(input.ownership.interest_rate + 1, 0, 100),
          },
        }),
        minus: computeDelta({
          ...input,
          ownership: {
            ...input.ownership,
            interest_rate: clamp(input.ownership.interest_rate - 1, 0, 100),
          },
        }),
      },
      {
        label: 'Home Appreciation',
        plus: computeDelta({
          ...input,
          ownership: {
            ...input.ownership,
            home_appreciation_rate: clamp(input.ownership.home_appreciation_rate + 0.01, -0.5, 0.5),
          },
        }),
        minus: computeDelta({
          ...input,
          ownership: {
            ...input.ownership,
            home_appreciation_rate: clamp(input.ownership.home_appreciation_rate - 0.01, -0.5, 0.5),
          },
        }),
      },
      {
        label: 'Investment Return',
        plus: computeDelta({
          ...input,
          shared: {
            ...input.shared,
            investment_return_rate: clamp(input.shared.investment_return_rate + 0.01, -0.5, 0.5),
          },
        }),
        minus: computeDelta({
          ...input,
          shared: {
            ...input.shared,
            investment_return_rate: clamp(input.shared.investment_return_rate - 0.01, -0.5, 0.5),
          },
        }),
      },
      {
        label: 'Rent Growth',
        plus: computeDelta({
          ...input,
          rental: {
            ...input.rental,
            rent_increase_rate: clamp(input.rental.rent_increase_rate + 0.01, -0.5, 0.5),
          },
        }),
        minus: computeDelta({
          ...input,
          rental: {
            ...input.rental,
            rent_increase_rate: clamp(input.rental.rent_increase_rate - 0.01, -0.5, 0.5),
          },
        }),
      },
    ]
  }, [result, input])

  return (
    <div>
      <h2 className="mb-2 text-sm font-semibold text-gray-700">Sensitivity: ±1pp Change</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {sensitivities.map((card) => (
          <div key={card.label} className="rounded-lg border border-gray-200 bg-white p-3">
            <p className="mb-2 text-xs font-semibold text-gray-700">{card.label}</p>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">+1pp</span>
                <span className={`font-mono text-xs ${deltaColorClass(card.plus)}`}>
                  {formatSensitivityDelta(card.plus)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">-1pp</span>
                <span className={`font-mono text-xs ${deltaColorClass(card.minus)}`}>
                  {formatSensitivityDelta(card.minus)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
