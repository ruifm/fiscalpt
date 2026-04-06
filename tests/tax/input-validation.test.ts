import { describe, it, expect } from 'vitest'
import {
  validateHousehold,
  validatePerson,
  validateIncome,
  validateDeduction,
  validateDependent,
  validateAscendant,
  sanitizeNumber,
} from '@/lib/tax/input-validation'
import type { Household, Person, Income } from '@/lib/tax/types'

// ─── Helpers ──────────────────────────────────────────────────

function validIncome(overrides: Partial<Income> = {}): Income {
  return { category: 'A', gross: 30000, ...overrides }
}

function validPerson(overrides: Partial<Person> = {}): Person {
  return {
    name: 'Test Person',
    incomes: [validIncome()],
    deductions: [],
    special_regimes: [],
    ...overrides,
  }
}

function validHousehold(overrides: Partial<Household> = {}): Household {
  return {
    year: 2025,
    filing_status: 'single',
    members: [validPerson()],
    dependents: [],
    ...overrides,
  }
}

// ═══════════════════════════════════════════════════════════════
// 1. sanitizeNumber
// ═══════════════════════════════════════════════════════════════

describe('sanitizeNumber', () => {
  it('passes through valid positive numbers', () => {
    expect(sanitizeNumber(100)).toBe(100)
    expect(sanitizeNumber(0)).toBe(0)
    expect(sanitizeNumber(0.01)).toBe(0.01)
    expect(sanitizeNumber(999999.99)).toBe(999999.99)
  })

  it('clamps negative numbers to 0 by default', () => {
    expect(sanitizeNumber(-1)).toBe(0)
    expect(sanitizeNumber(-50000)).toBe(0)
  })

  it('allows negative when allowNegative is true', () => {
    expect(sanitizeNumber(-100, { allowNegative: true })).toBe(-100)
  })

  it('replaces NaN with 0', () => {
    expect(sanitizeNumber(NaN)).toBe(0)
    expect(sanitizeNumber(Number('abc'))).toBe(0)
  })

  it('replaces Infinity with 0', () => {
    expect(sanitizeNumber(Infinity)).toBe(0)
    expect(sanitizeNumber(-Infinity)).toBe(0)
  })

  it('coerces undefined/null to 0', () => {
    expect(sanitizeNumber(undefined as unknown as number)).toBe(0)
    expect(sanitizeNumber(null as unknown as number)).toBe(0)
  })

  it('clamps to max when provided', () => {
    expect(sanitizeNumber(2000000, { max: 1000000 })).toBe(1000000)
  })

  it('rounds to 2 decimal places', () => {
    expect(sanitizeNumber(100.556)).toBe(100.56)
    expect(sanitizeNumber(100.554)).toBe(100.55)
  })
})

// ═══════════════════════════════════════════════════════════════
// 2. validateIncome
// ═══════════════════════════════════════════════════════════════

