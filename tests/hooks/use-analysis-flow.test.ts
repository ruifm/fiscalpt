import { describe, it, expect } from 'vitest'
import {
  analysisFlowReducer,
  INITIAL_STATE,
  STEPS,
  type AnalysisFlowState,
  type AnalysisFlowAction,
} from '@/hooks/use-analysis-flow'
import type { Household, AnalysisResult, ValidationIssue } from '@/lib/tax/types'

// ─── Factories ────────────────────────────────────────────────

function makeHousehold(overrides: Partial<Household> = {}): Household {
  return {
    year: 2024,
    filing_status: 'married_joint',
    members: [],
    dependents: [],
    ...overrides,
  }
}

function makeResult(overrides: Partial<AnalysisResult> = {}): AnalysisResult {
  return {
    year: 2024,
    household: makeHousehold(),
    scenarios: [],
    recommended_scenario: 'joint',
    optimizations: [],
    ...overrides,
  }
}

function makeIssue(code: string, msg?: string): ValidationIssue {
  return { severity: 'warning', code, message: msg ?? `Issue ${code}` }
}

// ─── Tests ────────────────────────────────────────────────────

describe('analysisFlowReducer', () => {
  describe('RESTORE_SESSION', () => {
    it('restores step, households, results, issues, liquidacao', () => {
      const hh = makeHousehold()
      const result = makeResult()
      const issue = makeIssue('TEST')
      const liquidacao = { year: 2024, coletaTotal: 1000 }

      const next = analysisFlowReducer(INITIAL_STATE, {
        type: 'RESTORE_SESSION',
        payload: {
          step: 'results',
          households: [hh],
          results: [result],
          issues: [issue],
          liquidacao,
        },
      })

      expect(next.step).toBe('results')
      expect(next.households).toEqual([hh])
      expect(next.results).toEqual([result])
      expect(next.issues).toEqual([issue])
      expect(next.liquidacao).toEqual(liquidacao)
    })

    it('sets uploadedHouseholds from payload when provided', () => {
      const hh = makeHousehold()
      const uploaded = makeHousehold({ year: 2023 })

      const next = analysisFlowReducer(INITIAL_STATE, {
        type: 'RESTORE_SESSION',
        payload: {
          step: 'questionnaire',
          households: [hh],
          uploadedHouseholds: [uploaded],
          results: [],
          issues: [],
          liquidacao: null,
        },
      })

      expect(next.uploadedHouseholds).toEqual([uploaded])
    })

    it('falls back to households when uploadedHouseholds not provided', () => {
      const hh = makeHousehold()

      const next = analysisFlowReducer(INITIAL_STATE, {
        type: 'RESTORE_SESSION',
        payload: {
          step: 'questionnaire',
          households: [hh],
          results: [],
          issues: [],
          liquidacao: null,
        },
      })

      expect(next.uploadedHouseholds).toEqual([hh])
    })

    it('derives furthestStep from results when present', () => {
      const next = analysisFlowReducer(INITIAL_STATE, {
        type: 'RESTORE_SESSION',
        payload: {
          step: 'questionnaire',
          households: [makeHousehold()],
          results: [makeResult()],
          issues: [],
          liquidacao: null,
        },
      })

      // Even though step is questionnaire, results exist → furthest = results index
      expect(next.furthestStep).toBe(STEPS.indexOf('results'))
    })

    it('derives furthestStep from step when no results', () => {
      const next = analysisFlowReducer(INITIAL_STATE, {
        type: 'RESTORE_SESSION',
        payload: {
          step: 'questionnaire',
          households: [makeHousehold()],
          results: [],
          issues: [],
          liquidacao: null,
        },
      })

      expect(next.furthestStep).toBe(STEPS.indexOf('questionnaire'))
    })
  })

  describe('SET_EXTRACTED', () => {
    it('sets households, issues, and advances to questionnaire', () => {
      const hh = makeHousehold()
      const issue = makeIssue('WARN1')

      const next = analysisFlowReducer(INITIAL_STATE, {
        type: 'SET_EXTRACTED',
        payload: { households: [hh], issues: [issue] },
      })

      expect(next.step).toBe('questionnaire')
      expect(next.households).toEqual([hh])
      expect(next.uploadedHouseholds).toEqual([hh])
      expect(next.issues).toEqual([issue])
      expect(next.results).toEqual([])
      expect(next.error).toBeNull()
    })

    it('retains existing liquidacao when not provided in payload', () => {
      const prevLiq = { year: 2024, coletaTotal: 5000 }
      const stateWithLiq: AnalysisFlowState = {
        ...INITIAL_STATE,
        liquidacao: prevLiq,
      }

      const next = analysisFlowReducer(stateWithLiq, {
        type: 'SET_EXTRACTED',
        payload: { households: [makeHousehold()], issues: [] },
      })

      expect(next.liquidacao).toEqual(prevLiq)
    })

    it('replaces liquidacao when provided in payload', () => {
      const prevLiq = { year: 2024, coletaTotal: 5000 }
      const newLiq = { year: 2024, coletaTotal: 7000 }
      const stateWithLiq: AnalysisFlowState = {
        ...INITIAL_STATE,
        liquidacao: prevLiq,
      }

      const next = analysisFlowReducer(stateWithLiq, {
        type: 'SET_EXTRACTED',
        payload: { households: [makeHousehold()], issues: [], liquidacao: newLiq },
      })

      expect(next.liquidacao).toEqual(newLiq)
    })

    it('clears previous results and error', () => {
      const prevState: AnalysisFlowState = {
        ...INITIAL_STATE,
        results: [makeResult()],
        error: 'old error',
      }

      const next = analysisFlowReducer(prevState, {
        type: 'SET_EXTRACTED',
        payload: { households: [makeHousehold()], issues: [] },
      })

      expect(next.results).toEqual([])
      expect(next.error).toBeNull()
    })
  })

  describe('START_CALCULATION', () => {
    it('sets calculating=true and clears error', () => {
      const prevState: AnalysisFlowState = {
        ...INITIAL_STATE,
        error: 'old error',
      }

      const next = analysisFlowReducer(prevState, { type: 'START_CALCULATION' })

      expect(next.calculating).toBe(true)
      expect(next.error).toBeNull()
    })
  })

  describe('CALC_SUCCESS', () => {
    it('sets results, households, step=results, and clears calculating', () => {
      const prevState: AnalysisFlowState = {
        ...INITIAL_STATE,
        step: 'questionnaire',
        calculating: true,
      }
      const result = makeResult()
      const hh = makeHousehold()

      const next = analysisFlowReducer(prevState, {
        type: 'CALC_SUCCESS',
        payload: { results: [result], households: [hh], newIssues: [] },
      })

      expect(next.results).toEqual([result])
      expect(next.households).toEqual([hh])
      expect(next.step).toBe('results')
      expect(next.calculating).toBe(false)
      expect(next.error).toBeNull()
    })

    it('merges new issues with existing ones, deduplicating', () => {
      const existingIssue = makeIssue('EXISTING', 'first')
      const newIssue = makeIssue('NEW', 'second')
      const duplicate = makeIssue('EXISTING', 'first') // same code + message

      const prevState: AnalysisFlowState = {
        ...INITIAL_STATE,
        issues: [existingIssue],
        calculating: true,
      }

      const next = analysisFlowReducer(prevState, {
        type: 'CALC_SUCCESS',
        payload: {
          results: [makeResult()],
          households: [makeHousehold()],
          newIssues: [newIssue, duplicate],
        },
      })

      expect(next.issues).toHaveLength(2) // existing + new, not the duplicate
      expect(next.issues).toEqual([existingIssue, newIssue])
    })

    it('advances furthestStep to results', () => {
      const prevState: AnalysisFlowState = {
        ...INITIAL_STATE,
        furthestStep: 1,
        calculating: true,
      }

      const next = analysisFlowReducer(prevState, {
        type: 'CALC_SUCCESS',
        payload: {
          results: [makeResult()],
          households: [makeHousehold()],
          newIssues: [],
        },
      })

      expect(next.furthestStep).toBe(STEPS.indexOf('results'))
    })

    it('does not reduce furthestStep', () => {
      const prevState: AnalysisFlowState = {
        ...INITIAL_STATE,
        furthestStep: STEPS.indexOf('results'),
        calculating: true,
      }

      const next = analysisFlowReducer(prevState, {
        type: 'CALC_SUCCESS',
        payload: {
          results: [makeResult()],
          households: [makeHousehold()],
          newIssues: [],
        },
      })

      expect(next.furthestStep).toBe(STEPS.indexOf('results'))
    })
  })

  describe('CALC_FAILURE', () => {
    it('sets error, clears calculating, reverts to questionnaire', () => {
      const prevState: AnalysisFlowState = {
        ...INITIAL_STATE,
        step: 'results',
        calculating: true,
      }

      const next = analysisFlowReducer(prevState, {
        type: 'CALC_FAILURE',
        payload: { error: 'Something broke' },
      })

      expect(next.error).toBe('Something broke')
      expect(next.calculating).toBe(false)
      expect(next.step).toBe('questionnaire')
    })

    it('appends error issue when provided', () => {
      const prevState: AnalysisFlowState = {
        ...INITIAL_STATE,
        issues: [makeIssue('PREV')],
        calculating: true,
      }

      const errIssue = makeIssue('CALC_ERROR', 'Calculation failed')

      const next = analysisFlowReducer(prevState, {
        type: 'CALC_FAILURE',
        payload: { error: 'fail', issue: errIssue },
      })

      expect(next.issues).toHaveLength(2)
      expect(next.issues[1]).toEqual(errIssue)
    })

    it('does not append issue when not provided', () => {
      const prevState: AnalysisFlowState = {
        ...INITIAL_STATE,
        issues: [makeIssue('PREV')],
        calculating: true,
      }

      const next = analysisFlowReducer(prevState, {
        type: 'CALC_FAILURE',
        payload: { error: 'fail' },
      })

      expect(next.issues).toHaveLength(1)
    })

    it('deduplicates error issues', () => {
      const existingIssue = makeIssue('CALC_ERROR', 'fail')
      const prevState: AnalysisFlowState = {
        ...INITIAL_STATE,
        issues: [existingIssue],
        calculating: true,
      }

      const next = analysisFlowReducer(prevState, {
        type: 'CALC_FAILURE',
        payload: { error: 'fail', issue: makeIssue('CALC_ERROR', 'fail') },
      })

      expect(next.issues).toHaveLength(1)
    })
  })

  describe('GO_TO_STEP', () => {
    it('sets step and clears error', () => {
      const prevState: AnalysisFlowState = {
        ...INITIAL_STATE,
        step: 'results',
        error: 'some error',
        furthestStep: 2,
      }

      const next = analysisFlowReducer(prevState, {
        type: 'GO_TO_STEP',
        payload: 'upload',
      })

      expect(next.step).toBe('upload')
      expect(next.error).toBeNull()
      // furthestStep unchanged — GO_TO_STEP is for navigation, not advancement
      expect(next.furthestStep).toBe(2)
    })
  })

  describe('ADVANCE_STEP', () => {
    it('sets step and advances furthestStep', () => {
      const next = analysisFlowReducer(INITIAL_STATE, {
        type: 'ADVANCE_STEP',
        payload: 'questionnaire',
      })

      expect(next.step).toBe('questionnaire')
      expect(next.furthestStep).toBe(STEPS.indexOf('questionnaire'))
    })

    it('does not reduce furthestStep', () => {
      const prevState: AnalysisFlowState = {
        ...INITIAL_STATE,
        furthestStep: 2,
      }

      const next = analysisFlowReducer(prevState, {
        type: 'ADVANCE_STEP',
        payload: 'questionnaire',
      })

      expect(next.furthestStep).toBe(2)
    })
  })

  describe('SET_ERROR / DISMISS_ERROR', () => {
    it('SET_ERROR sets error string', () => {
      const next = analysisFlowReducer(INITIAL_STATE, {
        type: 'SET_ERROR',
        payload: 'Something went wrong',
      })

      expect(next.error).toBe('Something went wrong')
    })

    it('DISMISS_ERROR clears error', () => {
      const prevState: AnalysisFlowState = {
        ...INITIAL_STATE,
        error: 'bad',
      }

      const next = analysisFlowReducer(prevState, { type: 'DISMISS_ERROR' })

      expect(next.error).toBeNull()
    })
  })

  describe('CLEAR_ALL', () => {
    it('resets to initial state', () => {
      const fullState: AnalysisFlowState = {
        step: 'results',
        households: [makeHousehold()],
        uploadedHouseholds: [makeHousehold()],
        results: [makeResult()],
        issues: [makeIssue('X')],
        liquidacao: { year: 2024, coletaTotal: 1000 },
        calculating: false,
        error: 'old',
        furthestStep: 2,
      }

      const next = analysisFlowReducer(fullState, { type: 'CLEAR_ALL' })

      expect(next).toEqual(INITIAL_STATE)
    })
  })

  describe('RELOAD_DOCUMENTS', () => {
    it('clears households, results, issues, liquidacao, and error', () => {
      const prevState: AnalysisFlowState = {
        ...INITIAL_STATE,
        step: 'results',
        households: [makeHousehold()],
        uploadedHouseholds: [makeHousehold()],
        results: [makeResult()],
        issues: [makeIssue('X')],
        liquidacao: { year: 2024, coletaTotal: 1000 },
        error: 'old',
        furthestStep: 2,
      }

      const next = analysisFlowReducer(prevState, { type: 'RELOAD_DOCUMENTS' })

      expect(next.households).toEqual([])
      expect(next.uploadedHouseholds).toEqual([])
      expect(next.results).toEqual([])
      expect(next.issues).toEqual([])
      expect(next.liquidacao).toBeNull()
      expect(next.error).toBeNull()
      // Preserves step and furthestStep
      expect(next.step).toBe('results')
      expect(next.furthestStep).toBe(2)
    })
  })

  describe('unknown action', () => {
    it('returns state unchanged', () => {
      const next = analysisFlowReducer(INITIAL_STATE, {
        type: 'UNKNOWN_TYPE',
      } as unknown as AnalysisFlowAction)

      expect(next).toBe(INITIAL_STATE)
    })
  })

  describe('deduplication logic', () => {
    it('deduplicates by code+message, not severity', () => {
      const prev: AnalysisFlowState = {
        ...INITIAL_STATE,
        issues: [{ severity: 'warning', code: 'X', message: 'hello' }],
        calculating: true,
      }

      const next = analysisFlowReducer(prev, {
        type: 'CALC_SUCCESS',
        payload: {
          results: [makeResult()],
          households: [makeHousehold()],
          newIssues: [{ severity: 'error', code: 'X', message: 'hello' }],
        },
      })

      // Same code+message → deduplicated, even though severity differs
      expect(next.issues).toHaveLength(1)
    })
  })

  describe('DEFAULTS_USED warning via CALC_SUCCESS', () => {
    it('carries DEFAULTS_USED warning from extraIssues through to state.issues', () => {
      const defaultsWarning = makeIssue('DEFAULTS_USED', 'Using defaults')
      const prev: AnalysisFlowState = {
        ...INITIAL_STATE,
        calculating: true,
      }

      const next = analysisFlowReducer(prev, {
        type: 'CALC_SUCCESS',
        payload: {
          results: [makeResult()],
          households: [makeHousehold()],
          newIssues: [defaultsWarning],
        },
      })

      expect(next.issues).toHaveLength(1)
      expect(next.issues[0].code).toBe('DEFAULTS_USED')
      expect(next.issues[0].severity).toBe('warning')
    })

    it('preserves DEFAULTS_USED alongside spouse-missing warning', () => {
      const spouseWarning = makeIssue('SPOUSE_MISSING', 'Spouse docs missing')
      const defaultsWarning = makeIssue('DEFAULTS_USED', 'Using defaults')
      const prev: AnalysisFlowState = {
        ...INITIAL_STATE,
        issues: [spouseWarning],
        calculating: true,
      }

      const next = analysisFlowReducer(prev, {
        type: 'CALC_SUCCESS',
        payload: {
          results: [makeResult()],
          households: [makeHousehold()],
          newIssues: [defaultsWarning],
        },
      })

      expect(next.issues).toHaveLength(2)
      expect(next.issues.map((i) => i.code)).toContain('SPOUSE_MISSING')
      expect(next.issues.map((i) => i.code)).toContain('DEFAULTS_USED')
    })
  })
})
