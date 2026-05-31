import type { ScenarioInput } from '../engine/types'
import { ScenarioInputSchema } from './schema'

export function exportToJson(input: ScenarioInput): string {
  return JSON.stringify(input, null, 2)
}

export function importFromJson(raw: string): ScenarioInput | null {
  try {
    const parsed: unknown = JSON.parse(raw)
    const result = ScenarioInputSchema.safeParse(parsed)
    if (result.success) return result.data as ScenarioInput
    return null
  } catch {
    return null
  }
}
