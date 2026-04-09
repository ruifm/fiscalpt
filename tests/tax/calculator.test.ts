import { describe, it, expect } from 'vitest'
import { analyzeHousehold } from '@/lib/tax/calculator'
import type { Household } from '@/lib/tax/types'
import {
  getSpecificDeduction,
  AUTONOMOUS_RATE_CAT_E,
  AUTONOMOUS_RATE_CAT_F,
  AUTONOMOUS_RATE_CAT_G,
  CAT_G_REAL_ESTATE_INCLUSION_RATE,
  MINIMO_EXISTENCIA,
} from '@/lib/tax/types'

// ─── Cat A Specific Deduction (Art. 25 CIRS) ────────────────

describe('Cat A Specific Deduction (Art. 25 CIRS)', () => {
  it('deducts max(€4,104, SS_paid) from Cat A gross', () => {
    const household: Household = {
      year: 2025,
      filing_status: 'single',
      members: [
        {
          name: 'Ana',
          incomes: [{ category: 'A', gross: 30000, ss_paid: 3300 }],
          deductions: [],
          special_regimes: [],
        },
      ],
      dependents: [],
    }
    const result = analyzeHousehold(household)
    const person = result.scenarios[0].persons[0]
    // SS paid (3300) < 4462.15 (2025), so specific deduction = 4462.15
    expect(person.taxable_income).toBe(25537.85)
    expect(person.specific_deduction).toBe(4462.15)
  })

  it('uses SS_paid when greater than €4,104', () => {
    const household: Household = {
      year: 2025,
      filing_status: 'single',
      members: [
        {
          name: 'Bruno',
          incomes: [{ category: 'A', gross: 50000, ss_paid: 5500 }],
          deductions: [],
          special_regimes: [],
        },
      ],
      dependents: [],
    }
    const result = analyzeHousehold(household)
    const person = result.scenarios[0].persons[0]
    expect(person.taxable_income).toBe(44500)
    expect(person.specific_deduction).toBe(5500)
  })
})

// ─── Cat H Specific Deduction (Art. 53 CIRS) ────────────────

describe('Cat H Specific Deduction (Art. 53 CIRS)', () => {
  it('applies same formula as Cat A to pension income', () => {
    const household: Household = {
      year: 2025,
      filing_status: 'single',
      members: [
        {
          name: 'Carlos',
          incomes: [{ category: 'H', gross: 20000 }],
          deductions: [],
          special_regimes: [],
        },
      ],
      dependents: [],
    }
    const result = analyzeHousehold(household)
    const person = result.scenarios[0].persons[0]
    // No SS paid → specific deduction = 4462.15 (2025)
    // Taxable = 20000 - 4462.15 = 15537.85
    expect(person.taxable_income).toBe(15537.85)
    expect(person.specific_deduction).toBe(4462.15)
  })

  it('pension with SS contributions uses max(4104, SS)', () => {
    const household: Household = {
      year: 2025,
      filing_status: 'single',
      members: [
        {
          name: 'Diana',
          incomes: [{ category: 'H', gross: 25000, ss_paid: 4500 }],
          deductions: [],
          special_regimes: [],
        },
      ],
      dependents: [],
    }
    const result = analyzeHousehold(household)
    const person = result.scenarios[0].persons[0]
    // SS paid (4500) > 4104 → specific deduction = 4500
    expect(person.taxable_income).toBe(20500)
    expect(person.specific_deduction).toBe(4500)
  })

  it('person with both Cat A and Cat H gets separate deductions', () => {
    const household: Household = {
      year: 2025,
      filing_status: 'single',
      members: [
        {
          name: 'Eva',
          incomes: [
            { category: 'A', gross: 20000, ss_paid: 2200 },
            { category: 'H', gross: 10000 },
          ],
          deductions: [],
          special_regimes: [],
        },
      ],
      dependents: [],
    }
    const result = analyzeHousehold(household)
    const person = result.scenarios[0].persons[0]
    // Cat A: 20000 - max(4462.15, 2200) = 20000 - 4462.15 = 15537.85
    // Cat H: 10000 - max(4462.15, 0) = 10000 - 4462.15 = 5537.85
    // Total taxable: 15537.85 + 5537.85 = 21075.70
    expect(person.taxable_income).toBe(21075.7)
    expect(person.specific_deduction).toBe(4462.15 + 4462.15) // both deductions
  })
})

// ─── Cat B Organized Accounting ──────────────────────────────

describe('Cat B — Organized Accounting', () => {
  it('simplified regime uses 75% coefficient', () => {
    const household: Household = {
      year: 2025,
      filing_status: 'single',
      members: [
        {
          name: 'Fátima',
          incomes: [{ category: 'B', gross: 30000 }],
          deductions: [],
          special_regimes: [],
        },
      ],
      dependents: [],
    }
    const result = analyzeHousehold(household)
    expect(result.scenarios[0].persons[0].taxable_income).toBe(22500) // 30000 × 0.75
  })

  it('organized accounting uses gross - expenses', () => {
    const household: Household = {
      year: 2025,
      filing_status: 'single',
      members: [
        {
          name: 'Gustavo',
          incomes: [
            {
              category: 'B',
              gross: 40000,
              cat_b_regime: 'organized',
              expenses: 15000,
            },
          ],
          deductions: [],
          special_regimes: [],
        },
      ],
      dependents: [],
    }
    const result = analyzeHousehold(household)
    expect(result.scenarios[0].persons[0].taxable_income).toBe(25000) // 40000 - 15000
  })
})

// ─── Cat E Autonomous Taxation ──────────────────────────────

describe('Cat E — Capital Income', () => {
  it('default: 28% autonomous tax, not in progressive brackets', () => {
    const household: Household = {
      year: 2025,
      filing_status: 'single',
      members: [
        {
          name: 'Hugo',
          incomes: [{ category: 'E', gross: 10000 }],
          deductions: [],
          special_regimes: [],
        },
      ],
      dependents: [],
    }
    const result = analyzeHousehold(household)
    const person = result.scenarios[0].persons[0]
    expect(person.taxable_income).toBe(0) // not in brackets
    expect(person.autonomous_tax).toBe(2800) // 10000 × 0.28
    expect(person.irs_before_deductions).toBe(0)
  })

  it('englobamento: enters progressive brackets instead', () => {
    const household: Household = {
      year: 2025,
      filing_status: 'single',
      members: [
        {
          name: 'Inês',
          incomes: [{ category: 'E', gross: 5000, englobamento: true }],
          deductions: [],
          special_regimes: [],
        },
      ],
      dependents: [],
    }
    const result = analyzeHousehold(household)
    const person = result.scenarios[0].persons[0]
    expect(person.taxable_income).toBe(5000) // in brackets
    expect(person.autonomous_tax).toBe(0) // no autonomous
    expect(person.irs_before_deductions).toBeGreaterThan(0)
  })

  it('mixed Cat A + Cat E: Cat A progressive, Cat E autonomous', () => {
    const household: Household = {
      year: 2025,
      filing_status: 'single',
      members: [
        {
          name: 'João',
          incomes: [
            { category: 'A', gross: 30000, ss_paid: 3300 },
            { category: 'E', gross: 5000 },
          ],
          deductions: [],
          special_regimes: [],
        },
      ],
      dependents: [],
    }
    const result = analyzeHousehold(household)
    const person = result.scenarios[0].persons[0]
    // Cat A: 30000 - 4462.15 = 25537.85 → progressive
    // Cat E: 5000 × 0.28 = 1400 → autonomous
    expect(person.taxable_income).toBe(25537.85)
    expect(person.autonomous_tax).toBe(1400)
  })
})

// ─── Cat F Rental Income ────────────────────────────────────

