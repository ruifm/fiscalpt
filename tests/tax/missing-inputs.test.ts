import { describe, it, expect } from 'vitest'
import {
  identifyMissingInputs,
  groupBySection,
  applyAnswers,
  hasMandatoryQuestions,
  countUnansweredCritical,
  validateAnswer,
  type MissingInputQuestion,
} from '@/lib/tax/missing-inputs'
import type { Household, Person, Income } from '@/lib/tax/types'

// ─── Test Helpers ────────────────────────────────────────────

function makePerson(overrides: Partial<Person> = {}): Person {
  return {
    name: 'Test Person',
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
    members: [makePerson()],
    dependents: [],
    ...overrides,
  }
}

function makeIncome(overrides: Partial<Income> = {}): Income {
  return { category: 'A', gross: 30000, ...overrides }
}

// ─── identifyMissingInputs ──────────────────────────────────

describe('identifyMissingInputs', () => {
  describe('taxpayer birth year', () => {
    it('asks for birth year when missing', () => {
      const h = makeHousehold({
        members: [makePerson({ name: 'Rui' })],
      })
      const qs = identifyMissingInputs(h)
      const q = qs.find((q) => q.id === 'member.0.birth_year')
      expect(q).toBeDefined()
      expect(q!.section).toBe('taxpayer_info')
      expect(q!.priority).toBe('important')
    })

    it('does not ask when birth year is present', () => {
      const h = makeHousehold({
        members: [makePerson({ birth_year: 1990 })],
      })
      const qs = identifyMissingInputs(h)
      expect(qs.find((q) => q.id === 'member.0.birth_year')).toBeUndefined()
    })

    it('marks birth year as critical when IRS Jovem is active', () => {
      const h = makeHousehold({
        members: [makePerson({ special_regimes: ['irs_jovem'] })],
      })
      const qs = identifyMissingInputs(h)
      const q = qs.find((q) => q.id === 'member.0.birth_year')
      expect(q!.priority).toBe('critical')
    })

    it('asks for both members in married household', () => {
      const h = makeHousehold({
        filing_status: 'married_joint',
        members: [makePerson({ name: 'A' }), makePerson({ name: 'B' })],
      })
      const qs = identifyMissingInputs(h)
      expect(qs.find((q) => q.id === 'member.0.birth_year')).toBeDefined()
      expect(qs.find((q) => q.id === 'member.1.birth_year')).toBeDefined()
    })
  })

  describe('dependent birth years', () => {
    it('asks when birth year is a placeholder (year - 5)', () => {
      const h = makeHousehold({
        dependents: [{ name: 'Child', birth_year: 2020 }],
      })
      const qs = identifyMissingInputs(h)
      const q = qs.find((q) => q.id === 'dependent.0.birth_year')
      expect(q).toBeDefined()
      expect(q!.isPlaceholder).toBe(true)
      expect(q!.currentValue).toBe(2020)
    })

    it('asks when birth year is 0 (unknown from XML parser)', () => {
      const h = makeHousehold({
        dependents: [{ name: 'Child', birth_year: 0 }],
      })
      const qs = identifyMissingInputs(h)
      const q = qs.find((q) => q.id === 'dependent.0.birth_year')
      expect(q).toBeDefined()
      expect(q!.isPlaceholder).toBe(true)
      expect(q!.currentValue).toBe(0)
    })

    it('asks when birth year is negative', () => {
      const h = makeHousehold({
        dependents: [{ name: 'Child', birth_year: -1 }],
      })
      const qs = identifyMissingInputs(h)
      const q = qs.find((q) => q.id === 'dependent.0.birth_year')
      expect(q).toBeDefined()
      expect(q!.isPlaceholder).toBe(true)
    })

    it('asks with optional priority when birth year is not a placeholder', () => {
      const h = makeHousehold({
        dependents: [{ name: 'Child', birth_year: 2018 }],
      })
      const qs = identifyMissingInputs(h)
      const q = qs.find((q) => q.id === 'dependent.0.birth_year')
      expect(q).toBeDefined()
      expect(q!.isPlaceholder).toBe(false)
      expect(q!.priority).toBe('optional')
      expect(q!.currentValue).toBe(2018)
    })

    it('asks for disability status of each dependent', () => {
      const h = makeHousehold({
        dependents: [
          { name: 'A', birth_year: 2015 },
          { name: 'B', birth_year: 2018 },
        ],
      })
      const qs = identifyMissingInputs(h)
      expect(qs.find((q) => q.id === 'dependent.0.disability')).toBeDefined()
      expect(qs.find((q) => q.id === 'dependent.1.disability')).toBeDefined()
    })

    it('does not ask disability when already set to non-zero', () => {
      const h = makeHousehold({
        dependents: [{ name: 'A', birth_year: 2015, disability_degree: 60 }],
      })
      const qs = identifyMissingInputs(h)
      expect(qs.find((q) => q.id === 'dependent.0.disability')).toBeUndefined()
    })

    it('does not ask disability when explicitly set to 0 (no disability from XML)', () => {
      const h = makeHousehold({
        dependents: [{ name: 'A', birth_year: 2015, disability_degree: 0 }],
      })
      const qs = identifyMissingInputs(h)
      expect(qs.find((q) => q.id === 'dependent.0.disability')).toBeUndefined()
    })

    it('asks disability when undefined (unknown — e.g. from PDF without disability info)', () => {
      const h = makeHousehold({
        dependents: [{ name: 'A', birth_year: 2015 }],
      })
      const qs = identifyMissingInputs(h)
      const q = qs.find((q) => q.id === 'dependent.0.disability')
      expect(q).toBeDefined()
      expect(q!.priority).toBe('optional')
    })
  })

  describe('ascendant birth year conditional on disability', () => {
    it('asks when disability is unknown (undefined)', () => {
      const h = makeHousehold({
        ascendants: [{ name: 'Avó', income: 3000 }],
      })
      const qs = identifyMissingInputs(h)
      expect(qs.find((q) => q.id === 'ascendant.0.birth_year')).toBeDefined()
    })

    it('asks when disability >= 90% (acompanhamento deduction)', () => {
      const h = makeHousehold({
        ascendants: [{ name: 'Avó', income: 3000, disability_degree: 90 }],
      })
      const qs = identifyMissingInputs(h)
      expect(qs.find((q) => q.id === 'ascendant.0.birth_year')).toBeDefined()
    })

    it('does not ask when disability is known and < 90%', () => {
      const h = makeHousehold({
        ascendants: [{ name: 'Avó', income: 3000, disability_degree: 60 }],
      })
      const qs = identifyMissingInputs(h)
      expect(qs.find((q) => q.id === 'ascendant.0.birth_year')).toBeUndefined()
    })

    it('does not ask when disability is 0 (no disability)', () => {
      const h = makeHousehold({
        ascendants: [{ name: 'Avó', income: 3000, disability_degree: 0 }],
      })
      const qs = identifyMissingInputs(h)
      expect(qs.find((q) => q.id === 'ascendant.0.birth_year')).toBeUndefined()
    })

    it('asks when disability is exactly 90%', () => {
      const h = makeHousehold({
        ascendants: [{ name: 'Avó', income: 3000, disability_degree: 90 }],
      })
      const qs = identifyMissingInputs(h)
      const q = qs.find((q) => q.id === 'ascendant.0.birth_year')
      expect(q).toBeDefined()
      expect(q!.priority).toBe('optional')
    })

    it('does not ask when disability is 89% (just below threshold)', () => {
      const h = makeHousehold({
        ascendants: [{ name: 'Avó', income: 3000, disability_degree: 89 }],
      })
      const qs = identifyMissingInputs(h)
      expect(qs.find((q) => q.id === 'ascendant.0.birth_year')).toBeUndefined()
    })
  })

  describe('Cat B activity details', () => {
    it('asks for activity year when Cat B income present', () => {
      const h = makeHousehold({
        members: [
          makePerson({
            incomes: [makeIncome({ category: 'B', gross: 50000 })],
          }),
        ],
      })
      const qs = identifyMissingInputs(h)
      const q = qs.find((q) => q.id === 'member.0.cat_b_start_year')
      expect(q).toBeDefined()
      expect(q!.priority).toBe('critical')
      expect(q!.type).toBe('number')
    })

    it('asks with optional priority when cat_b_start_year is set', () => {
      const h = makeHousehold({
        members: [
          makePerson({
            cat_b_start_year: 2024,
            incomes: [
              makeIncome({
                category: 'B',
                gross: 50000,
              }),
            ],
          }),
        ],
      })
      const qs = identifyMissingInputs(h)
      const q = qs.find((q) => q.id === 'member.0.cat_b_start_year')
      expect(q).toBeDefined()
      expect(q!.priority).toBe('optional')
      expect(q!.currentValue).toBe('2024')
    })

    it('does not ask cat_b_start_year for Cat A income', () => {
      const h = makeHousehold({
        members: [makePerson({ incomes: [makeIncome({ category: 'A' })] })],
      })
      const qs = identifyMissingInputs(h)
      expect(qs.find((q) => q.id.includes('cat_b_start_year'))).toBeUndefined()
    })

    it('auto-sets cat_b_start_year when member has Cat B in ≥2 other years (3+ total)', () => {
      const h = makeHousehold({
        year: 2025,
        members: [
          makePerson({
            name: 'Rui',
            nif: '123',
            incomes: [makeIncome({ category: 'B', gross: 50000 })],
          }),
        ],
      })
      const otherYears: Household[] = [
        makeHousehold({
          year: 2023,
          members: [
            makePerson({
              name: 'Rui',
              nif: '123',
              incomes: [makeIncome({ category: 'B', gross: 40000 })],
            }),
          ],
        }),
        makeHousehold({
          year: 2024,
          members: [
            makePerson({
              name: 'Rui',
              nif: '123',
              incomes: [makeIncome({ category: 'B', gross: 45000 })],
            }),
          ],
        }),
      ]
      const qs = identifyMissingInputs(h, otherYears)
      expect(qs.find((q) => q.id.includes('cat_b_start_year'))).toBeUndefined()
      // Auto-inference: earliest year with Cat B = min(2025, 2023, 2024) = 2023
      expect(h.members[0].cat_b_start_year).toBe(2023)
    })

    it('still asks cat_b_start_year when member has Cat B in only 1 other year', () => {
      const h = makeHousehold({
        year: 2025,
        members: [
          makePerson({
            name: 'Rui',
            nif: '123',
            incomes: [makeIncome({ category: 'B', gross: 50000 })],
          }),
        ],
      })
      const otherYears: Household[] = [
        makeHousehold({
          year: 2024,
          members: [
            makePerson({
              name: 'Rui',
              nif: '123',
              incomes: [makeIncome({ category: 'B', gross: 45000 })],
            }),
          ],
        }),
      ]
      const qs = identifyMissingInputs(h, otherYears)
      expect(qs.find((q) => q.id.includes('cat_b_start_year'))).toBeDefined()
    })
  })

  describe('Cat F rental duration', () => {
    it('asks for rental contract duration', () => {
      const h = makeHousehold({
        members: [
          makePerson({
            incomes: [makeIncome({ category: 'F', gross: 12000 })],
          }),
        ],
      })
      const qs = identifyMissingInputs(h)
      const q = qs.find((q) => q.id === 'member.0.income.0.rental_duration')
      expect(q).toBeDefined()
      expect(q!.section).toBe('income_options')
      expect(q!.options).toHaveLength(5)
    })

    it('asks with optional priority when duration already set', () => {
      const h = makeHousehold({
        members: [
          makePerson({
            incomes: [
              makeIncome({
                category: 'F',
                gross: 12000,
                rental_contract_duration: 5,
              }),
            ],
          }),
        ],
      })
      const qs = identifyMissingInputs(h)
      const q = qs.find((q) => q.id === 'member.0.income.0.rental_duration')
      expect(q).toBeDefined()
      expect(q!.priority).toBe('optional')
      expect(q!.currentValue).toBe('5')
    })
  })

  describe('IRS Jovem', () => {
    it('no longer asks for benefit year dropdown — derives from first_work_year', () => {
      const h = makeHousehold({
        members: [makePerson({ special_regimes: ['irs_jovem'] })],
      })
      const qs = identifyMissingInputs(h)
      expect(qs.find((q) => q.id === 'member.0.irs_jovem_year')).toBeUndefined()
    })

    it('asks for first_work_year when IRS Jovem detected from XML (≥2025)', () => {
      const h = makeHousehold({
        year: 2025,
        members: [
          makePerson({
            special_regimes: ['irs_jovem'],
            birth_year: 1995,
            incomes: [makeIncome({ category: 'A', gross: 30000 })],
          }),
        ],
      })
      const qs = identifyMissingInputs(h)
      const q = qs.find((q) => q.id === 'member.0.first_work_year')
      expect(q).toBeDefined()
      expect(q!.section).toBe('irs_jovem')
      expect(q!.priority).toBe('critical')
    })

    it('skips first_work_year when irs_jovem_first_work_year already set', () => {
      const h = makeHousehold({
        year: 2025,
        members: [
          makePerson({
            special_regimes: ['irs_jovem'],
            birth_year: 1995,
            irs_jovem_first_work_year: 2020,
          }),
        ],
      })
      const qs = identifyMissingInputs(h)
      expect(qs.find((q) => q.id === 'member.0.first_work_year')).toBeUndefined()
    })

    it('does not ask when IRS Jovem not active', () => {
      const h = makeHousehold({
        members: [makePerson({ special_regimes: [] })],
      })
      const qs = identifyMissingInputs(h)
      expect(qs.find((q) => q.id === 'member.0.irs_jovem_year')).toBeUndefined()
      expect(qs.find((q) => q.id === 'member.0.first_work_year')).toBeUndefined()
    })
  })

  describe('NHR', () => {
    it('asks for start year when NHR active but year not set', () => {
      const h = makeHousehold({
        members: [makePerson({ special_regimes: ['nhr'] })],
      })
      const qs = identifyMissingInputs(h)
      const q = qs.find((q) => q.id === 'member.0.nhr_start_year')
      expect(q).toBeDefined()
      expect(q!.priority).toBe('critical')
      expect(q!.section).toBe('nhr')
    })

    it('does not ask when start year is set', () => {
      const h = makeHousehold({
        members: [makePerson({ special_regimes: ['nhr'], nhr_start_year: 2020 })],
      })
      const qs = identifyMissingInputs(h)
      expect(qs.find((q) => q.id === 'member.0.nhr_start_year')).toBeUndefined()
    })

    it('asks start year with lower priority when nhr_confirmed (Anexo L present)', () => {
      const h = makeHousehold({
        members: [makePerson({ special_regimes: ['nhr'], nhr_confirmed: true })],
      })
      const qs = identifyMissingInputs(h)
      const q = qs.find((q) => q.id === 'member.0.nhr_start_year')
      expect(q).toBeDefined()
      expect(q!.priority).toBe('important') // lower than critical since confirmed for this year
    })

    it('does not ask when nhr_confirmed and start year already set', () => {
      const h = makeHousehold({
        members: [
          makePerson({ special_regimes: ['nhr'], nhr_confirmed: true, nhr_start_year: 2020 }),
        ],
      })
      const qs = identifyMissingInputs(h)
      expect(qs.find((q) => q.id === 'member.0.nhr_start_year')).toBeUndefined()
    })
  })

  describe('deductions', () => {
    it('never asks for deduction expenses (provided via AT portal paste)', () => {
      const h = makeHousehold({
        members: [makePerson({ deductions: [] })],
      })
      const qs = identifyMissingInputs(h)
      expect(qs.filter((q) => q.section === 'deductions')).toHaveLength(0)
    })
  })

  describe('englobamento', () => {
    it('asks for Cat E englobamento when not set', () => {
      const h = makeHousehold({
        members: [
          makePerson({
            incomes: [makeIncome({ category: 'E', gross: 5000 })],
          }),
        ],
      })
      const qs = identifyMissingInputs(h)
      const q = qs.find((q) => q.id === 'member.0.income.0.englobamento')
      expect(q).toBeDefined()
      expect(q!.section).toBe('income_options')
    })

    it('asks for Cat F englobamento when not set', () => {
      const h = makeHousehold({
        members: [
          makePerson({
            incomes: [makeIncome({ category: 'F', gross: 12000 })],
          }),
        ],
      })
      const qs = identifyMissingInputs(h)
      const q = qs.find((q) => q.id === 'member.0.income.0.englobamento')
      expect(q).toBeDefined()
    })

    it('does not ask for Cat A englobamento', () => {
      const h = makeHousehold({
        members: [
          makePerson({
            incomes: [makeIncome({ category: 'A', gross: 30000 })],
          }),
        ],
      })
      const qs = identifyMissingInputs(h)
      expect(qs.find((q) => q.id === 'member.0.income.0.englobamento')).toBeUndefined()
    })

    it('does not ask when englobamento is explicitly set', () => {
      const h = makeHousehold({
        members: [
          makePerson({
            incomes: [makeIncome({ category: 'E', gross: 5000, englobamento: false })],
          }),
        ],
      })
      const qs = identifyMissingInputs(h)
      expect(qs.find((q) => q.id === 'member.0.income.0.englobamento')).toBeUndefined()
    })
  })

  describe('complex household', () => {
    it('generates all relevant questions for a complex household', () => {
      const h = makeHousehold({
        year: 2025,
        filing_status: 'married_joint',
        members: [
          makePerson({
            name: 'Rui',
            special_regimes: ['irs_jovem'],
            incomes: [
              makeIncome({ category: 'A', gross: 40000 }),
              makeIncome({ category: 'B', gross: 20000 }),
            ],
          }),
          makePerson({
            name: 'Micha',
            special_regimes: ['nhr'],
            incomes: [makeIncome({ category: 'A', gross: 30000 })],
          }),
        ],
        dependents: [{ name: 'Child', birth_year: 2020 }],
        ascendants: [{ name: 'Avó', income: 3000 }],
      })

      const qs = identifyMissingInputs(h)

      // Both members should have birth year questions
      expect(qs.find((q) => q.id === 'member.0.birth_year')).toBeDefined()
      expect(qs.find((q) => q.id === 'member.1.birth_year')).toBeDefined()

      // Child has placeholder birth year
      expect(qs.find((q) => q.id === 'dependent.0.birth_year')).toBeDefined()

      // Rui: no irs_jovem_year dropdown (derived from first_work_year)
      // But birth_year not set, so first_work_year question won't appear yet
      expect(qs.find((q) => q.id === 'member.0.irs_jovem_year')).toBeUndefined()
      expect(qs.find((q) => q.id === 'member.0.cat_b_start_year')).toBeDefined()

      // Micha: NHR start year
      expect(qs.find((q) => q.id === 'member.1.nhr_start_year')).toBeDefined()

      // Ascendant
      expect(qs.find((q) => q.id === 'ascendant.0.birth_year')).toBeDefined()

      // Deductions are never asked (provided via AT portal paste)
      expect(qs.filter((q) => q.section === 'deductions')).toHaveLength(0)
    })
  })

  describe('empty household', () => {
    it('returns minimal questions for empty single household', () => {
      const h = makeHousehold()
      const qs = identifyMissingInputs(h)
      // At minimum: birth year (no deduction questions — those come from AT paste)
      expect(qs.length).toBeGreaterThanOrEqual(1)
      expect(qs.filter((q) => q.section === 'deductions')).toHaveLength(0)
    })
  })
})

