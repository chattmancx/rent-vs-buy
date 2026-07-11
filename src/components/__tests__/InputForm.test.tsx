import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import App from '../../App'

beforeEach(() => {
  Object.defineProperty(window, 'location', {
    value: { search: '' },
    writable: true,
  })
  vi.spyOn(history, 'replaceState').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('App input form', () => {
  it('renders purchase price default value', () => {
    render(<App />)
    const input = screen.getByDisplayValue('550000')
    expect(input).toBeTruthy()
  })

  it('updates purchase price when changed', () => {
    render(<App />)
    const input = screen.getByDisplayValue('550000') as HTMLInputElement
    fireEvent.change(input, { target: { value: '600000' } })
    expect((screen.getByDisplayValue('600000') as HTMLInputElement).value).toBe('600000')
  })

  it('advanced options section starts collapsed', () => {
    render(<App />)
    const details = screen.getByText('Advanced Options').closest('details')
    expect(details?.hasAttribute('open')).toBe(false)
  })

  it('reveals advanced fields when Advanced Options is toggled', () => {
    render(<App />)
    const summary = screen.getByText('Advanced Options')
    fireEvent.click(summary)
    // PMI Rate is an advanced-only field
    expect(screen.getByText('PMI Rate')).toBeTruthy()
  })

  it('renders a main landmark element', () => {
    render(<App />)
    expect(document.querySelector('main')).not.toBeNull()
  })

  it('range sliders have aria-label attributes', () => {
    render(<App />)
    const sliders = document.querySelectorAll('input[type="range"]')
    sliders.forEach((slider) => {
      expect(slider.getAttribute('aria-label')).not.toBeNull()
    })
  })

  it('CG-17: "Capital Gains" section renders with include_capital_gains checked by default', () => {
    render(<App />)
    const checkbox = screen.getByLabelText('Include capital gains tax on sale') as HTMLInputElement
    expect(checkbox.checked).toBe(true)
  })

  it('CG-18: unchecking the toggle removes the Capital gains tax row even with a taxable gain', () => {
    render(<App />)
    // Enable taxes
    fireEvent.click(screen.getByLabelText('Enable federal tax effects'))
    // Extend horizon so the sale-year gain exceeds the $250K single exclusion
    const horizonSlider = screen.getByLabelText('Analysis horizon in years') as HTMLInputElement
    fireEvent.change(horizonSlider, { target: { value: '20' } })
    // Income high enough to land in a nonzero LTCG bracket
    const incomeInput = screen.getByLabelText('Gross annual income') as HTMLInputElement
    fireEvent.change(incomeInput, { target: { value: '150000' } })

    expect(screen.getByText('Capital gains tax')).toBeTruthy()

    fireEvent.click(screen.getByLabelText('Include capital gains tax on sale'))
    expect(screen.queryByText('Capital gains tax')).toBeNull()
  })

  it('CG-19: the Capital Gains section control is disabled when taxes_enabled is false', () => {
    render(<App />)
    const checkbox = screen.getByLabelText('Include capital gains tax on sale') as HTMLInputElement
    expect(checkbox.disabled).toBe(true)
    expect(checkbox.closest('.opacity-50')).not.toBeNull()
  })
})
