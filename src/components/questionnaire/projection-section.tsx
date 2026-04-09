'use client'

import { HelpCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { Household } from '@/lib/tax/types'
import { useT } from '@/lib/i18n'

export function ProjectionSection({
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