// ─── groupBySection ──────────────────────────────────────────

describe('groupBySection', () => {
  it('groups questions by section with metadata', () => {
    const h = makeHousehold({
      year: 2025,
      members: [
        makePerson({
          special_regimes: ['irs_jovem'],
          birth_year: 1995,
          incomes: [makeIncome({ category: 'B', gross: 50000 })],
        }),
      ],
    })
    const qs = identifyMissingInputs(h)
    const groups = groupBySection(qs)

    // Should have cat_b_details, irs_jovem sections (NOT deductions)
    // taxpayer_info may not appear if birth_year is already set
    const sectionNames = groups.map((g) => g.section)
    expect(sectionNames).toContain('cat_b_details')
    expect(sectionNames).toContain('irs_jovem')
    expect(sectionNames).not.toContain('deductions')
  })

  it('omits sections with no questions', () => {
    const h = makeHousehold({
      members: [
        makePerson({
          birth_year: 1990,
          deductions: [{ category: 'health', amount: 500 }],
        }),
      ],
    })
    const qs = identifyMissingInputs(h)
    const groups = groupBySection(qs)
    // No special regimes, no Cat B, no dependents → minimal sections
    expect(groups.every((g) => g.questions.length > 0)).toBe(true)
  })

  it('maintains section order', () => {
    const h = makeHousehold({
      members: [makePerson({ special_regimes: ['nhr'] })],
      dependents: [{ name: 'Child', birth_year: 2020 }],
    })
    const qs = identifyMissingInputs(h)
    const groups = groupBySection(qs)
    const sectionNames = groups.map((g) => g.section)

    // taxpayer_info should come before nhr
    const taxIdx = sectionNames.indexOf('taxpayer_info')
    const nhrIdx = sectionNames.indexOf('nhr')
    if (taxIdx >= 0 && nhrIdx >= 0) {
      expect(taxIdx).toBeLessThan(nhrIdx)
    }
  })
  it('sorts questions within sections: critical → important → optional', () => {
    const qs: MissingInputQuestion[] = [
      {
        id: 'opt1',
        label: 'Optional Q',
        type: 'number',
        section: 'taxpayer_info',
        priority: 'optional',
        reason: 'r',
        path: 'x',
      },
      {
        id: 'crit1',
        label: 'Critical Q',
        type: 'number',
        section: 'taxpayer_info',
        priority: 'critical',
        reason: 'r',
        path: 'x',
      },
      {
        id: 'imp1',
        label: 'Important Q',
        type: 'number',
        section: 'taxpayer_info',
        priority: 'important',
        reason: 'r',
        path: 'x',
      },
    ]
    const groups = groupBySection(qs)
    expect(groups).toHaveLength(1)
    expect(groups[0].questions.map((q) => q.priority)).toEqual([
      'critical',
      'important',
      'optional',
    ])
  })
})

