import { useScenario } from './hooks/useScenario'
import { BasicInputs } from './components/BasicInputs'
import { AdvancedInputs } from './components/AdvancedInputs'
import { ExpertOptions } from './components/ExpertOptions'
import { HeadlineResult } from './components/HeadlineResult'
import { CostTable } from './components/CostTable'
import { InputSection } from './components/InputSection'
import { ChartTabs } from './components/ChartTabs'
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
    updateTax,
  } = useScenario()

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-accent focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to main content
      </a>
      <main id="main-content" className="mx-auto max-w-6xl px-4 py-8">
        {urlError && (
          <div
            role="alert"
            className="mb-4 flex items-center justify-between rounded border-l-4 border-signal-negative bg-surface-panel px-4 py-3 text-sm text-ink-secondary"
          >
            <span>URL parameters were invalid or corrupted. Showing default values.</span>
            <button
              type="button"
              onClick={dismissUrlError}
              className="ml-4 font-semibold text-ink-primary underline hover:no-underline"
            >
              Dismiss
            </button>
          </div>
        )}
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-ink-muted">
            Rent vs Buy Calculator
          </p>
          <p className="mt-1 text-xs text-ink-muted">Developed Using Claude Code</p>
        </div>
        <div className="flex flex-col gap-6 md:grid md:grid-cols-5">
          <div className="space-y-5 rounded-lg border border-surface-rule bg-surface-panel p-6 md:col-span-2">
            <BasicInputs
              input={input}
              updateOwnership={updateOwnership}
              updateRental={updateRental}
              updateShared={updateShared}
            />
            <InputSection title="Advanced Options">
              <div className="col-span-full space-y-2 border-l-2 border-surface-rule pl-4">
                <AdvancedInputs
                  input={input}
                  updateOwnership={updateOwnership}
                  updateRental={updateRental}
                  updateShared={updateShared}
                />
              </div>
            </InputSection>
            <InputSection title="Expert Options">
              <div className="col-span-full space-y-2 border-l-2 border-surface-rule pl-4">
                <ExpertOptions input={input} updateTax={updateTax} updateShared={updateShared} />
              </div>
            </InputSection>
          </div>
          <div className="space-y-4 md:col-span-3">
            <HeadlineResult result={result} />
            <ChartTabs result={result} updateShared={updateShared} />
            <SensitivityStrip input={input} result={result} />
            <CostTable result={result} />
          </div>
          {/* ExportPanel — hidden pending PII disclosure design (Tier 3 decision) */}
          {/* <ExportPanel result={result} input={input} onImport={replaceInput} /> */}
          {/* DebugPanel — hidden; sidelined until further notice */}
          {/* <DebugPanel result={result} /> */}
        </div>
      </main>
    </>
  )
}
