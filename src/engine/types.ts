export type OwnershipInput = {
  purchase_price: number
  down_payment_pct: number // percentage, e.g. 20 for 20%
  interest_rate: number // annual percentage, e.g. 6.722
  loan_term_years: number
  pmi_rate: number // annual percentage; 0 = no PMI
  real_estate_tax_rate: number // annual percentage of home value
  assessed_value: number // USD; 0 = use purchase_price as tax basis
  homeowner_insurance_annual: number // USD per year
  hoa_monthly: number // USD per month
  home_size_sqft: number // used for reference; utilities come from SharedInput
  closing_costs_pct: number // percentage of purchase price
  maintenance_pct_annual: number // percentage of home value per year
  home_appreciation_rate: number // annual, decimal, e.g. 0.04
  hoa_increase_rate: number // annual, decimal
  maintenance_increase_rate: number // annual, decimal
  insurance_increase_rate: number // annual, decimal
  selling_cost_pct: number // percentage of sale price at horizon end
}

export type RentalInput = {
  base_rent_monthly: number
  pet_rent_monthly: number
  parking_fee_monthly: number
  renters_insurance_monthly: number
  admin_fee: number // one-time, non-refundable; counted as cost
  security_deposit: number // refundable; NOT counted as cost
  pet_deposit: number // refundable; NOT counted as cost
  rent_increase_rate: number // annual, decimal
  pet_rent_increase_rate: number // annual, decimal
  parking_increase_rate: number // annual, decimal
}

export type SharedInput = {
  utilities_monthly_base: number // USD per month at year 1
  utilities_increase_rate: number // annual, decimal
  horizon_years: number // 1 to 30
  investment_return_rate: number // annual, decimal, e.g. 0.075
  invest_vs_spend_ratio: number // 0.0 to 1.0
  real_dollars: boolean // display-only; not consumed by computeScenario — see Stage 13 brief
  inflation_rate: number // display-only; not consumed by computeScenario — see Stage 13 brief
}

export type FilingStatus =
  | 'single'
  | 'married_filing_jointly'
  | 'married_filing_separately'
  | 'head_of_household'

export type TaxInput = {
  taxes_enabled: boolean
  filing_status: FilingStatus
  gross_annual_income: number
  state_income_tax_annual: number // USD; used for SALT cap calculation only
  state: string // canonical state name e.g. 'Maryland'; '' = not selected
  itemizes: boolean // if false, forces tax benefit to zero regardless of math
  include_capital_gains: boolean // if false, forces capital gains tax to zero regardless of the math, independent of taxes_enabled
}

export type ScenarioInput = {
  ownership: OwnershipInput
  rental: RentalInput
  shared: SharedInput
  tax: TaxInput
}

export type MonthlyRow = {
  month_index: number // 1-based
  year_index: number // 1-based
  // Ownership side
  mortgage_payment: number // principal + interest only
  principal_payment: number
  interest_payment: number
  pmi_payment: number
  property_tax: number
  homeowner_insurance: number
  hoa: number
  home_maintenance: number
  utilities_owner: number
  remaining_loan_balance: number
  home_value: number
  // Rental side
  base_rent: number
  pet_rent: number
  parking_fee: number
  renters_insurance: number
  utilities_renter: number
  // Differential and investment tracking
  owner_total_monthly_cost: number
  renter_total_monthly_cost: number
  monthly_differential: number // positive = owning costs more
  invested_amount_this_month: number
  owner_investment_balance: number
  renter_investment_balance: number
  // Net worth
  owner_paper_net_worth: number // equity + investment, no selling costs
  owner_realized_net_worth: number // equity - selling costs + investment
  tax_benefit_this_month: number // USD; owner's monthly effective cost reduction from federal tax
}

export type YearlySummary = {
  year: number // 1-based
  owner_costs_this_year: number
  renter_costs_this_year: number
  owner_equity_in_home: number // home_value - remaining_loan at year end
  owner_net_worth: number
  renter_net_worth: number
}

export type ScenarioTotals = {
  // Ownership totals
  total_principal_paid: number
  total_interest_paid: number
  total_pmi_paid: number
  total_property_taxes: number
  total_homeowner_insurance: number
  total_hoa: number
  total_maintenance: number
  total_utilities_owner: number
  total_closing_costs: number
  total_ownership_outflows: number
  sale_proceeds: number
  owner_final_net_worth: number
  total_mortgage_interest_deduction: number // USD; total MID claimed over horizon
  total_salt_benefit: number // USD; total property tax benefit claimed (post-cap)
  total_tax_benefit: number // USD; sum of all federal tax benefits over horizon
  total_capital_gains_tax: number // USD; federal LTCG tax on sale-year gain, after §121 exclusion
  // Rental totals
  total_rent_paid: number
  total_pet_rent: number
  total_parking_fees: number
  total_renters_insurance: number
  total_utilities_renter: number
  total_admin_fee: number
  total_rentership_outflows: number
  renter_final_net_worth: number
}

export type Verdict = {
  winner: 'buying' | 'renting' | 'tie'
  margin_usd: number
  owner_net_worth: number
  renter_net_worth: number
}

export type ScenarioResult = {
  inputs: ScenarioInput
  monthly_schedule: MonthlyRow[]
  yearly_summary: YearlySummary[]
  totals: ScenarioTotals
  verdict: Verdict
}

export class EngineInputError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'EngineInputError'
  }
}