// ─── applyAnswers ────────────────────────────────────────────

describe('applyAnswers', () => {
  it('applies member birth year', () => {
    const h = makeHousehold()
    const result = applyAnswers(h, { 'member.0.birth_year': 1990 })
    expect(result.members[0].birth_year).toBe(1990)
  })

  it('applies IRS Jovem year', () => {
    const h = makeHousehold({
      members: [makePerson({ special_regimes: ['irs_jovem'] })],
    })
    const result = applyAnswers(h, { 'member.0.irs_jovem_year': '3' })
    expect(result.members[0].irs_jovem_year).toBe(3)
  })

  it('applies NHR start year', () => {
    const h = makeHousehold({
      members: [makePerson({ special_regimes: ['nhr'] })],
    })
    const result = applyAnswers(h, { 'member.0.nhr_start_year': 2020 })
    expect(result.members[0].nhr_start_year).toBe(2020)
  })

  it('applies Cat B start year', () => {
    const h = makeHousehold({
      members: [
        makePerson({
          incomes: [makeIncome({ category: 'B', gross: 50000 })],
        }),
      ],
    })
    const result = applyAnswers(h, {
      'member.0.cat_b_start_year': '2024',
    })
    expect(result.members[0].cat_b_start_year).toBe(2024)
  })

  it('applies rental contract duration', () => {
    const h = makeHousehold({
      members: [
        makePerson({
          incomes: [makeIncome({ category: 'F', gross: 12000 })],
        }),
      ],
    })
    const result = applyAnswers(h, {
      'member.0.income.0.rental_duration': '10',
    })
    expect(result.members[0].incomes[0].rental_contract_duration).toBe(10)
  })

  it('applies dependent birth year', () => {
    const h = makeHousehold({
      dependents: [{ name: 'Child', birth_year: 2020 }],
    })
    const result = applyAnswers(h, { 'dependent.0.birth_year': 2019 })
    expect(result.dependents[0].birth_year).toBe(2019)
  })

  it('applies dependent disability', () => {
    const h = makeHousehold({
      dependents: [{ name: 'Child', birth_year: 2015 }],
    })
    const result = applyAnswers(h, { 'dependent.0.disability': true })
    expect(result.dependents[0].disability_degree).toBe(60)
  })

  it('clears dependent disability when false', () => {
    const h = makeHousehold({
      dependents: [{ name: 'Child', birth_year: 2015, disability_degree: 60 }],
    })
    const result = applyAnswers(h, { 'dependent.0.disability': false })
    expect(result.dependents[0].disability_degree).toBeUndefined()
  })

  it('applies ascendant birth year', () => {
    const h = makeHousehold({
      ascendants: [{ name: 'Avó', income: 3000 }],
    })
    const result = applyAnswers(h, { 'ascendant.0.birth_year': 1945 })
    expect(result.ascendants![0].birth_year).toBe(1945)
  })

  it('adds deduction when member has none', () => {
    const h = makeHousehold()
    const result = applyAnswers(h, { 'member.0.deduction.health': 800 })
    expect(result.members[0].deductions).toHaveLength(1)
    expect(result.members[0].deductions[0].category).toBe('health')
    expect(result.members[0].deductions[0].amount).toBe(800)
  })

  it('updates existing deduction', () => {
    const h = makeHousehold({
      members: [
        makePerson({
          deductions: [{ category: 'health', amount: 500 }],
        }),
      ],
    })
    const result = applyAnswers(h, { 'member.0.deduction.health': 800 })
    expect(result.members[0].deductions).toHaveLength(1)
    expect(result.members[0].deductions[0].amount).toBe(800)
  })

  it('does not add deduction with zero amount', () => {
    const h = makeHousehold()
    const result = applyAnswers(h, { 'member.0.deduction.health': 0 })
    expect(result.members[0].deductions).toHaveLength(0)
  })

  it('applies englobamento as boolean', () => {
    const h = makeHousehold({
      members: [
        makePerson({
          incomes: [makeIncome({ category: 'E', gross: 5000 })],
        }),
      ],
    })
    const result = applyAnswers(h, {
      'member.0.income.0.englobamento': true,
    })
    expect(result.members[0].incomes[0].englobamento).toBe(true)
  })

  it('applies multiple answers at once', () => {
    const h = makeHousehold({
      members: [
        makePerson({
          special_regimes: ['irs_jovem'],
          incomes: [makeIncome({ category: 'B', gross: 50000 })],
        }),
      ],
      dependents: [{ name: 'Child', birth_year: 2020 }],
    })
    const result = applyAnswers(h, {
      'member.0.birth_year': 1995,
      'member.0.irs_jovem_year': '2',
      'member.0.cat_b_start_year': '2023',
      'dependent.0.birth_year': 2023,
    })
    expect(result.members[0].birth_year).toBe(1995)
    expect(result.members[0].irs_jovem_year).toBe(2)
    expect(result.members[0].cat_b_start_year).toBe(2023)
    expect(result.dependents[0].birth_year).toBe(2023)
  })

  it('does not mutate the original household', () => {
    const h = makeHousehold()
    const original = JSON.stringify(h)
    applyAnswers(h, { 'member.0.birth_year': 1990 })
    expect(JSON.stringify(h)).toBe(original)
  })

  it('ignores answers for non-existent indices', () => {
    const h = makeHousehold()
    // member.5 doesn't exist
    const result = applyAnswers(h, { 'member.5.birth_year': 1990 })
    expect(result.members).toHaveLength(1)
    expect(result.members[0].birth_year).toBeUndefined()
  })
})

