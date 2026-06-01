import type { ScenarioResult } from '../engine/types'

function sanitize(value: string | number): string {
  const str = String(value)
  return /^[=+\-@\t\r]/.test(str) ? `'${str}` : str
}

function row(...cells: (string | number)[]): string {
  return cells.map(sanitize).join(',')
}

function fmt(n: number): number {
  return Math.round(n)
}

export function exportToCsv(result: ScenarioResult): string {
  const { monthly_schedule, totals, verdict, inputs } = result
  const lines: string[] = []

  const verdictLabel =
    verdict.winner === 'tie' ? 'Tie' : verdict.winner === 'buying' ? 'Buying wins' : 'Renting wins'

  lines.push('Rent vs. Buy Analysis')
  lines.push(row('Verdict', verdictLabel, 'Margin', fmt(verdict.margin_usd)))
  lines.push(row('Horizon', `${inputs.shared.horizon_years} years`))
  lines.push('')

  lines.push(
    row(
      'Month',
      'Year',
      'Owner Total Monthly Cost',
      'Renter Total Monthly Cost',
      'Mortgage Payment',
      'Principal',
      'Interest',
      'PMI',
      'Property Tax',
      'Home Insurance',
      'HOA',
      'Maintenance',
      'Owner Utilities',
      'Base Rent',
      'Pet Rent',
      'Parking',
      'Renters Insurance',
      'Renter Utilities',
      'Owner Investment Balance',
      'Renter Investment Balance',
      'Home Value',
      'Remaining Loan Balance',
      'Owner Net Worth',
      'Renter Net Worth',
    ),
  )

  for (const m of monthly_schedule) {
    lines.push(
      row(
        m.month_index,
        m.year_index,
        fmt(m.owner_total_monthly_cost),
        fmt(m.renter_total_monthly_cost),
        fmt(m.mortgage_payment),
        fmt(m.principal_payment),
        fmt(m.interest_payment),
        fmt(m.pmi_payment),
        fmt(m.property_tax),
        fmt(m.homeowner_insurance),
        fmt(m.hoa),
        fmt(m.home_maintenance),
        fmt(m.utilities_owner),
        fmt(m.base_rent),
        fmt(m.pet_rent),
        fmt(m.parking_fee),
        fmt(m.renters_insurance),
        fmt(m.utilities_renter),
        fmt(m.owner_investment_balance),
        fmt(m.renter_investment_balance),
        fmt(m.home_value),
        fmt(m.remaining_loan_balance),
        fmt(m.owner_paper_net_worth),
        fmt(m.renter_investment_balance),
      ),
    )
  }

  lines.push('')
  lines.push('Key Totals')
  lines.push(row('Total Ownership Outflows', fmt(totals.total_ownership_outflows)))
  lines.push(row('Total Rentership Outflows', fmt(totals.total_rentership_outflows)))
  lines.push(row('Sale Proceeds', fmt(totals.sale_proceeds)))
  lines.push(row('Owner Final Net Worth', fmt(totals.owner_final_net_worth)))
  lines.push(row('Renter Final Net Worth', fmt(totals.renter_final_net_worth)))

  return lines.join('\n')
}
