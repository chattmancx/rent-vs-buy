import {
  type ScenarioInput,
  type ScenarioResult,
  type MonthlyRow,
  type YearlySummary,
  type ScenarioTotals,
  type Verdict,
  EngineInputError,
} from './types'
import {
  buildAmortizationSchedule,
  computeMonthlyPmi,
  computeMonthlyPropertyTaxBase,
} from './mortgage'
import { escalate } from './rent'
import { computeMonthlyInvestmentRate, growBalance } from './investment'
import { computeAnnualTaxBenefitBreakdown, computeCapitalGainsTax } from './tax'

function validateInputs(input: ScenarioInput): void {
  const allValues: number[] = [
    input.ownership.purchase_price,
    input.ownership.down_payment_pct,
    input.ownership.interest_rate,
    input.ownership.loan_term_years,
    input.ownership.pmi_rate,
    input.ownership.real_estate_tax_rate,
    input.ownership.assessed_value,
    input.ownership.homeowner_insurance_annual,
    input.ownership.hoa_monthly,
    input.ownership.home_size_sqft,
    input.ownership.closing_costs_pct,
    input.ownership.maintenance_pct_annual,
    input.ownership.home_appreciation_rate,
    input.ownership.hoa_increase_rate,
    input.ownership.maintenance_increase_rate,
    input.ownership.insurance_increase_rate,
    input.ownership.selling_cost_pct,
    input.rental.base_rent_monthly,
    input.rental.pet_rent_monthly,
    input.rental.parking_fee_monthly,
    input.rental.renters_insurance_monthly,
    input.rental.admin_fee,
    input.rental.security_deposit,
    input.rental.pet_deposit,
    input.rental.rent_increase_rate,
    input.rental.pet_rent_increase_rate,
    input.rental.parking_increase_rate,
    input.shared.utilities_monthly_base,
    input.shared.utilities_increase_rate,
    input.shared.horizon_years,
    input.shared.investment_return_rate,
    input.shared.invest_vs_spend_ratio,
    input.tax.gross_annual_income,
    input.tax.state_income_tax_annual,
  ]

  for (const v of allValues) {
    if (!Number.isFinite(v)) {
      throw new EngineInputError(`Non-finite input detected: ${v}`)
    }
  }
}