// ─── hasMandatoryQuestions ───────────────────────────────────

describe('hasMandatoryQuestions', () => {
  it('returns true when critical questions exist', () => {
    const qs: MissingInputQuestion[] = [
      {
        id: 'test',
        section: 'taxpayer_info',
        label: 'Test',
        reason: 'Test',
        type: 'number',
        priority: 'critical',
        path: 'test',
      },
    ]
    expect(hasMandatoryQuestions(qs)).toBe(true)
  })

  it('returns true when important questions exist', () => {
    const qs: MissingInputQuestion[] = [
      {
        id: 'test',
        section: 'taxpayer_info',
        label: 'Test',
        reason: 'Test',
        type: 'number',
        priority: 'important',
        path: 'test',
      },
    ]
    expect(hasMandatoryQuestions(qs)).toBe(true)
  })

  it('returns false when only optional questions exist', () => {
    const qs: MissingInputQuestion[] = [
      {
        id: 'test',
        section: 'taxpayer_info',
        label: 'Test',
        reason: 'Test',
        type: 'number',
        priority: 'optional',
        path: 'test',
      },
    ]
    expect(hasMandatoryQuestions(qs)).toBe(false)
  })

  it('returns false for empty array', () => {
    expect(hasMandatoryQuestions([])).toBe(false)
  })
})

// ─── countUnansweredCritical ─────────────────────────────────

describe('countUnansweredCritical', () => {
  it('counts unanswered critical questions', () => {
    const qs: MissingInputQuestion[] = [
      {
        id: 'a',
        section: 'taxpayer_info',
        label: 'A',
        reason: '',
        type: 'number',
        priority: 'critical',
        path: 'a',
      },
      {
        id: 'b',
        section: 'taxpayer_info',
        label: 'B',
        reason: '',
        type: 'number',
        priority: 'critical',
        path: 'b',
      },
      {
        id: 'c',
        section: 'taxpayer_info',
        label: 'C',
        reason: '',
        type: 'number',
        priority: 'optional',
        path: 'c',
      },
    ]
    expect(countUnansweredCritical(qs, { a: 1990 })).toBe(1)
    expect(countUnansweredCritical(qs, {})).toBe(2)
    expect(countUnansweredCritical(qs, { a: 1990, b: 1985 })).toBe(0)
  })
})

