import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ExportPanel } from '../ExportPanel'
import { computeScenario } from '../../engine'
import { DEFAULT_INPUT } from '../../lib/defaults'

beforeEach(() => {
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url')
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ExportPanel', () => {
  it('renders the Export & Import heading', () => {
    const result = computeScenario(DEFAULT_INPUT)
    render(<ExportPanel result={result} input={DEFAULT_INPUT} onImport={vi.fn()} />)
    expect(screen.getByText('Export & Import')).toBeTruthy()
  })

  it('renders Download CSV, Save Scenario, and Load Scenario buttons', () => {
    const result = computeScenario(DEFAULT_INPUT)
    render(<ExportPanel result={result} input={DEFAULT_INPUT} onImport={vi.fn()} />)
    expect(screen.getByRole('button', { name: /download csv/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /save scenario/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /load scenario/i })).toBeTruthy()
  })

  it('calls URL.createObjectURL with a Blob when Download CSV is clicked', () => {
    const result = computeScenario(DEFAULT_INPUT)
    render(<ExportPanel result={result} input={DEFAULT_INPUT} onImport={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /download csv/i }))
    expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob))
  })

  it('calls URL.createObjectURL with a Blob when Save Scenario is clicked', () => {
    const result = computeScenario(DEFAULT_INPUT)
    render(<ExportPanel result={result} input={DEFAULT_INPUT} onImport={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /save scenario/i }))
    expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob))
  })

  it('calls onImport with parsed input when a valid JSON file is loaded', async () => {
    const onImport = vi.fn()
    const result = computeScenario(DEFAULT_INPUT)
    render(<ExportPanel result={result} input={DEFAULT_INPUT} onImport={onImport} />)

    const content = JSON.stringify(DEFAULT_INPUT)
    const file = new File([content], 'scenario.json', { type: 'application/json' })
    const fileInput = screen.getByTestId('json-import-input')

    // HTMLInputElement.files is read-only; use defineProperty before firing change.
    Object.defineProperty(fileInput, 'files', { value: [file], configurable: true })
    fireEvent.change(fileInput)

    await waitFor(() => expect(onImport).toHaveBeenCalled(), { timeout: 2000 })
    expect(onImport).toHaveBeenCalledWith(DEFAULT_INPUT)
  })
})