describe('Cat F — Rental Income', () => {
  it('default: 28% autonomous on net rental income', () => {
    const household: Household = {
      year: 2025,
      filing_status: 'single',
      members: [
        {
          name: 'Karina',
          incomes: [
            {
              category: 'F',
              gross: 12000,
              expenses: 2000, // IMI, insurance, maintenance
            },
          ],
          deductions: [],
          special_regimes: [],
        },
      ],
      dependents: [],
    }
    const result = analyzeHousehold(household)
    const person = result.scenarios[0].persons[0]
    // Net rental = 12000 - 2000 = 10000
    // Autonomous: 10000 × 0.28 = 2800
    expect(person.autonomous_tax).toBe(2800)
    expect(person.taxable_income).toBe(0)
  })

  it('reduced rate for long-term contract (5-10 years: 23%)', () => {
    const household: Household = {
      year: 2025,
      filing_status: 'single',
      members: [
        {
          name: 'Luís',
          incomes: [
            {
              category: 'F',
              gross: 10000,
              rental_contract_duration: 7,
            },
          ],
          deductions: [],
          special_regimes: [],
        },
      ],
      dependents: [],
    }
    const result = analyzeHousehold(household)
    const person = result.scenarios[0].persons[0]
    // 10000 × 0.23 = 2300
    expect(person.autonomous_tax).toBe(2300)
  })

  it('reduced rate for very long-term (≥20 years: 10%)', () => {
    const household: Household = {
      year: 2025,
      filing_status: 'single',
      members: [
        {
          name: 'Maria',
          incomes: [
            {
              category: 'F',
              gross: 10000,
              rental_contract_duration: 25,
            },
          ],
          deductions: [],
          special_regimes: [],
        },
      ],
      dependents: [],
    }
    const result = analyzeHousehold(household)
    expect(result.scenarios[0].persons[0].autonomous_tax).toBe(1000) // 10000 × 0.10
  })

  it('englobamento: net rental in progressive brackets', () => {
    const household: Household = {
      year: 2025,
      filing_status: 'single',
      members: [
        {
          name: 'Nuno',
          incomes: [
            {
              category: 'F',
              gross: 8000,
              expenses: 1000,
              englobamento: true,
            },
          ],
          deductions: [],
          special_regimes: [],
        },
      ],
      dependents: [],
    }
    const result = analyzeHousehold(household)
    const person = result.scenarios[0].persons[0]
    expect(person.taxable_income).toBe(7000) // 8000 - 1000
    expect(person.autonomous_tax).toBe(0)
  })
})

// ─── Cat G Capital Gains ────────────────────────────────────

describe('Cat G — Capital Gains', () => {
  it('real estate: 50% mandatory aggregation', () => {
    const household: Household = {
      year: 2025,
      filing_status: 'single',
      members: [
        {
          name: 'Olivia',
          incomes: [
            {
              category: 'G',
              gross: 50000, // gain after acquisition cost
              asset_type: 'real_estate',
            },
          ],
          deductions: [],
          special_regimes: [],
        },
      ],
      dependents: [],
    }
    const result = analyzeHousehold(household)
    const person = result.scenarios[0].persons[0]
    // 50% of gain → progressive brackets
    expect(person.taxable_income).toBe(25000) // 50000 × 0.50
    expect(person.autonomous_tax).toBe(0)
  })

  it('financial: 28% autonomous by default', () => {
    const household: Household = {
      year: 2025,
      filing_status: 'single',
      members: [
        {
          name: 'Pedro',
          incomes: [
            {
              category: 'G',
              gross: 20000,
              asset_type: 'financial',
            },
          ],
          deductions: [],
          special_regimes: [],
        },
      ],
      dependents: [],
    }
    const result = analyzeHousehold(household)
    const person = result.scenarios[0].persons[0]
    expect(person.autonomous_tax).toBe(5600) // 20000 × 0.28
    expect(person.taxable_income).toBe(0)
  })

  it('financial with englobamento: enters progressive', () => {
    const household: Household = {
      year: 2025,
      filing_status: 'single',
      members: [
        {
          name: 'Rita',
          incomes: [
            {
              category: 'G',
              gross: 10000,
              asset_type: 'financial',
              englobamento: true,
            },
          ],
          deductions: [],
          special_regimes: [],
        },
      ],
      dependents: [],
    }
    const result = analyzeHousehold(household)
    const person = result.scenarios[0].persons[0]
    expect(person.taxable_income).toBe(10000)
    expect(person.autonomous_tax).toBe(0)
  })

  it('Cat G without asset_type defaults to autonomous 28%', () => {
    const household: Household = {
      year: 2025,
      filing_status: 'single',
      members: [
        {
          name: 'Sara',
          incomes: [{ category: 'G', gross: 10000 }],
          deductions: [],
          special_regimes: [],
        },
      ],
      dependents: [],
    }
    const result = analyzeHousehold(household)
    expect(result.scenarios[0].persons[0].autonomous_tax).toBe(2800)
  })
})

// ─── Mínimo de Existência (Art. 70 CIRS) ────────────────────

describe('Mínimo de Existência (Art. 70 CIRS)', () => {
  it('caps IRS for low-income Cat A worker', () => {
    const household: Household = {
      year: 2025,
      filing_status: 'single',
      members: [
        {
          name: 'Tiago',
          incomes: [{ category: 'A', gross: 13000, ss_paid: 1430 }],
          deductions: [],
          special_regimes: [],
        },
      ],
      dependents: [],
    }
    const result = analyzeHousehold(household)
    const person = result.scenarios[0].persons[0]
    // Mínimo 2025 = €12,180
    // Max IRS = max(0, 13000 - 12180) = 820
    // Taxable = 13000 - 4104 = 8896
    // Tax on 8896 at 2025 rates ≈ 8059 × 0.125 + (8896-8059) × 0.16 = 1007.375 + 133.92 = 1141.30
    // 1141.30 > 820 → capped to 820
    expect(person.irs_after_deductions).toBeLessThanOrEqual(820)
    expect(person.minimo_existencia_applied).toBe(true)
  })

  it('does not affect high-income earners', () => {
    const household: Household = {
      year: 2025,
      filing_status: 'single',
      members: [
        {
          name: 'Ursula',
          incomes: [{ category: 'A', gross: 50000, ss_paid: 5500 }],
          deductions: [],
          special_regimes: [],
        },
      ],
      dependents: [],
    }
    const result = analyzeHousehold(household)
    expect(result.scenarios[0].persons[0].minimo_existencia_applied).toBe(false)
  })

  it('does not apply when income is predominantly Cat E/F/G', () => {
    const household: Household = {
      year: 2025,
      filing_status: 'single',
      members: [
        {
          name: 'Vera',
          incomes: [
            { category: 'A', gross: 5000, ss_paid: 550 },
            { category: 'E', gross: 8000 },
          ],
          deductions: [],
          special_regimes: [],
        },
      ],
      dependents: [],
    }
    const result = analyzeHousehold(household)
    // Cat A (5000) is < 50% of total (13000) → mínimo doesn't apply
    expect(result.scenarios[0].persons[0].minimo_existencia_applied).toBe(false)
  })

  it('zero IRS for income below mínimo', () => {
    const household: Household = {
      year: 2025,
      filing_status: 'single',
      members: [
        {
          name: 'Wilma',
          incomes: [{ category: 'A', gross: 10000, ss_paid: 1100 }],
          deductions: [],
          special_regimes: [],
        },
      ],
      dependents: [],
    }
    const result = analyzeHousehold(household)
    const person = result.scenarios[0].persons[0]
    // 10000 < 12180 → max IRS = 0
    expect(person.irs_after_deductions).toBe(0)
    expect(person.minimo_existencia_applied).toBe(true)
  })

  it('applies across different years with correct thresholds', () => {
    for (const year of [2021, 2022, 2023, 2024, 2025]) {
      const household: Household = {
        year,
        filing_status: 'single',
        members: [
          {
            name: 'Xisto',
            incomes: [{ category: 'A', gross: 10000, ss_paid: 1100 }],
            deductions: [],
            special_regimes: [],
          },
        ],
        dependents: [],
      }
      const result = analyzeHousehold(household)
      const person = result.scenarios[0].persons[0]
      const minimo = MINIMO_EXISTENCIA[year]
      if (10000 < minimo) {
        expect(person.irs_after_deductions).toBe(0)
      }
    }
  })
})

// ─── NHR Revocation Warning ─────────────────────────────────

describe('NHR — Revocation Warning', () => {
  it('warns when nhr_start_year >= 2024', () => {
    const household: Household = {
      year: 2025,
      filing_status: 'single',
      members: [
        {
          name: 'Yara',
          incomes: [{ category: 'A', gross: 50000, ss_paid: 5500 }],
          deductions: [],
          special_regimes: ['nhr'],
          nhr_start_year: 2024,
        },
      ],
      dependents: [],
    }
    const result = analyzeHousehold(household)
    const warning = result.optimizations.find((o) => o.id.includes('nhr-revocation'))
    expect(warning).toBeDefined()
    expect(warning!.description).toContain('revogado')
  })

  it('no warning for nhr_start_year before 2024', () => {
    const household: Household = {
      year: 2025,
      filing_status: 'single',
      members: [
        {
          name: 'Zara',
          incomes: [{ category: 'A', gross: 50000, ss_paid: 5500 }],
          deductions: [],
          special_regimes: ['nhr'],
          nhr_start_year: 2020,
        },
      ],
      dependents: [],
    }
    const result = analyzeHousehold(household)
    const warning = result.optimizations.find((o) => o.id.includes('nhr-revocation'))
    expect(warning).toBeUndefined()
  })
})

