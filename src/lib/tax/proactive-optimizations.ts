import type { AnalysisResult, Household, Optimization, Person } from './types'
import { CAT_B_MIN_EXPENSE_RATIO, FATURA_DEDUCTION_CAP, FATURA_DEDUCTION_RATE } from './types'
import { round2 } from './utils'

// ─── Constants ──────────────────────────────────────────────

const GENERAL_DEDUCTION_RATE = 0.35
const GENERAL_DEDUCTION_CAP = 250
// Required spending to reach the €250 cap: 250 / 0.35 ≈ €714.29
const GENERAL_REQUIRED_SPENDING = Math.ceil(GENERAL_DEDUCTION_CAP / GENERAL_DEDUCTION_RATE)

const PPR_RATE = 0.2
function getPprCap(birthYear: number | undefined, taxYear: number): number {
  if (!birthYear) return 400
  const age = taxYear - birthYear
  if (age < 35) return 400
  if (age <= 50) return 350
  return 300
}

const HEALTH_RATE = 0.15
const HEALTH_CAP = 1000
const EDUCATION_RATE = 0.3
const EDUCATION_CAP = 800
const HOUSING_RATE = 0.15
const HOUSING_CAP_DEFAULT = 502
const HOUSING_CAP_2025 = 800

function getHousingCap(year: number): number {
  return year >= 2025 ? HOUSING_CAP_2025 : HOUSING_CAP_DEFAULT
}

const TRACKABLE_EXPENSE_CATEGORIES = [
  { category: 'health', rate: HEALTH_RATE, cap: HEALTH_CAP, label: 'Saúde' },
  { category: 'education', rate: EDUCATION_RATE, cap: EDUCATION_CAP, label: 'Educação' },
] as const

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
}

// ─── Per-member generators ──────────────────────────────────

function generateGeneralDeductionOpt(
  person: Person,
  _taxYear: number,
  slug: string,
): Optimization | undefined {
  const generalExpenses = person.deductions
    .filter((d) => d.category === 'general')
    .reduce((s, d) => s + d.amount, 0)

  const currentDeduction = Math.min(generalExpenses * GENERAL_DEDUCTION_RATE, GENERAL_DEDUCTION_CAP)
  if (currentDeduction >= GENERAL_DEDUCTION_CAP) return undefined

  const additionalSpending = GENERAL_REQUIRED_SPENDING - generalExpenses
  if (additionalSpending <= 0) return undefined

  const savings = round2(GENERAL_DEDUCTION_CAP - currentDeduction)

  return {
    id: `general-deduction-${slug}`,
    title: `Maximizar dedução geral (${person.name})`,
    description: `Gaste mais ${formatEuro(additionalSpending)} em despesas gerais (e-fatura) para obter a dedução máxima de ${formatEuro(GENERAL_DEDUCTION_CAP)}.`,
    estimated_savings: savings,
  }
}

function generateCatBAcrescimoOpt(
  person: Person,
  personIdx: number,
  result: AnalysisResult,
  slug: string,
): Optimization | undefined {
  const catBIncomes = person.incomes.filter((i) => i.category === 'B')
  if (catBIncomes.length === 0) return undefined

  // Find the person's tax detail from the recommended scenario
  const scenario = result.scenarios.find((s) => s.label === result.recommended_scenario)
  const detail = scenario?.persons[personIdx]
  if (!detail || detail.cat_b_acrescimo <= 0) return undefined

  // Estimate savings at marginal rate (~22% for mid incomes, conservative)
  const marginalRate =
    detail.effective_rate_irs > 0 ? Math.min(detail.effective_rate_irs * 1.5, 0.48) : 0.22
  const savings = round2(detail.cat_b_acrescimo * marginalRate)

  const totalGross = catBIncomes.reduce((s, i) => s + i.gross, 0)
  const minExpenses = round2(totalGross * CAT_B_MIN_EXPENSE_RATIO)

  return {
    id: `cat-b-acrescimo-${slug}`,
    title: `Evitar acréscimo de trabalho independente (${person.name})`,
    description: `Obtenha pelo menos ${formatEuro(minExpenses)} em despesas documentadas (15% do rendimento bruto de trabalho independente) para evitar o acréscimo de ${formatEuro(detail.cat_b_acrescimo)}.`,
    estimated_savings: savings,
  }
}

function generatePprOpt(person: Person, taxYear: number, slug: string): Optimization | undefined {
  const hasPpr = person.deductions.some((d) => d.category === 'ppr')
  if (hasPpr) return undefined

  const cap = getPprCap(person.birth_year, taxYear)
  const savings = round2(cap * PPR_RATE)

  return {
    id: `ppr-${slug}`,
    title: `Subscrever PPR (${person.name})`,
    description: `Subscreva um PPR e deduza até ${formatEuro(cap)} (20% do investimento). Benefício máximo: ${formatEuro(savings)}.`,
    estimated_savings: savings,
  }
}

