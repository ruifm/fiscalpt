'use client'

import { useState, useMemo, useEffect, useRef, memo } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  Undo2,
  Redo2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { Household, Income } from '@/lib/tax/types'
import {
  identifyMissingInputs,
  groupBySection,
  applyAnswers,
  countUnansweredCritical,
  validateAnswer,
  type MissingInputQuestion,
  type QuestionSection,
} from '@/lib/tax/missing-inputs'
import { buildProjectedHousehold } from '@/lib/tax/projection'
import { useAnswerHistory } from '@/hooks/use-answer-history'
import { useT } from '@/lib/i18n'

interface HouseholdQuestionnaireProps {
  household: Household
  onComplete: (household: Household, projectedHousehold?: Household) => void
  onBack: () => void
  onSkip: () => void
  /** If set, show projection section for this year */
  projectionYear?: number
}

const PRIORITY_BADGE_STYLES: Record<string, string> = {
  critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  important: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  optional: 'bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400',
}

const SECTION_ICONS: Record<QuestionSection, string> = {
  taxpayer_info: '👤',
  dependents: '👶',
  ascendants: '👴',
  cat_b_details: '💼',
  irs_jovem: '🎓',
  nhr: '🌍',
  deductions: '🧾',
  income_options: '⚙️',
}

