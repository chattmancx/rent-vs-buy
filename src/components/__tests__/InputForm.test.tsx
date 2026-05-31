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
})
