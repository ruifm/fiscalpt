'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useT } from '@/lib/i18n'
import { computeSimulationResults } from '@/lib/tax/simulation'
import type {
  SimulationInputs,
  SimulationPersonInput,
  SimulationResults,
} from '@/lib/tax/simulation'
import { Calculator, Minus, Plus, Users, User, Baby, HelpCircle } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

// ─── Types ───────────────────────────────────────────────────

export interface PersonFormState {
  birth_year: string
  gross_cat_a: string
  gross_cat_b: string
  nhr: boolean
  first_work_year: string
}

export interface SimulationFormState {
  married: boolean
  persons: PersonFormState[]
  depsUnder3: number
  deps3to6: number
  depsOver6: number
}

interface FormErrors {
  persons: Array<{
    birth_year?: string
    income?: string
    first_work_year?: string
  }>
}

interface SimulationFormProps {
  onResults: (results: SimulationResults, inputs: SimulationInputs) => void
  initialState?: SimulationFormState
  onStateChange?: (state: SimulationFormState) => void
}

// ─── Helpers ─────────────────────────────────────────────────

export const DEFAULT_PERSON: PersonFormState = {
  birth_year: '',
  gross_cat_a: '',
  gross_cat_b: '',
  nhr: false,
  first_work_year: '',
}

export const DEFAULT_FORM_STATE: SimulationFormState = {
  married: false,
  persons: [{ ...DEFAULT_PERSON }],
  depsUnder3: 0,
  deps3to6: 0,
  depsOver6: 0,
}

function toPersonInput(state: PersonFormState): SimulationPersonInput {
  const catB = parseFloat(state.gross_cat_b) || 0
  const firstWorkYear = parseInt(state.first_work_year, 10)
  return {
    birth_year: parseInt(state.birth_year, 10),
    gross_cat_a: parseFloat(state.gross_cat_a) || 0,
    gross_cat_b: catB > 0 ? catB : undefined,
    nhr: state.nhr,
    first_work_year: !isNaN(firstWorkYear) ? firstWorkYear : undefined,
  }
}

// ─── Stepper Component ───────────────────────────────────────

