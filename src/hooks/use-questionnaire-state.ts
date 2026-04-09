import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import type { Household, Income } from '@/lib/tax/types'
import {
  identifyMissingInputs,
  groupBySection,
  applyAnswers,
  validateAnswer,
  type MissingInputQuestion,
} from '@/lib/tax/missing-inputs'
import { buildProjectedHousehold } from '@/lib/tax/projection'
import { useAnswerHistory } from '@/hooks/use-answer-history'

function isQuestionAnswered(
  answers: Record<string, string | number | boolean>,
  questionId: string,
): boolean {
  const val = answers[questionId]
  return val !== undefined && val !== ''
}

export interface UseQuestionnaireStateOptions {
  household: Household
  projectionYear?: number
  otherYearHouseholds?: Household[]
}

export function useQuestionnaireState({
  household,
  projectionYear,
  otherYearHouseholds,
}: UseQuestionnaireStateOptions) {
  // ─── Questions ──────────────────────────────────────────────
  const initialQuestions = useMemo(
    () => identifyMissingInputs(household, otherYearHouseholds),
    [household, otherYearHouseholds],
  )

  // ─── Answers (with sessionStorage persistence) ─────────────
  const answersStorageKey = `fiscalpt-answers-${household.year}`
  const initialAnswers = useMemo(() => {
    const init: Record<string, string | number | boolean> = {}
    for (const q of initialQuestions) {
      if (q.currentValue !== undefined && !q.isPlaceholder) {
        init[q.id] = q.currentValue
      }
    }
    try {
      const raw = sessionStorage.getItem(answersStorageKey)
      if (raw) {
        const cached = JSON.parse(raw) as Record<string, string | number | boolean>
        for (const [k, v] of Object.entries(cached)) {
          if (v !== '' && v !== undefined) init[k] = v
        }
      }
    } catch {}
    return init
  }, [initialQuestions, answersStorageKey])

  const history = useAnswerHistory(initialAnswers)
  const answers = history.state.current

  useEffect(() => {
    try {
      const nonEmpty = Object.fromEntries(
        Object.entries(answers).filter(([, v]) => v !== '' && v !== undefined),
      )
      if (Object.keys(nonEmpty).length > 0) {
        sessionStorage.setItem(answersStorageKey, JSON.stringify(nonEmpty))
      }
    } catch {}
  }, [answers, answersStorageKey])

  // ─── Dynamic question accumulation ─────────────────────────
  const liveQuestions = useMemo(() => {
    if (Object.keys(answers).length === 0) return initialQuestions
    const liveHousehold = applyAnswers(household, answers)
    return identifyMissingInputs(liveHousehold, otherYearHouseholds)
  }, [household, answers, initialQuestions, otherYearHouseholds])

  const questions = useMemo(() => {
    const seen = new Map<string, MissingInputQuestion>()
    for (const q of initialQuestions) seen.set(q.id, q)
    for (const q of liveQuestions) {
      if (!seen.has(q.id)) seen.set(q.id, q)
    }
    return Array.from(seen.values())
  }, [initialQuestions, liveQuestions])

  const sections = useMemo(() => groupBySection(questions), [questions])

  // ─── UI state ──────────────────────────────────────────────
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | null>>({})
  const containerRef = useRef<HTMLDivElement>(null)

  // ─── Projection ────────────────────────────────────────────
  const projectionStorageKey = `fiscalpt-projection-${household.year}`
  const [projectionEnabled, setProjectionEnabled] = useState(() => {
    if (typeof window === 'undefined') return false
    try {
      const saved = sessionStorage.getItem(projectionStorageKey)
      if (saved) return JSON.parse(saved).enabled ?? false
    } catch {}
    return !!projectionYear
  })
  const [projectedIncomes, setProjectedIncomes] = useState<Record<string, number>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem(projectionStorageKey)
        if (saved) {
          const parsed = JSON.parse(saved)
          if (parsed.incomes && Object.keys(parsed.incomes).length > 0) return parsed.incomes
        }
      } catch {}
    }
    const initial: Record<string, number> = {}
    for (const member of household.members) {
      const nif = member.nif ?? member.name
      for (const income of member.incomes) {
        const key = `${nif}:${income.category}`
        initial[key] = (initial[key] ?? 0) + income.gross
      }
    }
    return initial
  })

  useEffect(() => {
    try {
      sessionStorage.setItem(
        projectionStorageKey,
        JSON.stringify({ enabled: projectionEnabled, incomes: projectedIncomes }),
      )
    } catch {}
  }, [projectionEnabled, projectedIncomes, projectionStorageKey])

  // ─── Auto-scroll to first unanswered field on mount ─────────
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!containerRef.current) return
      const allFields = containerRef.current.querySelectorAll<HTMLElement>('[data-question-id]')
      for (const el of allFields) {
        const qId = el.getAttribute('data-question-id')
        if (!qId) continue
        if (isQuestionAnswered(answers, qId)) continue
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        const input = el.querySelector<HTMLElement>('input, select, textarea')
        input?.focus()
        return
      }
      const first = containerRef.current.querySelector<HTMLElement>(
        'input:not([type=hidden]), select, textarea',
      )
      first?.focus()
    }, 200)
    return () => clearTimeout(timer)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Handlers ──────────────────────────────────────────────
  const setAnswer = useCallback(
    (id: string, value: string | number | boolean) => {
      const question = questions.find((q) => q.id === id)
      const error = question ? validateAnswer(question, value) : null
      setFieldErrors((prev) => ({ ...prev, [id]: error }))

      history.set(id, value)

      if (value !== '' && value !== undefined && !error) {
        const next = { ...answers, [id]: value }
        setTimeout(() => {
          if (!containerRef.current) return
          const allFields = containerRef.current.querySelectorAll<HTMLElement>('[data-question-id]')
          for (const el of allFields) {
            const qId = el.getAttribute('data-question-id')
            if (!qId) continue
            if (isQuestionAnswered(next, qId)) continue
            el.scrollIntoView({ behavior: 'smooth', block: 'center' })
            el.classList.add('ring-2', 'ring-primary/50')
            setTimeout(() => el.classList.remove('ring-2', 'ring-primary/50'), 1500)
            const input = el.querySelector<HTMLElement>('input, select, textarea')
            input?.focus()
            return
          }
        }, 100)
      }
    },
    [questions, history, answers],
  )

  const buildProjection = useCallback(
    (updatedHousehold: Household): Household | undefined => {
      if (!projectionEnabled || !projectionYear) return undefined
      const adjustedIncomes = new Map<string, Income[]>()
      for (const member of updatedHousehold.members) {
        const nif = member.nif ?? member.name
        const categoryTemplates = new Map<string, Income>()
        for (const income of member.incomes) {
          categoryTemplates.set(income.category, income)
        }
        const consolidated: Income[] = []
        for (const [category, template] of categoryTemplates) {
          consolidated.push({
            ...template,
            gross: projectedIncomes[`${nif}:${category}`] ?? template.gross,
          })
        }
        if (member.nif) adjustedIncomes.set(member.nif, consolidated)
      }
      return buildProjectedHousehold(updatedHousehold, adjustedIncomes)
    },
    [projectionEnabled, projectionYear, projectedIncomes],
  )

  const handleSubmit = useCallback(() => {
    const updated = applyAnswers(household, answers)
    // Detect if any question with isDefault was left at its default value
    const hasUnconfirmedDefaults = initialQuestions.some((q) => {
      if (!q.isDefault) return false
      const answer = answers[q.id]
      return answer === q.currentValue
    })
    return { updated, projected: buildProjection(updated), hasUnconfirmedDefaults }
  }, [household, answers, buildProjection, initialQuestions])

  return {
    // State
    questions,
    sections,
    answers,
    fieldErrors,
    containerRef,
    history,

    // Projection
    projectionEnabled,
    setProjectionEnabled,
    projectedIncomes,
    setProjectedIncomes,

    // Handlers
    setAnswer,
    handleSubmit,
  }
}
