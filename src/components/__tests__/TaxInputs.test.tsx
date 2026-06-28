import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TaxInputs } from '../TaxInputs'
import { DEFAULT_INPUT } from '../../lib/defaults'
import { FEDERAL_TAX_AS_OF_DATE } from '../../engine'

const enabledInput = {
  ...DEFAULT_INPUT,
  tax: { ...DEFAULT_INPUT.tax, taxes_enabled: true },
}

describe('TaxInputs', () => {
  it('renders "Include federal tax effects" checkbox unchecked by default', () => {
    render(<TaxInputs input={DEFAULT_INPUT} updateTax={vi.fn()} />)
    const checkbox = screen.getByRole('checkbox', { name: /enable federal tax effects/i })
    expect((checkbox as HTMLInputElement).checked).toBe(false)
  })

  it('renders "Filing status" select with four options', () => {
    render(<TaxInputs input={DEFAULT_INPUT} updateTax={vi.fn()} />)
    const select = screen.getByLabelText(/filing status/i) as HTMLSelectElement
    expect(select.options.length).toBe(4)
  })

  it('renders state selector with at least 51 options', () => {
    render(<TaxInputs input={DEFAULT_INPUT} updateTax={vi.fn()} />)
    const select = screen.getByLabelText(/state/i) as HTMLSelectElement
    // 51 states + 1 placeholder disabled option
    expect(select.options.length).toBeGreaterThanOrEqual(51)
  })

  it('renders "Gross annual income" number input', () => {
    render(<TaxInputs input={DEFAULT_INPUT} updateTax={vi.fn()} />)
    const input = screen.getByLabelText(/gross annual income/i) as HTMLInputElement
    expect(input.type).toBe('number')
  })

  it('renders "Itemized mortgage expenses" checkbox', () => {
    render(<TaxInputs input={DEFAULT_INPUT} updateTax={vi.fn()} />)
    const checkboxes = screen.getAllByRole('checkbox')
    // Second checkbox is itemizes
    expect(checkboxes.length).toBeGreaterThanOrEqual(2)
    const itemizes = checkboxes.find((el) =>
      el.closest('label')?.textContent?.includes('Itemized mortgage expenses'),
    )
    expect(itemizes).toBeTruthy()
  })

  it('renders the "as of" disclosure note containing FEDERAL_TAX_AS_OF_DATE', () => {
    render(<TaxInputs input={DEFAULT_INPUT} updateTax={vi.fn()} />)
    expect(screen.getByText(new RegExp(FEDERAL_TAX_AS_OF_DATE))).toBeTruthy()
  })

  it('fields wrapper has opacity-50 class when taxes_enabled is false', () => {
    const { container } = render(<TaxInputs input={DEFAULT_INPUT} updateTax={vi.fn()} />)
    const wrapper = container.querySelector('.opacity-50')
    expect(wrapper).toBeTruthy()
  })

  it('checking "Include federal tax effects" calls updateTax({ taxes_enabled: true })', () => {
    const updateTax = vi.fn()
    render(<TaxInputs input={DEFAULT_INPUT} updateTax={updateTax} />)
    const checkbox = screen.getByRole('checkbox', { name: /enable federal tax effects/i })
    fireEvent.click(checkbox)
    expect(updateTax).toHaveBeenCalledWith({ taxes_enabled: true })
  })

  it('changing filing status calls updateTax with the new filing_status value', () => {
    const updateTax = vi.fn()
    render(<TaxInputs input={enabledInput} updateTax={updateTax} />)
    const select = screen.getByLabelText(/filing status/i)
    fireEvent.change(select, { target: { value: 'married_filing_jointly' } })
    expect(updateTax).toHaveBeenCalledWith({ filing_status: 'married_filing_jointly' })
  })

  it('changing gross income calls updateTax with the new gross_annual_income value', () => {
    const updateTax = vi.fn()
    render(<TaxInputs input={enabledInput} updateTax={updateTax} />)
    const input = screen.getByLabelText(/gross annual income/i)
    fireEvent.change(input, { target: { value: '100000' } })
    expect(updateTax).toHaveBeenCalledWith({ gross_annual_income: 100000 })
  })

  it('changing state calls updateTax with the new state value', () => {
    const updateTax = vi.fn()
    render(<TaxInputs input={enabledInput} updateTax={updateTax} />)
    const select = screen.getByLabelText(/state/i)
    fireEvent.change(select, { target: { value: 'Maryland' } })
    expect(updateTax).toHaveBeenCalledWith({ state: 'Maryland' })
  })

  it('checking "Itemized mortgage expenses" calls updateTax({ itemizes: true })', () => {
    const updateTax = vi.fn()
    render(<TaxInputs input={enabledInput} updateTax={updateTax} />)
    const checkboxes = screen.getAllByRole('checkbox')
    const itemizes = checkboxes.find((el) =>
      el.closest('label')?.textContent?.includes('Itemized mortgage expenses'),
    )!
    fireEvent.click(itemizes)
    expect(updateTax).toHaveBeenCalledWith({ itemizes: true })
  })
})
