import type { ScenarioResult } from '../engine'

type DebugPanelProps = {
  result: ScenarioResult
}

export function DebugPanel({ result }: DebugPanelProps) {
  const firstRow = result.monthly_schedule[0] ?? null
  const lastRow = result.monthly_schedule[result.monthly_schedule.length - 1] ?? null

  return (
    <details>
      <summary className="cursor-pointer select-none py-2 text-sm font-semibold text-gray-500">
        Debug: Raw Engine Output
      </summary>
      <div className="mt-2 space-y-2">
        <pre className="overflow-auto rounded bg-gray-50 p-2 text-xs">
          {JSON.stringify(result.verdict, null, 2)}
        </pre>
        <pre className="overflow-auto rounded bg-gray-50 p-2 text-xs">
          {JSON.stringify(result.totals, null, 2)}
        </pre>
        <pre className="overflow-auto rounded bg-gray-50 p-2 text-xs">
          {JSON.stringify(firstRow, null, 2)}
        </pre>
        <pre className="overflow-auto rounded bg-gray-50 p-2 text-xs">
          {JSON.stringify(lastRow, null, 2)}
        </pre>
      </div>
    </details>
  )
}
