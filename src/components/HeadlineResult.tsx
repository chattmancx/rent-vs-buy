import type { ScenarioResult } from '../engine'
import { FEDERAL_TAX_AS_OF_DATE } from '../engine'
import { formatCurrency } from '../lib/format'

type HeadlineResultProps = {
  result: ScenarioResult
}

const wrapperClass: Record<string, string> = {
  buying: 'border-green-300 bg-green-50',
  renting: 'border-blue-300 bg-blue-50',
  tie: 'border-gray-300 bg-gray-50',
}

export function HeadlineResult({ result }: HeadlineResultProps) {
  const { winner, margin_usd } = result.verdict
  const years = result.inputs.shared.horizon_years
  const colors = wrapperClass[winner] ?? wrapperClass['tie']

  return (
    <div className={`rounded-lg border p-6 text-center ${colors}`}>
      <p className="text-xl font-semibold text-gray-900">
        {winner === 'tie' ? (
          <>
            Over <strong>{years}</strong> years, buying and renting come out essentially even
          </>
        ) : (
          <>
            Over <strong>{years}</strong> years,{' '}
            <strong>{winner === 'buying' ? 'buying' : 'renting'}</strong> wins by{' '}
            <strong>{formatCurrency(margin_usd)}</strong>
          </>
        )}
      </p>
      {result.inputs.tax.taxes_enabled && (
        <p className="mt-2 text-xs text-gray-500">
          Federal tax estimates use {FEDERAL_TAX_AS_OF_DATE} IRS tables.
        </p>
      )}
    </div>
  )
}