describe('validateIncome', () => {
  it('accepts valid income', () => {
    const errors = validateIncome(validIncome())
    expect(errors).toHaveLength(0)
  })

  it('rejects negative gross', () => {
    const errors = validateIncome(validIncome({ gross: -1000 }))
    expect(errors).toContainEqual(
      expect.objectContaining({ field: 'gross', code: 'NEGATIVE_VALUE' }),
    )
  })

  it('rejects NaN gross', () => {
    const errors = validateIncome(validIncome({ gross: NaN }))
    expect(errors).toContainEqual(
      expect.objectContaining({ field: 'gross', code: 'INVALID_NUMBER' }),
    )
  })

  it('rejects Infinity gross', () => {
    const errors = validateIncome(validIncome({ gross: Infinity }))
    expect(errors).toContainEqual(
      expect.objectContaining({ field: 'gross', code: 'INVALID_NUMBER' }),
    )
  })

  it('warns on absurdly high gross (>€10M)', () => {
    const errors = validateIncome(validIncome({ gross: 15000000 }))
    expect(errors).toContainEqual(
      expect.objectContaining({ field: 'gross', code: 'SUSPICIOUSLY_HIGH' }),
    )
  })

  it('rejects negative withholding', () => {
    const errors = validateIncome(validIncome({ withholding: -500 }))
    expect(errors).toContainEqual(
      expect.objectContaining({ field: 'withholding', code: 'NEGATIVE_VALUE' }),
    )
  })

  it('warns when withholding exceeds gross', () => {
    const errors = validateIncome(validIncome({ gross: 30000, withholding: 35000 }))
    expect(errors).toContainEqual(expect.objectContaining({ code: 'WITHHOLDING_EXCEEDS_GROSS' }))
  })

  it('rejects negative ss_paid', () => {
    const errors = validateIncome(validIncome({ ss_paid: -100 }))
    expect(errors).toContainEqual(
      expect.objectContaining({ field: 'ss_paid', code: 'NEGATIVE_VALUE' }),
    )
  })

  it('rejects negative expenses', () => {
    const errors = validateIncome(
      validIncome({ category: 'B', expenses: -1000, cat_b_regime: 'organized' }),
    )
    expect(errors).toContainEqual(
      expect.objectContaining({ field: 'expenses', code: 'NEGATIVE_VALUE' }),
    )
  })

  it('rejects negative foreign_tax_paid', () => {
    const errors = validateIncome(validIncome({ foreign_tax_paid: -500 }))
    expect(errors).toContainEqual(
      expect.objectContaining({ field: 'foreign_tax_paid', code: 'NEGATIVE_VALUE' }),
    )
  })

  it('warns when foreign_tax_paid exceeds gross', () => {
    const errors = validateIncome(validIncome({ gross: 10000, foreign_tax_paid: 12000 }))
    expect(errors).toContainEqual(expect.objectContaining({ code: 'FOREIGN_TAX_EXCEEDS_GROSS' }))
  })

  it('rejects negative rental_contract_duration', () => {
    const errors = validateIncome(validIncome({ category: 'F', rental_contract_duration: -1 }))
    expect(errors).toContainEqual(
      expect.objectContaining({ field: 'rental_contract_duration', code: 'NEGATIVE_VALUE' }),
    )
  })

  it('accepts zero gross (valid — someone may have zero income in a category)', () => {
    const errors = validateIncome(validIncome({ gross: 0 }))
    expect(errors).toHaveLength(0)
  })

  it('accepts valid Cat B income with all fields', () => {
    const errors = validateIncome(
      validIncome({
        category: 'B',
        gross: 50000,
        cat_b_regime: 'simplified',
        cat_b_income_code: 403,
        cat_b_documented_expenses: 5000,
        cat_b_activity_year: 1,
      }),
    )
    expect(errors).toHaveLength(0)
  })

  it('accepts cat_b_activity_year of 0 (3rd year or more, no reduction)', () => {
    const errors = validateIncome(validIncome({ category: 'B', cat_b_activity_year: 0 }))
    expect(errors.filter((e) => e.field === 'cat_b_activity_year')).toHaveLength(0)
  })

  it('accepts cat_b_activity_year of 3 or more', () => {
    const errors = validateIncome(validIncome({ category: 'B', cat_b_activity_year: 3 }))
    expect(errors.filter((e) => e.field === 'cat_b_activity_year')).toHaveLength(0)
  })
})

// ═══════════════════════════════════════════════════════════════
// 3. validateDeduction
// ═══════════════════════════════════════════════════════════════

describe('validateDeduction', () => {
  it('accepts valid deduction', () => {
    const errors = validateDeduction({ category: 'health', amount: 500 })
    expect(errors).toHaveLength(0)
  })

  it('rejects negative amount', () => {
    const errors = validateDeduction({ category: 'health', amount: -100 })
    expect(errors).toContainEqual(
      expect.objectContaining({ field: 'amount', code: 'NEGATIVE_VALUE' }),
    )
  })

  it('rejects NaN amount', () => {
    const errors = validateDeduction({ category: 'health', amount: NaN })
    expect(errors).toContainEqual(
      expect.objectContaining({ field: 'amount', code: 'INVALID_NUMBER' }),
    )
  })

  it('warns on suspiciously high amount (>€100K)', () => {
    const errors = validateDeduction({ category: 'health', amount: 200000 })
    expect(errors).toContainEqual(expect.objectContaining({ code: 'SUSPICIOUSLY_HIGH' }))
  })
})

// ═══════════════════════════════════════════════════════════════
// 4. validateDependent
// ═══════════════════════════════════════════════════════════════

