import { describe, it, expect } from 'vitest'
import {
  buildSimulationHousehold,
  buildOptimizedSimulationHousehold,
  computeSimulationResults,
} from '@/lib/tax/simulation'
import type { SimulationInputs } from '@/lib/tax/simulation'

// ─── Household Builder Tests ─────────────────────────────────

describe('buildSimulationHousehold', () => {
  it('builds a single filer household', () => {
    const inputs: SimulationInputs = {
      married: false,
      persons: [{ birth_year: 1990, gross_cat_a: 30000 }],
      dependents_under_3: 0,
      dependents_3_to_6: 0,
      dependents_over_6: 0,
    }

    const household = buildSimulationHousehold(inputs)

    expect(household.year).toBe(2025)
    expect(household.filing_status).toBe('single')
    expect(household.members).toHaveLength(1)
    expect(household.members[0].name).toBe('Contribuinte')
    expect(household.members[0].incomes).toHaveLength(1)
    expect(household.members[0].incomes[0].category).toBe('A')
    expect(household.members[0].incomes[0].gross).toBe(30000)
    expect(household.dependents).toHaveLength(0)
    expect(household.projected).toBe(true)
  })

  it('builds married household with married_separate filing', () => {
    const inputs: SimulationInputs = {
      married: true,
      persons: [
        { birth_year: 1990, gross_cat_a: 30000 },
        { birth_year: 1992, gross_cat_a: 25000 },
      ],
      dependents_under_3: 0,
      dependents_3_to_6: 0,
      dependents_over_6: 0,
    }

    const household = buildSimulationHousehold(inputs)

    expect(household.filing_status).toBe('married_separate')
    expect(household.members).toHaveLength(2)
    expect(household.members[0].name).toBe('Sujeito Passivo A')
    expect(household.members[1].name).toBe('Sujeito Passivo B')
  })

  it('includes Cat B income when specified', () => {
    const inputs: SimulationInputs = {
      married: false,
      persons: [{ birth_year: 1990, gross_cat_a: 20000, gross_cat_b: 10000 }],
      dependents_under_3: 0,
      dependents_3_to_6: 0,
      dependents_over_6: 0,
    }

    const household = buildSimulationHousehold(inputs)
    const incomes = household.members[0].incomes

    expect(incomes).toHaveLength(2)
    expect(incomes[0].category).toBe('A')
    expect(incomes[1].category).toBe('B')
    expect(incomes[1].gross).toBe(10000)
    expect(incomes[1].cat_b_regime).toBe('simplified')
    expect(incomes[1].cat_b_income_code).toBe(403)
  })

  it('skips Cat B when gross is 0', () => {
    const inputs: SimulationInputs = {
      married: false,
      persons: [{ birth_year: 1990, gross_cat_a: 20000, gross_cat_b: 0 }],
      dependents_under_3: 0,
      dependents_3_to_6: 0,
      dependents_over_6: 0,
    }

    const household = buildSimulationHousehold(inputs)
    expect(household.members[0].incomes).toHaveLength(1)
  })

  it('generates dependents from age bracket counts', () => {
    const inputs: SimulationInputs = {
      married: false,
      persons: [{ birth_year: 1990, gross_cat_a: 30000 }],
      dependents_under_3: 1,
      dependents_3_to_6: 2,
      dependents_over_6: 1,
    }

    const household = buildSimulationHousehold(inputs)
    expect(household.dependents).toHaveLength(4)

    // Under 3 → birth_year 2024
    expect(household.dependents[0].birth_year).toBe(2024)
    // 3-6 → birth_year 2021
    expect(household.dependents[1].birth_year).toBe(2021)
    expect(household.dependents[2].birth_year).toBe(2021)
    // Over 6 → birth_year 2017
    expect(household.dependents[3].birth_year).toBe(2017)
  })

  it('applies NHR special regime when toggled', () => {
    const inputs: SimulationInputs = {
      married: false,
      persons: [{ birth_year: 1990, gross_cat_a: 50000, nhr: true }],
      dependents_under_3: 0,
      dependents_3_to_6: 0,
      dependents_over_6: 0,
    }

    const household = buildSimulationHousehold(inputs)
    const person = household.members[0]

    expect(person.special_regimes).toContain('nhr')
    expect(person.nhr_start_year).toBe(2024)
    expect(person.nhr_confirmed).toBe(true)
  })

  it('does NOT apply IRS Jovem in current (conservative) household', () => {
    const inputs: SimulationInputs = {
      married: false,
      persons: [{ birth_year: 2000, gross_cat_a: 25000 }], // age 25
      dependents_under_3: 0,
      dependents_3_to_6: 0,
      dependents_over_6: 0,
    }

    const household = buildSimulationHousehold(inputs)
    expect(household.members[0].special_regimes).not.toContain('irs_jovem')
    expect(household.members[0].irs_jovem_first_work_year).toBeUndefined()
  })

  it('includes default general deduction of €250', () => {
    const inputs: SimulationInputs = {
      married: false,
      persons: [{ birth_year: 1990, gross_cat_a: 30000 }],
      dependents_under_3: 0,
      dependents_3_to_6: 0,
      dependents_over_6: 0,
    }

    const household = buildSimulationHousehold(inputs)
    const deductions = household.members[0].deductions

    expect(deductions).toHaveLength(1)
    expect(deductions[0].category).toBe('general')
    expect(deductions[0].amount).toBe(250)
  })
})

