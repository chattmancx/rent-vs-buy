import type { ScenarioResult } from '../engine'
import { FEDERAL_TAX_AS_OF_DATE } from '../engine'
import { formatCurrency } from '../lib/format'

type HeadlineResultProps = {
  result: ScenarioResult
}

const figureColorClass: Record<string, string> = {
  buying: 'text-signal-buy',
  renting: 'text-signal-rent',
  tie: 'text-ink-primary',
}

export function HeadlineResult({ result }: HeadlineResultProps) {
  const { winner, margin_usd } = result.verdict
  const years = result.inputs.shared.horizon_years
  const figureColor = figureColorClass[winner] ?? figureColorClass['tie']

  return (
    <div className="rounded-lg border-l-4 border-accent bg-surface-panel p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-ink-muted">Verdict</p>
      {winner === 'tie' ? (
        <p className="mt-1 text-3xl font-semibold leading-tight text-ink-primary">
          Over <strong>{years}</strong> years, buying and renting come out essentially even
        </p>
      ) : (
        <>
          <p className="mt-1 text-3xl font-semibold leading-tight text-ink-primary">
            Over <strong>{years}</strong> years,{' '}
            <strong>{winner === 'buying' ? 'buying' : 'renting'}</strong> wins by
          </p>
          <p className={`font-mono text-3xl font-semibold ${figureColor}`}>
            {formatCurrency(margin_usd)}
          </p>
        </>
      )}
      {result.inputs.tax.taxes_enabled && (
        <p className="mt-4 border-t border-surface-rule pt-4 text-xs text-ink-muted">
          Federal tax estimates use {FEDERAL_TAX_AS_OF_DATE} IRS tables.
        </p>
      )}
    </div>
  )
}