describe('validateDependent', () => {
  it('accepts valid dependent', () => {
    const errors = validateDependent({ name: 'Child', birth_year: 2020 }, 2025)
    expect(errors).toHaveLength(0)
  })

  it('rejects birth_year in the future', () => {
    const errors = validateDependent({ name: 'Child', birth_year: 2030 }, 2025)
    expect(errors).toContainEqual(
      expect.objectContaining({ field: 'birth_year', code: 'FUTURE_BIRTH_YEAR' }),
    )
  })

  it('rejects birth_year before 1900', () => {
    const errors = validateDependent({ name: 'Child', birth_year: 1850 }, 2025)
    expect(errors).toContainEqual(
      expect.objectContaining({ field: 'birth_year', code: 'OUT_OF_RANGE' }),
    )
  })

  it('rejects empty name', () => {
    const errors = validateDependent({ name: '', birth_year: 2020 }, 2025)
    expect(errors).toContainEqual(expect.objectContaining({ field: 'name', code: 'REQUIRED' }))
  })

  it('rejects disability_degree outside 0-100', () => {
    const errors = validateDependent(
      { name: 'Child', birth_year: 2020, disability_degree: 150 },
      2025,
    )
    expect(errors).toContainEqual(
      expect.objectContaining({ field: 'disability_degree', code: 'OUT_OF_RANGE' }),
    )
  })

  it('warns when disability_degree < 60 (no tax benefit)', () => {
    const errors = validateDependent(
      { name: 'Child', birth_year: 2020, disability_degree: 40 },
      2025,
    )
    expect(errors).toContainEqual(
      expect.objectContaining({ field: 'disability_degree', code: 'BELOW_BENEFIT_THRESHOLD' }),
    )
  })
})

// ═══════════════════════════════════════════════════════════════
// 5. validateAscendant
// ═══════════════════════════════════════════════════════════════

describe('validateAscendant', () => {
  it('accepts valid ascendant', () => {
    const errors = validateAscendant({ name: 'Parent', birth_year: 1960, income: 3000 }, 2025)
    expect(errors).toHaveLength(0)
  })

  it('rejects negative income', () => {
    const errors = validateAscendant({ name: 'Parent', income: -100 }, 2025)
    expect(errors).toContainEqual(
      expect.objectContaining({ field: 'income', code: 'NEGATIVE_VALUE' }),
    )
  })

  it('rejects empty name', () => {
    const errors = validateAscendant({ name: '', birth_year: 1960 }, 2025)
    expect(errors).toContainEqual(expect.objectContaining({ field: 'name', code: 'REQUIRED' }))
  })
})

// ═══════════════════════════════════════════════════════════════
// 6. validatePerson
// ═══════════════════════════════════════════════════════════════

describe('validatePerson', () => {
  it('accepts valid person', () => {
    const errors = validatePerson(validPerson(), 2025)
    expect(errors).toHaveLength(0)
  })

  it('rejects empty name', () => {
    const errors = validatePerson(validPerson({ name: '' }), 2025)
    expect(errors).toContainEqual(expect.objectContaining({ field: 'name', code: 'REQUIRED' }))
  })

  it('rejects invalid birth_year', () => {
    const errors = validatePerson(validPerson({ birth_year: 1800 }), 2025)
    expect(errors).toContainEqual(
      expect.objectContaining({ field: 'birth_year', code: 'OUT_OF_RANGE' }),
    )
  })

  it('rejects irs_jovem_year outside 1-10', () => {
    const errors = validatePerson(
      validPerson({ irs_jovem_year: 11, special_regimes: ['irs_jovem'] }),
      2025,
    )
    expect(errors).toContainEqual(
      expect.objectContaining({ field: 'irs_jovem_year', code: 'OUT_OF_RANGE' }),
    )
  })

  it('rejects irs_jovem without irs_jovem_year', () => {
    const errors = validatePerson(validPerson({ special_regimes: ['irs_jovem'] }), 2025)
    expect(errors).toContainEqual(
      expect.objectContaining({ field: 'irs_jovem_year', code: 'REQUIRED' }),
    )
  })

  it('rejects nhr without nhr_start_year', () => {
    const errors = validatePerson(validPerson({ special_regimes: ['nhr'] }), 2025)
    expect(errors).toContainEqual(
      expect.objectContaining({ field: 'nhr_start_year', code: 'REQUIRED' }),
    )
  })

  it('accepts nhr without nhr_start_year when nhr_confirmed', () => {
    const errors = validatePerson(
      validPerson({ special_regimes: ['nhr'], nhr_confirmed: true }),
      2025,
    )
    expect(errors).not.toContainEqual(
      expect.objectContaining({ field: 'nhr_start_year', code: 'REQUIRED' }),
    )
  })

  it('propagates income validation errors', () => {
    const errors = validatePerson(validPerson({ incomes: [validIncome({ gross: -500 })] }), 2025)
    expect(errors).toContainEqual(
      expect.objectContaining({ field: 'incomes[0].gross', code: 'NEGATIVE_VALUE' }),
    )
  })

  it('propagates deduction validation errors', () => {
    const errors = validatePerson(
      validPerson({ deductions: [{ category: 'health', amount: -100 }] }),
      2025,
    )
    expect(errors).toContainEqual(
      expect.objectContaining({ field: 'deductions[0].amount', code: 'NEGATIVE_VALUE' }),
    )
  })

  it('rejects disability_degree outside 0-100', () => {
    const errors = validatePerson(validPerson({ disability_degree: 120 }), 2025)
    expect(errors).toContainEqual(
      expect.objectContaining({ field: 'disability_degree', code: 'OUT_OF_RANGE' }),
    )
  })
})

