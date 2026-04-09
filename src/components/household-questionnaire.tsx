'use client'

import { ArrowLeft, ArrowRight, AlertCircle, CheckCircle2, Undo2, Redo2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { Household } from '@/lib/tax/types'
import { applyAnswers, type QuestionSection } from '@/lib/tax/missing-inputs'
import { useQuestionnaireState } from '@/hooks/use-questionnaire-state'
import { QuestionField } from '@/components/questionnaire/question-field'
import { ProjectionSection } from '@/components/questionnaire/projection-section'
import { useT } from '@/lib/i18n'

interface HouseholdQuestionnaireProps {
  household: Household
  onComplete: (household: Household, projectedHousehold?: Household) => void
  onBack: () => void
  onSkip?: () => void
  /** If set, show projection section for this year */
  projectionYear?: number
  /** Households from other tax years (for cross-year inference, e.g. Cat B activity) */
  otherYearHouseholds?: Household[]
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

function isQuestionAnswered(
  answers: Record<string, string | number | boolean>,
  questionId: string,
): boolean {
  const val = answers[questionId]
  return val !== undefined && val !== ''
}

export function HouseholdQuestionnaire({
  household,
  onComplete,
  onBack,
  onSkip: _onSkip,
  projectionYear,
  otherYearHouseholds,
}: HouseholdQuestionnaireProps) {
  const t = useT()
  const state = useQuestionnaireState({ household, projectionYear, otherYearHouseholds })

  const {
    questions,
    sections,
    answers,
    fieldErrors,
    showSkipWarning,
    setShowSkipWarning,
    containerRef,
    history,
    criticalUnanswered,
    answeredCount,
    totalCount,
    openSections,
    projectionEnabled,
    setProjectionEnabled,
    projectedIncomes,
    setProjectedIncomes,
    handleAccordionChange,
    setAnswer,
    handleSubmit: getSubmitResult,
    handleSkip: getSkipResult,
  } = state

  function handleSubmit() {
    const result = getSubmitResult()
    onComplete(result.updated, result.projected)
  }

  function handleSkip() {
    const result = getSkipResult()
    if (result) {
      onComplete(result.updated, result.projected)
    }
  }

  // No questions needed AND no projection available → data-complete view
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

      {/* Projection section */}
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

      {/* Question sections */}
      <Accordion multiple value={openSections} onValueChange={handleAccordionChange}>
        {sections.map((group) => {
          const sIdx = sections.indexOf(group)
          return (
            <AccordionItem key={group.section} value={`section-${sIdx}`}>
              <Card className="mb-4 border">
                <AccordionTrigger
                  className="w-full px-4 py-3 min-h-[44px] hover:no-underline"
                  tabIndex={-1}
                >
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
                      const result = getSubmitResult()
                      onComplete(updated, result.projected)
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
