import { useScenario } from './hooks/useScenario'
import { BasicInputs } from './components/BasicInputs'
import { AdvancedInputs } from './components/AdvancedInputs'
import { DebugPanel } from './components/DebugPanel'
import { HeadlineResult } from './components/HeadlineResult'
import { CostTable } from './components/CostTable'
import { ExportPanel } from './components/ExportPanel'
import { InputSection } from './components/InputSection'
import { BreakEvenChart } from './components/BreakEvenChart'
import { SensitivityStrip } from './components/SensitivityStrip'

export default function App() {
  const {
    input,
    result,
    urlError,
    dismissUrlError,
    updateOwnership,
    updateRental,
    updateShared,
    replaceInput,
  } = useScenario()

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-blue-600 focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to main content
      </a>
      <main id="main-content" className="mx-auto max-w-4xl px-4 py-8">
        {urlError && (
          <div
            role="alert"
            className="mb-4 flex items-center justify-between rounded border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-800"
          >
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
            <div className="col-span-full space-y-2 border-l-2 border-gray-200 pl-4">
              <AdvancedInputs
                input={input}
                updateOwnership={updateOwnership}
                updateRental={updateRental}
                updateShared={updateShared}
              />
            </div>
          </InputSection>
          <BreakEvenChart result={result} updateShared={updateShared} />
          <SensitivityStrip input={input} result={result} />
          <CostTable result={result} />
          <ExportPanel result={result} input={input} onImport={replaceInput} />
          <DebugPanel result={result} />
        </div>
      </main>
    </>
  )
}
