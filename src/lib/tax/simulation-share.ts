import type { SimulationInputs } from './simulation'
import type { SimulationFormState } from '@/components/simulation-form'

/**
 * Encode simulation inputs into a URL-safe base64 string.
 * The result is compact enough for a query parameter.
 */
export function encodeSimulationInputs(inputs: SimulationInputs): string {
  const json = JSON.stringify(inputs)
  // btoa works on Latin-1; use TextEncoder → binary string for safety
  const bytes = new TextEncoder().encode(json)
  const binary = Array.from(bytes, (b) => String.fromCharCode(b)).join('')
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/**
 * Decode a URL-safe base64 string back to SimulationInputs.
 * Returns null if the string is invalid or doesn't parse.
 */
export function decodeSimulationInputs(encoded: string): SimulationInputs | null {
  try {
    // Restore standard base64
    let b64 = encoded.replace(/-/g, '+').replace(/_/g, '/')
    const pad = (4 - (b64.length % 4)) % 4
    b64 += '='.repeat(pad)

    const binary = atob(b64)
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
    const json = new TextDecoder().decode(bytes)
    const parsed = JSON.parse(json)

    // Basic shape validation
    if (typeof parsed !== 'object' || parsed === null) return null
    if (typeof parsed.married !== 'boolean') return null
    if (!Array.isArray(parsed.persons) || parsed.persons.length === 0) return null

    return parsed as SimulationInputs
  } catch {
    return null
  }
}

/**
 * Convert decoded SimulationInputs back into form state for pre-filling.
 */
export function inputsToFormState(inputs: SimulationInputs): SimulationFormState {
  return {
    married: inputs.married,
    persons: inputs.persons.map((p) => ({
      birth_year: String(p.birth_year),
      gross_cat_a: p.gross_cat_a > 0 ? String(p.gross_cat_a) : '',
      gross_cat_b: p.gross_cat_b && p.gross_cat_b > 0 ? String(p.gross_cat_b) : '',
      nhr: p.nhr ?? false,
      first_work_year: p.first_work_year ? String(p.first_work_year) : '',
    })),
    depsUnder3: inputs.dependents_under_3 ?? 0,
    deps3to6: inputs.dependents_3_to_6 ?? 0,
    depsOver6: inputs.dependents_over_6 ?? 0,
  }
}
