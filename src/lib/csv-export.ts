import type { ScenarioResult } from '../engine/types'

function sanitize(value: string | number): string {
  const str = String(value)
  return /^[=+\-@\t\r]/.test(str) ? `'${str}` : str
}

function row(...cells: (string | number)[]): string {
  return cells.map(sanitize).join(',')
}

export function exportToCsv(result: ScenarioResult): string {
  const { yearly_summary, totals, verdict, inputs } = result
  const lines: string[] = []

  const verdictLabel =
    verdict.winner === 'tie' ? 'Tie' : verdict.winner === 'buying' ? 'Buying wins' : 'Renting wins'

  lines.push('Rent vs. Buy Analysis')
  lines.push(row('Verdict', verdictLabel, 'Margin', verdict.margin_usd))
  lines.push(row('Horizon', `${inputs.shared.horizon_years} years`))
  lines.push('')

  lines.push(
    row(
      'Year',
      'Owner Net Worth',
      'Renter Net Worth',
      'Owner Costs This Year',
      'Renter Costs This Year',
      'Owner Equity in Home',
    ),
  )
  for (const yr of yearly_summary) {
    lines.push(
      row(
        yr.year,
        yr.owner_net_worth,
        yr.renter_net_worth,
        yr.owner_costs_this_year,
        yr.renter_costs_this_year,
        yr.owner_equity_in_home,
      ),
    )
  }
  lines.push('')

  lines.push('Key Totals')
  lines.push(row('Total Ownership Outflows', totals.total_ownership_outflows))
  lines.push(row('Total Rentership Outflows', totals.total_rentership_outflows))
  lines.push(row('Sale Proceeds', totals.sale_proceeds))
  lines.push(row('Owner Final Net Worth', totals.owner_final_net_worth))
  lines.push(row('Renter Final Net Worth', totals.renter_final_net_worth))

  return lines.join('\n')
}