export function HouseholdQuestionnaire({
  household,
  onComplete,
  onBack,
  onSkip,
  projectionYear,
}: HouseholdQuestionnaireProps) {
  const t = useT()
  const initialQuestions = useMemo(() => identifyMissingInputs(household), [household])

  // Pre-fill answers from questions that already have confirmed (non-placeholder) values
  const initialAnswers = useMemo(() => {
    const init: Record<string, string | number | boolean> = {}
    for (const q of initialQuestions) {
      if (q.currentValue !== undefined && !q.isPlaceholder) {
        init[q.id] = q.currentValue
      }
    }
    return init
  }, [initialQuestions])
  const history = useAnswerHistory(initialAnswers)
  const answers = history.state.current

  // Dynamic question accumulation: apply current answers to get a live household,
  // then re-identify missing inputs. This surfaces dependent questions (e.g. IRS
  // Jovem after birth_year is answered). Union with initial questions to keep
  // already-shown fields visible.
  const liveQuestions = useMemo(() => {
    if (Object.keys(answers).length === 0) return initialQuestions
    const liveHousehold = applyAnswers(household, answers)
    return identifyMissingInputs(liveHousehold)
  }, [household, answers, initialQuestions])

  const questions = useMemo(() => {
    const seen = new Map<string, MissingInputQuestion>()
    for (const q of initialQuestions) seen.set(q.id, q)
    for (const q of liveQuestions) {
      if (!seen.has(q.id)) seen.set(q.id, q)
    }
    return Array.from(seen.values())
  }, [initialQuestions, liveQuestions])

  const sections = useMemo(() => groupBySection(questions), [questions])
  const [showSkipWarning, setShowSkipWarning] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | null>>({})
  const containerRef = useRef<HTMLDivElement>(null)

  // Projection state
  const [projectionEnabled, setProjectionEnabled] = useState(false)
  const [projectedIncomes, setProjectedIncomes] = useState<Record<string, number>>(() => {
    // Initialize with primary year's gross incomes consolidated by category per member.
    // Multiple incomes of the same category (e.g. two Cat A from a job change) are summed.
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

  // Auto-scroll to the first unanswered mandatory question on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!containerRef.current) return
      const allFields = containerRef.current.querySelectorAll<HTMLElement>('[data-question-id]')
      for (const el of allFields) {
        const qId = el.getAttribute('data-question-id')
        const qPriority = el.getAttribute('data-priority')
        if (!qId || (qPriority !== 'critical' && qPriority !== 'important')) continue
        if (isQuestionAnswered(answers, qId)) continue
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        const input = el.querySelector<HTMLElement>('input, select, textarea')
        input?.focus()
        return
      }
      // Fallback: focus first input
      const first = containerRef.current.querySelector<HTMLElement>(
        'input:not([type=hidden]), select, textarea',
      )
      first?.focus()
    }, 200)
    return () => clearTimeout(timer)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const criticalUnanswered = countUnansweredCritical(questions, answers)
  const answeredCount = Object.keys(answers).filter(
    (k) => answers[k] !== '' && answers[k] !== undefined,
  ).length
  const totalCount = questions.length

  // Controlled accordion: track which sections are open.
  // Auto-open sections with critical/important questions; preserve user toggles.
  const autoOpenSections = useMemo(
    () =>
      new Set(
        sections
          .filter((g) =>
            g.questions.some((q) => q.priority === 'critical' || q.priority === 'important'),
          )
          .map((g) => `section-${sections.indexOf(g)}`),
      ),
    [sections],
  )
  // Tracks user-explicit open/close overrides (undefined = no override, use auto)
  const [userToggles, setUserToggles] = useState<Record<string, boolean>>({})
  const openSections = useMemo(() => {
    const result: string[] = []
    for (const g of sections) {
      const id = `section-${sections.indexOf(g)}`
      const userToggle = userToggles[id]
      if (userToggle === true || (userToggle === undefined && autoOpenSections.has(id))) {
        result.push(id)
      }
    }
    return result
  }, [sections, autoOpenSections, userToggles])

  function handleAccordionChange(value: string[]) {
    const valueSet = new Set(value)
    setUserToggles((prev) => {
      const next = { ...prev }
      for (const g of sections) {
        const id = `section-${sections.indexOf(g)}`
        const isNowOpen = valueSet.has(id)
        const wasOpen = openSections.includes(id)
        if (isNowOpen !== wasOpen) {
          next[id] = isNowOpen
        }
      }
      return next
    })
  }

  function setAnswer(id: string, value: string | number | boolean) {
    const question = questions.find((q) => q.id === id)
    const error = question ? validateAnswer(question, value) : null
    setFieldErrors((prev) => ({ ...prev, [id]: error }))

    history.set(id, value)

    // Only autoscroll if value is non-empty and passes validation
    if (value !== '' && value !== undefined && !error) {
      const next = { ...answers, [id]: value }
      setTimeout(() => {
        if (!containerRef.current) return
        const allFields = containerRef.current.querySelectorAll<HTMLElement>('[data-question-id]')
        for (const el of allFields) {
          const qId = el.getAttribute('data-question-id')
          const qPriority = el.getAttribute('data-priority')
          if (!qId || (qPriority !== 'critical' && qPriority !== 'important')) continue
          if (isQuestionAnswered(next, qId)) continue
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          el.classList.add('ring-2', 'ring-primary/50')
          setTimeout(() => el.classList.remove('ring-2', 'ring-primary/50'), 1500)
          return
        }
      }, 100)
    }
  }

  function buildProjection(updatedHousehold: Household): Household | undefined {
    if (!projectionEnabled || !projectionYear) return undefined
    const adjustedIncomes = new Map<string, Income[]>()
    for (const member of updatedHousehold.members) {
      const nif = member.nif ?? member.name
      // Build one consolidated income per category using the projected value.
      // Use the last income of each category as the template (most recent job/source).
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
  }

  function handleSubmit() {
    const updated = applyAnswers(household, answers)
    onComplete(updated, buildProjection(updated))
  }

  function handleSkip() {
    if (criticalUnanswered > 0) {
      setShowSkipWarning(true)
      return
    }
    const unansweredImportant = questions.filter(
      (q) => q.priority === 'important' && !isQuestionAnswered(answers, q.id),
    ).length
    if (unansweredImportant > 0 && !showSkipWarning) {
      setShowSkipWarning(true)
      return
    }
    // Apply whatever answers were given before skipping
    const updated = applyAnswers(household, answers)
    onSkip()
    onComplete(updated, buildProjection(updated))
  }

  // No questions needed AND no projection available → auto-advance
  if (questions.length === 0 && !projectionYear) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-green-500 mb-4" aria-hidden="true" />
          <h2 className="text-2xl font-bold tracking-tight">{t('questionnaire.dataComplete')}</h2>
          <p className="mt-2 text-muted-foreground">{t('questionnaire.dataCompleteDesc')}</p>
        </div>
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <Button
            variant="outline"
            onClick={onBack}
            className="w-full sm:w-auto gap-1.5"
            data-testid="questionnaire-back"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {t('common.back')}
          </Button>
          <Button
            onClick={() => onComplete(household)}
            className="w-full sm:w-auto gap-1.5"
            data-testid="questionnaire-continue"
          >
            {t('common.continue')}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {t('questionnaire.title')}
        </h1>
        <p className="mt-2 text-muted-foreground">{t('questionnaire.subtitle')}</p>
      </div>

      {/* Progress indicator */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">{t('questionnaire.progress')}</span>
              <span className="font-medium">
                {t('questionnaire.answered', { answered: answeredCount, total: totalCount })}
              </span>
            </div>
            {criticalUnanswered > 0 && (
              <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                <span className="text-xs font-medium">
                  {criticalUnanswered !== 1
                    ? t('questionnaire.criticalPlural', { count: criticalUnanswered })
                    : t('questionnaire.criticalSingular', { count: criticalUnanswered })}
                </span>
              </div>
            )}
          </div>
          <div
            className="mt-2 h-1.5 w-full rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={answeredCount}
            aria-valuemax={totalCount}
          >
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${totalCount > 0 ? (answeredCount / totalCount) * 100 : 0}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Undo / Redo */}
      <div className="flex items-center gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="outline"
                  size="icon"
                  disabled={!history.state.canUndo}
                  onClick={history.undo}
                  aria-label={t('questionnaire.undo')}
                />
              }
            >
              <Undo2 className="h-4 w-4" aria-hidden="true" />
            </TooltipTrigger>
            <TooltipContent>{t('questionnaire.undo')}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="outline"
                  size="icon"
                  disabled={!history.state.canRedo}
                  onClick={history.redo}
                  aria-label={t('questionnaire.redo')}
                />
              }
            >
              <Redo2 className="h-4 w-4" aria-hidden="true" />
            </TooltipTrigger>
            <TooltipContent>{t('questionnaire.redo')}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Projection section — front and center */}
      {projectionYear && (
        <ProjectionSection
          household={household}
          projectionYear={projectionYear}
          enabled={projectionEnabled}
          onToggle={setProjectionEnabled}
          incomes={projectedIncomes}
          onIncomeChange={(key, value) =>
            setProjectedIncomes((prev) => ({ ...prev, [key]: value }))
          }
        />
      )}

      {/* Sections */}
      <Accordion multiple value={openSections} onValueChange={handleAccordionChange}>
        {sections.map((group) => {
          const sIdx = sections.indexOf(group)
          return (
            <AccordionItem key={group.section} value={`section-${sIdx}`}>
              <Card className="mb-4 border">
                <AccordionTrigger className="w-full px-4 py-3 min-h-[44px] hover:no-underline">
                  <div className="flex items-center gap-3">
                    <span className="text-xl" aria-hidden="true">
                      {SECTION_ICONS[group.section]}
                    </span>
                    <div className="text-left">
                      <h3 className="font-semibold">{group.meta.title}</h3>
                      <p className="text-xs text-muted-foreground">{group.meta.description}</p>
                    </div>
                    <Badge variant="outline" className="ml-auto mr-2">
                      {group.questions.filter((q) => isQuestionAnswered(answers, q.id)).length}/
                      {group.questions.length}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <CardContent className="pt-0 space-y-4">
                    <Separator />
                    {group.questions.map((question) => (
                      <QuestionField
                        key={question.id}
                        question={question}
                        value={answers[question.id]}
                        onChange={(val) => setAnswer(question.id, val)}
                        error={fieldErrors[question.id] ?? null}
                      />
                    ))}
                  </CardContent>
                </AccordionContent>
              </Card>
            </AccordionItem>
          )
        })}
      </Accordion>

      {/* Skip warning */}
      {showSkipWarning && (
        <div
          role="alert"
          aria-live="assertive"
          className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-4"
        >
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" aria-hidden="true" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                {criticalUnanswered > 0
                  ? t('questionnaire.skipWarningCritical', { count: criticalUnanswered })
                  : t('questionnaire.skipWarningImportant')}
              </p>
              <div className="flex gap-2 mt-3">
                <Button variant="outline" size="sm" onClick={() => setShowSkipWarning(false)}>
                  {t('questionnaire.backToQuestions')}
                </Button>
                {criticalUnanswered === 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const updated = applyAnswers(household, answers)
                      onComplete(updated, buildProjection(updated))
                    }}
                    className="text-muted-foreground"
                    data-testid="skip-confirm"
                  >
                    {t('questionnaire.continueAnyway')}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between pt-2">
        <Button
          variant="outline"
          onClick={onBack}
          className="w-full sm:w-auto gap-1.5"
          data-testid="questionnaire-back"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t('common.back')}
        </Button>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="text-muted-foreground"
            data-testid="questionnaire-skip"
          >
            {t('common.skip')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={criticalUnanswered > 0}
            className="flex-1 sm:flex-initial gap-1.5"
            data-testid="questionnaire-continue"
          >
            {t('common.continue')}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {criticalUnanswered > 0 && (
        <p className="text-center text-xs text-muted-foreground">
          {t('questionnaire.answerRequired')}
        </p>
      )}
    </div>
  )
}

