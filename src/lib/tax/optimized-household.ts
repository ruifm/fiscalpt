import type { Household, Person, Deduction, DeductionCategory, Income, Optimization } from './types'
import { CAT_B_MIN_EXPENSE_RATIO, FATURA_DEDUCTION_CAP, FATURA_DEDUCTION_RATE } from './types'
import { getDeductionConfig } from './deductions'

const MAXIMIZABLE_CATEGORIES = ['general', 'health', 'education', 'housing', 'ppr'] as const

/**
 * Build an optimized copy of the household by maximizing all deductions to their
 * caps and eliminating Cat B acréscimo. Used to compute the "best possible" tax
 * burden if the user follows all proactive recommendations.
 *
 * Only applies to projected years (future tax periods where the user can still
 * take action). Returns the original household unchanged for historical years.
 */
export function buildOptimizedHousehold(
  household: Household,
  optimizations: Optimization[],
): Household {
  if (!household.projected) return household
  if (optimizations.length === 0) return household

  // Only optimize categories that have an active optimization suggestion
  const activeOptIds = new Set(
    optimizations.filter((o) => o.estimated_savings > 0).map((o) => o.id),
  )
  if (activeOptIds.size === 0) return household

  const taxYear = household.year

  return {
    ...household,
    members: household.members.map((person) => {
      const slug = slugify(person.name)
      return optimizePerson(person, slug, taxYear, activeOptIds)
    }),
  }
}

function optimizePerson(
  person: Person,
  slug: string,
  taxYear: number,
  activeOptIds: Set<string>,
): Person {
  let deductions = [...person.deductions]
  let incomes = person.incomes

  for (const category of MAXIMIZABLE_CATEGORIES) {
    const optId =
      category === 'ppr'
        ? findPprOptId(slug, activeOptIds)
        : category === 'general'
          ? `general-deduction-${slug}`
          : `expense-${category}-${slug}`

    if (!optId || !activeOptIds.has(optId)) continue

    const config = getDeductionConfig(category, taxYear, person.birth_year)
    if (!config) continue

    // Replace existing deductions for this category with the cap-maxing amount
    const requiredExpenses = Math.ceil(config.cap / config.rate)
    deductions = replaceDeductionCategory(deductions, category, requiredExpenses)
  }

  // Fatura (Art. 78-F)
  if (activeOptIds.has(`fatura-${slug}`)) {
    const requiredFatura = Math.ceil(FATURA_DEDUCTION_CAP / FATURA_DEDUCTION_RATE)
    deductions = replaceDeductionCategory(deductions, 'fatura', requiredFatura)
  }

  // Cat B acréscimo: ensure documented expenses ≥ 15% of gross
  if (activeOptIds.has(`cat-b-acrescimo-${slug}`)) {
    incomes = incomes.map((income) => optimizeCatBExpenses(income))
  }

  return { ...person, deductions, incomes }
}

function optimizeCatBExpenses(income: Income): Income {
  if (income.category !== 'B') return income
  const minExpenses = income.gross * CAT_B_MIN_EXPENSE_RATIO
  const current = income.cat_b_documented_expenses ?? 0
  if (current >= minExpenses) return income
  return { ...income, cat_b_documented_expenses: minExpenses }
}

function replaceDeductionCategory(
  deductions: Deduction[],
  category: DeductionCategory,
  amount: number,
): Deduction[] {
  const filtered = deductions.filter((d) => d.category !== category)
  filtered.push({ category, amount })
  return filtered
}

function findPprOptId(slug: string, activeOptIds: Set<string>): string | undefined {
  if (activeOptIds.has(`ppr-${slug}`)) return `ppr-${slug}`
  if (activeOptIds.has(`ppr-maximize-${slug}`)) return `ppr-maximize-${slug}`
  return undefined
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
}