// ─── Optimized Household Builder Tests ───────────────────────

describe('buildOptimizedSimulationHousehold', () => {
  it('applies IRS Jovem for young eligible person (age 25)', () => {
    const inputs: SimulationInputs = {
      married: false,
      persons: [{ birth_year: 2000, gross_cat_a: 25000 }], // age 25
      dependents_under_3: 0,
      dependents_3_to_6: 0,
      dependents_over_6: 0,
    }

    const household = buildOptimizedSimulationHousehold(inputs)
    const person = household.members[0]

    expect(person.special_regimes).toContain('irs_jovem')
    // Age 25 → started at 18 → first_work_year = 2018
    expect(person.irs_jovem_first_work_year).toBe(2018)
  })

  it('applies IRS Jovem for person age 30 (infers start at 23)', () => {
    const inputs: SimulationInputs = {
      married: false,
      persons: [{ birth_year: 1995, gross_cat_a: 35000 }], // age 30
      dependents_under_3: 0,
      dependents_3_to_6: 0,
      dependents_over_6: 0,
    }

    const household = buildOptimizedSimulationHousehold(inputs)
    const person = household.members[0]

    expect(person.special_regimes).toContain('irs_jovem')
    // Age 30 → started at 23 → first_work_year = 2018
    expect(person.irs_jovem_first_work_year).toBe(2018)
  })

  it('does NOT apply IRS Jovem for person over 35', () => {
    const inputs: SimulationInputs = {
      married: false,
      persons: [{ birth_year: 1985, gross_cat_a: 40000 }], // age 40
      dependents_under_3: 0,
      dependents_3_to_6: 0,
      dependents_over_6: 0,
    }

    const household = buildOptimizedSimulationHousehold(inputs)
    expect(household.members[0].special_regimes).not.toContain('irs_jovem')
  })

  it('uses explicit first_work_year instead of heuristic', () => {
    const inputs: SimulationInputs = {
      married: false,
      persons: [{ birth_year: 1995, gross_cat_a: 30000, first_work_year: 2022 }],
      dependents_under_3: 0,
      dependents_3_to_6: 0,
      dependents_over_6: 0,
    }

    const household = buildOptimizedSimulationHousehold(inputs)
    const person = household.members[0]

    expect(person.special_regimes).toContain('irs_jovem')
    // Explicit first_work_year = 2022, NOT heuristic (1995 + 23 = 2018)
    expect(person.irs_jovem_first_work_year).toBe(2022)
  })

  it('falls back to heuristic when first_work_year is not provided', () => {
    const inputs: SimulationInputs = {
      married: false,
      persons: [{ birth_year: 1995, gross_cat_a: 30000 }], // age 30, no first_work_year
      dependents_under_3: 0,
      dependents_3_to_6: 0,
      dependents_over_6: 0,
    }

    const household = buildOptimizedSimulationHousehold(inputs)
    // Heuristic: age > 25 → started at 23 → 1995 + 23 = 2018
    expect(household.members[0].irs_jovem_first_work_year).toBe(2018)
  })

  it('NHR and IRS Jovem are mutually exclusive — NHR wins', () => {
    const inputs: SimulationInputs = {
      married: false,
      persons: [{ birth_year: 2000, gross_cat_a: 40000, nhr: true }], // age 25, NHR checked
      dependents_under_3: 0,
      dependents_3_to_6: 0,
      dependents_over_6: 0,
    }

    const household = buildOptimizedSimulationHousehold(inputs)
    const person = household.members[0]

    expect(person.special_regimes).toContain('nhr')
    expect(person.special_regimes).not.toContain('irs_jovem')
  })

  it('uses married_joint filing status for married couples', () => {
    const inputs: SimulationInputs = {
      married: true,
      persons: [
        { birth_year: 1990, gross_cat_a: 30000 },
        { birth_year: 1992, gross_cat_a: 25000 },
      ],
      dependents_under_3: 0,
      dependents_3_to_6: 0,
      dependents_over_6: 0,
    }

    const household = buildOptimizedSimulationHousehold(inputs)
    expect(household.filing_status).toBe('married_joint')
  })

  it('applies IRS Jovem only to eligible members in mixed couple', () => {
    const inputs: SimulationInputs = {
      married: true,
      persons: [
        { birth_year: 1980, gross_cat_a: 40000 }, // age 45 — not eligible
        { birth_year: 2000, gross_cat_a: 25000 }, // age 25 — eligible
      ],
      dependents_under_3: 0,
      dependents_3_to_6: 0,
      dependents_over_6: 0,
    }

    const household = buildOptimizedSimulationHousehold(inputs)

    expect(household.members[0].special_regimes).not.toContain('irs_jovem')
    expect(household.members[1].special_regimes).toContain('irs_jovem')
  })

  it('handles IRS Jovem eligibility edge — exactly age 35', () => {
    const inputs: SimulationInputs = {
      married: false,
      persons: [{ birth_year: 1990, gross_cat_a: 30000 }], // age 35
      dependents_under_3: 0,
      dependents_3_to_6: 0,
      dependents_over_6: 0,
    }

    const household = buildOptimizedSimulationHousehold(inputs)
    const person = household.members[0]

    // Age 35 → started at 23 → first_work_year = 2013 → benefit year = 13 → exceeds 10
    // So IRS Jovem should NOT be eligible (benefit year 13 > max 10)
    expect(person.special_regimes).not.toContain('irs_jovem')
  })
})

