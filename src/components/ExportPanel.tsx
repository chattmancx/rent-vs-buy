import { useRef, useState } from 'react'
import type { ScenarioInput, ScenarioResult } from '../engine/types'
import { exportToCsv } from '../lib/csv-export'
import { exportToJson, importFromJson } from '../lib/json-io'

type Props = {
  result: ScenarioResult
  input: ScenarioInput
  onImport: (input: ScenarioInput) => void
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function ExportPanel({ result, input, onImport }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importError, setImportError] = useState<string | null>(null)

  const handleCsvDownload = () => {
    downloadFile(exportToCsv(result), 'rent-vs-buy-analysis.csv', 'text/csv')
  }

  const handleJsonDownload = () => {
    downloadFile(exportToJson(input), 'rent-vs-buy-scenario.json', 'application/json')
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const raw = event.target?.result
      if (typeof raw !== 'string') return
      const parsed = importFromJson(raw)
      if (parsed !== null) {
        onImport(parsed)
        setImportError(null)
      } else {
        setImportError('Could not import: invalid or unrecognized scenario file.')
      }
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
    reader.readAsText(file)
  }

  const btnClass =
    'rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h2 className="mb-3 text-lg font-semibold text-gray-900">Export &amp; Import</h2>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={handleCsvDownload} className={btnClass}>
          Download CSV
        </button>
        <button type="button" onClick={handleJsonDownload} className={btnClass}>
          Download JSON
        </button>
        <button type="button" onClick={handleImportClick} className={btnClass}>
          Import JSON
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          data-testid="json-import-input"
          className="sr-only"
          onChange={handleFileChange}
        />
      </div>
      {importError !== null && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {importError}
        </p>
      )}
    </div>
  )
}
