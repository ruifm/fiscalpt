import type { AnalysisResult, Household, ValidationIssue } from '@/lib/tax/types'
import type { LiquidacaoParsed } from '@/lib/tax/pdf-extractor'

/** @deprecated Use session-ID-based key via sessionKey() */
export const SESSION_STORAGE_KEY = 'fiscalpt:analyze-session'

const SESSION_KEY_PREFIX = 'fiscalpt:session:'

type Step = 'upload' | 'questionnaire' | 'review' | 'results'

export interface PersistedState {
  step: Step
  households: Household[]
  /** Original uploaded households before questionnaire answers are applied. */
  uploadedHouseholds?: Household[]
  results: AnalysisResult[]
  issues: ValidationIssue[]
  liquidacao: LiquidacaoParsed | null
}

export function generateSessionId(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

export function sessionKey(id: string): string {
  return `${SESSION_KEY_PREFIX}${id}`
}

export function saveSessionState(state: PersistedState, storage?: Storage): void
export function saveSessionState(id: string, state: PersistedState, storage?: Storage): void
export function saveSessionState(
  idOrState: string | PersistedState,
  stateOrStorage?: PersistedState | Storage,
  maybeStorage?: Storage,
): void {
  let key: string
  let state: PersistedState
  let storage: Storage

  if (typeof idOrState === 'string') {
    key = sessionKey(idOrState)
    state = stateOrStorage as PersistedState
    storage = maybeStorage ?? globalThis.localStorage
  } else {
    // Legacy overload: no session ID
    key = SESSION_STORAGE_KEY
    state = idOrState
    storage = (stateOrStorage as Storage | undefined) ?? globalThis.sessionStorage
  }

  if (state.step === 'upload' || state.households.length === 0) return

  try {
    // lgtm[js/clear-text-storage-of-sensitive-data]
    // CodeQL suppression: household data (income, deductions) is the user's own
    // data stored in their own browser via localStorage/sessionStorage. It never
    // leaves the client. The app requires client-side persistence to maintain
    // analysis state across page reloads. No server, no transmission.
    storage.setItem(key, JSON.stringify(state))
  } catch {
    // Quota exceeded or other storage error — silently ignore
  }
}

function parsePersistedState(raw: string): PersistedState | null {
  try {
    const parsed = JSON.parse(raw) as Partial<PersistedState>
    if (!parsed.step || parsed.step === 'upload') return null

    // Migrate legacy single-household state
    const households: Household[] = parsed.households?.length
      ? parsed.households
      : (parsed as Record<string, unknown>).household
        ? [(parsed as Record<string, unknown>).household as Household]
        : []
    const results: AnalysisResult[] = parsed.results?.length
      ? parsed.results
      : (parsed as Record<string, unknown>).result
        ? [(parsed as Record<string, unknown>).result as AnalysisResult]
        : []

    return {
      step: parsed.step,
      households,
      uploadedHouseholds: parsed.uploadedHouseholds,
      results,
      issues: parsed.issues ?? [],
      liquidacao: parsed.liquidacao ?? null,
    }
  } catch {
    return null
  }
}

export function loadSessionState(storage?: Storage): PersistedState | null
export function loadSessionState(id: string, storage?: Storage): PersistedState | null
export function loadSessionState(
  idOrStorage?: string | Storage,
  maybeStorage?: Storage,
): PersistedState | null {
  let key: string
  let storage: Storage

  if (typeof idOrStorage === 'string') {
    key = sessionKey(idOrStorage)
    storage = maybeStorage ?? globalThis.localStorage
  } else {
    key = SESSION_STORAGE_KEY
    storage = idOrStorage ?? globalThis.sessionStorage
  }

  const raw = storage.getItem(key)
  if (!raw) return null
  return parsePersistedState(raw)
}

export function clearSessionState(storage?: Storage): void
export function clearSessionState(id: string, storage?: Storage): void
export function clearSessionState(idOrStorage?: string | Storage, maybeStorage?: Storage): void {
  if (typeof idOrStorage === 'string') {
    const storage = maybeStorage ?? globalThis.localStorage
    storage.removeItem(sessionKey(idOrStorage))
  } else {
    const storage = idOrStorage ?? globalThis.sessionStorage
    storage.removeItem(SESSION_STORAGE_KEY)
  }
}

/**
 * Migrate legacy sessionStorage state to a new session-ID-based localStorage entry.
 * Returns the migrated state, or null if nothing to migrate.
 */
export function migrateLegacySession(
  newId: string,
  sessionStore: Storage = globalThis.sessionStorage,
  localStore: Storage = globalThis.localStorage,
): PersistedState | null {
  const raw = sessionStore.getItem(SESSION_STORAGE_KEY)
  if (!raw) return null

  const state = parsePersistedState(raw)
  if (!state) return null

  try {
    localStore.setItem(sessionKey(newId), JSON.stringify(state))
    sessionStore.removeItem(SESSION_STORAGE_KEY)
  } catch {
    // Storage error — return state anyway, just don't persist
  }
  return state
}
