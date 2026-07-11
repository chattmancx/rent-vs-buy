import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ExpertOptions } from '../ExpertOptions'
import { DEFAULT_INPUT } from '../../lib/defaults'

describe('ExpertOptions', () => {
  it('S15-1: renders three sections titled "Tax & Income", "Capital Gains", "Display Options" with no "(Expert)" suffix', () => {
    render(
      <ExpertOptions
        input={DEFAULT_INPUT}
        updateTax={vi.fn()}
        updateShared={vi.fn()}
        updateOwnership={vi.fn()}
      />,
    )
    expect(screen.getByText('Tax & Income')).toBeTruthy()
    expect(screen.getByText('Capital Gains')).toBeTruthy()
    expect(screen.getByText('Display Options')).toBeTruthy()
    expect(screen.queryByText(/\(Expert\)/)).toBeNull()
  })

  it('S15-2: Capital Gains checkbox reflects include_capital_gains and calls updateTax on change', () => {
    const updateTax = vi.fn()
    render(
      <ExpertOptions
        input={{ ...DEFAULT_INPUT, tax: { ...DEFAULT_INPUT.tax, taxes_enabled: true } }}
        updateTax={updateTax}
        updateShared={vi.fn()}
        updateOwnership={vi.fn()}
      />,
    )
    const checkbox = screen.getByLabelText('Include capital gains tax on sale') as HTMLInputElement
    expect(checkbox.checked).toBe(DEFAULT_INPUT.tax.include_capital_gains)
    fireEvent.click(checkbox)
    expect(updateTax).toHaveBeenCalledWith({
      include_capital_gains: !DEFAULT_INPUT.tax.include_capital_gains,
    })
  })

  it('S15-3: Capital Gains checkbox is disabled and dimmed when taxes_enabled is false', () => {
    render(
      <ExpertOptions
        input={{ ...DEFAULT_INPUT, tax: { ...DEFAULT_INPUT.tax, taxes_enabled: false } }}
        updateTax={vi.fn()}
        updateShared={vi.fn()}
        updateOwnership={vi.fn()}
      />,
    )
    const checkbox = screen.getByLabelText('Include capital gains tax on sale') as HTMLInputElement
    expect(checkbox.disabled).toBe(true)
    expect(checkbox.closest('.opacity-50')).not.toBeNull()
  })

  it('S15-4: Display Options reveals inflation rate field only when real_dollars is true', () => {
    const updateShared = vi.fn()
    const { rerender } = render(
      <ExpertOptions
        input={{ ...DEFAULT_INPUT, shared: { ...DEFAULT_INPUT.shared, real_dollars: false } }}
        updateTax={vi.fn()}
        updateShared={updateShared}
        updateOwnership={vi.fn()}
      />,
    )
    expect(screen.queryByText('Inflation rate assumption')).toBeNull()

    rerender(
      <ExpertOptions
        input={{ ...DEFAULT_INPUT, shared: { ...DEFAULT_INPUT.shared, real_dollars: true } }}
        updateTax={vi.fn()}
        updateShared={updateShared}
        updateOwnership={vi.fn()}
      />,
    )
    expect(screen.getByText('Inflation rate assumption')).toBeTruthy()

    fireEvent.click(screen.getByLabelText("Show in today's dollars"))
    expect(updateShared).toHaveBeenCalledWith({ real_dollars: false })
  })

  it('S17-1: renders a "Refinancing" section', () => {
    render(
      <ExpertOptions
        input={DEFAULT_INPUT}
        updateTax={vi.fn()}
        updateShared={vi.fn()}
        updateOwnership={vi.fn()}
      />,
    )
    expect(screen.getByText('Refinancing')).toBeTruthy()
    expect(screen.getByLabelText('Enable refinance')).toBeTruthy()
  })

  it('S17-2: refinance fields are dimmed/pointer-events-none when refinance_enabled is false', () => {
    render(
      <ExpertOptions
        input={{
          ...DEFAULT_INPUT,
          ownership: { ...DEFAULT_INPUT.ownership, refinance_enabled: false },
        }}
        updateTax={vi.fn()}
        updateShared={vi.fn()}
        updateOwnership={vi.fn()}
      />,
    )
    const triggerMonthLabel = screen.getByText('Trigger Month')
    expect(triggerMonthLabel.closest('.opacity-50')).not.toBeNull()
  })

  it('S17-3: refinance fields are enabled (not dimmed) when refinance_enabled is true', () => {
    render(
      <ExpertOptions
        input={{
          ...DEFAULT_INPUT,
          ownership: { ...DEFAULT_INPUT.ownership, refinance_enabled: true },
        }}
        updateTax={vi.fn()}
        updateShared={vi.fn()}
        updateOwnership={vi.fn()}
      />,
    )
    const triggerMonthLabel = screen.getByText('Trigger Month')
    expect(triggerMonthLabel.closest('.opacity-50')).toBeNull()
  })

  it('S17-4: toggling "Enable refinance" calls updateOwnership with refinance_enabled', () => {
    const updateOwnership = vi.fn()
    render(
      <ExpertOptions
        input={{
          ...DEFAULT_INPUT,
          ownership: { ...DEFAULT_INPUT.ownership, refinance_enabled: false },
        }}
        updateTax={vi.fn()}
        updateShared={vi.fn()}
        updateOwnership={updateOwnership}
      />,
    )
    fireEvent.click(screen.getByLabelText('Enable refinance'))
    expect(updateOwnership).toHaveBeenCalledWith({ refinance_enabled: true })
  })

  it('S17-5: each refinance field calls updateOwnership with the correct patch on change', () => {
    const updateOwnership = vi.fn()
    render(
      <ExpertOptions
        input={{
          ...DEFAULT_INPUT,
          ownership: { ...DEFAULT_INPUT.ownership, refinance_enabled: true },
        }}
        updateTax={vi.fn()}
        updateShared={vi.fn()}
        updateOwnership={updateOwnership}
      />,
    )
    fireEvent.change(screen.getByLabelText('Trigger Month'), { target: { value: '84' } })
    expect(updateOwnership).toHaveBeenCalledWith({ refinance_trigger_month: 84 })

    fireEvent.change(screen.getByLabelText('New Interest Rate'), { target: { value: '5.25' } })
    expect(updateOwnership).toHaveBeenCalledWith({ refinance_new_interest_rate: 5.25 })

    fireEvent.change(screen.getByLabelText('New Loan Term'), { target: { value: '15' } })
    expect(updateOwnership).toHaveBeenCalledWith({ refinance_new_loan_term_years: 15 })

    fireEvent.change(screen.getByLabelText('New Closing Costs'), { target: { value: '3' } })
    expect(updateOwnership).toHaveBeenCalledWith({ refinance_closing_costs_pct: 3 })
  })
})