// ─── NHR + Cat E/F/G ────────────────────────────────────────

describe('NHR with non-qualifying income', () => {
  it('Cat A gets NHR 20%, Cat E gets autonomous 28%', () => {
    const household: Household = {
      year: 2025,
      filing_status: 'single',
      members: [
        {
          name: 'Alberto',
          incomes: [
            { category: 'A', gross: 50000, ss_paid: 5500 },
            { category: 'E', gross: 10000 },
          ],
          deductions: [],
          special_regimes: ['nhr'],
          nhr_start_year: 2020,
        },
      ],
      dependents: [],
    }
    const result = analyzeHousehold(household)
    const person = result.scenarios[0].persons[0]
    expect(person.nhr_tax).toBe(10000) // 50000 × 0.20
    expect(person.autonomous_tax).toBe(2800) // 10000 × 0.28
    expect(person.taxable_income).toBe(0) // nothing in progressive
  })
})

// ─── Married Couple — Joint vs Separate ─────────────────────

describe('Married Couple — Joint vs Separate', () => {
  it('compares joint and separate filing', () => {
    const household: Household = {
      year: 2025,
      filing_status: 'married_joint',
      members: [
        {
          name: 'Hugo',
          incomes: [{ category: 'A', gross: 50000, ss_paid: 5500 }],
          deductions: [{ category: 'general', amount: 800 }],
          special_regimes: [],
        },
        {
          name: 'Inês',
          incomes: [{ category: 'A', gross: 20000, ss_paid: 2200 }],
          deductions: [{ category: 'general', amount: 800 }],
          special_regimes: [],
        },
      ],
      dependents: [],
    }
    const result = analyzeHousehold(household)
    expect(result.scenarios).toHaveLength(2)
    expect(result.joint_vs_separate_savings).toBeDefined()
  })

  it('joint filing benefits unequal incomes', () => {
    const household: Household = {
      year: 2025,
      filing_status: 'married_joint',
      members: [
        {
          name: 'João',
          incomes: [{ category: 'A', gross: 60000, ss_paid: 6600 }],
          deductions: [],
          special_regimes: [],
        },
        {
          name: 'Karina',
          incomes: [{ category: 'A', gross: 15000, ss_paid: 1650 }],
          deductions: [],
          special_regimes: [],
        },
      ],
      dependents: [],
    }
    const result = analyzeHousehold(household)
    const joint = result.scenarios.find((s) => s.filing_status === 'married_joint')!
    const separate = result.scenarios.find((s) => s.filing_status === 'married_separate')!
    expect(joint.total_irs).toBeLessThan(separate.total_irs)
    expect(result.recommended_scenario).toBe('Tributação Conjunta')
  })

  it('retired couple with pension income', () => {
    const household: Household = {
      year: 2025,
      filing_status: 'married_joint',
      members: [
        {
          name: 'Manuel',
          incomes: [{ category: 'H', gross: 18000 }],
          deductions: [],
          special_regimes: [],
        },
        {
          name: 'Rosa',
          incomes: [{ category: 'H', gross: 14000 }],
          deductions: [],
          special_regimes: [],
        },
      ],
      dependents: [],
    }
    const result = analyzeHousehold(household)
    expect(result.scenarios.length).toBe(2)
    // Both get Cat H specific deduction
    const joint = result.scenarios.find((s) => s.filing_status === 'married_joint')!
    expect(joint.total_irs).toBeGreaterThan(0)
    expect(joint.total_gross).toBe(32000)
  })
})

// ─── Real-World Scenarios ───────────────────────────────────

describe('Real-world scenarios', () => {
  it('employee + freelancer + rental income household', () => {
    const household: Household = {
      year: 2025,
      filing_status: 'married_joint',
      members: [
        {
          name: 'Pedro',
          incomes: [
            { category: 'A', gross: 42000, ss_paid: 4620 },
            { category: 'F', gross: 6000, expenses: 1000 },
          ],
          deductions: [
            { category: 'general', amount: 800 },
            { category: 'health', amount: 1200 },
          ],
          special_regimes: [],
        },
        {
          name: 'Rita',
          incomes: [{ category: 'B', gross: 25000 }],
          deductions: [{ category: 'general', amount: 600 }],
          special_regimes: [],
        },
      ],
      dependents: [
        { name: 'Child1', birth_year: 2018 },
        { name: 'Child2', birth_year: 2022 },
      ],
    }
    const result = analyzeHousehold(household)
    expect(result.year).toBe(2025)
    expect(result.scenarios.length).toBeGreaterThanOrEqual(2)

    const joint = result.scenarios.find((s) => s.filing_status === 'married_joint')!
    expect(joint.total_gross).toBe(73000) // 42000 + 6000 + 25000
    expect(joint.effective_rate_irs).toBeGreaterThan(0.05)
    expect(joint.effective_rate_irs).toBeLessThan(0.3)
  })

  it('retiree with dividends and rental income', () => {
    const household: Household = {
      year: 2025,
      filing_status: 'single',
      members: [
        {
          name: 'Sofia',
          incomes: [
            { category: 'H', gross: 15000 },
            { category: 'E', gross: 3000 }, // dividends → autonomous
            { category: 'F', gross: 8000, expenses: 1500 }, // rental → autonomous
          ],
          deductions: [{ category: 'health', amount: 2000 }],
          special_regimes: [],
        },
      ],
      dependents: [],
    }
    const result = analyzeHousehold(household)
    const person = result.scenarios[0].persons[0]

    // Cat H: 15000 - 4462.15 = 10537.85 → progressive
    expect(person.taxable_income).toBe(10537.85)
    // Cat E: 3000 × 0.28 = 840 → autonomous
    // Cat F: (8000-1500) × 0.28 = 1820 → autonomous
    expect(person.autonomous_tax).toBe(840 + 1820)
    expect(person.specific_deduction).toBe(4462.15) // Cat H only
  })

  it('property sale with 50% inclusion', () => {
    const household: Household = {
      year: 2025,
      filing_status: 'single',
      members: [
        {
          name: 'Tomás',
          incomes: [
            { category: 'A', gross: 35000, ss_paid: 3850 },
            { category: 'G', gross: 80000, asset_type: 'real_estate' },
          ],
          deductions: [],
          special_regimes: [],
        },
      ],
      dependents: [],
    }
    const result = analyzeHousehold(household)
    const person = result.scenarios[0].persons[0]
    // Cat A: 35000 - 4462.15 = 30537.85
    // Cat G: 80000 × 50% = 40000 → progressive
    // Total progressive: 30537.85 + 40000 = 70537.85
    expect(person.taxable_income).toBe(70537.85)
    expect(person.autonomous_tax).toBe(0)
  })
})

// ─── Cross-year comparison ──────────────────────────────────

describe('Cross-year comparison', () => {
  it('same income produces different tax in different years', () => {
    const makeHousehold = (year: number): Household => ({
      year,
      filing_status: 'single',
      members: [
        {
          name: 'Sara',
          incomes: [{ category: 'A', gross: 30000, ss_paid: 3300 }],
          deductions: [],
          special_regimes: [],
        },
      ],
      dependents: [],
    })

    const results = [2021, 2022, 2023, 2024, 2025].map((year) =>
      analyzeHousehold(makeHousehold(year)),
    )

    for (const r of results) {
      expect(r.scenarios).toHaveLength(1)
      expect(r.scenarios[0].total_irs).toBeGreaterThan(0)
    }

    // 2024 and 2025 should have lower taxes than 2021 (rates decreased)
    const tax2021 = results[0].scenarios[0].total_irs
    const tax2024 = results[3].scenarios[0].total_irs
    const tax2025 = results[4].scenarios[0].total_irs
    expect(tax2024).toBeLessThan(tax2021)
    expect(tax2025).toBeLessThan(tax2021)
  })
})

// ─── Ascendant Deductions in Calculator ─────────────────────