// ─── validateAnswer ──────────────────────────────────────────

describe('validateAnswer', () => {
  const baseQuestion: MissingInputQuestion = {
    id: 'test',
    label: 'Test',
    type: 'number',
    section: 'taxpayer_info',
    priority: 'critical',
    reason: 'r',
    path: 'x',
  }

  it('returns null for question without validate function', () => {
    expect(validateAnswer(baseQuestion, 42)).toBeNull()
  })

  it('returns null for empty/undefined values (skips validation)', () => {
    const q = { ...baseQuestion, validate: () => 'error' }
    expect(validateAnswer(q, undefined)).toBeNull()
    expect(validateAnswer(q, '')).toBeNull()
  })

  it('returns error message from custom validate function', () => {
    const q = {
      ...baseQuestion,
      validate: (v: string | number | boolean) =>
        typeof v === 'number' && v < 1950 ? 'Ano inválido' : null,
    }
    expect(validateAnswer(q, 1940)).toBe('Ano inválido')
    expect(validateAnswer(q, 1990)).toBeNull()
  })

  it('returns null when validate returns null (valid)', () => {
    const q = { ...baseQuestion, validate: () => null }
    expect(validateAnswer(q, 'anything')).toBeNull()
  })
})

// ─── Question Validators ─────────────────────────────────────

