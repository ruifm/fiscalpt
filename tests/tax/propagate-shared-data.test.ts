import { describe, it, expect } from 'vitest'
import type { Household, Person } from '@/lib/tax/types'
import { propagateSharedData } from '@/lib/tax/propagate-shared-data'

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

describe('propagateSharedData', () => {
  it('propagates birth_year from primary to target by position', () => {
    const primary = makeHousehold(2025, [
      makePerson('Rui', { birth_year: 1990 }),
      makePerson('Micha', { birth_year: 1992 }),
    ])
    const target = makeHousehold(2023, [
      makePerson('RUI MIGUEL FERREIRA', {}),
      makePerson('Titular B (123456789)', {}),
    ])

    const result = propagateSharedData(primary, target)
    expect(result.members[0].birth_year).toBe(1990)
    expect(result.members[1].birth_year).toBe(1992)
  })

  it('propagates name from primary to target by position', () => {
    const primary = makeHousehold(2025, [makePerson('Rui'), makePerson('Micha')])
    const target = makeHousehold(2023, [
      makePerson('RUI MIGUEL FERREIRA'),
      makePerson('Titular B (123456789)'),
    ])

    const result = propagateSharedData(primary, target)
    expect(result.members[0].name).toBe('Rui')
    expect(result.members[1].name).toBe('Micha')
  })

  it('does not propagate name when target has fewer members', () => {
    const primary = makeHousehold(2025, [makePerson('Rui'), makePerson('Micha')])
    const target = makeHousehold(2023, [makePerson('RUI MIGUEL')], {
      filing_status: 'single',
    })

    const result = propagateSharedData(primary, target)
    expect(result.members).toHaveLength(1)
    expect(result.members[0].name).toBe('Rui')
  })

  it('preserves target-specific data (incomes, deductions)', () => {
    const primary = makeHousehold(2025, [makePerson('Rui', { birth_year: 1990 })])
    const target = makeHousehold(2023, [
      makePerson('RUI MIGUEL', {
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
    const primary = makeHousehold(2025, [makePerson('Rui', { nhr_start_year: 2020 })])
    const target = makeHousehold(2023, [makePerson('RUI MIGUEL')])

    const result = propagateSharedData(primary, target)
    expect(result.members[0].nhr_start_year).toBe(2020)
  })

  it('keeps target nhr_confirmed if set', () => {
    const primary = makeHousehold(2025, [makePerson('Rui')])
    const target = makeHousehold(2023, [makePerson('RUI MIGUEL', { nhr_confirmed: true })])

    const result = propagateSharedData(primary, target)
    expect(result.members[0].nhr_confirmed).toBe(true)
  })

  it('propagates dependent birth_year by position', () => {
    const primary = makeHousehold(2025, [makePerson('Rui')], {
      dependents: [{ name: 'Child', birth_year: 2020 }],
    })
    const target = makeHousehold(2023, [makePerson('RUI MIGUEL')], {
      dependents: [
        { name: 'Dependente 1 (111111111)', birth_year: undefined as unknown as number },
      ],
    })

    const result = propagateSharedData(primary, target)
    expect(result.dependents[0].birth_year).toBe(2020)
  })

  it('preserves target special_regimes when non-empty', () => {
    const primary = makeHousehold(2025, [makePerson('Rui', { special_regimes: ['irs_jovem'] })])
    const target = makeHousehold(2023, [makePerson('RUI MIGUEL', { special_regimes: ['nhr'] })])

    const result = propagateSharedData(primary, target)
    expect(result.members[0].special_regimes).toEqual(['nhr'])
  })

  it('copies primary special_regimes when target has none', () => {
    const primary = makeHousehold(2025, [makePerson('Rui', { special_regimes: ['irs_jovem'] })])
    const target = makeHousehold(2023, [makePerson('RUI MIGUEL')])

    const result = propagateSharedData(primary, target)
    expect(result.members[0].special_regimes).toEqual(['irs_jovem'])
  })

  it('matches by NIF when member order differs between primary and target', () => {
    const primary = makeHousehold(2025, [
      makePerson('Rui', { nif: '111', birth_year: 1990 }),
      makePerson('Micha', { nif: '222', birth_year: 1992 }),
    ])
    // Target has reversed member order (different XML submitted first)
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
    // Member at index 0 has NIF 222 → should get Micha's name and birth_year
    expect(result.members[0].name).toBe('Micha')
    expect(result.members[0].birth_year).toBe(1992)
    expect(result.members[0].incomes[0].gross).toBe(25000) // preserves target data
    // Member at index 1 has NIF 111 → should get Rui's name and birth_year
    expect(result.members[1].name).toBe('Rui')
    expect(result.members[1].birth_year).toBe(1990)
    expect(result.members[1].incomes[0].gross).toBe(35000)
  })

  it('falls back to position matching when NIFs are not available', () => {
    const primary = makeHousehold(2025, [
      makePerson('Rui', { birth_year: 1990 }),
      makePerson('Micha', { birth_year: 1992 }),
    ])
    const target = makeHousehold(2023, [makePerson('RUI MIGUEL'), makePerson('Titular B (123)')])

    const result = propagateSharedData(primary, target)
    expect(result.members[0].name).toBe('Rui')
    expect(result.members[0].birth_year).toBe(1990)
    expect(result.members[1].name).toBe('Micha')
    expect(result.members[1].birth_year).toBe(1992)
  })

  it('propagates NIF from primary to target', () => {
    const primary = makeHousehold(2025, [makePerson('Rui', { nif: '111' })])
    const target = makeHousehold(2023, [makePerson('RUI MIGUEL')])

    const result = propagateSharedData(primary, target)
    expect(result.members[0].nif).toBe('111')
  })
})
