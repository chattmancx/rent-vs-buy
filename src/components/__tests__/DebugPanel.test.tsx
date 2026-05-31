import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DebugPanel } from '../DebugPanel'
import { computeScenario } from '../../engine'
import { DEFAULT_INPUT } from '../../lib/defaults'

const result = computeScenario(DEFAULT_INPUT)

describe('DebugPanel', () => {
  it('renders without crashing', () => {
    render(<DebugPanel result={result} />)
    expect(screen.getByText('Debug: Raw Engine Output')).toBeTruthy()
  })

  it('is closed by default', () => {
    render(<DebugPanel result={result} />)
    const details = screen.getByText('Debug: Raw Engine Output').closest('details')
    expect(details?.hasAttribute('open')).toBe(false)
  })

  it('shows winner text when opened', () => {
    render(<DebugPanel result={result} />)
    const details = screen.getByText('Debug: Raw Engine Output').closest('details')
    if (details) details.setAttribute('open', '')
    const winner = result.verdict.winner
    expect(screen.getAllByText(new RegExp(winner)).length).toBeGreaterThan(0)
  })
})
