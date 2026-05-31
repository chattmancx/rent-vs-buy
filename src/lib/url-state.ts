import type { ScenarioInput } from '../engine'
import { ScenarioInputSchema } from './schema'

export function encode(input: ScenarioInput): string {
  return btoa(encodeURIComponent(JSON.stringify(input)))
}

export function decode(raw: string): ScenarioInput | null {
  try {
    const json = decodeURIComponent(atob(raw))
    const parsed: unknown = JSON.parse(json)
    const result = ScenarioInputSchema.safeParse(parsed)
    if (result.success) {
      // ValidatedScenarioInput is structurally identical to ScenarioInput
      return result.data as ScenarioInput
    }
    return null
  } catch {
    return null
  }
}