// ─── Projection Section Component ────────────────────────────

function ProjectionSection({
  household,
  projectionYear,
  enabled,
  onToggle,
  incomes,
  onIncomeChange,
}: {
  household: Household
  projectionYear: number
  enabled: boolean
  onToggle: (enabled: boolean) => void
  incomes: Record<string, number>
  onIncomeChange: (key: string, value: number) => void
}) {
  const t = useT()
  return (
    <Card className="border-2 border-dashed border-blue-300 dark:border-blue-700">
      <CardContent className="py-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xl" aria-hidden="true">
              🔮
            </span>
            <div>
              <h3 className="font-semibold">
                {t('questionnaire.projection.title', { year: projectionYear })}
              </h3>
              <p className="text-xs text-muted-foreground">
                {t('questionnaire.projection.description')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="projection-toggle" className="text-sm text-muted-foreground">
              {enabled ? t('common.yes') : t('common.no')}
            </Label>
            <Switch id="projection-toggle" checked={enabled} onCheckedChange={onToggle} />
          </div>
        </div>

        {enabled && (
          <>
            <Separator />
            <p className="text-sm text-muted-foreground">
              {t('questionnaire.projection.adjustHint', {
                year: projectionYear,
                primaryYear: household.year,
              })}
            </p>
            <div className="space-y-4">
              {household.members.map((member) => {
                const nif = member.nif ?? member.name
                // Deduplicate categories — show one input per category
                const seen = new Set<string>()
                const uniqueCategories = member.incomes
                  .map((income) => income.category)
                  .filter((cat) => {
                    if (seen.has(cat)) return false
                    seen.add(cat)
                    return true
                  })
                return (
                  <div key={nif} className="space-y-2">
                    <h4 className="text-sm font-medium">{member.name}</h4>
                    {uniqueCategories.map((category) => {
                      const key = `${nif}:${category}`
                      return (
                        <div
                          key={key}
                          className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 pl-4"
                        >
                          <Label htmlFor={`proj-${key}`} className="text-xs sm:min-w-[200px]">
                            <span className="inline-flex items-center gap-1">
                              {t(`questionnaire.incomeCategories.${category}`)}
                              <TooltipProvider delay={200}>
                                <Tooltip>
                                  <TooltipTrigger
                                    className="inline-flex text-muted-foreground hover:text-foreground"
                                    aria-label={t(
                                      `questionnaire.incomeCategoryDescriptions.${category}`,
                                    )}
                                  >
                                    <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
                                  </TooltipTrigger>
                                  <TooltipContent side="bottom">
                                    {t(`questionnaire.incomeCategoryDescriptions.${category}`)}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </span>
                          </Label>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-muted-foreground">€</span>
                            <Input
                              id={`proj-${key}`}
                              type="number"
                              min={0}
                              value={incomes[key] ?? 0}
                              onChange={(e) => onIncomeChange(key, parseFloat(e.target.value) || 0)}
                              className="h-8 w-full sm:w-32"
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Question Field Component ────────────────────────────────

const QuestionField = memo(function QuestionField({
  question,
  value,
  onChange,
  error,
}: {
  question: MissingInputQuestion
  value: string | number | boolean | undefined
  onChange: (value: string | number | boolean) => void
  error: string | null
}) {
  const t = useT()
  const badgeStyle = PRIORITY_BADGE_STYLES[question.priority]
  const inputId = `q-${question.id.replace(/\./g, '-')}`
  const errorId = `${inputId}-error`

  return (
    <div
      className="space-y-2 rounded-lg border p-4 transition-shadow duration-300"
      data-question-id={question.id}
      data-priority={question.priority}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Label htmlFor={inputId} className="text-sm font-medium">
              {question.label}
            </Label>
            <Badge className={`text-[10px] px-1.5 py-0 ${badgeStyle}`}>
              {t(`questionnaire.priority.${question.priority}`)}
            </Badge>
            {question.isPlaceholder && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                {t('questionnaire.estimatedValue')}
              </Badge>
            )}
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger
                tabIndex={-1}
                className="flex items-center gap-1 mt-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <HelpCircle className="h-3 w-3" aria-hidden="true" />
                {t('questionnaire.why')}
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs text-xs">
                {question.reason}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <div className="max-w-sm">
        {question.type === 'number' && (
          <Input
            id={inputId}
            type="number"
            value={value !== undefined ? String(value) : ''}
            placeholder="0"
            min={0}
            onChange={(e) => {
              const v = e.target.value
              onChange(v === '' ? '' : parseFloat(v) || 0)
            }}
            className="h-9"
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
          />
        )}

        {question.type === 'year' && (
          <Input
            id={inputId}
            type="number"
            value={
              value !== undefined
                ? String(value)
                : question.currentValue
                  ? String(question.currentValue)
                  : ''
            }
            placeholder={t('questionnaire.yearPlaceholder')}
            min={1920}
            max={new Date().getFullYear()}
            onChange={(e) => {
              const v = parseInt(e.target.value)
              onChange(isNaN(v) ? '' : v)
            }}
            className="h-9 w-32"
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
          />
        )}

        {question.type === 'select' && question.options && (
          <select
            id={inputId}
            value={value !== undefined ? String(value) : ''}
            onChange={(e) => onChange(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
          >
            <option value="">{t('questionnaire.selectPlaceholder')}</option>
            {question.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}

        {question.type === 'boolean' && (
          <div className="flex items-center gap-3">
            <Switch
              id={inputId}
              checked={value === true || value === 'true'}
              onCheckedChange={(checked) => onChange(checked)}
            />
            <Label htmlFor={inputId} className="text-sm text-muted-foreground">
              {value === true || value === 'true' ? t('common.yes') : t('common.no')}
            </Label>
          </div>
        )}
      </div>
      {error && (
        <p id={errorId} className="text-xs text-red-600 dark:text-red-400" role="alert">
          ⚠ {error}
        </p>
      )}
    </div>
  )
})

// ─── Helper ──────────────────────────────────────────────────

function isQuestionAnswered(
  answers: Record<string, string | number | boolean>,
  questionId: string,
): boolean {
  const val = answers[questionId]
  return val !== undefined && val !== ''
}