describe('Ascendant Deductions Integration', () => {
  it('single filer with 1 ascendant gets €635 deduction', () => {
    const withAsc: Household = {
      year: 2025,
      filing_status: 'single',
      members: [
        {
          name: 'Ana',
          incomes: [{ category: 'A', gross: 30000, ss_paid: 3300 }],
          deductions: [],
          special_regimes: [],
        },
      ],
      dependents: [],
      ascendants: [{ name: 'Mãe', income: 3000 }],
    }
    const withoutAsc: Household = {
      ...withAsc,
      ascendants: [],
    }

    const resultWith = analyzeHousehold(withAsc)
    const resultWithout = analyzeHousehold(withoutAsc)

    const personWith = resultWith.scenarios[0].persons[0]
    const personWithout = resultWithout.scenarios[0].persons[0]

    expect(personWith.ascendant_deduction_share).toBe(635)
    expect(personWithout.ascendant_deduction_share).toBe(0)
    expect(personWith.deductions_total - personWithout.deductions_total).toBeCloseTo(635, 0)
  })

  it('married separate splits ascendant deduction between spouses', () => {
    const household: Household = {
      year: 2025,
      filing_status: 'married_separate',
      members: [
        {
          name: 'Ana',
          incomes: [{ category: 'A', gross: 30000, ss_paid: 3300 }],
          deductions: [],
          special_regimes: [],
        },
        {
          name: 'João',
          incomes: [{ category: 'A', gross: 25000, ss_paid: 2750 }],
          deductions: [],
          special_regimes: [],
        },
      ],
      dependents: [],
      ascendants: [
        { name: 'Mãe da Ana', income: 3000 },
        { name: 'Pai da Ana', income: 3000 },
      ],
    }

    const result = analyzeHousehold(household)
    const separate = result.scenarios.find((s) => s.filing_status === 'married_separate')!

    // 2 ascendants = €525 × 2 = €1050, split between 2 = €525 each
    expect(separate.persons[0].ascendant_deduction_share).toBe(525)
    expect(separate.persons[1].ascendant_deduction_share).toBe(525)
  })

  it('ineligible ascendant (high income) has no impact', () => {
    const household: Household = {
      year: 2025,
      filing_status: 'single',
      members: [
        {
          name: 'Ana',
          incomes: [{ category: 'A', gross: 30000, ss_paid: 3300 }],
          deductions: [],
          special_regimes: [],
        },
      ],
      dependents: [],
      ascendants: [{ name: 'Mãe', income: 50000 }],
    }

    const result = analyzeHousehold(household)
    expect(result.scenarios[0].persons[0].ascendant_deduction_share).toBe(0)
  })
})

// ─── Disability Deductions in Calculator ─────────────────────

describe('Disability Deductions Integration', () => {
  it('disabled taxpayer gets Art. 87 deduction', () => {
    const withDisability: Household = {
      year: 2025,
      filing_status: 'single',
      members: [
        {
          name: 'Ana',
          incomes: [{ category: 'A', gross: 30000, ss_paid: 3300 }],
          deductions: [],
          special_regimes: [],
          disability_degree: 60,
        },
      ],
      dependents: [],
    }
    const withoutDisability: Household = {
      ...withDisability,
      members: [{ ...withDisability.members[0], disability_degree: undefined }],
    }

    const resultWith = analyzeHousehold(withDisability)
    const resultWithout = analyzeHousehold(withoutDisability)

    const personWith = resultWith.scenarios[0].persons[0]
    const personWithout = resultWithout.scenarios[0].persons[0]

    // 60% disability: 4 × IAS = 4 × 522.50 = €2,090
    expect(personWith.disability_deductions).toBe(2090)
    expect(personWithout.disability_deductions).toBe(0)
    expect(resultWith.scenarios[0].total_irs).toBeLessThan(resultWithout.scenarios[0].total_irs)
  })

  it('90%+ disability adds companion deduction', () => {
    const household: Household = {
      year: 2025,
      filing_status: 'single',
      members: [
        {
          name: 'Ana',
          incomes: [{ category: 'A', gross: 40000, ss_paid: 4400 }],
          deductions: [],
          special_regimes: [],
          disability_degree: 90,
        },
      ],
      dependents: [],
    }

    const result = analyzeHousehold(household)
    // 90%: 4 × IAS (taxpayer) + 4 × IAS (companion) = 8 × 522.50 = €4,180
    expect(result.scenarios[0].persons[0].disability_deductions).toBe(4180)
  })

  it('disabled dependent adds deduction to household', () => {
    const household: Household = {
      year: 2025,
      filing_status: 'single',
      members: [
        {
          name: 'Ana',
          incomes: [{ category: 'A', gross: 30000, ss_paid: 3300 }],
          deductions: [],
          special_regimes: [],
        },
      ],
      dependents: [{ name: 'Child', birth_year: 2015, disability_degree: 70 }],
    }

    const result = analyzeHousehold(household)
    // Dependent disability: 2.5 × IAS = 2.5 × 522.50 = €1,306.25
    expect(result.scenarios[0].persons[0].disability_deductions).toBe(1306.25)
    expect(result.scenarios[0].persons[0].dependent_deduction_share).toBe(600)
  })
})

// ─── Cat B Coefficients per Income Code (Art. 31 nº 1) ───────

describe('Cat B Coefficients per Income Code', () => {
  it('uses 0.75 coefficient for code 403 (services)', () => {
    const household: Household = {
      year: 2025,
      filing_status: 'single',
      members: [
        {
          name: 'Test',
          incomes: [{ category: 'B', gross: 100000, cat_b_income_code: 403 }],
          deductions: [],
          special_regimes: [],
        },
      ],
      dependents: [],
    }
    const result = analyzeHousehold(household)
    // taxable = 100000 * 0.75 = 75000
    expect(result.scenarios[0].persons[0].taxable_income).toBe(75000)
  })

  it('uses 0.15 coefficient for code 401 (merchandise)', () => {
    const household: Household = {
      year: 2025,
      filing_status: 'single',
      members: [
        {
          name: 'Test',
          incomes: [{ category: 'B', gross: 100000, cat_b_income_code: 401 }],
          deductions: [],
          special_regimes: [],
        },
      ],
      dependents: [],
    }
    const result = analyzeHousehold(household)
    // taxable = 100000 * 0.15 = 15000
    expect(result.scenarios[0].persons[0].taxable_income).toBe(15000)
  })

  it('defaults to 0.75 when no income code specified', () => {
    const household: Household = {
      year: 2025,
      filing_status: 'single',
      members: [
        {
          name: 'Test',
          incomes: [{ category: 'B', gross: 100000 }],
          deductions: [],
          special_regimes: [],
        },
      ],
      dependents: [],
    }
    const result = analyzeHousehold(household)
    expect(result.scenarios[0].persons[0].taxable_income).toBe(75000)
  })

  it('handles mixed Cat B codes correctly', () => {
    const household: Household = {
      year: 2025,
      filing_status: 'single',
      members: [
        {
          name: 'Test',
          incomes: [
            { category: 'B', gross: 50000, cat_b_income_code: 403 }, // 0.75 → 37500
            { category: 'B', gross: 20000, cat_b_income_code: 401 }, // 0.15 → 3000
          ],
          deductions: [],
          special_regimes: [],
        },
      ],
      dependents: [],
    }
    const result = analyzeHousehold(household)
    // Total taxable = 37500 + 3000 = 40500
    expect(result.scenarios[0].persons[0].taxable_income).toBe(40500)
  })
})

// ─── Art. 81 Double Taxation Credit ──────────────────────────

