'use client'

import { useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  Edit3,
  Plus,
  Trash2,
  Baby,
  CheckCircle,
  HelpCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type {
  Household,
  Person,
  Income,
  Dependent,
  FilingStatus,
  IncomeCategory,
  DeductionCategory,
  SpecialRegime,
  ValidationIssue,
} from '@/lib/tax/types'
import { sanitizeNumber } from '@/lib/tax/input-validation'
import { formatEuro } from '@/lib/utils'
import { useT } from '@/lib/i18n'

interface HouseholdReviewProps {
  household: Household
  issues: ValidationIssue[]
  onConfirm: (household: Household) => void
  onBack: () => void
}

const INCOME_CATEGORIES: IncomeCategory[] = ['A', 'B', 'E', 'F', 'G', 'H']

const DEDUCTION_CATEGORY_KEYS: DeductionCategory[] = [
  'general',
  'health',
  'education',
  'housing',
  'care_home',
  'ppr',
  'alimony',
  'fatura',
  'trabalho_domestico',
  'disability_rehab',
  'disability_insurance',
  'sindical',
]

export function HouseholdReview({
  household: initial,
  issues,
  onConfirm,
  onBack,
}: HouseholdReviewProps) {
  const t = useT()
  const [household, setHousehold] = useState<Household>({ ...initial })
  const [editing, setEditing] = useState(false)

  function updateMember(index: number, updated: Person) {
    const members = [...household.members]
    members[index] = updated
    setHousehold({ ...household, members })
  }

  function addIncome(memberIdx: number) {
    const member = { ...household.members[memberIdx] }
    member.incomes = [...member.incomes, { category: 'A' as IncomeCategory, gross: 0 }]
    updateMember(memberIdx, member)
  }

  function removeIncome(memberIdx: number, incomeIdx: number) {
    const member = { ...household.members[memberIdx] }
    member.incomes = member.incomes.filter((_, i) => i !== incomeIdx)
    updateMember(memberIdx, member)
  }

  function updateIncome(memberIdx: number, incomeIdx: number, updated: Income) {
    const member = { ...household.members[memberIdx] }
    const incomes = [...member.incomes]
    incomes[incomeIdx] = updated
    member.incomes = incomes
    updateMember(memberIdx, member)
  }

  function addDeduction(memberIdx: number) {
    const member = { ...household.members[memberIdx] }
    member.deductions = [
      ...member.deductions,
      { category: 'general' as DeductionCategory, amount: 0 },
    ]
    updateMember(memberIdx, member)
  }

  function removeDeduction(memberIdx: number, dedIdx: number) {
    const member = { ...household.members[memberIdx] }
    member.deductions = member.deductions.filter((_, i) => i !== dedIdx)
    updateMember(memberIdx, member)
  }

  function toggleRegime(memberIdx: number, regime: SpecialRegime) {
    const member = { ...household.members[memberIdx] }
    const has = member.special_regimes.includes(regime)
    member.special_regimes = has
      ? member.special_regimes.filter((r) => r !== regime)
      : [...member.special_regimes, regime]
    updateMember(memberIdx, member)
  }

  function addDependent() {
    setHousehold({
      ...household,
      dependents: [
        ...household.dependents,
        {
          name: t('review.defaultDependent', { n: household.dependents.length + 1 }),
          birth_year: 2020,
        },
      ],
    })
  }

  function removeDependent(index: number) {
    setHousehold({
      ...household,
      dependents: household.dependents.filter((_, i) => i !== index),
    })
  }

  function updateDependent(index: number, updated: Dependent) {
    const dependents = [...household.dependents]
    dependents[index] = updated
    setHousehold({ ...household, dependents })
  }

  const totalGross = household.members.reduce(
    (sum, m) => sum + m.incomes.reduce((s, i) => s + i.gross, 0),
    0,
  )

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t('review.pageTitle')}</h1>
        <p className="mt-2 text-muted-foreground">{t('review.pageSubtitle')}</p>
      </div>

      {/* Issues — Errors (red, blocking) and Warnings (amber, informational) */}
      {issues.length > 0 && (
        <div className="space-y-2" role="alert">
          {issues
            .filter((i) => i.severity === 'error')
            .map((issue, i) => (
              <div
                key={`err-${i}`}
                className="flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-3"
              >
                <AlertTriangle
                  className="h-4 w-4 text-red-600 mt-0.5 shrink-0"
                  aria-hidden="true"
                />
                <p className="text-sm text-red-800 dark:text-red-200">{issue.message}</p>
              </div>
            ))}
          {issues
            .filter((i) => i.severity === 'warning')
            .map((issue, i) => (
              <div
                key={`warn-${i}`}
                className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3"
              >
                <AlertTriangle
                  className="h-4 w-4 text-amber-600 mt-0.5 shrink-0"
                  aria-hidden="true"
                />
                <p className="text-sm text-amber-800 dark:text-amber-200">{issue.message}</p>
              </div>
            ))}
        </div>
      )}

      {/* Summary Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t('review.householdTitle')}</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditing(!editing)}
            className="gap-1.5"
          >
            <Edit3 className="h-4 w-4" aria-hidden="true" />
            {editing ? t('review.closeEdit') : t('review.edit')}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">{t('review.fiscalYear')}</span>
              <div className="font-semibold">{household.year}</div>
            </div>
            <div>
              <span className="text-muted-foreground">{t('review.filingLabel')}</span>
              <div className="font-semibold">
                {household.filing_status === 'single'
                  ? t('review.filing.single')
                  : household.filing_status === 'married_joint'
                    ? t('review.filing.joint')
                    : t('review.filing.separate')}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">{t('review.taxpayers')}</span>
              <div className="font-semibold">{household.members.length}</div>
            </div>
            <div>
              <span className="text-muted-foreground">{t('review.grossIncome')}</span>
              <div className="font-semibold">{formatEuro(totalGross)}</div>
            </div>
          </div>

          {editing && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="edit-year" className="text-xs">
                    {t('review.fiscalYear')}
                  </Label>
                  <Input
                    id="edit-year"
                    type="number"
                    min={2021}
                    max={2025}
                    value={household.year}
                    onChange={(e) =>
                      setHousehold({
                        ...household,
                        year: parseInt(e.target.value) || household.year,
                      })
                    }
                    className="h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-filing" className="text-xs">
                    {t('review.filingType')}
                  </Label>
                  <select
                    id="edit-filing"
                    value={household.filing_status}
                    onChange={(e) =>
                      setHousehold({
                        ...household,
                        filing_status: e.target.value as FilingStatus,
                      })
                    }
                    className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  >
                    <option value="single">{t('review.filing.single')}</option>
                    <option value="married_joint">{t('review.filing.joint')}</option>
                    <option value="married_separate">{t('review.filing.separate')}</option>
                  </select>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Members */}
      {household.members.map((member, mIdx) => (
        <Card key={mIdx}>
          <CardHeader>
            <CardTitle className="text-lg">{member.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {editing && (
              <div className="space-y-1">
                <Label className="text-xs">{t('review.name')}</Label>
                <Input
                  value={member.name}
                  onChange={(e) => updateMember(mIdx, { ...member, name: e.target.value })}
                  className="h-8"
                />
              </div>
            )}

            {/* Incomes */}
            <div>
              <Label className="text-sm font-semibold mb-2 block">{t('review.incomes')}</Label>
              {member.incomes.map((income, iIdx) => (
                <div key={iIdx} className="flex items-end gap-2 mb-2">
                  {editing ? (
                    <>
                      <div className="w-48 space-y-1">
                        <Label className="text-xs">{t('review.category')}</Label>
                        <select
                          value={income.category}
                          onChange={(e) =>
                            updateIncome(mIdx, iIdx, {
                              ...income,
                              category: e.target.value as IncomeCategory,
                            })
                          }
                          className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-sm"
                        >
                          {INCOME_CATEGORIES.map((k) => (
                            <option key={k} value={k}>
                              {t(`review.incomeCategories.${k}`)}
                            </option>
                          ))}
                        </select>
                        <p className="text-[10px] text-muted-foreground leading-tight">
                          {t(`review.incomeCategoryDescriptions.${income.category}`)}
                        </p>
                      </div>
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs">{t('review.gross')}</Label>
                        <Input
                          type="number"
                          min={0}
                          value={income.gross || ''}
                          onChange={(e) =>
                            updateIncome(mIdx, iIdx, {
                              ...income,
                              gross: sanitizeNumber(parseFloat(e.target.value)),
                            })
                          }
                          className="h-8"
                        />
                      </div>
                      <div className="w-28 space-y-1">
                        <Label className="text-xs">{t('review.withholding')}</Label>
                        <Input
                          type="number"
                          min={0}
                          value={income.withholding || ''}
                          onChange={(e) =>
                            updateIncome(mIdx, iIdx, {
                              ...income,
                              withholding: sanitizeNumber(parseFloat(e.target.value)),
                            })
                          }
                          className="h-8"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeIncome(mIdx, iIdx)}
                        className="shrink-0 h-8 w-8 text-destructive"
                        aria-label={t('review.removeIncome')}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </>
                  ) : (
                    <div className="flex items-center gap-3 text-sm">
                      <TooltipProvider delay={200}>
                        <Tooltip>
                          <TooltipTrigger className="inline-flex items-center gap-1">
                            <Badge variant="outline">
                              {t(`review.incomeCategories.${income.category}`)}
                            </Badge>
                            <HelpCircle
                              className="h-3.5 w-3.5 text-muted-foreground"
                              aria-hidden="true"
                            />
                          </TooltipTrigger>
                          <TooltipContent side="bottom">
                            {t(`review.incomeCategoryDescriptions.${income.category}`)}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <span>{formatEuro(income.gross)}</span>
                      {income.withholding ? (
                        <span className="text-muted-foreground">
                          ({t('review.withholdingLabel')} {formatEuro(income.withholding)})
                        </span>
                      ) : null}
                      {income.ss_paid ? (
                        <span className="text-muted-foreground">
                          ({t('review.ssLabel')} {formatEuro(income.ss_paid)})
                        </span>
                      ) : null}
                    </div>
                  )}
                </div>
              ))}
              {editing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addIncome(mIdx)}
                  className="gap-1 text-xs"
                >
                  <Plus className="h-3 w-3" aria-hidden="true" />
                  {t('review.income')}
                </Button>
              )}
            </div>

            {/* Deductions (editing only) */}
            {editing && (
              <div>
                <Label className="text-sm font-semibold mb-2 block">{t('review.deductions')}</Label>
                {member.deductions.map((ded, dIdx) => (
                  <div key={dIdx} className="flex items-end gap-2 mb-2">
                    <div className="w-40 space-y-1">
                      <select
                        value={ded.category}
                        onChange={(e) => {
                          const newDeds = [...member.deductions]
                          newDeds[dIdx] = {
                            ...ded,
                            category: e.target.value as DeductionCategory,
                          }
                          updateMember(mIdx, {
                            ...member,
                            deductions: newDeds,
                          })
                        }}
                        className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-sm"
                      >
                        {DEDUCTION_CATEGORY_KEYS.map((k) => (
                          <option key={k} value={k}>
                            {t(`review.deductionCategories.${k}`)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1 space-y-1">
                      <Input
                        type="number"
                        min={0}
                        value={ded.amount || ''}
                        onChange={(e) => {
                          const newDeds = [...member.deductions]
                          newDeds[dIdx] = {
                            ...ded,
                            amount: sanitizeNumber(parseFloat(e.target.value)),
                          }
                          updateMember(mIdx, {
                            ...member,
                            deductions: newDeds,
                          })
                        }}
                        className="h-8"
                        placeholder={t('review.valuePlaceholder')}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeDeduction(mIdx, dIdx)}
                      className="shrink-0 h-8 w-8 text-destructive"
                      aria-label={t('review.removeDeduction')}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addDeduction(mIdx)}
                  className="gap-1 text-xs"
                >
                  <Plus className="h-3 w-3" aria-hidden="true" />
                  {t('review.deduction')}
                </Button>
              </div>
            )}

            {/* Special Regimes */}
            {editing && (
              <div>
                <Label className="text-sm font-semibold mb-2 block">
                  {t('review.specialRegimes')}
                </Label>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleRegime(mIdx, 'irs_jovem')}
                    className={`rounded-lg border-2 px-3 py-2 text-xs transition-all ${
                      member.special_regimes.includes('irs_jovem')
                        ? 'border-primary bg-primary/5'
                        : 'border-border'
                    }`}
                  >
                    {t('review.irsJovem')}
                  </button>
                  <button
                    onClick={() => toggleRegime(mIdx, 'nhr')}
                    className={`rounded-lg border-2 px-3 py-2 text-xs transition-all ${
                      member.special_regimes.includes('nhr')
                        ? 'border-primary bg-primary/5'
                        : 'border-border'
                    }`}
                  >
                    {t('review.nhr')}
                  </button>
                </div>
                {member.special_regimes.includes('irs_jovem') && (
                  <div className="mt-2 ml-1 space-y-1">
                    <Label htmlFor={`jovem-year-${mIdx}`} className="text-xs">
                      {t('review.benefitYear')}
                    </Label>
                    <Input
                      id={`jovem-year-${mIdx}`}
                      type="number"
                      min={1}
                      max={10}
                      value={member.irs_jovem_year || 1}
                      onChange={(e) =>
                        updateMember(mIdx, {
                          ...member,
                          irs_jovem_year: parseInt(e.target.value) || 1,
                        })
                      }
                      className="h-8 w-20"
                    />
                  </div>
                )}
                {member.special_regimes.includes('nhr') && (
                  <div className="mt-2 ml-1 space-y-1">
                    <Label htmlFor={`nhr-year-${mIdx}`} className="text-xs">
                      {t('review.nhrStartYear')}
                    </Label>
                    <Input
                      id={`nhr-year-${mIdx}`}
                      type="number"
                      min={2009}
                      max={household.year}
                      value={member.nhr_start_year || household.year - 1}
                      onChange={(e) =>
                        updateMember(mIdx, {
                          ...member,
                          nhr_start_year: parseInt(e.target.value) || household.year - 1,
                        })
                      }
                      className="h-8 w-24"
                    />
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Dependents */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">{t('review.dependents')}</CardTitle>
          {editing && (
            <Button variant="outline" size="sm" onClick={addDependent} className="gap-1 text-xs">
              <Baby className="h-3 w-3" aria-hidden="true" />
              {t('review.addDependent')}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {household.dependents.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('review.noDependents')}</p>
          ) : (
            <div className="space-y-2">
              {household.dependents.map((dep, i) => (
                <div key={i} className="flex items-center gap-3">
                  {editing ? (
                    <>
                      <Input
                        value={dep.name}
                        onChange={(e) => updateDependent(i, { ...dep, name: e.target.value })}
                        className="h-8 flex-1"
                        placeholder={t('review.name')}
                      />
                      <Input
                        type="number"
                        min={1920}
                        max={new Date().getFullYear()}
                        value={dep.birth_year}
                        onChange={(e) =>
                          updateDependent(i, {
                            ...dep,
                            birth_year: parseInt(e.target.value) || dep.birth_year,
                          })
                        }
                        className="h-8 w-24"
                        placeholder={t('review.birthYear')}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeDependent(i)}
                        className="h-8 w-8 text-destructive"
                        aria-label={t('review.removeDependent')}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </>
                  ) : (
                    <div className="text-sm">
                      {dep.name}{' '}
                      <span className="text-muted-foreground">
                        ({t('review.birthLabel')} {dep.birth_year})
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onBack} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t('common.back')}
        </Button>
        <Button onClick={() => onConfirm(household)} size="lg" className="gap-1.5">
          <CheckCircle className="h-4 w-4" aria-hidden="true" />
          {t('review.confirmAndCalculate')}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}
