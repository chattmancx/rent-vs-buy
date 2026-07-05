import type { ScenarioInput, OwnershipInput, RentalInput, SharedInput } from '../engine'
import { toPercent } from '../lib/format'
import { InputField } from './InputField'
import { InputSection } from './InputSection'

type AdvancedInputsProps = {
  input: ScenarioInput
  updateOwnership: (patch: Partial<OwnershipInput>) => void
  updateRental: (patch: Partial<RentalInput>) => void
  updateShared: (patch: Partial<SharedInput>) => void
}

export function AdvancedInputs({
  input,
  updateOwnership,
  updateRental,
  updateShared,
}: AdvancedInputsProps) {
  const { ownership, rental, shared } = input

  return (
    <>
      <InputSection title="Loan Details">
        <InputField
          label="Loan Term"
          value={ownership.loan_term_years}
          onChange={(v) => updateOwnership({ loan_term_years: v })}
          suffix="yrs"
          min={1}
          max={50}
          step={1}
          tooltip="Most mortgages are 30 years. A 15-year term builds equity faster but requires higher monthly payments."
        />
        <InputField
          label="PMI Rate"
          value={ownership.pmi_rate}
          onChange={(v) => updateOwnership({ pmi_rate: v })}
          suffix="%/yr"
          min={0}
          max={10}
          step={0.05}
          tooltip="Private Mortgage Insurance, required when down payment is below 20%. Typically 0.5–1.5%/yr of the loan."
        />
        <InputField
          label="Closing Costs"
          value={ownership.closing_costs_pct}
          onChange={(v) => updateOwnership({ closing_costs_pct: v })}
          suffix="%"
          min={0}
          max={20}
          step={0.1}
          tooltip="Upfront fees when buying: lender fees, title insurance, escrow. Typically 2–5% of purchase price."
        />
        <InputField
          label="Selling Cost"
          value={ownership.selling_cost_pct}
          onChange={(v) => updateOwnership({ selling_cost_pct: v })}
          suffix="%"
          min={0}
          max={30}
          step={0.1}
          tooltip="Cost to sell at horizon end: agent commissions, transfer taxes. Typically 6–8% of sale price."
        />
      </InputSection>

      <InputSection title="Property Costs">
        <InputField
          label="Property Tax Rate"
          value={ownership.real_estate_tax_rate}
          onChange={(v) => updateOwnership({ real_estate_tax_rate: v })}
          suffix="%/yr"
          min={0}
          max={10}
          step={0.05}
          tooltip="Annual property tax as a percentage of home value. Varies widely by location; 1–2% is typical."
        />
        <InputField
          label="Assessed Value"
          value={ownership.assessed_value}
          onChange={(v) => updateOwnership({ assessed_value: v })}
          prefix="$"
          min={0}
          step={1000}
          tooltip="Some counties tax based on assessed value rather than market value. Enter 0 to use purchase price."
        />
        <InputField
          label="Home Insurance"
          value={ownership.homeowner_insurance_annual}
          onChange={(v) => updateOwnership({ homeowner_insurance_annual: v })}
          prefix="$"
          suffix="/yr"
          min={0}
          step={50}
          tooltip="Annual home insurance premium. Roughly $1,000–$2,000/yr for a median home."
        />
        <InputField
          label="HOA Fee"
          value={ownership.hoa_monthly}
          onChange={(v) => updateOwnership({ hoa_monthly: v })}
          prefix="$"
          suffix="/mo"
          min={0}
          step={10}
          tooltip="Monthly Homeowners Association fee, if any. Covers shared amenities and maintenance."
        />
        <InputField
          label="Home Size"
          value={ownership.home_size_sqft}
          onChange={(v) => updateOwnership({ home_size_sqft: v })}
          suffix="sqft"
          min={0}
          step={100}
          tooltip="Square footage of the home. Used for reference; utilities are entered separately."
        />
        <InputField
          label="Maintenance"
          value={ownership.maintenance_pct_annual}
          onChange={(v) => updateOwnership({ maintenance_pct_annual: v })}
          suffix="%/yr"
          min={0}
          max={20}
          step={0.1}
          tooltip="Annual maintenance and repairs as a % of home value. The 1% rule is a common starting point."
        />
      </InputSection>

      <InputSection title="Appreciation & Escalation">
        <InputField
          label="Home Appreciation"
          value={toPercent(ownership.home_appreciation_rate)}
          onChange={(v) => updateOwnership({ home_appreciation_rate: v / 100 })}
          suffix="%/yr"
          min={-50}
          max={50}
          step={0.25}
          tooltip="Expected annual home value appreciation. The national average is ~4%/yr but varies by market."
        />
        <InputField
          label="HOA Escalation"
          value={toPercent(ownership.hoa_increase_rate)}
          onChange={(v) => updateOwnership({ hoa_increase_rate: v / 100 })}
          suffix="%/yr"
          min={-50}
          max={50}
          step={0.25}
        />
        <InputField
          label="Maintenance Escalation"
          value={toPercent(ownership.maintenance_increase_rate)}
          onChange={(v) => updateOwnership({ maintenance_increase_rate: v / 100 })}
          suffix="%/yr"
          min={-50}
          max={50}
          step={0.25}
        />
        <InputField
          label="Insurance Escalation"
          value={toPercent(ownership.insurance_increase_rate)}
          onChange={(v) => updateOwnership({ insurance_increase_rate: v / 100 })}
          suffix="%/yr"
          min={-50}
          max={50}
          step={0.25}
        />
        <InputField
          label="Rent Escalation"
          value={toPercent(rental.rent_increase_rate)}
          onChange={(v) => updateRental({ rent_increase_rate: v / 100 })}
          suffix="%/yr"
          min={-50}
          max={50}
          step={0.25}
          tooltip="Expected annual rent increase. The national average is ~3–5%/yr."
        />
        <InputField
          label="Utilities"
          value={shared.utilities_monthly_base}
          onChange={(v) => updateShared({ utilities_monthly_base: v })}
          prefix="$"
          suffix="/mo"
          min={0}
          step={10}
          tooltip="Combined monthly utilities (electric, gas, water, etc.) in the first year. Assuming the same property types are being compared."
        />
        <InputField
          label="Utilities Escalation"
          value={toPercent(shared.utilities_increase_rate)}
          onChange={(v) => updateShared({ utilities_increase_rate: v / 100 })}
          suffix="%/yr"
          min={-50}
          max={50}
          step={0.25}
        />
      </InputSection>

      <InputSection title="Rental Details">
        <InputField
          label="Pet Rent"
          value={rental.pet_rent_monthly}
          onChange={(v) => updateRental({ pet_rent_monthly: v })}
          prefix="$"
          suffix="/mo"
          min={0}
          step={5}
        />
        <InputField
          label="Pet Rent Escalation"
          value={toPercent(rental.pet_rent_increase_rate)}
          onChange={(v) => updateRental({ pet_rent_increase_rate: v / 100 })}
          suffix="%/yr"
          min={-50}
          max={50}
          step={0.25}
        />
        <InputField
          label="Parking Fee"
          value={rental.parking_fee_monthly}
          onChange={(v) => updateRental({ parking_fee_monthly: v })}
          prefix="$"
          suffix="/mo"
          min={0}
          step={5}
        />
        <InputField
          label="Parking Escalation"
          value={toPercent(rental.parking_increase_rate)}
          onChange={(v) => updateRental({ parking_increase_rate: v / 100 })}
          suffix="%/yr"
          min={-50}
          max={50}
          step={0.25}
        />
        <InputField
          label="Renters Insurance"
          value={rental.renters_insurance_monthly}
          onChange={(v) => updateRental({ renters_insurance_monthly: v })}
          prefix="$"
          suffix="/mo"
          min={0}
          step={5}
          tooltip="Renters insurance protects your belongings. Typically $15–$30/month."
        />
        <InputField
          label="Admin Fee"
          value={rental.admin_fee}
          onChange={(v) => updateRental({ admin_fee: v })}
          prefix="$"
          min={0}
          step={50}
          tooltip="A one-time, non-refundable fee charged by some landlords at move-in (also called an application or move-in fee)."
        />
        <InputField
          label="Security Deposit"
          value={rental.security_deposit}
          onChange={(v) => updateRental({ security_deposit: v })}
          prefix="$"
          min={0}
          step={100}
          tooltip="A refundable deposit returned when you move out (minus damages). Not counted as a rental cost."
        />
        <InputField
          label="Pet Deposit"
          value={rental.pet_deposit}
          onChange={(v) => updateRental({ pet_deposit: v })}
          prefix="$"
          min={0}
          step={50}
        />
      </InputSection>
    </>
  )
}