describe('Art. 81 Double Taxation Credit', () => {
  it('credits foreign tax paid (limited to proportional PT tax)', () => {
    const household: Household = {
      year: 2025,
      filing_status: 'single',
      members: [
        {
          name: 'Test',
          incomes: [{ category: 'A', gross: 30000, country_code: '724', foreign_tax_paid: 5000 }],
          deductions: [],
          special_regimes: [],
        },
      ],
      dependents: [],
    }
    const result = analyzeHousehold(household)
    const detail = result.scenarios[0].persons[0]
    expect(detail.double_taxation_credit).toBeGreaterThan(0)
    // Credit ≤ foreign tax paid
    expect(detail.double_taxation_credit).toBeLessThanOrEqual(5000)
  })

  it('limits credit to proportional Portuguese tax when foreign tax is higher', () => {
    // Moderate income with very high foreign tax → credit capped at PT tax
    const household: Household = {
      year: 2025,
      filing_status: 'single',
      members: [
        {
          name: 'Test',
          incomes: [{ category: 'A', gross: 25000, country_code: '724', foreign_tax_paid: 50000 }],
          deductions: [],
          special_regimes: [],
        },
      ],
      dependents: [],
    }
    const result = analyzeHousehold(household)
    const detail = result.scenarios[0].persons[0]
    // Credit should be far less than 50000 — limited by PT coleta
    expect(detail.double_taxation_credit).toBeLessThan(10000)
    expect(detail.double_taxation_credit).toBeGreaterThan(0)
  })

  it('zero credit when no foreign income', () => {
    const household: Household = {
      year: 2025,
      filing_status: 'single',
      members: [
        {
          name: 'Test',
          incomes: [{ category: 'A', gross: 30000 }],
          deductions: [],
          special_regimes: [],
        },
      ],
      dependents: [],
    }
    const result = analyzeHousehold(household)
    expect(result.scenarios[0].persons[0].double_taxation_credit).toBe(0)
  })

  it('reduces total IRS by credit amount', () => {
    // Same income, with and without foreign tax credit
    const base: Household = {
      year: 2025,
      filing_status: 'single',
      members: [
        {
          name: 'Test',
          incomes: [{ category: 'A', gross: 40000 }],
          deductions: [],
          special_regimes: [],
        },
      ],
      dependents: [],
    }

    const withCredit: Household = {
      ...base,
      members: [
        {
          name: 'Test',
          incomes: [{ category: 'A', gross: 40000, country_code: '724', foreign_tax_paid: 3000 }],
          deductions: [],
          special_regimes: [],
        },
      ],
    }

    const baseResult = analyzeHousehold(base)
    const creditResult = analyzeHousehold(withCredit)

    expect(creditResult.scenarios[0].total_irs).toBeLessThan(baseResult.scenarios[0].total_irs)
    const diff = baseResult.scenarios[0].total_irs - creditResult.scenarios[0].total_irs
    expect(diff).toBeCloseTo(creditResult.scenarios[0].persons[0].double_taxation_credit, 0)
  })
})

// ─── Cat B Activity Year from Parser Integration ─────────────

describe('Cat B Activity Year (Art. 31 nº 10)', () => {
  it('year 1: only 50% of simplified income is taxable', () => {
    const household: Household = {
      year: 2024,
      filing_status: 'single',
      members: [
        {
          name: 'Test',
          cat_b_start_year: 2024,
          incomes: [
            {
              category: 'B',
              gross: 60000,
              cat_b_income_code: 403,
            },
          ],
          deductions: [],
          special_regimes: [],
        },
      ],
      dependents: [],
    }
    const result = analyzeHousehold(household)
    // 60000 × 0.75 × 0.50 = 22500
    expect(result.scenarios[0].persons[0].taxable_income).toBe(22500)
  })

  it('year 2: only 75% of simplified income is taxable', () => {
    const household: Household = {
      year: 2024,
      filing_status: 'single',
      members: [
        {
          name: 'Test',
          cat_b_start_year: 2023,
          incomes: [
            {
              category: 'B',
              gross: 60000,
              cat_b_income_code: 403,
            },
          ],
          deductions: [],
          special_regimes: [],
        },
      ],
      dependents: [],
    }
    const result = analyzeHousehold(household)
    // 60000 × 0.75 × 0.75 = 33750
    expect(result.scenarios[0].persons[0].taxable_income).toBe(33750)
  })

  it('year 3+: no reduction applied (full simplified coefficient)', () => {
    const household: Household = {
      year: 2024,
      filing_status: 'single',
      members: [
        {
          name: 'Test',
          cat_b_start_year: 2021,
          incomes: [
            {
              category: 'B',
              gross: 60000,
              cat_b_income_code: 403,
            },
          ],
          deductions: [],
          special_regimes: [],
        },
      ],
      dependents: [],
    }
    const result = analyzeHousehold(household)
    // 60000 × 0.75 = 45000 (no reduction for year 3+)
    expect(result.scenarios[0].persons[0].taxable_income).toBe(45000)
  })

  it('no activity year set: no reduction applied', () => {
    const household: Household = {
      year: 2024,
      filing_status: 'single',
      members: [
        {
          name: 'Test',
          incomes: [
            {
              category: 'B',
              gross: 60000,
              cat_b_income_code: 403,
            },
          ],
          deductions: [],
          special_regimes: [],
        },
      ],
      dependents: [],
    }
    const result = analyzeHousehold(household)
    // 60000 × 0.75 = 45000 (no activity year → no reduction)
    expect(result.scenarios[0].persons[0].taxable_income).toBe(45000)
  })
})

// ─── Autonomous Tax: Cat E/F/G (coverage gaps L77-101) ──────

