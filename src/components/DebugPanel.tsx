import type { ScenarioResult } from '../engine'

type DebugPanelProps = {
  result: ScenarioResult
}

function roundNumbers(_key: string, val: unknown): unknown {
  if (typeof val === 'number') return parseFloat(val.toPrecision(10))
  return val
}

export function DebugPanel({ result }: DebugPanelProps) {
  const firstRow = result.monthly_schedule[0] ?? null
  const lastRow = result.monthly_schedule[result.monthly_schedule.length - 1] ?? null

  return (
    <details>
      <summary className="cursor-pointer select-none py-2 text-sm font-semibold text-gray-600">
        Debug: Raw Engine Output
      </summary>
      <div className="mt-2 space-y-2">
        <pre className="overflow-auto rounded bg-gray-50 p-2 text-xs">
          {JSON.stringify(result.verdict, roundNumbers, 2)}
        </pre>
        <pre className="overflow-auto rounded bg-gray-50 p-2 text-xs">
          {JSON.stringify(result.totals, roundNumbers, 2)}
        </pre>
        <pre className="overflow-auto rounded bg-gray-50 p-2 text-xs">
          {JSON.stringify(firstRow, roundNumbers, 2)}
        </pre>
        <pre className="overflow-auto rounded bg-gray-50 p-2 text-xs">
          {JSON.stringify(lastRow, roundNumbers, 2)}
        </pre>
      </div>
    </details>
  )
}