export function computeScenario(input: ScenarioInput): ScenarioResult {
  validateInputs(input)

  const { ownership: o, rental: r, shared: s } = input

  const downPaymentAmount = (o.purchase_price * o.down_payment_pct) / 100
  const loanAmount = o.purchase_price - downPaymentAmount
  const closingCostsAmount = (o.purchase_price * o.closing_costs_pct) / 100
  const pmiMonthly = computeMonthlyPmi(o.pmi_rate, loanAmount)
  const monthlyTaxBase = computeMonthlyPropertyTaxBase(
    o.real_estate_tax_rate,
    o.purchase_price,
    o.assessed_value,
  )
  const totalMonthsHorizon = s.horizon_years * 12
  const totalMonthsLoan = o.loan_term_years * 12
  const monthlyInvestRate = computeMonthlyInvestmentRate(s.investment_return_rate)

  // Build full amortization schedule for the entire loan term
  const fullAmort = buildAmortizationSchedule(
    loanAmount,
    o.interest_rate,
    o.loan_term_years,
    pmiMonthly,
    o.purchase_price,
  )

  // Opportunity cost seeding: owner's larger upfront outflow seeds the renter's investment balance.
  // Only admin_fee is a real renter cost; deposits are refundable.
  const ownerUpfront = downPaymentAmount + closingCostsAmount
  const renterUpfront = r.admin_fee
  const upfrontDiff = ownerUpfront - renterUpfront

  // In the typical case (owner pays more upfront), the renter's investment balance is seeded.
  // If the renter somehow paid more upfront, the owner's balance is seeded instead.
  let ownerInvestBalance = upfrontDiff < 0 ? Math.abs(upfrontDiff) * s.invest_vs_spend_ratio : 0
  let renterInvestBalance = upfrontDiff >= 0 ? upfrontDiff * s.invest_vs_spend_ratio : 0

  const monthlySchedule: MonthlyRow[] = []
  const yearlySummary: YearlySummary[] = []

  // Running totals
  let totalPrincipal = 0
  let totalInterest = 0
  let totalPmi = 0
  let totalPropertyTax = 0
  let totalHomeownerIns = 0
  let totalHoa = 0
  let totalMaintenance = 0
  let totalUtilitiesOwner = 0
  let totalRent = 0
  let totalPetRent = 0
  let totalParking = 0
  let totalRentersIns = 0
  let totalUtilitiesRenter = 0
  let yearOwnerCosts = 0
  let yearRenterCosts = 0

  // Tax benefit tracking
  let yearStartLoanBalance = loanAmount
  let monthlyTaxBenefit = 0
  let yearInterest = 0
  let yearPropertyTax = 0
  let totalMidBenefit = 0
  let totalSaltBenefit = 0
  let totalTaxBenefit = 0

  const baseMonthlyInsurance = o.homeowner_insurance_annual / 12
  const baseMonthlyMaintenance = ((o.maintenance_pct_annual / 100) * o.purchase_price) / 12

  for (let m = 1; m <= totalMonthsHorizon; m++) {
    const yearIndex = Math.ceil(m / 12) // 1-based year

    // Reset annual tax accumulators at start of each year
    if ((m - 1) % 12 === 0) {
      yearInterest = 0
      yearPropertyTax = 0
    }

    // Home value for this year: year 1 = purchase_price, escalates at year boundaries.
    // At horizon end (year = horizon_years), this matches purchase_price * (1+rate)^(horizon_years-1).
    // Sale price uses an explicit formula to add one final year of appreciation.
    const homeValue = escalate(o.purchase_price, o.home_appreciation_rate, yearIndex)

    // Pull amortization data; past the loan term, all values are zero (loan paid off)
    let principalPayment = 0
    let interestPayment = 0
    let pmiPayment = 0
    let remainingLoanBalance = 0

    if (m <= totalMonthsLoan) {
      const entry = fullAmort[m - 1]
      if (entry !== undefined) {
        principalPayment = entry.principal_payment
        interestPayment = entry.interest_payment
        pmiPayment = entry.pmi_payment
        remainingLoanBalance = entry.remaining_loan_balance
      }
    }

    // Escalating owner costs (year 1 uses base value; each subsequent year multiplies by (1+rate))
    const monthlyTax = escalate(monthlyTaxBase, o.home_appreciation_rate, yearIndex)
    const monthlyIns = escalate(baseMonthlyInsurance, o.insurance_increase_rate, yearIndex)
    const monthlyHoa = escalate(o.hoa_monthly, o.hoa_increase_rate, yearIndex)
    const monthlyMaint = escalate(baseMonthlyMaintenance, o.maintenance_increase_rate, yearIndex)
    const monthlyUtils = escalate(s.utilities_monthly_base, s.utilities_increase_rate, yearIndex)

    // Escalating renter costs
    const monthlyRent = escalate(r.base_rent_monthly, r.rent_increase_rate, yearIndex)
    const monthlyPetRent = escalate(r.pet_rent_monthly, r.pet_rent_increase_rate, yearIndex)
    const monthlyParking = escalate(r.parking_fee_monthly, r.parking_increase_rate, yearIndex)
    // renters_insurance: no dedicated escalation rate in the type; keep flat
    const monthlyRentersIns = r.renters_insurance_monthly

    // Monthly totals
    const ownerMonthly =
      principalPayment +
      interestPayment +
      pmiPayment +
      monthlyTax +
      monthlyIns +
      monthlyHoa +
      monthlyMaint +
      monthlyUtils
    const renterMonthly =
      monthlyRent + monthlyPetRent + monthlyParking + monthlyRentersIns + monthlyUtils

    yearInterest += interestPayment
    yearPropertyTax += monthlyTax

    // After-tax owner cost: reduces effective monthly outlay for differential/investment logic.
    // ownerMonthly (pre-tax) is preserved for outflow totals — reflects actual cash paid.
    const ownerMonthlyAfterTax = ownerMonthly - monthlyTaxBenefit

    // Monthly differential: positive = owner pays more, renter saves (and invests)
    const differential = ownerMonthlyAfterTax - renterMonthly
    let investedThisMonth = 0

    if (differential > 0) {
      // Owner costs more; renter invests the surplus
      const contribution = differential * s.invest_vs_spend_ratio
      investedThisMonth = contribution
      renterInvestBalance = growBalance(renterInvestBalance, contribution, monthlyInvestRate)
      ownerInvestBalance = growBalance(ownerInvestBalance, 0, monthlyInvestRate)
    } else if (differential < 0) {
      // Renter costs more; owner invests the surplus
      const contribution = Math.abs(differential) * s.invest_vs_spend_ratio
      investedThisMonth = contribution
      ownerInvestBalance = growBalance(ownerInvestBalance, contribution, monthlyInvestRate)
      renterInvestBalance = growBalance(renterInvestBalance, 0, monthlyInvestRate)
    } else {
      ownerInvestBalance = growBalance(ownerInvestBalance, 0, monthlyInvestRate)
      renterInvestBalance = growBalance(renterInvestBalance, 0, monthlyInvestRate)
    }

    // Net worth (selling costs apply to realized figure even for intermediate months)
    const sellingCostsAtT = homeValue * (o.selling_cost_pct / 100)
    const ownerPaperNW = homeValue - remainingLoanBalance + ownerInvestBalance
    const ownerRealizedNW = homeValue - remainingLoanBalance - sellingCostsAtT + ownerInvestBalance

    // Accumulate totals
    totalPrincipal += principalPayment
    totalInterest += interestPayment
    totalPmi += pmiPayment
    totalPropertyTax += monthlyTax
    totalHomeownerIns += monthlyIns
    totalHoa += monthlyHoa
    totalMaintenance += monthlyMaint
    totalUtilitiesOwner += monthlyUtils
    totalRent += monthlyRent
    totalPetRent += monthlyPetRent
    totalParking += monthlyParking
    totalRentersIns += monthlyRentersIns
    totalUtilitiesRenter += monthlyUtils
    yearOwnerCosts += ownerMonthly
    yearRenterCosts += renterMonthly

    monthlySchedule.push({
      month_index: m,
      year_index: yearIndex,
      mortgage_payment: principalPayment + interestPayment,
      principal_payment: principalPayment,
      interest_payment: interestPayment,
      pmi_payment: pmiPayment,
      property_tax: monthlyTax,
      homeowner_insurance: monthlyIns,
      hoa: monthlyHoa,
      home_maintenance: monthlyMaint,
      utilities_owner: monthlyUtils,
      remaining_loan_balance: remainingLoanBalance,
      home_value: homeValue,
      base_rent: monthlyRent,
      pet_rent: monthlyPetRent,
      parking_fee: monthlyParking,
      renters_insurance: monthlyRentersIns,
      utilities_renter: monthlyUtils,
      owner_total_monthly_cost: ownerMonthly,
      renter_total_monthly_cost: renterMonthly,
      monthly_differential: differential,
      invested_amount_this_month: investedThisMonth,
      owner_investment_balance: ownerInvestBalance,
      renter_investment_balance: renterInvestBalance,
      owner_paper_net_worth: ownerPaperNW,
      owner_realized_net_worth: ownerRealizedNW,
      tax_benefit_this_month: monthlyTaxBenefit,
    })

    // Build yearly summary at the last month of each year
    if (m % 12 === 0) {
      const taxBreakdown = computeAnnualTaxBenefitBreakdown({
        taxInput: input.tax,
        annualMortgageInterest: yearInterest,
        annualPropertyTax: yearPropertyTax,
        loanBalance: yearStartLoanBalance,
      })
      monthlyTaxBenefit = taxBreakdown.total / 12
      totalMidBenefit += taxBreakdown.mid_benefit
      totalSaltBenefit += taxBreakdown.salt_benefit
      totalTaxBenefit += taxBreakdown.total
      yearStartLoanBalance = remainingLoanBalance

      yearlySummary.push({
        year: yearIndex,
        owner_costs_this_year: yearOwnerCosts,
        renter_costs_this_year: yearRenterCosts,
        owner_equity_in_home: homeValue - remainingLoanBalance,
        owner_net_worth: ownerPaperNW,
        renter_net_worth: renterInvestBalance,
      })
      yearOwnerCosts = 0
      yearRenterCosts = 0
    }
  }

  // Sale proceeds: the home sells at one full year of appreciation beyond the schedule's last value.
  // purchase_price * (1 + rate)^horizon_years as specified in the brief.
  const saleHomeValue = o.purchase_price * Math.pow(1 + o.home_appreciation_rate, s.horizon_years)
  const lastMonth = monthlySchedule[monthlySchedule.length - 1]!
  const saleRemainingLoan = lastMonth.remaining_loan_balance
  const sellingCostsFinal = saleHomeValue * (o.selling_cost_pct / 100)
  const saleProceeds = saleHomeValue - saleRemainingLoan - sellingCostsFinal

  // Capital gains tax (IRC §121 primary-residence exclusion) reduces the
  // owner's realized proceeds but not the reported sale_proceeds total,
  // which stays pre-tax (see ScenarioTotals.sale_proceeds).
  const gain = saleHomeValue - sellingCostsFinal - o.purchase_price
  const capitalGainsBreakdown = computeCapitalGainsTax({
    taxInput: input.tax,
    gain,
    horizonYears: s.horizon_years,
  })
  const saleProceedsAfterTax = saleProceeds - capitalGainsBreakdown.tax

  const ownerFinalNetWorth = saleProceedsAfterTax + lastMonth.owner_investment_balance
  const renterFinalNetWorth = lastMonth.renter_investment_balance

  const totalOwnershipOutflows =
    totalPrincipal +
    totalInterest +
    totalPmi +
    totalPropertyTax +
    totalHomeownerIns +
    totalHoa +
    totalMaintenance +
    totalUtilitiesOwner +
    closingCostsAmount

  const totalRentershipOutflows =
    totalRent + totalPetRent + totalParking + totalRentersIns + totalUtilitiesRenter + r.admin_fee

  const totals: ScenarioTotals = {
    total_principal_paid: totalPrincipal,
    total_interest_paid: totalInterest,
    total_pmi_paid: totalPmi,
    total_property_taxes: totalPropertyTax,
    total_homeowner_insurance: totalHomeownerIns,
    total_hoa: totalHoa,
    total_maintenance: totalMaintenance,
    total_utilities_owner: totalUtilitiesOwner,
    total_closing_costs: closingCostsAmount,
    total_ownership_outflows: totalOwnershipOutflows,
    sale_proceeds: saleProceeds,
    owner_final_net_worth: ownerFinalNetWorth,
    total_mortgage_interest_deduction: totalMidBenefit,
    total_salt_benefit: totalSaltBenefit,
    total_tax_benefit: totalTaxBenefit,
    total_capital_gains_tax: capitalGainsBreakdown.tax,
    total_rent_paid: totalRent,
    total_pet_rent: totalPetRent,
    total_parking_fees: totalParking,
    total_renters_insurance: totalRentersIns,
    total_utilities_renter: totalUtilitiesRenter,
    total_admin_fee: r.admin_fee,
    total_rentership_outflows: totalRentershipOutflows,
    renter_final_net_worth: renterFinalNetWorth,
  }

  const margin = Math.abs(ownerFinalNetWorth - renterFinalNetWorth)
  const winner: Verdict['winner'] =
    margin < 1 ? 'tie' : ownerFinalNetWorth > renterFinalNetWorth ? 'buying' : 'renting'

  const verdict: Verdict = {
    winner,
    margin_usd: margin,
    owner_net_worth: ownerFinalNetWorth,
    renter_net_worth: renterFinalNetWorth,
  }

  return {
    inputs: input,
    monthly_schedule: monthlySchedule,
    yearly_summary: yearlySummary,
    totals,
    verdict,
  }
}
