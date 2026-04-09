import { describe, it, expect } from 'vitest'
import type { Household, Person } from '@/lib/tax/types'
import { propagateSharedData, findMatchingMember } from '@/lib/tax/propagate-shared-data'

function makePerson(name: string, overrides: Partial<Person> = {}): Person {
  return {
    name,
    incomes: [],
    deductions: [],
    special_regimes: [],
    ...overrides,
  }
}

function makeHousehold(
  year: number,
  members: Person[],
  overrides: Partial<Household> = {},
): Household {
  return {
    year,
    filing_status: 'married_joint',
    members,
    dependents: [],
    ...overrides,
  }
}

// ─── findMatchingMember ───────────────────────────────────────

describe('findMatchingMember', () => {
  it('matches by NIF (exact)', () => {
    const member = makePerson('Rui', { nif: '111' })
    const others = [makePerson('RUI MIGUEL', { nif: '111' }), makePerson('Micha', { nif: '222' })]
    expect(findMatchingMember(member, others)).toBe(others[0])
  })

  it('matches by name (case-insensitive) when no NIF', () => {
    const member = makePerson('Rui')
    const others = [makePerson('RUI'), makePerson('Micha')]
    expect(findMatchingMember(member, others)).toBe(others[0])
  })

  it('prefers NIF over name', () => {
    const member = makePerson('Rui', { nif: '111' })
    const others = [
      makePerson('Rui', { nif: '999' }), // name matches but NIF doesn't
      makePerson('Different Name', { nif: '111' }), // NIF matches
    ]
    expect(findMatchingMember(member, others)).toBe(others[1])
  })

  it('returns undefined when no NIF or name match', () => {
    const member = makePerson('Charlie', { nif: '333' })
    const others = [makePerson('Rui', { nif: '111' }), makePerson('Micha', { nif: '222' })]
    expect(findMatchingMember(member, others)).toBeUndefined()
  })

  it('returns undefined for empty others list', () => {
    const member = makePerson('Rui', { nif: '111' })
    expect(findMatchingMember(member, [])).toBeUndefined()
  })

  it('returns undefined when member has no NIF and no name', () => {
    const member: Person = {
      name: '',
      incomes: [],
      deductions: [],
      special_regimes: [],
    }
    const others = [makePerson('Rui', { nif: '111' })]
    expect(findMatchingMember(member, others)).toBeUndefined()
  })
})

// ─── propagateSharedData ──────────────────────────────────────

