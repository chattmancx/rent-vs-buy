import { useScenario } from './hooks/useScenario'
import { BasicInputs } from './components/BasicInputs'
import { AdvancedInputs } from './components/AdvancedInputs'
import { DebugPanel } from './components/DebugPanel'
import { HeadlineResult } from './components/HeadlineResult'
import { CostTable } from './components/CostTable'
import { InputSection } from './components/InputSection'

export default function App() {
  const { input, result, urlError, dismissUrlError, updateOwnership, updateRental, updateShared } =
    useScenario()

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {urlError && (
        <div className="mb-4 flex items-center justify-between rounded border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          <span>URL parameters were invalid or corrupted. Showing default values.</span>
          <button
            type="button"
            onClick={dismissUrlError}
            className="ml-4 font-semibold underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}
      <h1 className="mb-6 text-3xl font-bold text-gray-900">Rent vs Buy Calculator</h1>
      <div className="space-y-6">
        <HeadlineResult result={result} />
        <BasicInputs
          input={input}
          updateOwnership={updateOwnership}
          updateRental={updateRental}
          updateShared={updateShared}
        />
        <InputSection title="Advanced Options">
          <AdvancedInputs
            input={input}
            updateOwnership={updateOwnership}
            updateRental={updateRental}
            updateShared={updateShared}
          />
        </InputSection>
        <CostTable result={result} />
        <DebugPanel result={result} />
      </div>
    </div>
  )
}
