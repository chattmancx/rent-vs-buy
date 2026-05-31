import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CostTable } from '../CostTable'
import { computeScenario } from '../../engine'
import { DEFAULT_INPUT } from '../../lib/defaults'

const result = computeScenario(DEFAULT_INPUT)

describe('CostTable', () => {
  it('renders Buying and Renting column headers', () => {
    render(<CostTable result={result} />)
    expect(screen.getByText('Buying')).toBeTruthy()
    expect(screen.getByText('Renting')).toBeTruthy()
  })

  it('renders the Final net worth row', () => {
    render(<CostTable result={result} />)
    expect(screen.getByText('Final net worth')).toBeTruthy()
  })

  it('renders formatted currency values containing $', () => {
    render(<CostTable result={result} />)
    const cells = screen.getAllByText(/\$[\d,]+/)
    expect(cells.length).toBeGreaterThan(0)
  })

  it('highlights the winning side net worth with green color', () => {
    render(<CostTable result={result} />)
    const greenCells = document.querySelectorAll('.text-green-700')
    expect(greenCells.length).toBeGreaterThan(0)
  })

  it('shows em dash for cells with no value on that side', () => {
    render(<CostTable result={result} />)
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThan(0)
  })
})