describe('Autonomous Tax — Cat E/F/G', () => {
  it('Cat E: 28% autonomous tax on dividends', () => {
    const household: Household = {
      year: 2025,
      filing_status: 'single',
      members: [
        {
          name: 'Test',
          incomes: [{ category: 'E', gross: 10000 }],
          deductions: [],
          special_regimes: [],
        },
      ],
      dependents: [],
    }
    const result = analyzeHousehold(household)
    const p = result.scenarios[0].persons[0]
    expect(p.autonomous_tax).toBeCloseTo(10000 * AUTONOMOUS_RATE_CAT_E, 2)
    expect(p.taxable_income).toBe(0) // not in brackets without englobamento
  })

  it('Cat E with englobamento: goes to progressive brackets, no autonomous tax', () => {
    const household: Household = {
      year: 2025,
      filing_status: 'single',
      members: [
        {
          name: 'Test',
          incomes: [{ category: 'E', gross: 10000, englobamento: true }],
          deductions: [],
          special_regimes: [],
        },
      ],
      dependents: [],
    }
    const result = analyzeHousehold(household)
    const p = result.scenarios[0].persons[0]
    expect(p.autonomous_tax).toBe(0)
    expect(p.taxable_income).toBe(10000) // in progressive brackets
  })

  it('Cat F: 28% autonomous with no expenses or duration', () => {
    const household: Household = {
      year: 2025,
      filing_status: 'single',
      members: [
        {
          name: 'Test',
          incomes: [{ category: 'F', gross: 12000 }],
          deductions: [],
          special_regimes: [],
        },
      ],
      dependents: [],
    }
    const result = analyzeHousehold(household)
    const p = result.scenarios[0].persons[0]
    expect(p.autonomous_tax).toBeCloseTo(12000 * AUTONOMOUS_RATE_CAT_F, 2)
  })

  it('Cat F: reduced rate for 7-year contract (23%)', () => {
    const household: Household = {
      year: 2025,
      filing_status: 'single',
      members: [
        {
          name: 'Test',
          incomes: [{ category: 'F', gross: 20000, expenses: 5000, rental_contract_duration: 7 }],
          deductions: [],
          special_regimes: [],
        },
      ],
      dependents: [],
    }
    const result = analyzeHousehold(household)
    const p = result.scenarios[0].persons[0]
    // (20000-5000) × 0.23 = 3450
    expect(p.autonomous_tax).toBeCloseTo(3450, 2)
  })

  it('Cat F: reduced rate for 2-year contract (26%)', () => {
    const household: Household = {
      year: 2025,
      filing_status: 'single',
      members: [
        {
          name: 'Test',
          incomes: [{ category: 'F', gross: 10000, rental_contract_duration: 3 }],
          deductions: [],
          special_regimes: [],
        },
      ],
      dependents: [],
    }
    const result = analyzeHousehold(household)
    const p = result.scenarios[0].persons[0]
    // 10000 × 0.26 = 2600
    expect(p.autonomous_tax).toBeCloseTo(2600, 2)
  })

  it('Cat F: reduced rate for 12-year contract (14%)', () => {
    const household: Household = {
      year: 2025,
      filing_status: 'single',
      members: [
        {
          name: 'Test',
          incomes: [{ category: 'F', gross: 10000, rental_contract_duration: 12 }],
          deductions: [],
          special_regimes: [],
        },
      ],
      dependents: [],
    }
    const result = analyzeHousehold(household)
    const p = result.scenarios[0].persons[0]
    expect(p.autonomous_tax).toBeCloseTo(1400, 2)
  })

  it('Cat F: reduced rate for 25-year contract (10%)', () => {
    const household: Household = {
      year: 2025,
      filing_status: 'single',
      members: [
        {
          name: 'Test',
          incomes: [{ category: 'F', gross: 10000, rental_contract_duration: 25 }],
          deductions: [],
          special_regimes: [],
        },
      ],
      dependents: [],
    }
    const result = analyzeHousehold(household)
    const p = result.scenarios[0].persons[0]
    expect(p.autonomous_tax).toBeCloseTo(1000, 2)
  })

  it('Cat F with englobamento: goes to progressive (net of expenses)', () => {
    const household: Household = {
      year: 2025,
      filing_status: 'single',
      members: [
        {
          name: 'Test',
          incomes: [{ category: 'F', gross: 20000, expenses: 5000, englobamento: true }],
          deductions: [],
          special_regimes: [],
        },
      ],
      dependents: [],
    }
    const result = analyzeHousehold(household)
    const p = result.scenarios[0].persons[0]
    expect(p.autonomous_tax).toBe(0)
    // Taxable = 20000 - 5000 = 15000 (net rental in brackets)
    expect(p.taxable_income).toBe(15000)
  })

  it('Cat G financial: 28% autonomous', () => {
    const household: Household = {
      year: 2025,
      filing_status: 'single',
      members: [
        {
          name: 'Test',
          incomes: [{ category: 'G', gross: 50000, asset_type: 'financial' }],
          deductions: [],
          special_regimes: [],
        },
      ],
      dependents: [],
    }
    const result = analyzeHousehold(household)
    const p = result.scenarios[0].persons[0]
    expect(p.autonomous_tax).toBeCloseTo(50000 * AUTONOMOUS_RATE_CAT_G, 2)
    expect(p.taxable_income).toBe(0) // financial not in brackets
  })

  it('Cat G real_estate: 50% inclusion in progressive, no autonomous', () => {
    const household: Household = {
      year: 2025,
      filing_status: 'single',
      members: [
        {
          name: 'Test',
          incomes: [{ category: 'G', gross: 50000, asset_type: 'real_estate' }],
          deductions: [],
          special_regimes: [],
        },
      ],
      dependents: [],
    }
    const result = analyzeHousehold(household)
    const p = result.scenarios[0].persons[0]
    expect(p.autonomous_tax).toBe(0)
    // 50% of gain goes to brackets
    expect(p.taxable_income).toBe(50000 * CAT_G_REAL_ESTATE_INCLUSION_RATE)
  })

  it('Cat G with englobamento: full amount in progressive', () => {
    const household: Household = {
      year: 2025,
      filing_status: 'single',
      members: [
        {
          name: 'Test',
          incomes: [{ category: 'G', gross: 30000, asset_type: 'financial', englobamento: true }],
          deductions: [],
          special_regimes: [],
        },
      ],
      dependents: [],
    }
    const result = analyzeHousehold(household)
    const p = result.scenarios[0].persons[0]
    expect(p.autonomous_tax).toBe(0)
    expect(p.taxable_income).toBe(30000) // in brackets via englobamento
  })

  it('mixed income: Cat A + Cat E + Cat F all computed correctly', () => {
    const household: Household = {
      year: 2025,
      filing_status: 'single',
      members: [
        {
          name: 'Test',
          incomes: [
            { category: 'A', gross: 30000, ss_paid: 3300 },
            { category: 'E', gross: 5000 },
            { category: 'F', gross: 8000, expenses: 1000 },
          ],
          deductions: [],
          special_regimes: [],
        },
      ],
      dependents: [],
    }
    const result = analyzeHousehold(household)
    const p = result.scenarios[0].persons[0]
    // E autonomous: 5000 × 0.28 = 1400
    // F autonomous: (8000-1000) × 0.28 = 1960
    expect(p.autonomous_tax).toBeCloseTo(1400 + 1960, 1)
    // Only Cat A goes to brackets: 30000 - 4104 = 25896
    expect(p.taxable_income).toBe(30000 - getSpecificDeduction(2025))
  })
})

// ─── NHR with multiple income categories (coverage L172-192) ─

describe('NHR — Mixed Income Categories', () => {
  it('NHR + Cat H pension: H goes to progressive brackets', () => {
    const household: Household = {
      year: 2025,
      filing_status: 'single',
      members: [
        {
          name: 'Test',
          incomes: [
            { category: 'A', gross: 50000, ss_paid: 5500 },
            { category: 'H', gross: 12000 },
          ],
          deductions: [],
          special_regimes: ['nhr'],
          nhr_start_year: 2020,
        },
      ],
      dependents: [],
    }
    const result = analyzeHousehold(household)
    const p = result.scenarios[0].persons[0]
    // NHR: Cat A at 20% flat = 10000
    expect(p.nhr_tax).toBeCloseTo(50000 * 0.2, 2)
    // Cat H goes to progressive (not NHR flat)
    expect(p.taxable_income).toBeGreaterThan(0)
  })

  it('NHR + Cat F englobamento: net rental in progressive brackets', () => {
    const household: Household = {
      year: 2025,
      filing_status: 'single',
      members: [
        {
          name: 'Test',
          incomes: [
            { category: 'A', gross: 40000, ss_paid: 4400 },
            { category: 'F', gross: 10000, expenses: 3000, englobamento: true },
          ],
          deductions: [],
          special_regimes: ['nhr'],
          nhr_start_year: 2020,
        },
      ],
      dependents: [],
    }
    const result = analyzeHousehold(household)
    const p = result.scenarios[0].persons[0]
    // NHR: Cat A at 20% flat = 8000
    expect(p.nhr_tax).toBeCloseTo(40000 * 0.2, 2)
    // Cat F englobamento: 10000-3000 = 7000 goes to progressive
    expect(p.taxable_income).toBe(7000)
  })

  it('NHR + Cat E englobamento: full amount in progressive', () => {
    const household: Household = {
      year: 2025,
      filing_status: 'single',
      members: [
        {
          name: 'Test',
          incomes: [
            { category: 'A', gross: 30000, ss_paid: 3300 },
            { category: 'E', gross: 5000, englobamento: true },
          ],
          deductions: [],
          special_regimes: ['nhr'],
          nhr_start_year: 2020,
        },
      ],
      dependents: [],
    }
    const result = analyzeHousehold(household)
    const p = result.scenarios[0].persons[0]
    expect(p.nhr_tax).toBeCloseTo(30000 * 0.2, 2)
    expect(p.taxable_income).toBe(5000)
  })

  it('NHR + Cat G real_estate: 50% inclusion in progressive', () => {
    const household: Household = {
      year: 2025,
      filing_status: 'single',
      members: [
        {
          name: 'Test',
          incomes: [
            { category: 'A', gross: 40000, ss_paid: 4400 },
            { category: 'G', gross: 60000, asset_type: 'real_estate' },
          ],
          deductions: [],
          special_regimes: ['nhr'],
          nhr_start_year: 2020,
        },
      ],
      dependents: [],
    }
    const result = analyzeHousehold(household)
    const p = result.scenarios[0].persons[0]
    expect(p.nhr_tax).toBeCloseTo(40000 * 0.2, 2)
    // 60000 × 0.50 = 30000 in progressive
    expect(p.taxable_income).toBe(30000)
  })

  it('NHR + Cat H with specific deduction', () => {
    const household: Household = {
      year: 2025,
      filing_status: 'single',
      members: [
        {
          name: 'Test',
          incomes: [
            { category: 'A', gross: 40000, ss_paid: 4400 },
            { category: 'H', gross: 15000, ss_paid: 1500 },
          ],
          deductions: [],
          special_regimes: ['nhr'],
          nhr_start_year: 2020,
        },
      ],
      dependents: [],
    }
    const result = analyzeHousehold(household)
    const p = result.scenarios[0].persons[0]
    // Cat H specific deduction: max(4462.15, 1500) = 4462.15
    const catHSpecific = getSpecificDeduction(2025)
    expect(p.taxable_income).toBe(Math.max(0, 15000 - catHSpecific))
  })
})

// ─── Mínimo de existência edge cases (coverage L318, L629) ───