describe('propagateSharedData', () => {
  it('propagates birth_year from primary to target by NIF', () => {
    const primary = makeHousehold(2025, [
      makePerson('Rui', { nif: '111', birth_year: 1990 }),
      makePerson('Micha', { nif: '222', birth_year: 1992 }),
    ])
    const target = makeHousehold(2023, [
      makePerson('RUI MIGUEL', { nif: '111' }),
      makePerson('Titular B', { nif: '222' }),
    ])

    const result = propagateSharedData(primary, target)
    expect(result.members[0].birth_year).toBe(1990)
    expect(result.members[1].birth_year).toBe(1992)
  })

  it('propagates name from primary to target by NIF', () => {
    const primary = makeHousehold(2025, [
      makePerson('Rui', { nif: '111' }),
      makePerson('Micha', { nif: '222' }),
    ])
    const target = makeHousehold(2023, [
      makePerson('RUI MIGUEL FERREIRA', { nif: '111' }),
      makePerson('Titular B (123456789)', { nif: '222' }),
    ])

    const result = propagateSharedData(primary, target)
    expect(result.members[0].name).toBe('Rui')
    expect(result.members[1].name).toBe('Micha')
  })

  it('propagates by name when NIFs match', () => {
    const primary = makeHousehold(2025, [
      makePerson('Rui', { birth_year: 1990 }),
      makePerson('Micha', { birth_year: 1992 }),
    ])
    const target = makeHousehold(2023, [makePerson('Rui'), makePerson('Micha')])

    const result = propagateSharedData(primary, target)
    expect(result.members[0].birth_year).toBe(1990)
    expect(result.members[1].birth_year).toBe(1992)
  })

  it('does not propagate to unmatched members', () => {
    const primary = makeHousehold(2025, [
      makePerson('Rui', { nif: '111', birth_year: 1990 }),
      makePerson('Micha', { nif: '222', birth_year: 1992 }),
    ])
    // Target has a member that doesn't exist in primary
    const target = makeHousehold(2023, [
      makePerson('RUI MIGUEL', { nif: '111' }),
      makePerson('Charlie', { nif: '333' }),
    ])

    const result = propagateSharedData(primary, target)
    expect(result.members[0].birth_year).toBe(1990)
    // Charlie has no match → keeps own data
    expect(result.members[1].name).toBe('Charlie')
    expect(result.members[1].nif).toBe('333')
    expect(result.members[1].birth_year).toBeUndefined()
  })

  it('handles target with fewer members than primary', () => {
    const primary = makeHousehold(2025, [
      makePerson('Rui', { nif: '111' }),
      makePerson('Micha', { nif: '222' }),
    ])
    const target = makeHousehold(2023, [makePerson('Rui', { nif: '111' })], {
      filing_status: 'single',
    })

    const result = propagateSharedData(primary, target)
    expect(result.members).toHaveLength(1)
    expect(result.members[0].name).toBe('Rui')
  })

  it('handles target with more members than primary (single→married)', () => {
    const primary = makeHousehold(2024, [makePerson('Alice', { nif: '111', birth_year: 1990 })], {
      filing_status: 'single',
    })
    const target = makeHousehold(2025, [
      makePerson('Alice', { nif: '111' }),
      makePerson('Bob', { nif: '222', birth_year: 1988 }),
    ])

    const result = propagateSharedData(primary, target)
    expect(result.members).toHaveLength(2)
    expect(result.members[0].birth_year).toBe(1990) // Alice matched
    expect(result.members[1].name).toBe('Bob') // Bob unmatched, kept as-is
    expect(result.members[1].birth_year).toBe(1988)
  })

  it('preserves target-specific data (incomes, deductions)', () => {
    const primary = makeHousehold(2025, [makePerson('Rui', { nif: '111', birth_year: 1990 })])
    const target = makeHousehold(2023, [
      makePerson('Rui', {
        nif: '111',
        incomes: [{ category: 'A', gross: 30000 }],
        deductions: [{ category: 'general', amount: 250 }],
      }),
    ])

    const result = propagateSharedData(primary, target)
    expect(result.members[0].incomes).toHaveLength(1)
    expect(result.members[0].incomes[0].gross).toBe(30000)
    expect(result.members[0].deductions).toHaveLength(1)
  })

  it('propagates nhr_start_year from primary', () => {
    const primary = makeHousehold(2025, [makePerson('Rui', { nif: '111', nhr_start_year: 2020 })])
    const target = makeHousehold(2023, [makePerson('Rui', { nif: '111' })])

    const result = propagateSharedData(primary, target)
    expect(result.members[0].nhr_start_year).toBe(2020)
  })

  it('keeps target nhr_confirmed — does not inherit from primary', () => {
    const primary = makeHousehold(2025, [makePerson('Rui', { nif: '111', nhr_confirmed: true })])
    const target = makeHousehold(2023, [makePerson('Rui', { nif: '111' })])

    const result = propagateSharedData(primary, target)
    expect(result.members[0].nhr_confirmed).toBeUndefined()
  })

  it('propagates dependent birth_year by name match', () => {
    const primary = makeHousehold(2025, [makePerson('Rui', { nif: '111' })], {
      dependents: [{ name: 'Sofia', birth_year: 2020 }],
    })
    const target = makeHousehold(2023, [makePerson('Rui', { nif: '111' })], {
      dependents: [{ name: 'Sofia', birth_year: undefined as unknown as number }],
    })

    const result = propagateSharedData(primary, target)
    expect(result.dependents[0].birth_year).toBe(2020)
  })

  it('does not propagate dependent data when names differ', () => {
    const primary = makeHousehold(2025, [makePerson('Rui', { nif: '111' })], {
      dependents: [{ name: 'Sofia', birth_year: 2020 }],
    })
    const target = makeHousehold(2024, [makePerson('Rui', { nif: '111' })], {
      dependents: [{ name: 'Tomás', birth_year: 2023 }],
    })

    const result = propagateSharedData(primary, target)
    expect(result.dependents[0].name).toBe('Tomás')
    expect(result.dependents[0].birth_year).toBe(2023)
  })

  it('handles different dependent counts across years (new child)', () => {
    const primary = makeHousehold(2025, [makePerson('Rui', { nif: '111' })], {
      dependents: [
        { name: 'Sofia', birth_year: 2020 },
        { name: 'Tomás', birth_year: 2024 },
      ],
    })
    const target = makeHousehold(2023, [makePerson('Rui', { nif: '111' })], {
      dependents: [{ name: 'Sofia', birth_year: undefined as unknown as number }],
    })

    const result = propagateSharedData(primary, target)
    expect(result.dependents).toHaveLength(1) // target's own count preserved
    expect(result.dependents[0].birth_year).toBe(2020) // matched by name
  })

  it('preserves target special_regimes — does not inherit from primary', () => {
    const primary = makeHousehold(2025, [
      makePerson('Rui', { nif: '111', special_regimes: ['irs_jovem'] }),
    ])
    const target = makeHousehold(2023, [
      makePerson('Rui', { nif: '111', special_regimes: ['nhr'] }),
    ])

    const result = propagateSharedData(primary, target)
    expect(result.members[0].special_regimes).toEqual(['nhr'])
  })

  it('does not copy primary special_regimes to target (year-specific)', () => {
    const primary = makeHousehold(2025, [
      makePerson('Rui', { nif: '111', special_regimes: ['irs_jovem'] }),
    ])
    const target = makeHousehold(2023, [makePerson('Rui', { nif: '111' })])

    const result = propagateSharedData(primary, target)
    expect(result.members[0].special_regimes).toEqual([])
  })

  it('matches by NIF when member order differs between primary and target', () => {
    const primary = makeHousehold(2025, [
      makePerson('Rui', { nif: '111', birth_year: 1990 }),
      makePerson('Micha', { nif: '222', birth_year: 1992 }),
    ])
    const target = makeHousehold(2023, [
      makePerson('CONTRIBUINTE EXEMPLO B', {
        nif: '222',
        incomes: [{ category: 'A', gross: 25000 }],
      }),
      makePerson('Titular B (111)', {
        nif: '111',
        incomes: [{ category: 'A', gross: 35000 }],
      }),
    ])

    const result = propagateSharedData(primary, target)
    expect(result.members[0].name).toBe('Micha')
    expect(result.members[0].birth_year).toBe(1992)
    expect(result.members[0].incomes[0].gross).toBe(25000)
    expect(result.members[1].name).toBe('Rui')
    expect(result.members[1].birth_year).toBe(1990)
    expect(result.members[1].incomes[0].gross).toBe(35000)
  })

  it('does not propagate when no NIF or name match (no position fallback)', () => {
    const primary = makeHousehold(2025, [
      makePerson('Rui', { birth_year: 1990 }),
      makePerson('Micha', { birth_year: 1992 }),
    ])
    // Target names differ and no NIFs → no match possible
    const target = makeHousehold(2023, [makePerson('RUI MIGUEL'), makePerson('Titular B (123)')])

    const result = propagateSharedData(primary, target)
    // No propagation: target data preserved as-is
    expect(result.members[0].name).toBe('RUI MIGUEL')
    expect(result.members[0].birth_year).toBeUndefined()
    expect(result.members[1].name).toBe('Titular B (123)')
    expect(result.members[1].birth_year).toBeUndefined()
  })

  it('propagates NIF from primary to target', () => {
    const primary = makeHousehold(2025, [makePerson('Rui', { nif: '111' })])
    const target = makeHousehold(2023, [makePerson('Rui')])

    const result = propagateSharedData(primary, target)
    expect(result.members[0].nif).toBe('111')
  })

  it('does not cross-contaminate NHR when member order differs and NIF unavailable', () => {
    const primary = makeHousehold(2025, [
      makePerson('Rui', { nif: '111', special_regimes: [] }),
      makePerson('Micha', { nif: '222', special_regimes: ['nhr'], nhr_confirmed: true }),
    ])
    const target = makeHousehold(2024, [
      makePerson('Micha', {
        nif: '222',
        special_regimes: ['nhr'],
        nhr_confirmed: true,
      }),
      makePerson('Rui', {
        // nif missing but name matches
        special_regimes: [],
      }),
    ])

    const result = propagateSharedData(primary, target)
    expect(result.members[1].special_regimes).toEqual([])
    expect(result.members[1].nhr_confirmed).toBeUndefined()
  })

  it('propagates irs_jovem_first_work_year from primary to target', () => {
    const primary = makeHousehold(2025, [
      makePerson('Rui', { nif: '111', irs_jovem_first_work_year: 2020 }),
    ])
    const target = makeHousehold(2023, [makePerson('Rui', { nif: '111' })])

    const result = propagateSharedData(primary, target)
    expect(result.members[0].irs_jovem_first_work_year).toBe(2020)
  })

  it('skips dependent propagation when dependent has no name and no birth_year', () => {
    const primary = makeHousehold(2025, [makePerson('Rui', { nif: '111' })], {
      dependents: [{ name: 'Sofia', birth_year: 2020 }],
    })
    const target = makeHousehold(2024, [makePerson('Rui', { nif: '111' })], {
      dependents: [
        { name: undefined as unknown as string, birth_year: undefined as unknown as number },
      ],
    })

    const result = propagateSharedData(primary, target)
    // No name or birth_year → findMatchingDependent returns undefined → keeps as-is
    expect(result.dependents[0].name).toBeUndefined()
    expect(result.dependents[0].birth_year).toBeUndefined()
  })

  // Divorce/remarriage: different spouse across years
  it('handles spouse change across years (remarriage)', () => {
    const primary = makeHousehold(2025, [
      makePerson('Alice', { nif: '111', birth_year: 1990 }),
      makePerson('Charlie', { nif: '333', birth_year: 1985, nhr_start_year: 2018 }),
    ])
    const target = makeHousehold(2024, [
      makePerson('Alice', { nif: '111' }),
      makePerson('Bob', { nif: '222', birth_year: 1988, nhr_start_year: 2019 }),
    ])

    const result = propagateSharedData(primary, target)
    expect(result.members[0].birth_year).toBe(1990) // Alice matched
    // Bob has no match in primary → keeps own data (not Charlie's)
    expect(result.members[1].name).toBe('Bob')
    expect(result.members[1].birth_year).toBe(1988)
    expect(result.members[1].nhr_start_year).toBe(2019) // Bob's own, not Charlie's
  })
})

