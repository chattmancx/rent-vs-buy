import { useState, useEffect, useCallback, useRef } from 'react'
import type {
  ScenarioInput,
  ScenarioResult,
  OwnershipInput,
  RentalInput,
  SharedInput,
  TaxInput,
} from '../engine'
import { DEFAULT_INPUT } from '../lib/defaults'
import { encode, decode } from '../lib/url-state'
import { estimateStateIncomeTax } from '../lib/state-tax'
import { computeScenarioForDisplay } from '../lib/inflation'

function toStateTaxFilingStatus(
  status: TaxInput['filing_status'],
): 'single' | 'married_filing_jointly' {
  return status === 'married_filing_jointly' ? 'married_filing_jointly' : 'single'
}

function computeWithTax(input: ScenarioInput): ScenarioInput {
  const { tax } = input
  if (!tax.taxes_enabled || tax.gross_annual_income === 0 || tax.state === '') {
    return input
  }
  const estimated = estimateStateIncomeTax(
    tax.state,
    tax.gross_annual_income,
    toStateTaxFilingStatus(tax.filing_status),
  )
  return { ...input, tax: { ...input.tax, state_income_tax_annual: estimated } }
}

type ScenarioState = {
  input: ScenarioInput
  result: ScenarioResult
  urlError: boolean
}

function initState(): ScenarioState {
  const params = new URLSearchParams(window.location.search)
  const raw = params.get('s')
  if (raw !== null) {
    const decoded = decode(raw)
    if (decoded !== null) {
      const withTax = computeWithTax(decoded)
      return { input: withTax, result: computeScenarioForDisplay(withTax), urlError: false }
    }
    return {
      input: DEFAULT_INPUT,
      result: computeScenarioForDisplay(DEFAULT_INPUT),
      urlError: true,
    }
  }
  return { input: DEFAULT_INPUT, result: computeScenarioForDisplay(DEFAULT_INPUT), urlError: false }
}

export function useScenario() {
  const [state, setState] = useState<ScenarioState>(initState)
  const didMount = useRef(false)

  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true
      return
    }
    history.replaceState(null, '', `?s=${encode(state.input)}`)
  }, [state.input])

  const updateOwnership = useCallback((patch: Partial<OwnershipInput>) => {
    setState((prev) => {
      const newInput: ScenarioInput = {
        ...prev.input,
        ownership: { ...prev.input.ownership, ...patch },
      }
      return { input: newInput, result: computeScenarioForDisplay(newInput), urlError: false }
    })
  }, [])

  const updateRental = useCallback((patch: Partial<RentalInput>) => {
    setState((prev) => {
      const newInput: ScenarioInput = {
        ...prev.input,
        rental: { ...prev.input.rental, ...patch },
      }
      return { input: newInput, result: computeScenarioForDisplay(newInput), urlError: false }
    })
  }, [])

  const updateShared = useCallback((patch: Partial<SharedInput>) => {
    setState((prev) => {
      const newInput: ScenarioInput = {
        ...prev.input,
        shared: { ...prev.input.shared, ...patch },
      }
      return { input: newInput, result: computeScenarioForDisplay(newInput), urlError: false }
    })
  }, [])

  const dismissUrlError = useCallback(() => {
    setState((prev) => ({ ...prev, urlError: false }))
  }, [])

  const replaceInput = useCallback((newInput: ScenarioInput) => {
    const withTax = computeWithTax(newInput)
    setState({ input: withTax, result: computeScenarioForDisplay(withTax), urlError: false })
  }, [])

  const updateTax = useCallback((patch: Partial<TaxInput>) => {
    setState((prev) => {
      const merged: ScenarioInput = {
        ...prev.input,
        tax: { ...prev.input.tax, ...patch },
      }
      const withTax = computeWithTax(merged)
      return { input: withTax, result: computeScenarioForDisplay(withTax), urlError: false }
    })
  }, [])

  return {
    input: state.input,
    result: state.result,
    urlError: state.urlError,
    dismissUrlError,
    updateOwnership,
    updateRental,
    updateShared,
    updateTax,
    replaceInput,
  }
}
