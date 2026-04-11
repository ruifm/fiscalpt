import { afterEach, describe, expect, it, beforeEach, vi } from 'vitest'

import {
  saveSessionState,
  loadSessionState,
  clearSessionState,
  generateSessionId,
  sessionKey,
  migrateLegacySession,
  SESSION_STORAGE_KEY,
  type PersistedState,
} from '@/lib/session-persistence'
import type { Household, AnalysisResult, ValidationIssue } from '@/lib/tax/types'

function makeHousehold(overrides: Partial<Household> = {}): Household {
  return {
    year: 2025,
    filing_status: 'single',
    members: [{ name: 'Rui', incomes: [], deductions: [], special_regimes: [] }],
    dependents: [],
    ...overrides,
  }
}

function makeStorage(): Storage {
  const store = new Map<string, string>()
  return {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => store.set(key, value)),
    removeItem: vi.fn((key: string) => store.delete(key)),
    clear: vi.fn(() => store.clear()),
    get length() {
      return store.size
    },
    key: vi.fn((_i: number) => null),
  }
}

describe('session-persistence', () => {
  let storage: Storage

  beforeEach(() => {
    storage = makeStorage()
  })

  describe('saveSessionState', () => {
    it('saves step + households to storage', () => {
      const household = makeHousehold()
      saveSessionState(
        {
          step: 'questionnaire',
          households: [household],
          results: [],
          issues: [],
          liquidacao: null,
        },
        storage,
      )

      const raw = storage.getItem(SESSION_STORAGE_KEY)
      expect(raw).toBeTruthy()
      const parsed: PersistedState = JSON.parse(raw!)
      expect(parsed.step).toBe('questionnaire')
      expect(parsed.households[0]?.year).toBe(2025)
    })

    it('saves results when on results step', () => {
      const household = makeHousehold()
      const result: AnalysisResult = {
        year: 2025,
        household,
        scenarios: [],
        recommended_scenario: 'test',
        optimizations: [],
      }
      saveSessionState(
        {
          step: 'results',
          households: [household],
          results: [result],
          issues: [],
          liquidacao: null,
        },
        storage,
      )

      const parsed: PersistedState = JSON.parse(storage.getItem(SESSION_STORAGE_KEY)!)
      expect(parsed.results).toHaveLength(1)
      expect(parsed.results[0]?.year).toBe(2025)
    })

    it('saves issues and liquidacao', () => {
      const household = makeHousehold()
      const issues: ValidationIssue[] = [
        { severity: 'warning', code: 'TEST', message: 'test warning' },
      ]
      const liquidacao = { taxaEfetiva: 0.15 }
      saveSessionState(
        {
          step: 'review',
          households: [household],
          results: [],
          issues,
          liquidacao: liquidacao as never,
        },
        storage,
      )

      const parsed: PersistedState = JSON.parse(storage.getItem(SESSION_STORAGE_KEY)!)
      expect(parsed.issues).toHaveLength(1)
      expect(parsed.liquidacao).toBeTruthy()
    })

    it('does not save upload step (nothing to persist)', () => {
      saveSessionState(
        { step: 'upload', households: [], results: [], issues: [], liquidacao: null },
        storage,
      )

      expect(storage.getItem(SESSION_STORAGE_KEY)).toBeNull()
    })

    it('gracefully handles storage errors', () => {
      const badStorage = {
        ...makeStorage(),
        setItem: vi.fn(() => {
          throw new Error('QuotaExceededError')
        }),
      }

      // Should not throw
      expect(() =>
        saveSessionState(
          {
            step: 'questionnaire',
            households: [makeHousehold()],
            results: [],
            issues: [],
            liquidacao: null,
          },
          badStorage,
        ),
      ).not.toThrow()
    })
  })

  describe('loadSessionState', () => {
    it('returns null when no state saved', () => {
      expect(loadSessionState(storage)).toBeNull()
    })

    it('returns null for corrupted JSON', () => {
      storage.setItem(SESSION_STORAGE_KEY, 'not valid json{{{')
      expect(loadSessionState(storage)).toBeNull()
    })

    it('returns null if step is missing', () => {
      storage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ households: [makeHousehold()] }))
      expect(loadSessionState(storage)).toBeNull()
    })

    it('returns null if step is upload', () => {
      storage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ step: 'upload', households: [] }))
      expect(loadSessionState(storage)).toBeNull()
    })

    it('restores valid persisted state', () => {
      const state: PersistedState = {
        step: 'review',
        households: [makeHousehold()],
        results: [],
        issues: [{ severity: 'warning', code: 'T', message: 'x' }],
        liquidacao: null,
      }
      storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(state))

      const loaded = loadSessionState(storage)
      expect(loaded).toBeTruthy()
      expect(loaded!.step).toBe('review')
      expect(loaded!.households[0]?.year).toBe(2025)
      expect(loaded!.issues).toHaveLength(1)
    })

    it('restores results step with analysis results', () => {
      const household = makeHousehold()
      const state: PersistedState = {
        step: 'results',
        households: [household],
        results: [
          {
            year: 2025,
            household,
            scenarios: [],
            recommended_scenario: 'test',
            optimizations: [],
          },
        ],
        issues: [],
        liquidacao: null,
      }
      storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(state))

      const loaded = loadSessionState(storage)
      expect(loaded!.step).toBe('results')
      expect(loaded!.results[0]?.year).toBe(2025)
    })

    it('migrates legacy single-household state', () => {
      const household = makeHousehold()
      const legacy = {
        step: 'review',
        household,
        result: {
          year: 2025,
          household,
          scenarios: [],
          recommended_scenario: 'test',
          optimizations: [],
        },
        issues: [],
        liquidacao: null,
      }
      storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(legacy))

      const loaded = loadSessionState(storage)
      expect(loaded).toBeTruthy()
      expect(loaded!.households).toHaveLength(1)
      expect(loaded!.households[0]?.year).toBe(2025)
      expect(loaded!.results).toHaveLength(1)
      expect(loaded!.results[0]?.year).toBe(2025)
    })
  })

  describe('clearSessionState', () => {
    it('removes the key from storage', () => {
      storage.setItem(SESSION_STORAGE_KEY, 'something')
      clearSessionState(storage)
      expect(storage.getItem(SESSION_STORAGE_KEY)).toBeNull()
    })

    it('does not throw if nothing to clear', () => {
      expect(() => clearSessionState(storage)).not.toThrow()
    })
  })
})

