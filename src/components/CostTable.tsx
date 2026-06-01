import type { ScenarioResult } from '../engine'
import { formatCurrency } from '../lib/format'

type CostTableProps = {
  result: ScenarioResult
}

type RowDef = {
  label: string
  owner: number | null
  renter: number | null
  variant?: 'normal' | 'subtotal' | 'networth' | 'gainloss'
}

export function CostTable({ result }: CostTableProps) {
  const { totals, verdict, inputs } = result
  const lastRow = result.monthly_schedule[result.monthly_schedule.length - 1] ?? null
  const downPayment = inputs.ownership.purchase_price * (inputs.ownership.down_payment_pct / 100)

  const ownerNetGainLoss =
    totals.owner_final_net_worth - (totals.total_ownership_outflows + downPayment)
  const renterNetGainLoss = totals.renter_final_net_worth - totals.total_rentership_outflows

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
    {
      label: 'Total outflows',
      owner: totals.total_ownership_outflows,
      renter: totals.total_rentership_outflows,
      variant: 'subtotal',
    },
    { label: 'Sale proceeds', owner: totals.sale_proceeds, renter: null },
    {
      label: 'Investment portfolio',
      owner: lastRow?.owner_investment_balance ?? 0,
      renter: lastRow?.renter_investment_balance ?? 0,
    },
    {
      label: 'Final net worth',
      owner: totals.owner_final_net_worth,
      renter: totals.renter_final_net_worth,
      variant: 'networth',
    },
    {
      label:
        ownerNetGainLoss >= 0 && renterNetGainLoss >= 0
          ? 'Net gain'
          : ownerNetGainLoss < 0 && renterNetGainLoss < 0
            ? 'Net loss'
            : 'Net gain / loss',
      owner: ownerNetGainLoss,
      renter: renterNetGainLoss,
      variant: 'gainloss',
    },
  ]

  function rowClass(variant: RowDef['variant']) {
    if (variant === 'subtotal') return 'border-t-2 border-gray-300 bg-gray-50'
    if (variant === 'networth') return 'border-t-2 border-gray-400'
    if (variant === 'gainloss') return 'border-t border-gray-200 bg-gray-50'
    return 'border-t border-gray-100'
  }

  function cellClass(variant: RowDef['variant']) {
    if (variant === 'subtotal') return 'py-2 px-3 text-sm font-semibold text-right tabular-nums'
    if (variant === 'networth') return 'py-2 px-3 text-base font-bold text-right tabular-nums'
    if (variant === 'gainloss') return 'py-2 px-3 text-sm font-semibold text-right tabular-nums'
    return 'py-2 px-3 text-sm text-right tabular-nums'
  }

  function labelClass(variant: RowDef['variant']) {
    if (variant === 'subtotal') return 'py-2 px-3 text-sm font-semibold text-gray-700'
    if (variant === 'networth') return 'py-2 px-3 text-base font-bold text-gray-900'
    if (variant === 'gainloss') return 'py-2 px-3 text-sm font-semibold text-gray-700'
    return 'py-2 px-3 text-sm text-gray-600'
  }

  function winnerColor(side: 'owner' | 'renter', variant: RowDef['variant']) {
    if (variant !== 'networth') return ''
    if (verdict.winner === 'tie') return ''
    const sideWins =
      (side === 'owner' && verdict.winner === 'buying') ||
      (side === 'renter' && verdict.winner === 'renting')
    return sideWins ? 'text-green-700' : ''
  }

  function gainLossColor(value: number | null) {
    if (value === null) return ''
    return value >= 0 ? 'text-green-700' : 'text-red-700'
  }

  function formatGainLoss(value: number | null): string {
    if (value === null) return '—'
    const formatted = formatCurrency(Math.abs(value))
    return value >= 0 ? `+${formatted}` : `-${formatted}`
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full border-collapse">
        <caption className="sr-only">
          Cost breakdown comparing buying and renting over {inputs.shared.horizon_years} years
        </caption>
        <thead>
          <tr className="bg-gray-100">
            <th scope="col" className="py-2 px-3 text-left text-sm font-semibold text-gray-700">
              Category
            </th>
            <th scope="col" className="py-2 px-3 text-right text-sm font-semibold text-gray-700">
              Buying
            </th>
            <th scope="col" className="py-2 px-3 text-right text-sm font-semibold text-gray-700">
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
    </div>
  )
}
