import type { ScenarioResult } from '../engine'
import { formatCurrency } from '../lib/format'
import { deflateIfEnabled } from '../lib/inflation'

type CostTableProps = {
  result: ScenarioResult
}

type RowDef = {
  label: string
  owner: number | null
  renter: number | null
  variant?: 'normal' | 'subtotal' | 'networth' | 'gainloss' | 'taxbenefit' | 'capitalgainstax'
}

export function CostTable({ result }: CostTableProps) {
  const { totals, verdict, inputs } = result
  const lastRow = result.monthly_schedule[result.monthly_schedule.length - 1] ?? null
  const downPayment = inputs.ownership.purchase_price * (inputs.ownership.down_payment_pct / 100)
  const { real_dollars, inflation_rate, horizon_years } = inputs.shared

  const ownerNetGainLoss =
    totals.owner_final_net_worth - (totals.total_ownership_outflows + downPayment)
  const renterNetGainLoss = totals.renter_final_net_worth - totals.total_rentership_outflows

  function atHorizon(value: number): number {
    return deflateIfEnabled(value, real_dollars, inflation_rate, horizon_years)
  }

  const rows: RowDef[] = [
    { label: 'Down payment', owner: downPayment, renter: null },
    { label: 'Closing costs', owner: totals.total_closing_costs, renter: null },
    { label: 'Admin fee', owner: null, renter: totals.total_admin_fee },
    { label: 'Mortgage principal', owner: totals.total_principal_paid, renter: null },
    { label: 'Mortgage interest', owner: totals.total_interest_paid, renter: null },
    { label: 'PMI', owner: totals.total_pmi_paid, renter: null },
    { label: 'Property taxes', owner: totals.total_property_taxes, renter: null },
    { label: 'Home insurance', owner: totals.total_homeowner_insurance, renter: null },
    { label: 'HOA fees', owner: totals.total_hoa, renter: null },
    { label: 'Maintenance', owner: totals.total_maintenance, renter: null },
    { label: 'Rent paid', owner: null, renter: totals.total_rent_paid },
    { label: 'Pet rent', owner: null, renter: totals.total_pet_rent },
    { label: 'Parking fees', owner: null, renter: totals.total_parking_fees },
    { label: 'Renters insurance', owner: null, renter: totals.total_renters_insurance },
    {
      label: 'Utilities',
      owner: totals.total_utilities_owner,
      renter: totals.total_utilities_renter,
    },
    ...(inputs.tax.taxes_enabled && totals.total_tax_benefit !== 0
      ? [
          {
            label: 'Federal tax benefit',
            owner: -totals.total_tax_benefit,
            renter: null,
            variant: 'taxbenefit' as const,
          },
        ]
      : []),
    {
      label: 'Total outflows',
      owner: totals.total_ownership_outflows,
      renter: totals.total_rentership_outflows,
      variant: 'subtotal',
    },
    { label: 'Sale proceeds', owner: atHorizon(totals.sale_proceeds), renter: null },
    ...(inputs.tax.taxes_enabled && totals.total_capital_gains_tax !== 0
      ? [
          {
            label: 'Capital gains tax',
            owner: atHorizon(totals.total_capital_gains_tax),
            renter: null,
            variant: 'capitalgainstax' as const,
          },
        ]
      : []),
    {
      label: 'Investment portfolio',
      owner: atHorizon(lastRow?.owner_investment_balance ?? 0),
      renter: atHorizon(lastRow?.renter_investment_balance ?? 0),
    },
    {
      label: 'Final net worth',
      owner: atHorizon(totals.owner_final_net_worth),
      renter: atHorizon(totals.renter_final_net_worth),
      variant: 'networth',
    },
    {
      label:
        ownerNetGainLoss >= 0 && renterNetGainLoss >= 0
          ? 'Net gain'
          : ownerNetGainLoss < 0 && renterNetGainLoss < 0
            ? 'Net loss'
            : 'Net gain / loss',
      owner: atHorizon(ownerNetGainLoss),
      renter: atHorizon(renterNetGainLoss),
      variant: 'gainloss',
    },
  ]

  function rowClass(variant: RowDef['variant']) {
    if (variant === 'subtotal') return 'border-t-2 border-surface-rule bg-surface-base'
    if (variant === 'networth') return 'border-t-2 border-ink-primary'
    if (variant === 'gainloss') return 'border-t border-surface-rule bg-surface-base'
    return 'border-t border-surface-rule'
  }

  function cellClass(variant: RowDef['variant']) {
    if (variant === 'subtotal')
      return 'py-2 px-3 text-sm font-medium text-right font-mono tabular-nums text-ink-primary'
    if (variant === 'networth')
      return 'py-3 px-3 text-sm font-semibold text-right font-mono tabular-nums text-ink-primary'
    if (variant === 'gainloss')
      return 'py-2 px-3 text-sm font-semibold text-right font-mono tabular-nums'
    if (variant === 'taxbenefit')
      return 'py-2 px-3 text-sm text-right font-mono tabular-nums text-signal-benefit'
    if (variant === 'capitalgainstax')
      return 'py-2 px-3 text-sm text-right font-mono tabular-nums text-signal-negative'
    return 'py-2 px-3 text-sm text-right font-mono tabular-nums text-ink-primary'
  }

  function labelClass(variant: RowDef['variant']) {
    if (variant === 'subtotal') return 'py-2 px-3 text-sm font-medium text-ink-primary'
    if (variant === 'networth') return 'py-3 px-3 text-sm font-semibold text-ink-primary'
    if (variant === 'gainloss') return 'py-2 px-3 text-sm font-semibold text-ink-primary'
    if (variant === 'taxbenefit') return 'py-2 px-3 text-sm text-signal-benefit'
    if (variant === 'capitalgainstax') return 'py-2 px-3 text-sm text-signal-negative'
    return 'py-2 px-3 text-sm text-ink-secondary'
  }

  function winnerColor(side: 'owner' | 'renter', variant: RowDef['variant']) {
    if (variant !== 'networth') return ''
    if (verdict.winner === 'tie') return ''
    const sideWins =
      (side === 'owner' && verdict.winner === 'buying') ||
      (side === 'renter' && verdict.winner === 'renting')
    if (!sideWins) return ''
    return side === 'owner' ? 'text-signal-buy' : 'text-signal-rent'
  }

  function gainLossColor(value: number | null) {
    if (value === null) return ''
    return value >= 0 ? 'text-signal-benefit' : 'text-signal-negative'
  }

  function formatGainLoss(value: number | null): string {
    if (value === null) return '—'
    return formatCurrency(value)
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-surface-rule bg-surface-panel p-6">
      <table className="w-full border-collapse">
        <caption className="sr-only">
          Cost breakdown comparing buying and renting over {inputs.shared.horizon_years} years
        </caption>
        <thead>
          <tr>
            <th
              scope="col"
              className="border-b border-surface-rule pb-2 text-left text-xs font-semibold uppercase tracking-widest text-ink-muted"
            >
              Category
            </th>
            <th
              scope="col"
              className="border-b border-surface-rule pb-2 text-right text-xs font-semibold uppercase tracking-widest text-ink-muted"
            >
              Buying
            </th>
            <th
              scope="col"
              className="border-b border-surface-rule pb-2 text-right text-xs font-semibold uppercase tracking-widest text-ink-muted"
            >
              Renting
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className={rowClass(row.variant)}>
              <td className={labelClass(row.variant)}>{row.label}</td>
              {row.variant === 'gainloss' ? (
                <>
                  <td className={`${cellClass(row.variant)} ${gainLossColor(row.owner)}`}>
                    {formatGainLoss(row.owner)}
                  </td>
                  <td className={`${cellClass(row.variant)} ${gainLossColor(row.renter)}`}>
                    {formatGainLoss(row.renter)}
                  </td>
                </>
              ) : (
                <>
                  <td className={`${cellClass(row.variant)} ${winnerColor('owner', row.variant)}`}>
                    {row.owner !== null ? formatCurrency(row.owner) : '—'}
                  </td>
                  <td className={`${cellClass(row.variant)} ${winnerColor('renter', row.variant)}`}>
                    {row.renter !== null ? formatCurrency(row.renter) : '—'}
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {real_dollars && (
        <p className="mt-3 text-xs text-ink-muted">
          Summed costs shown in nominal dollars; horizon-end totals shown in today's dollars.
        </p>
      )}
    </div>
  )
}
