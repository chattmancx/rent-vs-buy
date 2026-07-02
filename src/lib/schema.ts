import { z } from 'zod'

const OwnershipSchema = z.object({
  purchase_price: z.number().finite().positive(),
  down_payment_pct: z.number().finite().min(0).max(100),
  interest_rate: z.number().finite().min(0).max(100),
  loan_term_years: z.number().finite().int().min(1).max(50),
  pmi_rate: z.number().finite().min(0).max(10),
  real_estate_tax_rate: z.number().finite().min(0).max(10),
  assessed_value: z.number().finite().min(0),
  homeowner_insurance_annual: z.number().finite().min(0),
  hoa_monthly: z.number().finite().min(0),
  home_size_sqft: z.number().finite().min(0),
  closing_costs_pct: z.number().finite().min(0).max(20),
  maintenance_pct_annual: z.number().finite().min(0).max(20),
  home_appreciation_rate: z.number().finite().min(-0.5).max(0.5),
  hoa_increase_rate: z.number().finite().min(-0.5).max(0.5),
  maintenance_increase_rate: z.number().finite().min(-0.5).max(0.5),
  insurance_increase_rate: z.number().finite().min(-0.5).max(0.5),
  selling_cost_pct: z.number().finite().min(0).max(30),
})

const RentalSchema = z.object({
  base_rent_monthly: z.number().finite().min(0),
  pet_rent_monthly: z.number().finite().min(0),
  parking_fee_monthly: z.number().finite().min(0),
  renters_insurance_monthly: z.number().finite().min(0),
  admin_fee: z.number().finite().min(0),
  security_deposit: z.number().finite().min(0),
  pet_deposit: z.number().finite().min(0),
  rent_increase_rate: z.number().finite().min(-0.5).max(0.5),
  pet_rent_increase_rate: z.number().finite().min(-0.5).max(0.5),
  parking_increase_rate: z.number().finite().min(-0.5).max(0.5),
})

const SharedSchema = z.object({
  utilities_monthly_base: z.number().finite().min(0),
  utilities_increase_rate: z.number().finite().min(-0.5).max(0.5),
  horizon_years: z.number().finite().int().min(1).max(30),
  investment_return_rate: z.number().finite().min(-0.5).max(0.5),
  invest_vs_spend_ratio: z.number().finite().min(0).max(1),
})

const FilingStatusSchema = z.enum([
  'single',
  'married_filing_jointly',
  'married_filing_separately',
  'head_of_household',
])

const TaxSchema = z.object({
  taxes_enabled: z.boolean(),
  filing_status: FilingStatusSchema,
  gross_annual_income: z.number().finite().min(0),
  state_income_tax_annual: z.number().finite().min(0),
  state: z.string().default(''),
  itemizes: z.boolean().default(false),
  include_capital_gains: z.boolean().default(true),
})

const DEFAULT_TAX = {
  taxes_enabled: false,
  filing_status: 'single' as const,
  gross_annual_income: 0,
  state_income_tax_annual: 0,
  state: '',
  itemizes: false,
  include_capital_gains: true,
}

export const ScenarioInputSchema = z.object({
  ownership: OwnershipSchema,
  rental: RentalSchema,
  shared: SharedSchema,
  tax: TaxSchema.optional().default(DEFAULT_TAX),
})

export type ValidatedScenarioInput = z.infer<typeof ScenarioInputSchema>