function Stepper({
  value,
  onChange,
  label,
  min = 0,
  max = 10,
}: {
  value: number
  onChange: (v: number) => void
  label: string
  min?: number
  max?: number
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm">{label}</span>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          aria-label={`Diminuir ${label}`}
        >
          <Minus className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
        <span className="w-8 text-center text-sm font-medium tabular-nums" aria-live="polite">
          {value}
        </span>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          aria-label={`Aumentar ${label}`}
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}

// ─── Help Tip ────────────────────────────────────────────────

function HelpTip({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger className="inline-flex">
        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
      </TooltipTrigger>
      <TooltipContent>{text}</TooltipContent>
    </Tooltip>
  )
}

// ─── Person Card ─────────────────────────────────────────────

function PersonCard({
  state,
  onChange,
  label,
  errors,
  t,
}: {
  state: PersonFormState
  onChange: (state: PersonFormState) => void
  label: string
  errors: FormErrors['persons'][number]
  t: ReturnType<typeof useT>
}) {
  return (
    <Card size="sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <User className="h-4 w-4" aria-hidden="true" />
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Birth year */}
        <div className="space-y-1.5">
          <Label htmlFor={`birth-year-${label}`}>{t('simulation.birthYear')}</Label>
          <Input
            id={`birth-year-${label}`}
            type="number"
            inputMode="numeric"
            placeholder="1990"
            value={state.birth_year}
            onChange={(e) => onChange({ ...state, birth_year: e.target.value })}
            aria-invalid={!!errors.birth_year}
            aria-describedby={errors.birth_year ? `birth-year-error-${label}` : undefined}
            className="max-w-[140px]"
          />
          {errors.birth_year && (
            <p id={`birth-year-error-${label}`} className="text-xs text-destructive">
              {errors.birth_year}
            </p>
          )}
        </div>

        {/* Income fields */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Gross Cat A */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Label htmlFor={`gross-a-${label}`}>{t('simulation.grossCatA')}</Label>
              <HelpTip text={t('simulation.grossCatAHelp')} />
            </div>
            <div className="relative">
              <Input
                id={`gross-a-${label}`}
                type="number"
                inputMode="decimal"
                placeholder="25000"
                value={state.gross_cat_a}
                onChange={(e) => onChange({ ...state, gross_cat_a: e.target.value })}
                aria-invalid={!!errors.income}
                aria-describedby={errors.income ? `income-error-${label}` : undefined}
                className="pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                €
              </span>
            </div>
          </div>

          {/* Gross Cat B */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Label htmlFor={`gross-b-${label}`}>{t('simulation.grossCatB')}</Label>
              <HelpTip text={t('simulation.grossCatBHelp')} />
            </div>
            <div className="relative">
              <Input
                id={`gross-b-${label}`}
                type="number"
                inputMode="decimal"
                placeholder="10000"
                value={state.gross_cat_b}
                onChange={(e) => onChange({ ...state, gross_cat_b: e.target.value })}
                className="pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                €
              </span>
            </div>
          </div>
        </div>
        {errors.income && (
          <p id={`income-error-${label}`} className="text-xs text-destructive">
            {errors.income}
          </p>
        )}

        {/* NHR toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Label htmlFor={`nhr-${label}`}>{t('simulation.nhr')}</Label>
            <HelpTip text={t('simulation.nhrHelp')} />
          </div>
          <Switch
            id={`nhr-${label}`}
            size="sm"
            checked={state.nhr}
            onCheckedChange={(checked) => onChange({ ...state, nhr: checked })}
          />
        </div>

        {/* First work year — shown when potentially IRS Jovem eligible */}
        {(() => {
          const birthYear = parseInt(state.birth_year, 10)
          const age = !isNaN(birthYear) ? 2025 - birthYear : null
          return age !== null && age <= 35 && !state.nhr ? (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Label htmlFor={`first-work-year-${label}`}>{t('simulation.firstWorkYear')}</Label>
                <HelpTip text={t('simulation.firstWorkYearHelp')} />
              </div>
              <Input
                id={`first-work-year-${label}`}
                type="number"
                inputMode="numeric"
                placeholder="2020"
                value={state.first_work_year}
                onChange={(e) => onChange({ ...state, first_work_year: e.target.value })}
                aria-invalid={!!errors.first_work_year}
                aria-describedby={
                  errors.first_work_year ? `first-work-year-error-${label}` : undefined
                }
                className="max-w-[140px]"
              />
              {errors.first_work_year && (
                <p id={`first-work-year-error-${label}`} className="text-xs text-destructive">
                  {errors.first_work_year}
                </p>
              )}
            </div>
          ) : null
        })()}
      </CardContent>
    </Card>
  )
}

// ─── Main Form ───────────────────────────────────────────────

export function SimulationForm({ onResults, initialState, onStateChange }: SimulationFormProps) {
  const t = useT()

  const [married, setMarried] = useState(initialState?.married ?? false)
  const [persons, setPersons] = useState<PersonFormState[]>(
    initialState?.persons ?? [{ ...DEFAULT_PERSON }],
  )
  const [depsUnder3, setDepsUnder3] = useState(initialState?.depsUnder3 ?? 0)
  const [deps3to6, setDeps3to6] = useState(initialState?.deps3to6 ?? 0)
  const [depsOver6, setDepsOver6] = useState(initialState?.depsOver6 ?? 0)
  const [calculating, setCalculating] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({
    persons: (initialState?.persons ?? [{ ...DEFAULT_PERSON }]).map(() => ({})),
  })

  // Emit state changes to parent for persistence
  const formState = useMemo(
    () => ({ married, persons, depsUnder3, deps3to6, depsOver6 }),
    [married, persons, depsUnder3, deps3to6, depsOver6],
  )

  useEffect(() => {
    onStateChange?.(formState)
  }, [formState, onStateChange])

  const handleMarriedChange = useCallback(
    (isMarried: boolean) => {
      setMarried(isMarried)
      if (isMarried && persons.length === 1) {
        setPersons([persons[0], { ...DEFAULT_PERSON }])
        setErrors({ persons: [errors.persons[0], {}] })
      } else if (!isMarried && persons.length === 2) {
        setPersons([persons[0]])
        setErrors({ persons: [errors.persons[0]] })
      }
    },
    [persons, errors],
  )

  const handlePersonChange = useCallback(
    (index: number, state: PersonFormState) => {
      const next = [...persons]
      next[index] = state
      setPersons(next)
      // Clear errors on change
      const nextErrors = { ...errors, persons: [...errors.persons] }
      nextErrors.persons[index] = {}
      setErrors(nextErrors)
    },
    [persons, errors],
  )

  const validate = useCallback((): boolean => {
    const currentYear = new Date().getFullYear()
    const newErrors: FormErrors = { persons: persons.map(() => ({})) }
    let valid = true

    for (let i = 0; i < persons.length; i++) {
      const p = persons[i]
      const year = parseInt(p.birth_year, 10)
      if (!p.birth_year || isNaN(year) || year < 1940 || year > currentYear - 16) {
        newErrors.persons[i].birth_year = t('simulation.birthYearError')
        valid = false
      }

      const catA = parseFloat(p.gross_cat_a) || 0
      const catB = parseFloat(p.gross_cat_b) || 0
      if (catA <= 0 && catB <= 0) {
        newErrors.persons[i].income = t('simulation.incomeError')
        valid = false
      }

      // Validate first_work_year if provided
      if (p.first_work_year.trim()) {
        const fwy = parseInt(p.first_work_year, 10)
        const birthYear = parseInt(p.birth_year, 10)
        const minWorkYear = !isNaN(birthYear) ? birthYear + 16 : 1960
        if (isNaN(fwy) || fwy < minWorkYear || fwy > currentYear) {
          newErrors.persons[i].first_work_year = t('simulation.firstWorkYearError')
          valid = false
        }
      }
    }

    setErrors(newErrors)
    return valid
  }, [persons, t])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!validate()) return

      setCalculating(true)

      // Use setTimeout to let the UI update with the loading state
      setTimeout(() => {
        const inputs: SimulationInputs = {
          married,
          persons: persons.map(toPersonInput),
          dependents_under_3: depsUnder3,
          dependents_3_to_6: deps3to6,
          dependents_over_6: depsOver6,
        }

        const results = computeSimulationResults(inputs)
        setCalculating(false)
        onResults(results, inputs)
      }, 50)
    },
    [married, persons, depsUnder3, deps3to6, depsOver6, validate, onResults],
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-6" data-testid="simulation-form">
      {/* Top submit */}
      <Button type="submit" size="lg" className="w-full gap-2 text-base" disabled={calculating}>
        <Calculator className="h-4 w-4" aria-hidden="true" />
        {calculating ? t('simulation.calculating') : t('simulation.calculate')}
      </Button>

      {/* Filing Status */}
      <Card size="sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" aria-hidden="true" />
            {t('simulation.filingStatus')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={!married ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleMarriedChange(false)}
              className="flex-1"
            >
              <User className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
              {t('simulation.single')}
            </Button>
            <Button
              type="button"
              variant={married ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleMarriedChange(true)}
              className="flex-1"
            >
              <Users className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
              {t('simulation.married')}
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {t('simulation.taxYear')}: <span className="font-medium">2025</span>
          </p>
        </CardContent>
      </Card>

      {/* Person cards */}
      <div className={cn('space-y-4', married && 'grid gap-4 md:grid-cols-2 space-y-0')}>
        {persons.map((person, i) => (
          <PersonCard
            key={i}
            state={person}
            onChange={(s) => handlePersonChange(i, s)}
            label={
              married
                ? t('simulation.personLabel', { letter: i === 0 ? 'A' : 'B' })
                : t('simulation.singleLabel')
            }
            errors={errors.persons[i] || {}}
            t={t}
          />
        ))}
      </div>

      {/* Dependents */}
      <Card size="sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Baby className="h-4 w-4" aria-hidden="true" />
            {t('simulation.dependents')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Stepper
            value={depsUnder3}
            onChange={setDepsUnder3}
            label={t('simulation.dependentsUnder3')}
          />
          <Stepper value={deps3to6} onChange={setDeps3to6} label={t('simulation.dependents3to6')} />
          <Stepper
            value={depsOver6}
            onChange={setDepsOver6}
            label={t('simulation.dependentsOver6')}
          />
        </CardContent>
      </Card>

      {/* Submit */}
      <Button
        type="submit"
        size="lg"
        className="w-full gap-2 text-base"
        disabled={calculating}
        data-testid="simulation-calculate"
      >
        <Calculator className="h-4 w-4" aria-hidden="true" />
        {calculating ? t('simulation.calculating') : t('simulation.calculate')}
      </Button>
    </form>
  )
}
