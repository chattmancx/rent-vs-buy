import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useScenario } from '../useScenario'

beforeEach(() => {
  window.history.replaceState(null, '', '/')
})

describe('useScenario — updateTax', () => {
  it('updateTax({ taxes_enabled: true }) updates state.input.tax.taxes_enabled', () => {
    const { result } = renderHook(() => useScenario())
    expect(result.current.input.tax.taxes_enabled).toBe(false)
    act(() => {
      result.current.updateTax({ taxes_enabled: true })
    })
    expect(result.current.input.tax.taxes_enabled).toBe(true)
  })

  it('taxes_enabled + state + income → state_income_tax_annual is non-zero', () => {
    const { result } = renderHook(() => useScenario())
    act(() => {
      result.current.updateTax({
        taxes_enabled: true,
        state: 'Maryland',
        gross_annual_income: 100000,
      })
    })
    expect(result.current.input.tax.state_income_tax_annual).toBeGreaterThan(0)
  })

  it('taxes_enabled: false → state_income_tax_annual stays 0 regardless of state and income', () => {
    const { result } = renderHook(() => useScenario())
    act(() => {
      result.current.updateTax({
        taxes_enabled: false,
        state: 'Maryland',
        gross_annual_income: 100000,
      })
    })
    expect(result.current.input.tax.state_income_tax_annual).toBe(0)
  })

  it('state is empty string → state_income_tax_annual stays 0', () => {
    const { result } = renderHook(() => useScenario())
    act(() => {
      result.current.updateTax({
        taxes_enabled: true,
        state: '',
        gross_annual_income: 100000,
      })
    })
    expect(result.current.input.tax.state_income_tax_annual).toBe(0)
  })

  it('filing_status MFS is stored as MFS in input.tax even though estimation maps to single', () => {
    const { result } = renderHook(() => useScenario())
    act(() => {
      result.current.updateTax({ filing_status: 'married_filing_separately' })
    })
    expect(result.current.input.tax.filing_status).toBe('married_filing_separately')
  })
})
