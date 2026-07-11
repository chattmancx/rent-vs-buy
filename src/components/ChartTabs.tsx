import { Tabs } from './Tabs'
import { NetWorthChartBody } from './BreakEvenChart'
import { CostsOverTimeChart } from './CostsOverTimeChart'
import { MonthlyCostsChart } from './MonthlyCostsChart'
import { HorizonSlider } from './HorizonSlider'
import type { ScenarioResult, SharedInput } from '../engine'

type ChartTabsProps = {
  result: ScenarioResult
  updateShared: (patch: Partial<SharedInput>) => void
}

export function ChartTabs({ result, updateShared }: ChartTabsProps) {
  return (
    <div className="rounded-lg border border-surface-rule bg-surface-panel p-6">
      <Tabs
        ariaLabel="Chart view"
        tabs={[
          { id: 'net-worth', label: 'Net Worth', content: <NetWorthChartBody result={result} /> },
          {
            id: 'costs',
            label: 'Costs Over Time',
            content: <CostsOverTimeChart result={result} />,
          },
          {
            id: 'monthly-costs',
            label: 'Monthly Costs',
            content: <MonthlyCostsChart result={result} />,
          },
        ]}
      />
      <HorizonSlider
        horizonYears={result.inputs.shared.horizon_years}
        updateShared={updateShared}
      />
    </div>
  )
}
