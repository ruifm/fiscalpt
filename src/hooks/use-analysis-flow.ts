'use client'

import { useReducer, useCallback, useRef, useEffect, useMemo } from 'react'
import type { Household, AnalysisResult, ValidationIssue } from '@/lib/tax/types'
import type { LiquidacaoParsed } from '@/lib/tax/pdf-extractor'
import { analyzeHousehold } from '@/lib/tax'
import { validateHousehold } from '@/lib/tax/input-validation'
import { validateAgainstLiquidacao } from '@/lib/tax/pdf-extractor'
import {
  saveSessionState,
  loadSessionState,
  clearSessionState,
  migrateLegacySession,
} from '@/lib/session-persistence'
import { propagateSharedData } from '@/lib/tax/propagate-shared-data'
import { estimateProjectedRetentions } from '@/lib/tax/projection'
import { applyDefaults } from '@/lib/tax/missing-inputs'
import { trackEvent } from '@/lib/analytics'

// ─── Types ────────────────────────────────────────────────────

export type Step = 'upload' | 'questionnaire' | 'results'

export const STEPS: Step[] = ['upload', 'questionnaire', 'results']

export interface AnalysisFlowState {
  step: Step
  households: Household[]
  uploadedHouseholds: Household[]
  results: AnalysisResult[]
  issues: ValidationIssue[]
  liquidacao: LiquidacaoParsed | null
  calculating: boolean
  error: string | null
  furthestStep: number
}

export const INITIAL_STATE: AnalysisFlowState = {
  step: 'upload',
  households: [],
  uploadedHouseholds: [],
  results: [],
  issues: [],
  liquidacao: null,
  calculating: false,
  error: null,
  furthestStep: 0,
}

// ─── Actions ──────────────────────────────────────────────────

export type AnalysisFlowAction =
  | {
      type: 'RESTORE_SESSION'
      payload: {
        step: Step
        households: Household[]
        uploadedHouseholds?: Household[]
        results: AnalysisResult[]
        issues: ValidationIssue[]
        liquidacao: LiquidacaoParsed | null
      }
    }
  | {
      type: 'SET_EXTRACTED'
      payload: {
        households: Household[]
        issues: ValidationIssue[]
        liquidacao?: LiquidacaoParsed
      }
    }
  | { type: 'START_CALCULATION' }
  | {
      type: 'CALC_SUCCESS'
      payload: {
        results: AnalysisResult[]
        households: Household[]
        newIssues: ValidationIssue[]
      }
    }
  | {
      type: 'CALC_FAILURE'
      payload: {
        error: string
        issue?: ValidationIssue
      }
    }
  | { type: 'GO_TO_STEP'; payload: Step }
  | { type: 'ADVANCE_STEP'; payload: Step }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'DISMISS_ERROR' }
  | { type: 'CLEAR_ALL' }
  | { type: 'RELOAD_DOCUMENTS' }

// ─── Helpers ──────────────────────────────────────────────────

function deduplicateIssues(
  existing: ValidationIssue[],
  incoming: ValidationIssue[],
): ValidationIssue[] {
  const seen = new Set(existing.map((i) => `${i.code}:${i.message}`))
  return [...existing, ...incoming.filter((i) => !seen.has(`${i.code}:${i.message}`))]
}

// ─── Reducer ──────────────────────────────────────────────────

