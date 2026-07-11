import { useMemo } from 'react'
import { EngineInputError } from '../engine'
import type { ScenarioInput, ScenarioResult } from '../engine'
import { formatDelta } from '../lib/format'
import { computeScenarioForDisplay } from '../lib/inflation'

type SensitivityStripProps = {
  input: ScenarioInput
  result: ScenarioResult
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function deltaColorClass(delta: number | null): string {
  if (delta === null) return 'text-ink-muted'
  if (delta > 0) return 'text-signal-buy'
  if (delta < 0) return 'text-signal-rent'
  return 'text-ink-muted'
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
        const tweaked = computeScenarioForDisplay(tweakedInput)
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
    <section aria-labelledby="sensitivity-heading">
      <h2
        id="sensitivity-heading"
        className="mb-2 text-xs font-semibold uppercase tracking-widest text-ink-muted"
      >
        Sensitivity: ±1pp Change
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {sensitivities.map((card) => (
          <div
            key={card.label}
            className="rounded-lg border border-surface-rule bg-surface-panel p-3"
          >
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-ink-muted">
              {card.label}
            </p>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-ink-muted">+1pp</span>
                <span className={`font-mono text-xs ${deltaColorClass(card.plus)}`}>
                  {formatSensitivityDelta(card.plus)}
                  {card.plus !== null && card.plus !== 0 && (
                    <span className="sr-only">
                      {card.plus > 0 ? '(favors buying)' : '(favors renting)'}
                    </span>
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-ink-muted">-1pp</span>
                <span className={`font-mono text-xs ${deltaColorClass(card.minus)}`}>
                  {formatSensitivityDelta(card.minus)}
                  {card.minus !== null && card.minus !== 0 && (
                    <span className="sr-only">
                      {card.minus > 0 ? '(favors buying)' : '(favors renting)'}
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
