import { useState, useEffect, useCallback, useRef } from 'react'
import { computeScenario } from '../engine'
import type {
  ScenarioInput,
  ScenarioResult,
  OwnershipInput,
  RentalInput,
  SharedInput,
} from '../engine'
import { DEFAULT_INPUT } from '../lib/defaults'
import { encode, decode } from '../lib/url-state'

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
      return { input: decoded, result: computeScenario(decoded), urlError: false }
    }
    return { input: DEFAULT_INPUT, result: computeScenario(DEFAULT_INPUT), urlError: true }
  }
  return { input: DEFAULT_INPUT, result: computeScenario(DEFAULT_INPUT), urlError: false }
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
      return { input: newInput, result: computeScenario(newInput), urlError: false }
    })
  }, [])

  const updateRental = useCallback((patch: Partial<RentalInput>) => {
    setState((prev) => {
      const newInput: ScenarioInput = {
        ...prev.input,
        rental: { ...prev.input.rental, ...patch },
      }
      return { input: newInput, result: computeScenario(newInput), urlError: false }
    })
  }, [])

  const updateShared = useCallback((patch: Partial<SharedInput>) => {
    setState((prev) => {
      const newInput: ScenarioInput = {
        ...prev.input,
        shared: { ...prev.input.shared, ...patch },
      }
      return { input: newInput, result: computeScenario(newInput), urlError: false }
    })
  }, [])

  const dismissUrlError = useCallback(() => {
    setState((prev) => ({ ...prev, urlError: false }))
  }, [])

  const replaceInput = useCallback((newInput: ScenarioInput) => {
    setState({ input: newInput, result: computeScenario(newInput), urlError: false })
  }, [])

  return {
    input: state.input,
    result: state.result,
    urlError: state.urlError,
    dismissUrlError,
    updateOwnership,
    updateRental,
    updateShared,
    replaceInput,
  }
}