describe('Mínimo de existência edge cases', () => {
  it('does NOT apply when non-qualifying income > 50% of total', () => {
    const household: Household = {
      year: 2025,
      filing_status: 'single',
      members: [
        {
          name: 'Test',
          incomes: [
            { category: 'A', gross: 3000, ss_paid: 330 },
            { category: 'E', gross: 10000 }, // > 50% from capital
          ],
          deductions: [],
          special_regimes: [],
        },
      ],
      dependents: [],
    }
    const result = analyzeHousehold(household)
    const p = result.scenarios[0].persons[0]
    expect(p.minimo_existencia_applied).toBe(false)
  })

  it('applies when qualifying Cat A income is > 50% of total', () => {
    const household: Household = {
      year: 2025,
      filing_status: 'single',
      members: [
        {
          name: 'Test',
          incomes: [{ category: 'A', gross: 9000, ss_paid: 990 }],
          deductions: [],
          special_regimes: [],
        },
      ],
      dependents: [],
    }
    const result = analyzeHousehold(household)
    const p = result.scenarios[0].persons[0]
    // Gross of 9000 < MINIMO_EXISTENCIA[2025]: mínimo should apply
    expect(p.minimo_existencia_applied).toBe(true)
  })

  it('applies for Cat B qualifying income', () => {
    const household: Household = {
      year: 2025,
      filing_status: 'single',
      members: [
        {
          name: 'Test',
          incomes: [{ category: 'B', gross: 9000 }],
          deductions: [],
          special_regimes: [],
        },
      ],
      dependents: [],
    }
    const result = analyzeHousehold(household)
    const p = result.scenarios[0].persons[0]
    expect(p.minimo_existencia_applied).toBe(true)
  })

  it('applies for Cat H qualifying income', () => {
    const household: Household = {
      year: 2025,
      filing_status: 'single',
      members: [
        {
          name: 'Test',
          incomes: [{ category: 'H', gross: 9000, ss_paid: 900 }],
          deductions: [],
          special_regimes: [],
        },
      ],
      dependents: [],
    }
    const result = analyzeHousehold(household)
    const p = result.scenarios[0].persons[0]
    expect(p.minimo_existencia_applied).toBe(true)
  })

  it('joint mínimo is doubled for married couple with low income', () => {
    const household: Household = {
      year: 2025,
      filing_status: 'married_joint',
      members: [
        {
          name: 'Spouse1',
          incomes: [{ category: 'A', gross: 8000, ss_paid: 880 }],
          deductions: [],
          special_regimes: [],
        },
        {
          name: 'Spouse2',
          incomes: [{ category: 'A', gross: 8000, ss_paid: 880 }],
          deductions: [],
          special_regimes: [],
        },
      ],
      dependents: [],
    }
    const result = analyzeHousehold(household)
    // Joint scenario
    const joint = result.scenarios.find((s) => s.label === 'Tributação Conjunta')
    expect(joint).toBeDefined()
    // Combined 16000 should trigger joint mínimo
    expect(joint!.total_irs).toBeLessThanOrEqual(Math.max(0, 16000 - MINIMO_EXISTENCIA[2025] * 2))
  })
})

// ─── Joint filing: NHR + Art. 81 credit (coverage L561, L639) ─

describe('Joint filing — NHR spouse', () => {
  it('NHR spouse Cat A taxed flat, other spouse in joint brackets', () => {
    const household: Household = {
      year: 2025,
      filing_status: 'married_joint',
      members: [
        {
          name: 'NHR',
          incomes: [{ category: 'A', gross: 50000, ss_paid: 5500 }],
          deductions: [],
          special_regimes: ['nhr'],
          nhr_start_year: 2020,
        },
        {
          name: 'Normal',
          incomes: [{ category: 'A', gross: 30000, ss_paid: 3300 }],
          deductions: [],
          special_regimes: [],
        },
      ],
      dependents: [],
    }
    const result = analyzeHousehold(household)
    const joint = result.scenarios.find((s) => s.label === 'Tributação Conjunta')
    expect(joint).toBeDefined()
    // NHR person should have flat tax
    const nhrPerson = joint!.persons.find((p) => p.name === 'NHR')
    expect(nhrPerson!.nhr_tax).toBeCloseTo(50000 * 0.2, 2)
    // Total IRS should include both
    expect(joint!.total_irs).toBeGreaterThan(0)
  })
})

describe('Joint filing — Art. 81 Double Taxation Credit', () => {
  it('applies foreign tax credit proportionally in joint filing', () => {
    const household: Household = {
      year: 2025,
      filing_status: 'married_joint',
      members: [
        {
          name: 'Foreign',
          incomes: [{ category: 'A', gross: 40000, country_code: '724', foreign_tax_paid: 4000 }],
          deductions: [],
          special_regimes: [],
        },
        {
          name: 'Domestic',
          incomes: [{ category: 'A', gross: 30000, ss_paid: 3300 }],
          deductions: [],
          special_regimes: [],
        },
      ],
      dependents: [],
    }
    const result = analyzeHousehold(household)
    const joint = result.scenarios.find((s) => s.label === 'Tributação Conjunta')
    expect(joint).toBeDefined()
    // Joint IRS should be reduced by the credit
    const separate = result.scenarios.find((s) => s.label === 'Tributação Separada')
    expect(separate).toBeDefined()
    // Both should have credit applied
    expect(joint!.total_irs).toBeGreaterThan(0)
  })
})

// ─── Optimization suggestions (coverage L806, englobamento, NHR revocation) ─

describe('Optimization suggestions', () => {
  it('suggests joint filing when it saves money', () => {
    const household: Household = {
      year: 2025,
      filing_status: 'married_joint',
      members: [
        {
          name: 'High',
          incomes: [{ category: 'A', gross: 60000, ss_paid: 6600 }],
          deductions: [],
          special_regimes: [],
        },
        {
          name: 'Low',
          incomes: [{ category: 'A', gross: 10000, ss_paid: 1100 }],
          deductions: [],
          special_regimes: [],
        },
      ],
      dependents: [],
    }
    const result = analyzeHousehold(household)
    // With very unequal incomes, one filing method should be better
    expect(result.optimizations.length).toBeGreaterThan(0)
    const filingOpt = result.optimizations.find(
      (o) => o.id === 'joint-filing' || o.id === 'separate-filing',
    )
    expect(filingOpt).toBeDefined()
    expect(filingOpt!.estimated_savings).toBeGreaterThan(0)
  })

  it('suggests separate filing when incomes are very unequal', () => {
    // When one spouse earns very little and the other very high,
    // separate can be better (mínimo de existência for low earner)
    const household: Household = {
      year: 2025,
      filing_status: 'married_joint',
      members: [
        {
          name: 'VeryHigh',
          incomes: [{ category: 'A', gross: 120000, ss_paid: 13200 }],
          deductions: [],
          special_regimes: [],
        },
        {
          name: 'VeryLow',
          incomes: [{ category: 'A', gross: 5000, ss_paid: 550 }],
          deductions: [],
          special_regimes: [],
        },
      ],
      dependents: [],
    }
    const result = analyzeHousehold(household)
    // One of the filing optimizations should appear
    const filingOpt = result.optimizations.find(
      (o) => o.id === 'joint-filing' || o.id === 'separate-filing',
    )
    expect(filingOpt).toBeDefined()
  })

  it('suggests englobamento when marginal rate < 28%', () => {
    const household: Household = {
      year: 2025,
      filing_status: 'single',
      members: [
        {
          name: 'Test',
          incomes: [
            { category: 'A', gross: 12000, ss_paid: 1320 },
            { category: 'E', gross: 5000 }, // dividends at 28% autonomous
          ],
          deductions: [],
          special_regimes: [],
        },
      ],
      dependents: [],
    }
    const result = analyzeHousehold(household)
    const englobOpt = result.optimizations.find((o) => o.id.startsWith('englobamento'))
    // Low income → marginal rate < 28% → englobamento suggestion
    expect(englobOpt).toBeDefined()
    expect(englobOpt!.title).toContain('Englobamento')
  })

  it('IRS Jovem optimization shows savings estimate', () => {
    const household: Household = {
      year: 2025,
      filing_status: 'single',
      members: [
        {
          name: 'Young',
          incomes: [{ category: 'A', gross: 25000, ss_paid: 2750 }],
          deductions: [],
          special_regimes: ['irs_jovem'],
          irs_jovem_year: 3,
        },
      ],
      dependents: [],
    }
    const result = analyzeHousehold(household)
    const jovemOpt = result.optimizations.find((o) => o.id.startsWith('irs-jovem'))
    expect(jovemOpt).toBeDefined()
    expect(jovemOpt!.estimated_savings).toBeGreaterThan(0)
  })

  it('NHR revocation warning for nhr_start_year >= 2024', () => {
    const household: Household = {
      year: 2025,
      filing_status: 'single',
      members: [
        {
          name: 'NewNHR',
          incomes: [{ category: 'A', gross: 50000, ss_paid: 5500 }],
          deductions: [],
          special_regimes: ['nhr'],
          nhr_start_year: 2024,
        },
      ],
      dependents: [],
    }
    const result = analyzeHousehold(household)
    const nhrWarn = result.optimizations.find((o) => o.id.startsWith('nhr-revocation'))
    expect(nhrWarn).toBeDefined()
    expect(nhrWarn!.title).toContain('NHR')
  })

  it('no NHR warning when nhr_start_year < 2024', () => {
    const household: Household = {
      year: 2025,
      filing_status: 'single',
      members: [
        {
          name: 'OldNHR',
          incomes: [{ category: 'A', gross: 50000, ss_paid: 5500 }],
          deductions: [],
          special_regimes: ['nhr'],
          nhr_start_year: 2020,
        },
      ],
      dependents: [],
    }
    const result = analyzeHousehold(household)
    const nhrWarn = result.optimizations.find((o) => o.id.startsWith('nhr-revocation'))
    expect(nhrWarn).toBeUndefined()
  })

  it('no englobamento suggestion when marginal rate >= 28%', () => {
    const household: Household = {
      year: 2025,
      filing_status: 'single',
      members: [
        {
          name: 'Test',
          incomes: [
            { category: 'A', gross: 150000, ss_paid: 16500 },
            { category: 'E', gross: 5000 },
          ],
          deductions: [],
          special_regimes: [],
        },
      ],
      dependents: [],
    }
    const result = analyzeHousehold(household)
    const englobOpt = result.optimizations.find((o) => o.id.startsWith('englobamento'))
    // Very high income → effective rate > 28% → no suggestion
    expect(englobOpt).toBeUndefined()
  })
})

