import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Tabs } from '../Tabs'

const tabs = [
  { id: 'one', label: 'One', content: <p>Content One</p> },
  { id: 'two', label: 'Two', content: <p>Content Two</p> },
  { id: 'three', label: 'Three', content: <p>Content Three</p> },
]

describe('Tabs', () => {
  it('S16-10: renders a tablist with 3 tabs, correct aria-selected on the default-active tab', () => {
    render(<Tabs tabs={tabs} ariaLabel="Test tabs" />)
    expect(screen.getByRole('tablist', { name: 'Test tabs' })).toBeTruthy()
    const tabButtons = screen.getAllByRole('tab')
    expect(tabButtons).toHaveLength(3)
    expect(tabButtons[0]).toHaveAttribute('aria-selected', 'true')
    expect(tabButtons[1]).toHaveAttribute('aria-selected', 'false')
    expect(tabButtons[2]).toHaveAttribute('aria-selected', 'false')
  })

  it('S16-11: only the active tab panel content is present in the DOM', () => {
    render(<Tabs tabs={tabs} ariaLabel="Test tabs" />)
    expect(screen.getByText('Content One')).toBeTruthy()
    expect(screen.queryByText('Content Two')).toBeNull()
    expect(screen.queryByText('Content Three')).toBeNull()
  })

  it('S16-12: clicking an inactive tab switches aria-selected and swaps panel content', () => {
    render(<Tabs tabs={tabs} ariaLabel="Test tabs" />)
    fireEvent.click(screen.getByRole('tab', { name: 'Two' }))
    expect(screen.getByRole('tab', { name: 'Two' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute('aria-selected', 'false')
    expect(screen.getByText('Content Two')).toBeTruthy()
    expect(screen.queryByText('Content One')).toBeNull()
  })

  it('S16-13: ArrowRight/ArrowLeft move activation between tabs with wrap-around', () => {
    render(<Tabs tabs={tabs} ariaLabel="Test tabs" />)
    const first = screen.getByRole('tab', { name: 'One' })
    fireEvent.keyDown(first, { key: 'ArrowRight' })
    expect(screen.getByRole('tab', { name: 'Two' })).toHaveAttribute('aria-selected', 'true')

    const second = screen.getByRole('tab', { name: 'Two' })
    fireEvent.keyDown(second, { key: 'ArrowLeft' })
    expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute('aria-selected', 'true')

    const firstAgain = screen.getByRole('tab', { name: 'One' })
    fireEvent.keyDown(firstAgain, { key: 'ArrowLeft' })
    expect(screen.getByRole('tab', { name: 'Three' })).toHaveAttribute('aria-selected', 'true')

    const third = screen.getByRole('tab', { name: 'Three' })
    fireEvent.keyDown(third, { key: 'ArrowRight' })
    expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute('aria-selected', 'true')
  })

  it('S16-14: aria-controls/id pairing between each tab and its panel is internally consistent', () => {
    render(<Tabs tabs={tabs} ariaLabel="Test tabs" />)
    const activeTab = screen.getByRole('tab', { name: 'One' })
    const panel = screen.getByRole('tabpanel')
    expect(activeTab.getAttribute('aria-controls')).toBe(panel.id)
    expect(panel.getAttribute('aria-labelledby')).toBe(activeTab.id)
  })
})
