'use client'

import { ArrowLeft, ArrowRight, CheckCircle2, Undo2, Redo2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { Household } from '@/lib/tax/types'
import type { QuestionSection } from '@/lib/tax/missing-inputs'
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
    containerRef,
    history,
    answeredCount,
    totalCount,
    projectionEnabled,
    setProjectionEnabled,
    projectedIncomes,
    setProjectedIncomes,
    setAnswer,
    handleSubmit: getSubmitResult,
  } = state

  function handleSubmit() {
    const result = getSubmitResult()
    onComplete(result.updated, result.projected)
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

      {/* Question sections — all expanded, no accordion */}
      {sections.map((group) => (
        <Card key={group.section} className="border">
          <div className="px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="text-xl" aria-hidden="true">
                {SECTION_ICONS[group.section]}
              </span>
              <div className="text-left">
                <h3 className="font-semibold">{group.meta.title}</h3>
                <p className="text-xs text-muted-foreground">{group.meta.description}</p>
              </div>
              <Badge variant="outline" className="ml-auto">
                {
                  group.questions.filter((q) => answers[q.id] !== undefined && answers[q.id] !== '')
                    .length
                }
                /{group.questions.length}
              </Badge>
            </div>
          </div>
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
        </Card>
      ))}

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
            onClick={handleSubmit}
            className="text-muted-foreground"
            data-testid="questionnaire-skip"
          >
            {t('common.skip')}
          </Button>
          <Button
            onClick={handleSubmit}
            className="flex-1 sm:flex-initial gap-1.5"
            data-testid="questionnaire-continue"
          >
            {t('common.continue')}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  )
}
