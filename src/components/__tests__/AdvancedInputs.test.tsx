import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AdvancedInputs } from '../AdvancedInputs'
import { DEFAULT_INPUT } from '../../lib/defaults'

describe('AdvancedInputs', () => {
  it('S14-11: Utilities tooltip includes the same-property-type note', () => {
    render(
      <AdvancedInputs
        input={DEFAULT_INPUT}
        updateOwnership={vi.fn()}
        updateRental={vi.fn()}
        updateShared={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByText('Appreciation & Escalation'))
    const button = screen.getByRole('button', { name: 'More information about Utilities' })
    fireEvent.focus(button)
    expect(screen.getByRole('tooltip').textContent).toContain(
      'Assuming the same property types are being compared.',
    )
  })
})