// ─── Session-ID-based persistence ────────────────────────────

describe('generateSessionId', () => {
  it('returns an alphanumeric string of at least 6 chars', () => {
    const id = generateSessionId()
    expect(id).toMatch(/^[a-z0-9]+$/)
    expect(id.length).toBeGreaterThanOrEqual(6)
  })

  it('returns unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateSessionId()))
    expect(ids.size).toBe(100)
  })
})

describe('sessionKey', () => {
  it('returns prefixed key', () => {
    expect(sessionKey('abc123')).toBe('fiscalpt:session:abc123')
  })
})

describe('session-ID-based persistence', () => {
  let storage: Storage

  beforeEach(() => {
    storage = makeStorage()
  })

  it('saves and loads state by session ID', () => {
    const state: PersistedState = {
      step: 'questionnaire',
      households: [makeHousehold()],
      results: [],
      issues: [],
      liquidacao: null,
    }
    saveSessionState('test-id', state, storage)

    const loaded = loadSessionState('test-id', storage)
    expect(loaded).toBeTruthy()
    expect(loaded!.step).toBe('questionnaire')
    expect(loaded!.households[0]?.year).toBe(2025)
  })

  it('different session IDs are isolated', () => {
    saveSessionState(
      'id-a',
      {
        step: 'questionnaire',
        households: [makeHousehold({ year: 2024 })],
        results: [],
        issues: [],
        liquidacao: null,
      },
      storage,
    )
    saveSessionState(
      'id-b',
      {
        step: 'results',
        households: [makeHousehold({ year: 2025 })],
        results: [],
        issues: [],
        liquidacao: null,
      },
      storage,
    )

    expect(loadSessionState('id-a', storage)!.step).toBe('questionnaire')
    expect(loadSessionState('id-b', storage)!.step).toBe('results')
  })

  it('clears by session ID without affecting others', () => {
    saveSessionState(
      'keep',
      {
        step: 'questionnaire',
        households: [makeHousehold()],
        results: [],
        issues: [],
        liquidacao: null,
      },
      storage,
    )
    saveSessionState(
      'remove',
      {
        step: 'results',
        households: [makeHousehold()],
        results: [],
        issues: [],
        liquidacao: null,
      },
      storage,
    )

    clearSessionState('remove', storage)
    expect(loadSessionState('remove', storage)).toBeNull()
    expect(loadSessionState('keep', storage)).toBeTruthy()
  })

  it('returns null for non-existent session ID', () => {
    expect(loadSessionState('nonexistent', storage)).toBeNull()
  })

  it('skips save for upload step', () => {
    saveSessionState(
      'test',
      {
        step: 'upload',
        households: [],
        results: [],
        issues: [],
        liquidacao: null,
      },
      storage,
    )
    expect(loadSessionState('test', storage)).toBeNull()
  })
})