describe('question validators', () => {
  const CURRENT_YEAR = new Date().getFullYear()

  describe('member birth_year', () => {
    function getBirthYearQuestion() {
      const h = makeHousehold({ members: [makePerson({ name: 'Ana' })] })
      const qs = identifyMissingInputs(h)
      return qs.find((q) => q.id === 'member.0.birth_year')!
    }

    it('has a validate function', () => {
      expect(getBirthYearQuestion().validate).toBeDefined()
    })

    it('accepts 1900', () => {
      expect(getBirthYearQuestion().validate!(1900)).toBeNull()
    })

    it('accepts current year', () => {
      expect(getBirthYearQuestion().validate!(CURRENT_YEAR)).toBeNull()
    })

    it('accepts typical birth year', () => {
      expect(getBirthYearQuestion().validate!(1990)).toBeNull()
    })

    it('rejects year before 1900', () => {
      expect(getBirthYearQuestion().validate!(1899)).toBe('Ano de nascimento inválido')
    })

    it('rejects year after current year', () => {
      expect(getBirthYearQuestion().validate!(CURRENT_YEAR + 1)).toBe('Ano de nascimento inválido')
    })

    it('handles string input', () => {
      expect(getBirthYearQuestion().validate!('1990')).toBeNull()
      expect(getBirthYearQuestion().validate!('1800')).toBe('Ano de nascimento inválido')
    })
  })

  describe('dependent birth_year', () => {
    function getDependentBirthYearQuestion() {
      const h = makeHousehold({
        dependents: [{ name: 'Filho', birth_year: 2020 }],
      })
      const qs = identifyMissingInputs(h)
      return qs.find((q) => q.id === 'dependent.0.birth_year')!
    }

    it('has a validate function', () => {
      expect(getDependentBirthYearQuestion().validate).toBeDefined()
    })

    it('accepts valid birth year', () => {
      expect(getDependentBirthYearQuestion().validate!(2020)).toBeNull()
      expect(getDependentBirthYearQuestion().validate!(1900)).toBeNull()
    })

    it('rejects invalid birth year', () => {
      expect(getDependentBirthYearQuestion().validate!(1899)).toBe('Ano de nascimento inválido')
      expect(getDependentBirthYearQuestion().validate!(CURRENT_YEAR + 1)).toBe(
        'Ano de nascimento inválido',
      )
    })
  })

  describe('first_work_year (IRS Jovem)', () => {
    function getFirstWorkYearQuestion(taxYear: number) {
      const h = makeHousehold({
        year: taxYear,
        members: [
          makePerson({
            name: 'João',
            birth_year: 2000,
            special_regimes: ['irs_jovem'],
            incomes: [makeIncome({ category: 'A', gross: 30000 })],
          }),
        ],
      })
      const qs = identifyMissingInputs(h)
      return qs.find((q) => q.id === 'member.0.first_work_year')!
    }

    it('asks first_work_year for 2025+ regime', () => {
      const q = getFirstWorkYearQuestion(2025)
      expect(q).toBeDefined()
      expect(q.type).toBe('year')
      expect(q.section).toBe('irs_jovem')
    })

    it('validates year range', () => {
      const q = getFirstWorkYearQuestion(2025)
      expect(q.validate!(2020)).toBeNull()
      expect(q.validate!(1800)).not.toBeNull()
    })

    it('no longer generates irs_jovem_year dropdown question', () => {
      const h = makeHousehold({
        year: 2025,
        members: [
          makePerson({
            name: 'João',
            birth_year: 2000,
            special_regimes: ['irs_jovem'],
            incomes: [makeIncome({ category: 'A', gross: 30000 })],
          }),
        ],
      })
      const qs = identifyMissingInputs(h)
      expect(qs.find((q) => q.id === 'member.0.irs_jovem_year')).toBeUndefined()
    })
  })

  describe('nhr_start_year', () => {
    function getNhrStartYearQuestion() {
      const h = makeHousehold({
        members: [
          makePerson({
            name: 'Maria',
            special_regimes: ['nhr'],
          }),
        ],
      })
      const qs = identifyMissingInputs(h)
      return qs.find((q) => q.id === 'member.0.nhr_start_year')!
    }

    it('has a validate function', () => {
      expect(getNhrStartYearQuestion().validate).toBeDefined()
    })

    it('accepts NHR inception year (2009)', () => {
      expect(getNhrStartYearQuestion().validate!(2009)).toBeNull()
    })

    it('accepts current year', () => {
      expect(getNhrStartYearQuestion().validate!(CURRENT_YEAR)).toBeNull()
    })

    it('rejects year before 2009', () => {
      expect(getNhrStartYearQuestion().validate!(2008)).toBe('Ano de início NHR inválido')
    })

    it('rejects year after current year', () => {
      expect(getNhrStartYearQuestion().validate!(CURRENT_YEAR + 1)).toBe(
        'Ano de início NHR inválido',
      )
    })

    it('handles string input', () => {
      expect(getNhrStartYearQuestion().validate!('2015')).toBeNull()
      expect(getNhrStartYearQuestion().validate!('2007')).toBe('Ano de início NHR inválido')
    })
  })

  describe('cat_b_start_year', () => {
    function getCatBStartYearQuestion() {
      const h = makeHousehold({
        members: [
          makePerson({
            name: 'Pedro',
            incomes: [makeIncome({ category: 'B', gross: 20000 })],
          }),
        ],
      })
      const qs = identifyMissingInputs(h)
      return qs.find((q) => q.id === 'member.0.cat_b_start_year')!
    }

    it('has a validate function', () => {
      expect(getCatBStartYearQuestion().validate).toBeDefined()
    })

    it('accepts valid years', () => {
      expect(getCatBStartYearQuestion().validate!(2025)).toBeNull()
      expect(getCatBStartYearQuestion().validate!(2020)).toBeNull()
      expect(getCatBStartYearQuestion().validate!(1990)).toBeNull()
      expect(getCatBStartYearQuestion().validate!('2023')).toBeNull()
    })

    it('rejects invalid years', () => {
      expect(getCatBStartYearQuestion().validate!(2026)).not.toBeNull()
      expect(getCatBStartYearQuestion().validate!(1989)).not.toBeNull()
    })
  })

  describe('rental_contract_duration', () => {
    function getRentalDurationQuestion() {
      const h = makeHousehold({
        members: [
          makePerson({
            name: 'Sofia',
            incomes: [makeIncome({ category: 'F', gross: 12000 })],
          }),
        ],
      })
      const qs = identifyMissingInputs(h)
      return qs.find((q) => q.id === 'member.0.income.0.rental_duration')!
    }

    it('has a validate function', () => {
      expect(getRentalDurationQuestion().validate).toBeDefined()
    })

    it('accepts value >= 1', () => {
      expect(getRentalDurationQuestion().validate!(2)).toBeNull()
      expect(getRentalDurationQuestion().validate!(5)).toBeNull()
      expect(getRentalDurationQuestion().validate!('10')).toBeNull()
    })

    it('accepts value 0 (no contract)', () => {
      expect(getRentalDurationQuestion().validate!(0)).toBeNull()
    })
  })

  // Feature 3: IRS Jovem proactive detection
  describe('IRS Jovem proactive detection', () => {
    it('asks first work year for ≤35 member without IRS Jovem (tax year ≥ 2025)', () => {
      const h = makeHousehold({
        year: 2025,
        members: [
          makePerson({
            name: 'Maria',
            birth_year: 1995, // age 30
            incomes: [makeIncome({ category: 'A', gross: 25000 })],
            special_regimes: [],
          }),
        ],
      })
      const qs = identifyMissingInputs(h)
      const q = qs.find((q) => q.id === 'member.0.first_work_year')
      expect(q).toBeDefined()
      expect(q!.section).toBe('irs_jovem')
      expect(q!.type).toBe('year')
      expect(q!.label).toContain('Maria')
    })

    it('asks degree year for ≤35 member without IRS Jovem (tax year ≤ 2024)', () => {
      const h = makeHousehold({
        year: 2024,
        members: [
          makePerson({
            name: 'João',
            birth_year: 1995, // age 29
            incomes: [makeIncome({ category: 'A', gross: 25000 })],
            special_regimes: [],
          }),
        ],
      })
      const qs = identifyMissingInputs(h)
      const q = qs.find((q) => q.id === 'member.0.degree_year')
      expect(q).toBeDefined()
      expect(q!.section).toBe('irs_jovem')
      expect(q!.type).toBe('year')
    })

    it('does not ask if member already has IRS Jovem', () => {
      const h = makeHousehold({
        year: 2025,
        members: [
          makePerson({
            name: 'Maria',
            birth_year: 1995,
            incomes: [makeIncome({ category: 'A', gross: 25000 })],
            special_regimes: ['irs_jovem'],
            irs_jovem_year: 2,
          }),
        ],
      })
      const qs = identifyMissingInputs(h)
      expect(qs.find((q) => q.id === 'member.0.first_work_year')).toBeUndefined()
    })

    it('does not ask if member is over 35', () => {
      const h = makeHousehold({
        year: 2025,
        members: [
          makePerson({
            name: 'Maria',
            birth_year: 1980, // age 45
            incomes: [makeIncome({ category: 'A', gross: 25000 })],
            special_regimes: [],
          }),
        ],
      })
      const qs = identifyMissingInputs(h)
      expect(qs.find((q) => q.id === 'member.0.first_work_year')).toBeUndefined()
    })

    it('does not ask if member has no birth year', () => {
      const h = makeHousehold({
        year: 2025,
        members: [
          makePerson({
            name: 'Maria',
            incomes: [makeIncome({ category: 'A', gross: 25000 })],
            special_regimes: [],
          }),
        ],
      })
      const qs = identifyMissingInputs(h)
      expect(qs.find((q) => q.id === 'member.0.first_work_year')).toBeUndefined()
    })

    it('does not ask if member has no Cat A or Cat B income', () => {
      const h = makeHousehold({
        year: 2025,
        members: [
          makePerson({
            name: 'Maria',
            birth_year: 1995,
            incomes: [makeIncome({ category: 'F', gross: 10000 })],
            special_regimes: [],
          }),
        ],
      })
      const qs = identifyMissingInputs(h)
      expect(qs.find((q) => q.id === 'member.0.first_work_year')).toBeUndefined()
    })

    it('asks for Cat B income too', () => {
      const h = makeHousehold({
        year: 2025,
        members: [
          makePerson({
            name: 'Pedro',
            birth_year: 1998,
            incomes: [makeIncome({ category: 'B', gross: 20000 })],
            special_regimes: [],
          }),
        ],
      })
      const qs = identifyMissingInputs(h)
      expect(qs.find((q) => q.id === 'member.0.first_work_year')).toBeDefined()
    })
  })

  // Feature 3 continued: applyAnswers for IRS Jovem detection
  describe('applyAnswers — IRS Jovem detection', () => {
    it('enables IRS Jovem when first work year makes member eligible (≥2025)', () => {
      const h = makeHousehold({
        year: 2025,
        members: [
          makePerson({
            name: 'Maria',
            birth_year: 1995,
            incomes: [makeIncome({ category: 'A', gross: 25000 })],
            special_regimes: [],
          }),
        ],
      })
      const updated = applyAnswers(h, { 'member.0.first_work_year': 2023 })
      expect(updated.members[0].special_regimes).toContain('irs_jovem')
      expect(updated.members[0].irs_jovem_year).toBe(3) // 2025 - 2023 + 1
    })

    it('enables IRS Jovem when degree year makes member eligible (≤2024)', () => {
      const h = makeHousehold({
        year: 2024,
        members: [
          makePerson({
            name: 'João',
            birth_year: 1995,
            incomes: [makeIncome({ category: 'A', gross: 25000 })],
            special_regimes: [],
          }),
        ],
      })
      const updated = applyAnswers(h, { 'member.0.degree_year': 2022 })
      expect(updated.members[0].special_regimes).toContain('irs_jovem')
      expect(updated.members[0].irs_jovem_year).toBe(2) // 2024 - 2022
    })

    it('does not enable IRS Jovem when first work year is too old', () => {
      const h = makeHousehold({
        year: 2025,
        members: [
          makePerson({
            name: 'Maria',
            birth_year: 1995,
            incomes: [makeIncome({ category: 'A', gross: 25000 })],
            special_regimes: [],
          }),
        ],
      })
      const updated = applyAnswers(h, { 'member.0.first_work_year': 2010 })
      expect(updated.members[0].special_regimes).not.toContain('irs_jovem')
    })

    it('does not enable IRS Jovem when degree year is too old (≤2024)', () => {
      const h = makeHousehold({
        year: 2024,
        members: [
          makePerson({
            name: 'João',
            birth_year: 1995,
            incomes: [makeIncome({ category: 'A', gross: 25000 })],
            special_regimes: [],
          }),
        ],
      })
      const updated = applyAnswers(h, { 'member.0.degree_year': 2015 })
      expect(updated.members[0].special_regimes).not.toContain('irs_jovem')
    })
  })

  // Feature: Dynamic question accumulation
  // Simulates the questionnaire flow: answering birth_year should trigger IRS Jovem questions
  describe('dynamic question accumulation via applyAnswers → identifyMissingInputs', () => {
    it('answering birth_year (≤35) triggers IRS Jovem first_work_year question (≥2025)', () => {
      // Initial: no birth_year → no IRS Jovem question
      const h = makeHousehold({
        year: 2025,
        members: [
          makePerson({
            name: 'Rui',
            incomes: [makeIncome({ category: 'A', gross: 30000 })],
            special_regimes: [],
            // birth_year intentionally omitted (undefined from XML parser)
          }),
        ],
      })
      const initialQs = identifyMissingInputs(h)
      expect(initialQs.find((q) => q.id === 'member.0.birth_year')).toBeDefined()
      expect(initialQs.find((q) => q.id === 'member.0.first_work_year')).toBeUndefined()

      // User answers birth_year = 1995 (age 30, ≤35)
      const liveHousehold = applyAnswers(h, { 'member.0.birth_year': 1995 })
      const liveQs = identifyMissingInputs(liveHousehold)

      // Now IRS Jovem question should appear
      expect(liveQs.find((q) => q.id === 'member.0.birth_year')).toBeUndefined() // already answered
      expect(liveQs.find((q) => q.id === 'member.0.first_work_year')).toBeDefined()
    })

    it('answering birth_year (>35) does NOT trigger IRS Jovem question', () => {
      const h = makeHousehold({
        year: 2025,
        members: [
          makePerson({
            name: 'Velho',
            incomes: [makeIncome({ category: 'A', gross: 30000 })],
            special_regimes: [],
          }),
        ],
      })
      const liveHousehold = applyAnswers(h, { 'member.0.birth_year': 1980 })
      const liveQs = identifyMissingInputs(liveHousehold)
      expect(liveQs.find((q) => q.id === 'member.0.first_work_year')).toBeUndefined()
    })

    it('answering birth_year (≤35) triggers degree_year question for pre-2025 years', () => {
      const h = makeHousehold({
        year: 2024,
        members: [
          makePerson({
            name: 'Ana',
            incomes: [makeIncome({ category: 'A', gross: 20000 })],
            special_regimes: [],
          }),
        ],
      })
      const initialQs = identifyMissingInputs(h)
      expect(initialQs.find((q) => q.id === 'member.0.degree_year')).toBeUndefined()

      const liveHousehold = applyAnswers(h, { 'member.0.birth_year': 1996 })
      const liveQs = identifyMissingInputs(liveHousehold)
      expect(liveQs.find((q) => q.id === 'member.0.degree_year')).toBeDefined()
    })

    it('accumulation preserves initial questions and adds new ones', () => {
      const h = makeHousehold({
        year: 2025,
        members: [
          makePerson({
            name: 'Rui',
            incomes: [makeIncome({ category: 'A', gross: 30000 })],
            special_regimes: [],
          }),
        ],
      })
      const initialQs = identifyMissingInputs(h)
      const initialIds = new Set(initialQs.map((q) => q.id))

      // Apply birth_year answer
      const liveHousehold = applyAnswers(h, { 'member.0.birth_year': 1995 })
      const liveQs = identifyMissingInputs(liveHousehold)
      const liveIds = new Set(liveQs.map((q) => q.id))

      // Union: all initial IDs + any new live IDs should be present
      const unionIds = new Set([...initialIds, ...liveIds])
      expect(unionIds.has('member.0.birth_year')).toBe(true) // from initial
      expect(unionIds.has('member.0.first_work_year')).toBe(true) // from live (new)
    })
  })

  // Bug fix: IRS Jovem benefit year NOT asked when member is > 35 and unconfirmed
  describe('IRS Jovem age-based verification', () => {
    it('does not ask benefit year for member > 35 with unconfirmed irs_jovem', () => {
      const h = makeHousehold({
        year: 2025,
        members: [
          makePerson({
            name: 'Micha',
            birth_year: 1989, // age 36
            incomes: [makeIncome({ category: 'A', gross: 30000 })],
            special_regimes: ['irs_jovem'], // from XML code 417
            // irs_jovem_year intentionally NOT set
          }),
        ],
      })
      const qs = identifyMissingInputs(h)
      // Should NOT ask irs_jovem_year (unconfirmed, age > 35)
      expect(qs.find((q) => q.id === 'member.0.irs_jovem_year')).toBeUndefined()
      // Should ask first_work_year to verify eligibility instead
      expect(qs.find((q) => q.id === 'member.0.first_work_year')).toBeDefined()
    })

    it('asks first_work_year for member ≤ 35 with irs_jovem from XML', () => {
      const h = makeHousehold({
        year: 2025,
        members: [
          makePerson({
            name: 'João',
            birth_year: 1995, // age 30
            incomes: [makeIncome({ category: 'A', gross: 30000 })],
            special_regimes: ['irs_jovem'],
          }),
        ],
      })
      const qs = identifyMissingInputs(h)
      // No dropdown, but should ask first_work_year
      expect(qs.find((q) => q.id === 'member.0.irs_jovem_year')).toBeUndefined()
      expect(qs.find((q) => q.id === 'member.0.first_work_year')).toBeDefined()
    })

    it('shows first_work_year with currentValue for member > 35 with confirmed irs_jovem_first_work_year', () => {
      const h = makeHousehold({
        year: 2025,
        members: [
          makePerson({
            name: 'Micha',
            birth_year: 1989, // age 36
            incomes: [makeIncome({ category: 'A', gross: 30000 })],
            special_regimes: ['irs_jovem'],
            irs_jovem_first_work_year: 2023,
          }),
        ],
      })
      const qs = identifyMissingInputs(h)
      const q = qs.find((q) => q.id === 'member.0.first_work_year')
      expect(q).toBeDefined()
      expect(q!.currentValue).toBe(2023)
    })

    it('asks first_work_year for member with unconfirmed XML irs_jovem and age ≤ 44', () => {
      const h = makeHousehold({
        year: 2025,
        members: [
          makePerson({
            name: 'Pedro',
            birth_year: 1985, // age 40 — could have started at 35
            incomes: [makeIncome({ category: 'A', gross: 30000 })],
            special_regimes: ['irs_jovem'],
          }),
        ],
      })
      const qs = identifyMissingInputs(h)
      expect(qs.find((q) => q.id === 'member.0.irs_jovem_year')).toBeUndefined()
      expect(qs.find((q) => q.id === 'member.0.first_work_year')).toBeDefined()
    })

    it('does not ask anything for member > 44 with unconfirmed irs_jovem', () => {
      const h = makeHousehold({
        year: 2025,
        members: [
          makePerson({
            name: 'Avô',
            birth_year: 1975, // age 50 — definitely past eligibility
            incomes: [makeIncome({ category: 'A', gross: 30000 })],
            special_regimes: ['irs_jovem'],
          }),
        ],
      })
      const qs = identifyMissingInputs(h)
      expect(qs.find((q) => q.id === 'member.0.irs_jovem_year')).toBeUndefined()
      expect(qs.find((q) => q.id === 'member.0.first_work_year')).toBeUndefined()
    })
  })

  // Bug fix: first_work_year question must persist after applyAnswers sets irs_jovem_year
  describe('IRS Jovem question persistence after applyAnswers', () => {
    it('first_work_year question survives applyAnswers setting irs_jovem + irs_jovem_year', () => {
      // Simulates the questionnaire flow: user types "2021" in first_work_year input
      const h = makeHousehold({
        year: 2025,
        members: [
          makePerson({
            name: 'Rui',
            birth_year: 1993,
            incomes: [makeIncome({ category: 'A', gross: 50000 })],
            special_regimes: [],
          }),
        ],
      })
      // Initial: question exists
      const initialQs = identifyMissingInputs(h)
      expect(initialQs.find((q) => q.id === 'member.0.first_work_year')).toBeDefined()

      // After applyAnswers: irs_jovem + irs_jovem_year are set
      const applied = applyAnswers(h, { 'member.0.first_work_year': 2021 })
      expect(applied.members[0].special_regimes).toContain('irs_jovem')
      expect(applied.members[0].irs_jovem_year).toBe(5)
      expect(applied.members[0].irs_jovem_first_work_year).toBe(2021)

      // Re-running identifyMissingInputs on the applied household:
      // question MUST still appear (with currentValue) so user can edit
      const liveQs = identifyMissingInputs(applied)
      const q = liveQs.find((q) => q.id === 'member.0.first_work_year')
      expect(q).toBeDefined()
      expect(q!.currentValue).toBe(2021)
    })

    it('legacy: skips question when irs_jovem_year set WITHOUT first_work_year', () => {
      // Legacy data: irs_jovem_year was set directly (e.g. from old dropdown)
      const h = makeHousehold({
        year: 2025,
        members: [
          makePerson({
            name: 'Maria',
            birth_year: 1995,
            incomes: [makeIncome({ category: 'A', gross: 25000 })],
            special_regimes: ['irs_jovem'],
            irs_jovem_year: 2,
            // irs_jovem_first_work_year NOT set
          }),
        ],
      })
      const qs = identifyMissingInputs(h)
      expect(qs.find((q) => q.id === 'member.0.first_work_year')).toBeUndefined()
    })
  })

  // Cross-year question generation: when households span both sides of 2025,
  // both IRS Jovem question types should be generated.
  describe('cross-year IRS Jovem questions', () => {
    it('asks both first_work_year AND degree_year when primary is 2025 with 2024 previous', () => {
      const primary = makeHousehold({
        year: 2025,
        members: [
          makePerson({
            name: 'Rui',
            birth_year: 1993,
            incomes: [makeIncome({ category: 'A', gross: 50000 })],
          }),
        ],
      })
      const prev2024 = makeHousehold({
        year: 2024,
        members: [
          makePerson({
            name: 'Rui',
            birth_year: 1993,
            incomes: [makeIncome({ category: 'A', gross: 45000 })],
          }),
        ],
      })

      const qs = identifyMissingInputs(primary, [prev2024])
      expect(qs.find((q) => q.id === 'member.0.first_work_year')).toBeDefined()
      expect(qs.find((q) => q.id === 'member.0.degree_year')).toBeDefined()
    })

    it('asks both questions when primary is 2024 with 2025 previous', () => {
      const primary = makeHousehold({
        year: 2024,
        members: [
          makePerson({
            name: 'Ana',
            birth_year: 1995,
            incomes: [makeIncome({ category: 'A', gross: 30000 })],
          }),
        ],
      })
      const prev2025 = makeHousehold({
        year: 2025,
        members: [
          makePerson({
            name: 'Ana',
            birth_year: 1995,
            incomes: [makeIncome({ category: 'A', gross: 32000 })],
          }),
        ],
      })

      const qs = identifyMissingInputs(primary, [prev2025])
      expect(qs.find((q) => q.id === 'member.0.first_work_year')).toBeDefined()
      expect(qs.find((q) => q.id === 'member.0.degree_year')).toBeDefined()
    })

    it('only asks first_work_year when all years are >= 2025', () => {
      const primary = makeHousehold({
        year: 2026,
        members: [
          makePerson({
            name: 'João',
            birth_year: 1996,
            incomes: [makeIncome({ category: 'A', gross: 25000 })],
          }),
        ],
      })
      const prev2025 = makeHousehold({
        year: 2025,
        members: [
          makePerson({
            name: 'João',
            birth_year: 1996,
            incomes: [makeIncome({ category: 'A', gross: 24000 })],
          }),
        ],
      })

      const qs = identifyMissingInputs(primary, [prev2025])
      expect(qs.find((q) => q.id === 'member.0.first_work_year')).toBeDefined()
      expect(qs.find((q) => q.id === 'member.0.degree_year')).toBeUndefined()
    })

    it('probes IRS Jovem when member has Cat A/B only in other-year household', () => {
      const primary = makeHousehold({
        year: 2025,
        members: [
          makePerson({
            name: 'Maria',
            birth_year: 1995,
            incomes: [], // No income in 2025
          }),
        ],
      })
      const prev2024 = makeHousehold({
        year: 2024,
        members: [
          makePerson({
            name: 'Maria',
            birth_year: 1995,
            incomes: [makeIncome({ category: 'A', gross: 20000 })],
          }),
        ],
      })

      const qs = identifyMissingInputs(primary, [prev2024])
      // Should still ask because 2024 member has Cat A income
      expect(qs.find((q) => q.id === 'member.0.first_work_year')).toBeDefined()
      expect(qs.find((q) => q.id === 'member.0.degree_year')).toBeDefined()
    })
  })

  // Cross-year NHR: nhr_start_year asked when NHR present in any year
  describe('cross-year NHR questions', () => {
    it('asks nhr_start_year when NHR is only in other-year household', () => {
      const primary = makeHousehold({
        year: 2025,
        members: [
          makePerson({
            name: 'Micha',
            birth_year: 1990,
            incomes: [makeIncome({ category: 'A', gross: 40000 })],
            special_regimes: [], // No NHR in 2025
          }),
        ],
      })
      const prev2024 = makeHousehold({
        year: 2024,
        members: [
          makePerson({
            name: 'Micha',
            birth_year: 1990,
            incomes: [makeIncome({ category: 'A', gross: 40000 })],
            special_regimes: ['nhr'],
            nhr_confirmed: true,
          }),
        ],
      })

      const qs = identifyMissingInputs(primary, [prev2024])
      expect(qs.find((q) => q.id === 'member.0.nhr_start_year')).toBeDefined()
    })

    it('does not ask nhr_start_year when already set', () => {
      const primary = makeHousehold({
        year: 2025,
        members: [
          makePerson({
            name: 'Micha',
            birth_year: 1990,
            incomes: [makeIncome({ category: 'A', gross: 40000 })],
            special_regimes: [],
            nhr_start_year: 2019,
          }),
        ],
      })
      const prev2024 = makeHousehold({
        year: 2024,
        members: [
          makePerson({
            name: 'Micha',
            special_regimes: ['nhr'],
          }),
        ],
      })

      const qs = identifyMissingInputs(primary, [prev2024])
      expect(qs.find((q) => q.id === 'member.0.nhr_start_year')).toBeUndefined()
    })
  })

  describe('applyAnswers preserves cat_b_start_year', () => {
    it('preserves cat_b_start_year through applyAnswers', () => {
      const h = makeHousehold({
        members: [
          makePerson({
            incomes: [makeIncome({ category: 'B', gross: 20000 })],
          }),
        ],
      })
      const updated = applyAnswers(h, {
        'member.0.cat_b_start_year': '2023',
      })
      expect(updated.members[0].cat_b_start_year).toBe(2023)
    })

    it('round-trips cat_b_start_year through identifyMissingInputs', () => {
      const h = makeHousehold({
        members: [
          makePerson({
            cat_b_start_year: 2023,
            incomes: [makeIncome({ category: 'B', gross: 20000 })],
          }),
        ],
      })
      const qs = identifyMissingInputs(h)
      const q = qs.find((q) => q.id === 'member.0.cat_b_start_year')
      expect(q).toBeDefined()
      expect(q!.currentValue).toBe('2023')
      expect(q!.priority).toBe('optional') // already answered
    })

    it('round-trips rental_contract_duration = 0 through identifyMissingInputs', () => {
      const h = makeHousehold({
        members: [
          makePerson({
            incomes: [makeIncome({ category: 'F', gross: 10000, rental_contract_duration: 0 })],
          }),
        ],
      })
      const qs = identifyMissingInputs(h)
      const q = qs.find((q) => q.id === 'member.0.income.0.rental_duration')
      expect(q).toBeDefined()
      expect(q!.currentValue).toBe('0')
      expect(q!.priority).toBe('optional')
    })
  })
})