// ─── IRS Jovem derivation during propagation ──────────────────

describe('IRS Jovem derivation', () => {
  it('derives irs_jovem eligibility for target year from first_work_year', () => {
    const primary = makeHousehold(2025, [
      makePerson('Ana', {
        nif: '111',
        irs_jovem_first_work_year: 2021,
        special_regimes: ['irs_jovem'],
        irs_jovem_year: 5,
      }),
    ])
    const target = makeHousehold(2024, [makePerson('Ana', { nif: '111' })])

    const result = propagateSharedData(primary, target)
    expect(result.members[0].special_regimes).toContain('irs_jovem')
    expect(result.members[0].irs_jovem_year).toBe(4) // 2024 - 2021 + 1
    expect(result.members[0].irs_jovem_first_work_year).toBe(2021)
  })

  it('does not add irs_jovem when benefit year exceeds max for that regime', () => {
    // Pre-2025 regime (2022-2024): maxBenefitYears = 5
    const primary = makeHousehold(2025, [
      makePerson('Ana', {
        nif: '111',
        irs_jovem_first_work_year: 2018,
        special_regimes: ['irs_jovem'],
        irs_jovem_year: 8,
      }),
    ])
    // 2024 regime: max 5 years. benefitYear = 2024 - 2018 + 1 = 7 → exceeds 5
    const target = makeHousehold(2024, [makePerson('Ana', { nif: '111' })])

    const result = propagateSharedData(primary, target)
    expect(result.members[0].special_regimes).not.toContain('irs_jovem')
    expect(result.members[0].irs_jovem_year).toBeUndefined()
  })

  it('does not add irs_jovem when benefit year is negative (before first work year)', () => {
    const primary = makeHousehold(2025, [
      makePerson('Ana', {
        nif: '111',
        irs_jovem_first_work_year: 2026,
        special_regimes: [],
      }),
    ])
    const target = makeHousehold(2024, [makePerson('Ana', { nif: '111' })])

    const result = propagateSharedData(primary, target)
    expect(result.members[0].special_regimes).not.toContain('irs_jovem')
  })

  it('does not duplicate irs_jovem if target already has it — preserves existing irs_jovem_year', () => {
    const primary = makeHousehold(2025, [
      makePerson('Ana', {
        nif: '111',
        irs_jovem_first_work_year: 2021,
        special_regimes: ['irs_jovem'],
      }),
    ])
    const target = makeHousehold(2024, [
      makePerson('Ana', {
        nif: '111',
        special_regimes: ['irs_jovem'],
        irs_jovem_year: 3, // XML-provided value
      }),
    ])

    const result = propagateSharedData(primary, target)
    const jovemCount = result.members[0].special_regimes.filter((r) => r === 'irs_jovem').length
    expect(jovemCount).toBe(1)
    // Preserves XML-provided value (3), does not overwrite with derived (4)
    expect(result.members[0].irs_jovem_year).toBe(3)
  })

  it('preserves other special_regimes when adding irs_jovem', () => {
    const primary = makeHousehold(2025, [
      makePerson('Ana', {
        nif: '111',
        irs_jovem_first_work_year: 2023,
        special_regimes: ['irs_jovem'],
      }),
    ])
    const target = makeHousehold(2024, [
      makePerson('Ana', {
        nif: '111',
        special_regimes: ['nhr'],
      }),
    ])

    const result = propagateSharedData(primary, target)
    expect(result.members[0].special_regimes).toContain('nhr')
    expect(result.members[0].special_regimes).toContain('irs_jovem')
    expect(result.members[0].irs_jovem_year).toBe(2) // 2024 - 2023 + 1
  })

  it('uses target member first_work_year when primary match has none', () => {
    const primary = makeHousehold(2025, [makePerson('Ana', { nif: '111' })])
    const target = makeHousehold(2024, [
      makePerson('Ana', {
        nif: '111',
        irs_jovem_first_work_year: 2022,
      }),
    ])

    const result = propagateSharedData(primary, target)
    expect(result.members[0].special_regimes).toContain('irs_jovem')
    expect(result.members[0].irs_jovem_year).toBe(3) // 2024 - 2022 + 1
  })

  it('handles 2025+ regime with 10-year max benefit', () => {
    const primary = makeHousehold(2026, [
      makePerson('Ana', {
        nif: '111',
        irs_jovem_first_work_year: 2018,
        special_regimes: ['irs_jovem'],
      }),
    ])
    // 2025 regime: max 10 years. benefitYear = 2025 - 2018 + 1 = 8 → within 10
    const target = makeHousehold(2025, [makePerson('Ana', { nif: '111' })])

    const result = propagateSharedData(primary, target)
    expect(result.members[0].special_regimes).toContain('irs_jovem')
    expect(result.members[0].irs_jovem_year).toBe(8)
  })

  it('skips derivation for members without first_work_year', () => {
    const primary = makeHousehold(2025, [
      makePerson('Ana', { nif: '111' }),
      makePerson('Bob', { nif: '222', irs_jovem_first_work_year: 2023 }),
    ])
    const target = makeHousehold(2024, [
      makePerson('Ana', { nif: '111' }),
      makePerson('Bob', { nif: '222' }),
    ])

    const result = propagateSharedData(primary, target)
    expect(result.members[0].special_regimes).not.toContain('irs_jovem')
    expect(result.members[1].special_regimes).toContain('irs_jovem')
    expect(result.members[1].irs_jovem_year).toBe(2)
  })

  it('does not activate IRS Jovem for pre-regime years (before 2021)', () => {
    const primary = makeHousehold(2025, [
      makePerson('Ana', {
        nif: '111',
        irs_jovem_first_work_year: 2019,
        special_regimes: ['irs_jovem'],
      }),
    ])
    const target = makeHousehold(2020, [makePerson('Ana', { nif: '111' })])

    const result = propagateSharedData(primary, target)
    // 2020 has no IRS Jovem regime → should not activate
    expect(result.members[0].special_regimes).not.toContain('irs_jovem')
    expect(result.members[0].irs_jovem_year).toBeUndefined()
  })
})