describe('migrateLegacySession', () => {
  it('migrates from sessionStorage to localStorage with new ID', () => {
    const sessionStore = makeStorage()
    const localStore = makeStorage()

    const legacy: PersistedState = {
      step: 'questionnaire',
      households: [makeHousehold()],
      results: [],
      issues: [],
      liquidacao: null,
    }
    sessionStore.setItem(SESSION_STORAGE_KEY, JSON.stringify(legacy))

    const result = migrateLegacySession('new-id', sessionStore, localStore)
    expect(result).toBeTruthy()
    expect(result!.step).toBe('questionnaire')

    // Old key removed
    expect(sessionStore.getItem(SESSION_STORAGE_KEY)).toBeNull()
    // New key exists
    expect(localStore.getItem(sessionKey('new-id'))).toBeTruthy()
  })

  it('returns null when no legacy state exists', () => {
    const result = migrateLegacySession('id', makeStorage(), makeStorage())
    expect(result).toBeNull()
  })

  it('returns null for corrupted legacy state', () => {
    const sessionStore = makeStorage()
    sessionStore.setItem(SESSION_STORAGE_KEY, 'not json')
    const result = migrateLegacySession('id', sessionStore, makeStorage())
    expect(result).toBeNull()
  })
})

describe('graceful degradation when storage is unavailable', () => {
  function makeState(): PersistedState {
    return {
      step: 'questionnaire',
      households: [makeHousehold()],
      results: [] as AnalysisResult[],
      issues: [] as ValidationIssue[],
      liquidacao: null,
    }
  }

  function blockBothStorages(fn: () => void) {
    const origLocal = globalThis.localStorage
    const origSession = globalThis.sessionStorage
    Object.defineProperty(globalThis, 'localStorage', {
      get() {
        throw new DOMException('Access denied', 'SecurityError')
      },
      configurable: true,
    })
    Object.defineProperty(globalThis, 'sessionStorage', {
      get() {
        throw new DOMException('Access denied', 'SecurityError')
      },
      configurable: true,
    })
    try {
      fn()
    } finally {
      Object.defineProperty(globalThis, 'localStorage', {
        value: origLocal,
        configurable: true,
        writable: true,
      })
      Object.defineProperty(globalThis, 'sessionStorage', {
        value: origSession,
        configurable: true,
        writable: true,
      })
    }
  }

  it('saveSessionState no-ops when both storages throw SecurityError', () => {
    blockBothStorages(() => {
      expect(() => saveSessionState('test-id', makeState())).not.toThrow()
    })
  })

  it('loadSessionState returns null when both storages throw SecurityError', () => {
    blockBothStorages(() => {
      expect(loadSessionState('test-id')).toBeNull()
    })
  })

  it('clearSessionState no-ops when both storages throw SecurityError', () => {
    blockBothStorages(() => {
      expect(() => clearSessionState('test-id')).not.toThrow()
    })
  })

  it('migrateLegacySession returns null when both storages throw SecurityError', () => {
    blockBothStorages(() => {
      expect(migrateLegacySession('test-id')).toBeNull()
    })
  })
})

describe('storage fallback cascade', () => {
  let origLocal: Storage | undefined
  let origSession: Storage | undefined

  beforeEach(() => {
    origLocal = globalThis.localStorage
    origSession = globalThis.sessionStorage
    // Ensure sessionStorage exists (Node <23 lacks it)
    if (!origSession) {
      Object.defineProperty(globalThis, 'sessionStorage', {
        value: makeStorage(),
        configurable: true,
        writable: true,
      })
    }
    // Ensure localStorage exists so we can block it
    if (!origLocal) {
      Object.defineProperty(globalThis, 'localStorage', {
        value: makeStorage(),
        configurable: true,
        writable: true,
      })
    }
  })

  afterEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: origLocal,
      configurable: true,
      writable: true,
    })
    Object.defineProperty(globalThis, 'sessionStorage', {
      value: origSession,
      configurable: true,
      writable: true,
    })
  })

  function makeState(): PersistedState {
    return {
      step: 'questionnaire',
      households: [makeHousehold()],
      results: [] as AnalysisResult[],
      issues: [] as ValidationIssue[],
      liquidacao: null,
    }
  }

  it('saveSessionState falls back to sessionStorage when localStorage is blocked', () => {
    Object.defineProperty(globalThis, 'localStorage', {
      get() {
        throw new DOMException('Access denied', 'SecurityError')
      },
      configurable: true,
    })

    const state = makeState()
    saveSessionState('fallback-test', state)
    const key = sessionKey('fallback-test')
    const raw = globalThis.sessionStorage.getItem(key)
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw!)
    expect(parsed.step).toBe('questionnaire')
    globalThis.sessionStorage.removeItem(key)
  })

  it('loadSessionState falls back to sessionStorage when localStorage is blocked', () => {
    const key = sessionKey('fallback-load')
    const state = makeState()
    globalThis.sessionStorage.setItem(key, JSON.stringify(state))

    Object.defineProperty(globalThis, 'localStorage', {
      get() {
        throw new DOMException('Access denied', 'SecurityError')
      },
      configurable: true,
    })

    const loaded = loadSessionState('fallback-load')
    expect(loaded).not.toBeNull()
    expect(loaded!.step).toBe('questionnaire')
    globalThis.sessionStorage.removeItem(key)
  })
})