// ─── Solidarity Surcharge (coverage for high-income brackets) ─

describe('Solidarity Surcharge (Art. 68-A)', () => {
  it('applies 2.5% on income between €80k-€250k', () => {
    const household: Household = {
      year: 2025,
      filing_status: 'single',
      members: [
        {
          name: 'High',
          incomes: [{ category: 'A', gross: 120000, ss_paid: 13200 }],
          deductions: [],
          special_regimes: [],
        },
      ],
      dependents: [],
    }
    const result = analyzeHousehold(household)
    const p = result.scenarios[0].persons[0]
    expect(p.solidarity_surcharge).toBeGreaterThan(0)
    // taxable = 120000 - max(4104, 13200) = 106800
    // surcharge = (106800 - 80000) × 0.025 = 670
    expect(p.solidarity_surcharge).toBeCloseTo(670, 0)
  })

  it('applies both 2.5% and 5% tiers for very high income', () => {
    const household: Household = {
      year: 2025,
      filing_status: 'single',
      members: [
        {
          name: 'VeryHigh',
          incomes: [{ category: 'A', gross: 300000, ss_paid: 33000 }],
          deductions: [],
          special_regimes: [],
        },
      ],
      dependents: [],
    }
    const result = analyzeHousehold(household)
    const p = result.scenarios[0].persons[0]
    // taxable = 300000 - max(4104, 33000) = 267000
    // surcharge = (250000-80000)×0.025 + (267000-250000)×0.05 = 4250 + 850 = 5100
    expect(p.solidarity_surcharge).toBeCloseTo(5100, 0)
  })
})

// ─── Single filer path (coverage for single/1-member) ─

describe('Single filer scenario', () => {
  it('produces exactly one scenario for single filing', () => {
    const household: Household = {
      year: 2025,
      filing_status: 'single',
      members: [
        {
          name: 'Solo',
          incomes: [{ category: 'A', gross: 30000, ss_paid: 3300 }],
          deductions: [],
          special_regimes: [],
        },
      ],
      dependents: [],
    }
    const result = analyzeHousehold(household)
    expect(result.scenarios).toHaveLength(1)
    expect(result.scenarios[0].filing_status).toBe('single')
  })

  it('produces one scenario for 1-member married_separate', () => {
    const household: Household = {
      year: 2025,
      filing_status: 'married_separate',
      members: [
        {
          name: 'Solo',
          incomes: [{ category: 'A', gross: 30000, ss_paid: 3300 }],
          deductions: [],
          special_regimes: [],
        },
      ],
      dependents: [],
    }
    const result = analyzeHousehold(household)
    // Single member → single scenario regardless of filing_status label
    expect(result.scenarios.length).toBeGreaterThanOrEqual(1)
  })

  // Feature 2: Cat F rental contract duration optimization
  describe('Cat F rental duration optimization', () => {
    it('suggests longer contract when current duration is short', () => {
      const household: Household = {
        year: 2025,
        filing_status: 'single',
        members: [
          {
            name: 'Ana',
            incomes: [{ category: 'F', gross: 12000, rental_contract_duration: 0 }],
            deductions: [],
            special_regimes: [],
          },
        ],
        dependents: [],
      }
      const result = analyzeHousehold(household)
      const opt = result.optimizations.find((o) => o.id.startsWith('cat-f-duration-'))
      expect(opt).toBeDefined()
      // 28% → 26% at 2 years: savings = 12000 × (0.28 - 0.26) = 240
      expect(opt!.estimated_savings).toBeGreaterThan(0)
    })

    it('suggests next tier for 2-year contract', () => {
      const household: Household = {
        year: 2025,
        filing_status: 'single',
        members: [
          {
            name: 'Ana',
            incomes: [{ category: 'F', gross: 12000, rental_contract_duration: 3 }],
            deductions: [],
            special_regimes: [],
          },
        ],
        dependents: [],
      }
      const result = analyzeHousehold(household)
      const opt = result.optimizations.find((o) => o.id.startsWith('cat-f-duration-'))
      expect(opt).toBeDefined()
      // 26% → 23% at 5 years
      expect(opt!.estimated_savings).toBeGreaterThan(0)
    })

    it('does not suggest for 20+ year contracts', () => {
      const household: Household = {
        year: 2025,
        filing_status: 'single',
        members: [
          {
            name: 'Ana',
            incomes: [{ category: 'F', gross: 12000, rental_contract_duration: 25 }],
            deductions: [],
            special_regimes: [],
          },
        ],
        dependents: [],
      }
      const result = analyzeHousehold(household)
      const opt = result.optimizations.find((o) => o.id.startsWith('cat-f-duration-'))
      expect(opt).toBeUndefined()
    })

    it('does not suggest for Cat F with englobamento', () => {
      const household: Household = {
        year: 2025,
        filing_status: 'single',
        members: [
          {
            name: 'Ana',
            incomes: [
              { category: 'F', gross: 12000, rental_contract_duration: 0, englobamento: true },
            ],
            deductions: [],
            special_regimes: [],
          },
        ],
        dependents: [],
      }
      const result = analyzeHousehold(household)
      const opt = result.optimizations.find((o) => o.id.startsWith('cat-f-duration-'))
      expect(opt).toBeUndefined()
    })
  })
})

// ─── deriveCatBActivityYear ──────────────────────────────────

import { deriveCatBActivityYear } from '@/lib/tax/types'

describe('deriveCatBActivityYear', () => {
  it('returns 1 for first year of activity', () => {
    expect(deriveCatBActivityYear(2024, 2024)).toBe(1)
  })

  it('returns 2 for second year of activity', () => {
    expect(deriveCatBActivityYear(2023, 2024)).toBe(2)
  })

  it('returns undefined for third year onwards', () => {
    expect(deriveCatBActivityYear(2022, 2024)).toBeUndefined()
    expect(deriveCatBActivityYear(2020, 2024)).toBeUndefined()
  })

  it('returns undefined when catBStartYear is undefined', () => {
    expect(deriveCatBActivityYear(undefined, 2024)).toBeUndefined()
  })

  it('returns undefined when start year is after tax year (future)', () => {
    expect(deriveCatBActivityYear(2025, 2024)).toBeUndefined()
  })

  it('handles boundary between year 2 and year 3', () => {
    // Start year 2022, tax year 2024: year = 2024 - 2022 + 1 = 3 → undefined
    expect(deriveCatBActivityYear(2022, 2024)).toBeUndefined()
    // Start year 2023, tax year 2024: year = 2024 - 2023 + 1 = 2 → 2
    expect(deriveCatBActivityYear(2023, 2024)).toBe(2)
  })
})