function generateFaturaOpt(
  person: Person,
  _taxYear: number,
  slug: string,
): Optimization | undefined {
  const faturaExpenses = person.deductions
    .filter((d) => d.category === 'fatura')
    .reduce((s, d) => s + d.amount, 0)

  const currentDeduction = Math.min(faturaExpenses * FATURA_DEDUCTION_RATE, FATURA_DEDUCTION_CAP)
  if (currentDeduction >= FATURA_DEDUCTION_CAP) return undefined

  const savings = round2(FATURA_DEDUCTION_CAP - currentDeduction)
  const requiredSpending = Math.ceil(FATURA_DEDUCTION_CAP / FATURA_DEDUCTION_RATE)
  const additionalSpending = requiredSpending - faturaExpenses

  if (additionalSpending <= 0) return undefined

  return {
    id: `fatura-${slug}`,
    title: `Maximizar e-fatura Art. 78-F (${person.name})`,
    description: `Peça fatura com NIF em setores elegíveis (restauração, cabeleireiros, oficinas, veterinários). Faltam ${formatEuro(additionalSpending)} para a dedução máxima de ${formatEuro(FATURA_DEDUCTION_CAP)}.`,
    estimated_savings: savings,
  }
}

function generateExpenseGapOpts(person: Person, taxYear: number, slug: string): Optimization[] {
  const opts: Optimization[] = []

  for (const { category, rate, cap, label } of TRACKABLE_EXPENSE_CATEGORIES) {
    const expenses = person.deductions
      .filter((d) => d.category === category)
      .reduce((s, d) => s + d.amount, 0)

    const currentDeduction = Math.min(expenses * rate, cap)
    if (currentDeduction >= cap) continue

    const gap = round2(cap - currentDeduction)
    const requiredSpending = Math.ceil(cap / rate) - expenses
    if (requiredSpending <= 0) continue

    opts.push({
      id: `expense-${category}-${slug}`,
      title: `Dedução de ${label} (${person.name})`,
      description: `Gaste mais ${formatEuro(requiredSpending)} em ${label.toLowerCase()} para deduzir até ${formatEuro(cap)}. Benefício adicional: ${formatEuro(gap)}.`,
      estimated_savings: gap,
    })
  }

  // Housing has year-specific cap
  const housingCap = getHousingCap(taxYear)
  const housingExpenses = person.deductions
    .filter((d) => d.category === 'housing')
    .reduce((s, d) => s + d.amount, 0)
  const housingDeduction = Math.min(housingExpenses * HOUSING_RATE, housingCap)
  if (housingDeduction < housingCap) {
    const gap = round2(housingCap - housingDeduction)
    const requiredSpending = Math.ceil(housingCap / HOUSING_RATE) - housingExpenses
    if (requiredSpending > 0) {
      opts.push({
        id: `expense-housing-${slug}`,
        title: `Dedução de Habitação (${person.name})`,
        description: `Gaste mais ${formatEuro(requiredSpending)} em habitação para deduzir até ${formatEuro(housingCap)}. Benefício adicional: ${formatEuro(gap)}.`,
        estimated_savings: gap,
      })
    }
  }

  return opts
}

// ─── Main ───────────────────────────────────────────────────

/**
 * Generate proactive optimization suggestions for a projected year.
 * These are actionable steps the user can take now to reduce future taxes.
 * Only applies to projected (future) year households.
 */
export function generateProactiveOptimizations(
  household: Household,
  result: AnalysisResult,
): Optimization[] {
  if (!household.projected) return []

  const optimizations: Optimization[] = []
  const taxYear = household.year

  for (let i = 0; i < household.members.length; i++) {
    const person = household.members[i]
    const slug = slugify(person.name)

    const generalOpt = generateGeneralDeductionOpt(person, taxYear, slug)
    if (generalOpt) optimizations.push(generalOpt)

    const catBOpt = generateCatBAcrescimoOpt(person, i, result, slug)
    if (catBOpt) optimizations.push(catBOpt)

    const pprOpt = generatePprOpt(person, taxYear, slug)
    if (pprOpt) optimizations.push(pprOpt)

    const faturaOpt = generateFaturaOpt(person, taxYear, slug)
    if (faturaOpt) optimizations.push(faturaOpt)

    optimizations.push(...generateExpenseGapOpts(person, taxYear, slug))
  }

  return optimizations
}

function formatEuro(amount: number): string {
  return `€${amount.toFixed(0)}`
}
