'use client'

import { memo } from 'react'
import { HelpCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { MissingInputQuestion } from '@/lib/tax/missing-inputs'
import { useT } from '@/lib/i18n'

export const QuestionField = memo(function QuestionField({
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
  const inputId = `q-${question.id.replace(/\./g, '-')}`
  const errorId = `${inputId}-error`
  const showDefault = question.isDefault && (value === undefined || value === '')

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
            {showDefault && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 text-muted-foreground italic"
              >
                {t('questionnaire.defaultValue')}
              </Badge>
            )}
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