// ─── Integration: computeSimulationResults ───────────────────

describe('computeSimulationResults', () => {
  it('computes results for a single filer', () => {
    const inputs: SimulationInputs = {
      married: false,
      persons: [{ birth_year: 1985, gross_cat_a: 30000 }],
      dependents_under_3: 0,
      dependents_3_to_6: 0,
      dependents_over_6: 0,
    }

    const results = computeSimulationResults(inputs)

    expect(results.current.year).toBe(2025)
    expect(results.optimized.year).toBe(2025)
    expect(results.current.scenarios.length).toBeGreaterThanOrEqual(1)
    expect(results.optimized.scenarios.length).toBeGreaterThanOrEqual(1)
    expect(results.total_savings).toBeGreaterThanOrEqual(0)
  })

  it('shows savings for IRS Jovem eligible person', () => {
    const inputs: SimulationInputs = {
      married: false,
      persons: [{ birth_year: 2000, gross_cat_a: 25000 }], // age 25
      dependents_under_3: 0,
      dependents_3_to_6: 0,
      dependents_over_6: 0,
    }

    const results = computeSimulationResults(inputs)

    // Current scenario has NO IRS Jovem → higher burden
    // Optimized has IRS Jovem → lower burden → savings > 0
    expect(results.total_savings).toBeGreaterThan(0)
  })

  it('computes results for married couple', () => {
    const inputs: SimulationInputs = {
      married: true,
      persons: [
        { birth_year: 1990, gross_cat_a: 35000 },
        { birth_year: 1992, gross_cat_a: 20000 },
      ],
      dependents_under_3: 1,
      dependents_3_to_6: 0,
      dependents_over_6: 1,
    }

    const results = computeSimulationResults(inputs)

    // Married → current has single scenario (separate), optimized compares joint vs separate
    expect(results.current.scenarios.length).toBeGreaterThanOrEqual(1)
    expect(results.optimized.scenarios.length).toBeGreaterThanOrEqual(1)
    expect(results.total_savings).toBeGreaterThanOrEqual(0)
  })

  it('handles Cat B income correctly', () => {
    const inputs: SimulationInputs = {
      married: false,
      persons: [{ birth_year: 1985, gross_cat_a: 20000, gross_cat_b: 15000 }],
      dependents_under_3: 0,
      dependents_3_to_6: 0,
      dependents_over_6: 0,
    }

    const results = computeSimulationResults(inputs)

    // Total gross should include both Cat A and Cat B
    const currentGross = results.current.scenarios[0].total_gross
    expect(currentGross).toBe(35000)
  })

  it('handles NHR person correctly', () => {
    const inputs: SimulationInputs = {
      married: false,
      persons: [{ birth_year: 1990, gross_cat_a: 50000, nhr: true }],
      dependents_under_3: 0,
      dependents_3_to_6: 0,
      dependents_over_6: 0,
    }

    const results = computeSimulationResults(inputs)

    // NHR person should have NHR tax computed
    const person = results.current.scenarios[0].persons[0]
    expect(person.nhr_tax).toBeGreaterThan(0)
  })

  it('total_savings is always non-negative', () => {
    const inputs: SimulationInputs = {
      married: false,
      persons: [{ birth_year: 1970, gross_cat_a: 15000 }], // older, low income
      dependents_under_3: 0,
      dependents_3_to_6: 0,
      dependents_over_6: 0,
    }

    const results = computeSimulationResults(inputs)
    expect(results.total_savings).toBeGreaterThanOrEqual(0)
  })
})
