import { describe, expect, it } from 'vitest'

import type { Household, Optimization, Person } from '@/lib/tax/types'
import type { Deduction } from '@/lib/tax/types'
import { buildOptimizedHousehold } from '@/lib/tax/optimized-household'

function makePerson(name: string, overrides: Partial<Person> = {}): Person {
  return {
    name,
    incomes: [],
    deductions: [],
    special_regimes: [],
    ...overrides,
  }
}

function makeHousehold(overrides: Partial<Household> = {}): Household {
  return {
    year: 2025,
    filing_status: 'single',
    members: [makePerson('Rui')],
    dependents: [],
    projected: true,
    ...overrides,
  }
}

function makeOpt(id: string, savings: number): Optimization {
  return { id, title: id, description: '', estimated_savings: savings }
}

describe('buildOptimizedHousehold', () => {
  it('returns original household for non-projected years', () => {
    const household = makeHousehold({ projected: false })
    const opts = [makeOpt('ppr-rui', 300)]

    const result = buildOptimizedHousehold(household, opts)

    expect(result).toBe(household)
  })

  it('returns original household when no optimizations', () => {
    const household = makeHousehold()

    const result = buildOptimizedHousehold(household, [])

    expect(result).toBe(household)
  })

  it('returns original household when all optimizations have zero savings', () => {
    const household = makeHousehold()
    const opts = [makeOpt('ppr-rui', 0), makeOpt('fatura-rui', 0)]

    const result = buildOptimizedHousehold(household, opts)

    expect(result).toBe(household)
  })

  it('maximizes general deduction for matching optimization', () => {
    const household = makeHousehold({
      members: [makePerson('Rui', { deductions: [{ category: 'general', amount: 100 }] })],
    })
    const opts = [makeOpt('general-deduction-rui', 50)]

    const result = buildOptimizedHousehold(household, opts)

    const generalDed = result.members[0].deductions.find((d) => d.category === 'general')
    expect(generalDed).toBeDefined()
    // general: rate 0.35, cap €250 → required = ceil(250/0.35) = 715
    expect(generalDed!.amount).toBe(715)
  })

  it('maximizes fatura deduction', () => {
    const household = makeHousehold({
      members: [makePerson('Rui', { deductions: [{ category: 'fatura', amount: 200 }] })],
    })
    const opts = [makeOpt('fatura-rui', 30)]

    const result = buildOptimizedHousehold(household, opts)

    const faturaDed = result.members[0].deductions.find((d) => d.category === 'fatura')
    expect(faturaDed).toBeDefined()
    // fatura: rate 0.15, cap €250 → required = ceil(250/0.15) = 1667
    expect(faturaDed!.amount).toBe(1667)
  })

  it('does not touch categories without matching optimization', () => {
    const household = makeHousehold({
      members: [
        makePerson('Rui', {
          deductions: [
            { category: 'general', amount: 100 },
            { category: 'health', amount: 50 },
          ],
        }),
      ],
    })
    // Only general optimization, not health
    const opts = [makeOpt('general-deduction-rui', 50)]

    const result = buildOptimizedHousehold(household, opts)

    const healthDed = result.members[0].deductions.find((d) => d.category === 'health')
    expect(healthDed!.amount).toBe(50) // unchanged
  })

  it('fixes Cat B acréscimo by setting expenses to 15% of gross', () => {
    const household = makeHousehold({
      members: [
        makePerson('Rui', {
          incomes: [{ category: 'B', gross: 30000, cat_b_documented_expenses: 2000 }],
        }),
      ],
    })
    const opts = [makeOpt('cat-b-acrescimo-rui', 500)]

    const result = buildOptimizedHousehold(household, opts)

    expect(result.members[0].incomes[0].cat_b_documented_expenses).toBe(4500) // 15% of 30000
  })

  it('does not reduce Cat B expenses if already above 15%', () => {
    const household = makeHousehold({
      members: [
        makePerson('Rui', {
          incomes: [{ category: 'B', gross: 30000, cat_b_documented_expenses: 6000 }],
        }),
      ],
    })
    const opts = [makeOpt('cat-b-acrescimo-rui', 500)]

    const result = buildOptimizedHousehold(household, opts)

    expect(result.members[0].incomes[0].cat_b_documented_expenses).toBe(6000)
  })

  it('handles PPR maximize variant', () => {
    const household = makeHousehold({
      members: [makePerson('Rui', { birth_year: 1990 })],
    })
    const opts = [makeOpt('ppr-maximize-rui', 200)]

    const result = buildOptimizedHousehold(household, opts)

    const pprDed = result.members[0].deductions.find((d) => d.category === 'ppr')
    expect(pprDed).toBeDefined()
    expect(pprDed!.amount).toBeGreaterThan(0)
  })

  it('handles multi-member household with per-person optimizations', () => {
    const household = makeHousehold({
      filing_status: 'married_joint',
      members: [
        makePerson('Rui', { deductions: [{ category: 'general', amount: 100 }] }),
        makePerson('Ana', { deductions: [{ category: 'general', amount: 80 }] }),
      ],
    })
    const opts = [makeOpt('general-deduction-rui', 50), makeOpt('fatura-ana', 20)]

    const result = buildOptimizedHousehold(household, opts)

    // Rui gets general maximized
    const ruiGeneral = result.members[0].deductions.find((d) => d.category === 'general')
    expect(ruiGeneral!.amount).toBe(715)

    // Ana's general is unchanged (no optimization for it)
    const anaGeneral = result.members[1].deductions.find((d) => d.category === 'general')
    expect(anaGeneral!.amount).toBe(80)

    // Ana gets fatura maximized
    const anaFatura = result.members[1].deductions.find((d) => d.category === 'fatura')
    expect(anaFatura).toBeDefined()
  })

  it('handles accented names via slugify', () => {
    const household = makeHousehold({
      members: [makePerson('João Silva')],
    })
    const opts = [makeOpt('general-deduction-joao-silva', 50)]

    const result = buildOptimizedHousehold(household, opts)

    const generalDed = result.members[0].deductions.find((d) => d.category === 'general')
    expect(generalDed!.amount).toBe(715)
  })

  it('does not mutate the original household', () => {
    const originalDeductions: Deduction[] = [{ category: 'general', amount: 100 }]
    const household = makeHousehold({
      members: [makePerson('Rui', { deductions: [...originalDeductions] })],
    })
    const opts = [makeOpt('general-deduction-rui', 50)]

    buildOptimizedHousehold(household, opts)

    expect(household.members[0].deductions).toEqual(originalDeductions)
  })
})