export function analysisFlowReducer(
  state: AnalysisFlowState,
  action: AnalysisFlowAction,
): AnalysisFlowState {
  switch (action.type) {
    case 'RESTORE_SESSION': {
      const { step, households, uploadedHouseholds, results, issues, liquidacao } = action.payload
      // Derive furthestStep from restored data
      const derivedFurthest = results.length > 0 ? STEPS.indexOf('results') : STEPS.indexOf(step)
      return {
        ...state,
        step,
        households,
        uploadedHouseholds: uploadedHouseholds ?? households,
        results,
        issues,
        liquidacao,
        furthestStep: derivedFurthest,
      }
    }

    case 'SET_EXTRACTED': {
      const { households, issues, liquidacao } = action.payload
      return {
        ...state,
        step: 'questionnaire',
        households,
        uploadedHouseholds: households,
        results: [],
        issues,
        liquidacao: liquidacao ?? state.liquidacao,
        error: null,
        furthestStep: STEPS.indexOf('questionnaire'),
      }
    }

    case 'START_CALCULATION':
      return { ...state, calculating: true, error: null }

    case 'CALC_SUCCESS': {
      const { results, households, newIssues } = action.payload
      const mergedIssues = deduplicateIssues(state.issues, newIssues)
      return {
        ...state,
        results,
        households,
        issues: mergedIssues,
        step: 'results',
        furthestStep: Math.max(state.furthestStep, STEPS.indexOf('results')),
        calculating: false,
        error: null,
      }
    }

    case 'CALC_FAILURE': {
      const { error, issue } = action.payload
      const issues = issue ? deduplicateIssues(state.issues, [issue]) : state.issues
      return {
        ...state,
        error,
        issues,
        step: 'questionnaire',
        calculating: false,
      }
    }

    case 'GO_TO_STEP':
      return { ...state, step: action.payload, error: null }

    case 'ADVANCE_STEP': {
      const idx = STEPS.indexOf(action.payload)
      return {
        ...state,
        step: action.payload,
        furthestStep: Math.max(state.furthestStep, idx),
        error: null,
      }
    }

    case 'SET_ERROR':
      return { ...state, error: action.payload }

    case 'DISMISS_ERROR':
      return { ...state, error: null }

    case 'CLEAR_ALL':
      return { ...INITIAL_STATE }

    case 'RELOAD_DOCUMENTS':
      return {
        ...state,
        households: [],
        uploadedHouseholds: [],
        results: [],
        issues: [],
        liquidacao: null,
        error: null,
      }

    default:
      return state
  }
}

// ─── Hook ─────────────────────────────────────────────────────

interface UseAnalysisFlowOptions {
  sessionId: string
  t: (key: string, params?: Record<string, string | number>) => string
}

