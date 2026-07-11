import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ChartTabs } from '../ChartTabs'
import { computeScenario } from '../../engine'
import { DEFAULT_INPUT } from '../../lib/defaults'

beforeEach(() => {
  Object.defineProperty(window, 'location', { value: { search: '' }, writable: true })
  vi.spyOn(history, 'replaceState').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ChartTabs', () => {
  it('S16-15: renders the shared horizon slider once and calls updateShared regardless of active tab', () => {
    const result = computeScenario(DEFAULT_INPUT)
    const updateShared = vi.fn()
    render(<ChartTabs result={result} updateShared={updateShared} />)

    expect(screen.getAllByRole('slider', { name: /chart horizon/i })).toHaveLength(1)

    fireEvent.click(screen.getByRole('tab', { name: 'Costs Over Time' }))
    expect(screen.getAllByRole('slider', { name: /chart horizon/i })).toHaveLength(1)

    const slider = screen.getByRole('slider', { name: /chart horizon/i })
    fireEvent.change(slider, { target: { value: '15' } })
    expect(updateShared).toHaveBeenCalledWith({ horizon_years: 15 })
  })

  it('S16-16: switching tabs does not reset or affect the slider displayed value', () => {
    const result = computeScenario(DEFAULT_INPUT)
    const updateShared = vi.fn()
    render(<ChartTabs result={result} updateShared={updateShared} />)

    const sliderBefore = screen.getByRole('slider', { name: /chart horizon/i }) as HTMLInputElement
    const initialValue = sliderBefore.value

    fireEvent.click(screen.getByRole('tab', { name: 'Monthly Cost Change' }))
    const sliderAfter = screen.getByRole('slider', { name: /chart horizon/i }) as HTMLInputElement
    expect(sliderAfter.value).toBe(initialValue)

    fireEvent.click(screen.getByRole('tab', { name: 'Net Worth' }))
    const sliderBack = screen.getByRole('slider', { name: /chart horizon/i }) as HTMLInputElement
    expect(sliderBack.value).toBe(initialValue)
  })
})