// ═══════════════════════════════════════════════════════════════
// 7. validateHousehold
// ═══════════════════════════════════════════════════════════════

describe('validateHousehold', () => {
  it('accepts valid single-person household', () => {
    const errors = validateHousehold(validHousehold())
    expect(errors).toHaveLength(0)
  })

  it('accepts valid married household with 2 members', () => {
    const errors = validateHousehold(
      validHousehold({
        filing_status: 'married_joint',
        members: [validPerson({ name: 'Person A' }), validPerson({ name: 'Person B' })],
      }),
    )
    expect(errors).toHaveLength(0)
  })

  it('rejects married joint filing with only 1 member', () => {
    const errors = validateHousehold(
      validHousehold({ filing_status: 'married_joint', members: [validPerson()] }),
    )
    expect(errors).toContainEqual(expect.objectContaining({ code: 'JOINT_REQUIRES_TWO_MEMBERS' }))
  })

  it('allows married separate filing with 1 member', () => {
    const errors = validateHousehold(
      validHousehold({ filing_status: 'married_separate', members: [validPerson()] }),
    )
    expect(errors.filter((e) => e.code === 'JOINT_REQUIRES_TWO_MEMBERS')).toHaveLength(0)
  })

  it('rejects single filing with 2 members', () => {
    const errors = validateHousehold(
      validHousehold({
        filing_status: 'single',
        members: [validPerson({ name: 'A' }), validPerson({ name: 'B' })],
      }),
    )
    expect(errors).toContainEqual(expect.objectContaining({ code: 'SINGLE_REQUIRES_ONE_MEMBER' }))
  })

  it('rejects empty members array', () => {
    const errors = validateHousehold(validHousehold({ members: [] }))
    expect(errors).toContainEqual(expect.objectContaining({ code: 'NO_MEMBERS' }))
  })

  it('rejects year before 2021', () => {
    const errors = validateHousehold(validHousehold({ year: 2018 }))
    expect(errors).toContainEqual(expect.objectContaining({ field: 'year', code: 'OUT_OF_RANGE' }))
  })

  it('rejects year in the far future', () => {
    const currentYear = new Date().getFullYear()
    const errors = validateHousehold(validHousehold({ year: currentYear + 2 }))
    expect(errors).toContainEqual(expect.objectContaining({ field: 'year', code: 'OUT_OF_RANGE' }))
  })

  it('propagates person validation errors with path', () => {
    const errors = validateHousehold(
      validHousehold({
        members: [validPerson({ incomes: [validIncome({ gross: -1000 })] })],
      }),
    )
    expect(errors).toContainEqual(
      expect.objectContaining({
        field: 'members[0].incomes[0].gross',
        code: 'NEGATIVE_VALUE',
      }),
    )
  })

  it('propagates dependent validation errors with path', () => {
    const errors = validateHousehold(
      validHousehold({
        dependents: [{ name: '', birth_year: 2020 }],
      }),
    )
    expect(errors).toContainEqual(
      expect.objectContaining({
        field: 'dependents[0].name',
        code: 'REQUIRED',
      }),
    )
  })

  it('propagates ascendant validation errors with path', () => {
    const errors = validateHousehold(
      validHousehold({
        ascendants: [{ name: 'Parent', income: -500 }],
      }),
    )
    expect(errors).toContainEqual(
      expect.objectContaining({
        field: 'ascendants[0].income',
        code: 'NEGATIVE_VALUE',
      }),
    )
  })

  it('rejects more than 10 dependents', () => {
    const deps = Array.from({ length: 11 }, (_, i) => ({
      name: `Child ${i}`,
      birth_year: 2020,
    }))
    const errors = validateHousehold(validHousehold({ dependents: deps }))
    expect(errors).toContainEqual(expect.objectContaining({ code: 'TOO_MANY_DEPENDENTS' }))
  })

  it('rejects more than 4 ascendants', () => {
    const asc = Array.from({ length: 5 }, (_, i) => ({
      name: `Ascendant ${i}`,
    }))
    const errors = validateHousehold(validHousehold({ ascendants: asc }))
    expect(errors).toContainEqual(expect.objectContaining({ code: 'TOO_MANY_ASCENDANTS' }))
  })

  it('collects multiple errors', () => {
    const errors = validateHousehold(
      validHousehold({
        year: 1990,
        members: [],
      }),
    )
    expect(errors.length).toBeGreaterThanOrEqual(2)
  })
})