export function useAnalysisFlow({ sessionId, t }: UseAnalysisFlowOptions) {
  const [state, dispatch] = useReducer(analysisFlowReducer, INITIAL_STATE)
  const restoredRef = useRef(false)
  const clearingRef = useRef(false)

  // Mirror latest state for persistence (avoids stale closures)
  const stateRef = useRef(state)
  useEffect(() => {
    stateRef.current = state
  })

  // ── Persistence helper ───────────────────────────────────────

  const persist = useCallback(
    (snapshot: Partial<AnalysisFlowState>) => {
      const s = { ...stateRef.current, ...snapshot }
      saveSessionState(sessionId, {
        step: s.step,
        households: s.households,
        uploadedHouseholds: s.uploadedHouseholds.length > 0 ? s.uploadedHouseholds : undefined,
        results: s.results,
        issues: s.issues,
        liquidacao: s.liquidacao,
      })
    },
    [sessionId],
  )

  // ── Session restore on mount ─────────────────────────────────

  useEffect(() => {
    if (restoredRef.current) return
    restoredRef.current = true

    trackEvent('page_view')

    const saved = loadSessionState(sessionId) ?? migrateLegacySession(sessionId)
    if (saved) {
      const step = (saved.step === 'review' ? 'questionnaire' : saved.step) as Step
      dispatch({
        type: 'RESTORE_SESSION',
        payload: {
          step,
          households: saved.households,
          uploadedHouseholds: saved.uploadedHouseholds,
          results: saved.results,
          issues: saved.issues,
          liquidacao: saved.liquidacao,
        },
      })
    }

    window.history.replaceState(null, '', `#s=${sessionId}`)
  }, [sessionId])

  // ── Persistence effect ───────────────────────────────────────
  // Persists after every meaningful state change. Guards:
  // - Skip before first restore completes
  // - Skip if a clear just happened (clearingRef)

  useEffect(() => {
    if (!restoredRef.current) return
    if (clearingRef.current) {
      clearingRef.current = false
      return
    }
    persist({})
  }, [
    persist,
    state.step,
    state.households,
    state.uploadedHouseholds,
    state.results,
    state.issues,
    state.liquidacao,
  ])

  // ── Derived values ───────────────────────────────────────────

  const primaryHousehold = state.households[0] ?? null

  const questionnaireHousehold = state.uploadedHouseholds[0] ?? primaryHousehold

  const projectionYear = useMemo(() => {
    if (!primaryHousehold) return undefined
    const currentYear = new Date().getFullYear()
    if (primaryHousehold.year >= currentYear - 1) return primaryHousehold.year + 1
    return undefined
  }, [primaryHousehold])

  // ── Handlers ─────────────────────────────────────────────────

  const handleExtracted = useCallback(
    (hs: Household[], newIssues: ValidationIssue[], liq?: LiquidacaoParsed) => {
      trackEvent('upload_complete', { householdCount: hs.length })
      dispatch({
        type: 'SET_EXTRACTED',
        payload: { households: hs, issues: newIssues, liquidacao: liq },
      })
    },
    [],
  )

  const computeAndShowResults = useCallback(
    (allHouseholds: Household[], extraIssues: ValidationIssue[] = []) => {
      // Validate but never block — surface issues as warnings alongside results
      const freshErrors = allHouseholds.flatMap((hh) => validateHousehold(hh))
      const validationWarnings: ValidationIssue[] = freshErrors
        .filter((e) => e.severity === 'error')
        .map((e) => ({
          severity: 'warning' as const,
          code: e.code,
          message: e.message,
        }))

      dispatch({ type: 'START_CALCULATION' })

      try {
        const nonProjected = allHouseholds.filter((hh) => !hh.projected)
        const projectedRaw = allHouseholds.filter((hh) => hh.projected)

        const allResults: AnalysisResult[] = nonProjected.map((hh) => analyzeHousehold(hh))

        // Enrich projected households with estimated retentions
        const primaryHH = nonProjected[0]
        const primaryResult = allResults.find((r) => r.year === primaryHH?.year)
        const enrichedHouseholds = [...nonProjected]

        for (const proj of projectedRaw) {
          const enriched =
            primaryHH && primaryResult
              ? estimateProjectedRetentions(proj, primaryHH, primaryResult)
              : proj
          enrichedHouseholds.push(enriched)
          allResults.push(analyzeHousehold(enriched))
        }

        // Diagnostic logging
        for (const r of allResults) {
          console.info(
            '[FiscalPT] Year:',
            r.year,
            r.household.projected ? '(projected)' : '(real)',
            {
              members: r.household.members.map((m) => ({
                name: m.name,
                nif: m.nif ?? '?',
                nhr: m.special_regimes.includes('nhr'),
                nhr_confirmed: m.nhr_confirmed ?? false,
                nhr_start: m.nhr_start_year ?? '?',
                regimes: m.special_regimes,
                irs_jovem_year: m.irs_jovem_year ?? '?',
                first_work: m.irs_jovem_first_work_year ?? '?',
              })),
              filing: r.household.filing_status,
              scenarios: r.scenarios.map((s) => ({
                filing: s.filing_status,
                burden: s.total_tax_burden.toFixed(2),
              })),
              personRates: r.scenarios[0]?.persons.map((p) => ({
                name: p.name,
                gross: p.gross_income,
                taxable: p.taxable_income,
                rate: (p.effective_rate_irs * 100).toFixed(2) + '%',
                irs_jovem_exempt: p.irs_jovem_exemption.toFixed(2),
                nhr_tax: p.nhr_tax.toFixed(2),
                irs_after: p.irs_after_deductions.toFixed(2),
              })),
              optimizations: r.optimizations.length,
            },
          )
        }

        // Cross-validate against liquidação
        const liqIssues: ValidationIssue[] = []
        const currentLiq = stateRef.current.liquidacao
        if (currentLiq) {
          for (const result of allResults) {
            if (result.year !== currentLiq.year) continue
            if (result.scenarios.length === 0) continue
            const validation = validateAgainstLiquidacao(currentLiq, result.scenarios[0])
            if (!validation.isValid) {
              liqIssues.push(...validation.issues)
            }
          }
        }

        const allNewIssues = [...validationWarnings, ...liqIssues, ...extraIssues]

        dispatch({
          type: 'CALC_SUCCESS',
          payload: {
            results: allResults,
            households: enrichedHouseholds,
            newIssues: allNewIssues,
          },
        })

        trackEvent('results_viewed', { scenarioCount: allResults.length })
      } catch (err) {
        const message = err instanceof Error ? err.message : t('analyze.calcError')
        const errorIssue: ValidationIssue = {
          severity: 'error',
          code: 'CALC_ERROR',
          message: t('analyze.calcErrorPrefix', { message }),
        }
        dispatch({
          type: 'CALC_FAILURE',
          payload: { error: message, issue: errorIssue },
        })
      }
    },
    [t],
  )

  const handleQuestionnaireComplete = useCallback(
    (h: Household, projectedHousehold?: Household) => {
      trackEvent('questionnaire_complete')
      const currentHouseholds = stateRef.current.households
      const nonProjected = currentHouseholds.filter((hh) => !hh.projected)
      const allHouseholds = nonProjected.map((hh, idx) => {
        if (idx === 0) return h
        const propagated = propagateSharedData(h, hh)
        console.info('[FiscalPT] Propagation year:', hh.year, {
          members: propagated.members.map((m) => ({
            name: m.name,
            nif: m.nif ?? '?',
            regimes: m.special_regimes,
            nhr_confirmed: m.nhr_confirmed,
            nhr_start_year: m.nhr_start_year,
            irs_jovem_first_work_year: m.irs_jovem_first_work_year,
            irs_jovem_year: m.irs_jovem_year,
            irs_jovem_is_phd: m.irs_jovem_is_phd,
            birth_year: m.birth_year,
          })),
        })
        // Apply defaults to fill any remaining gaps (e.g. dependents
        // not matched across years)
        return applyDefaults(propagated)
      })
      if (projectedHousehold) allHouseholds.push(projectedHousehold)
      computeAndShowResults(allHouseholds)
    },
    [computeAndShowResults],
  )

  const handleSkipQuestionnaire = useCallback(() => {
    trackEvent('questionnaire_skip')
    const currentHouseholds = stateRef.current.households
    const primary = currentHouseholds[0]
    if (!primary) return
    const withDefaults = applyDefaults(primary)
    const allHouseholds = currentHouseholds.map((hh, idx) => {
      if (idx === 0) return withDefaults
      // Propagate shared data from primary, then apply defaults to fill
      // any remaining gaps (e.g. dependents not matched across years)
      return applyDefaults(propagateSharedData(withDefaults, hh))
    })
    const defaultsWarning: ValidationIssue = {
      severity: 'warning',
      code: 'DEFAULTS_USED',
      message: t('analyze.defaultsUsedWarning'),
    }
    computeAndShowResults(allHouseholds, [defaultsWarning])
  }, [computeAndShowResults, t])

  const handleClearAll = useCallback(() => {
    clearingRef.current = true
    clearSessionState(sessionId)
    dispatch({ type: 'CLEAR_ALL' })
    // Clear cached questionnaire data
    try {
      for (const key of Object.keys(sessionStorage)) {
        if (key.startsWith('fiscalpt-answers-') || key.startsWith('fiscalpt-projection-')) {
          sessionStorage.removeItem(key)
        }
      }
    } catch {}
    window.history.replaceState(null, '', window.location.pathname)
  }, [sessionId])

  const goToStep = useCallback((target: Step) => {
    dispatch({ type: 'GO_TO_STEP', payload: target })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const advanceStep = useCallback((target: Step) => {
    dispatch({ type: 'ADVANCE_STEP', payload: target })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const reloadDocuments = useCallback(() => {
    dispatch({ type: 'RELOAD_DOCUMENTS' })
  }, [])

  const dismissError = useCallback(() => {
    dispatch({ type: 'DISMISS_ERROR' })
  }, [])

  return {
    state,
    primaryHousehold,
    questionnaireHousehold,
    projectionYear,
    handleExtracted,
    handleQuestionnaireComplete,
    handleSkipQuestionnaire,
    handleClearAll,
    goToStep,
    advanceStep,
    reloadDocuments,
    dismissError,
    computeAndShowResults,
  }
}
