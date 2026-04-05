import type { AnalysisResult, Household, Income, PersonTaxDetail } from './types'
import { SS_EMPLOYEE_RATE, SS_INDEPENDENT_BASE_RATIO, SS_INDEPENDENT_RATE } from './types'
import { getIrsJovemRegime } from './irs-jovem'
import { round2 } from './utils'

const CAT_B_RETENTION_RATE = 0.25
const PPC_STANDARD_RATE = 0.765
const PPC_NEW_ACTIVITY_RATE = 0.51

/**
 * Build a projected household for the next tax year based on primary year data.
 *
 * - Bumps year by 1, sets projected = true
 * - Strips withholding and ss_paid (unknown for future — use estimateProjectedRetentions after)
 * - Increments irs_jovem_year (drops if exceeds max benefit years)
 * - Increments cat_b_activity_year (drops if exceeds 2)
 * - Applies user-adjusted gross incomes by NIF if provided
 */
export function buildProjectedHousehold(
  primary: Household,
  adjustedIncomes?: Map<string, Income[]>,
): Household {
  const projectedYear = primary.year + 1
  const regime = getIrsJovemRegime(projectedYear)
  const maxBenefitYears = regime?.maxBenefitYears ?? 10

  return {
    year: projectedYear,
    filing_status: primary.filing_status,
    projected: true,
    dependents: primary.dependents.map((d) => ({ ...d })),
    ascendants: primary.ascendants?.map((a) => ({ ...a })),
    members: primary.members.map((member) => {
      const adjusted = member.nif ? adjustedIncomes?.get(member.nif) : undefined

      const newIrsJovemYear = member.irs_jovem_year ? member.irs_jovem_year + 1 : undefined
      const irsJovemActive = newIrsJovemYear !== undefined && newIrsJovemYear <= maxBenefitYears

      return {
        ...member,
        irs_jovem_year: irsJovemActive ? newIrsJovemYear : undefined,
        special_regimes: irsJovemActive
          ? member.special_regimes
          : member.special_regimes.filter((r) => r !== 'irs_jovem'),
        incomes: (adjusted ?? member.incomes).map((income) => {
          const { withholding: _, ss_paid: _ss, ...rest } = income

          // Increment cat_b_activity_year, drop if > 2
          let activityYear = rest.cat_b_activity_year
          if (activityYear !== undefined) {
            activityYear = activityYear + 1
            if (activityYear > 2) activityYear = undefined
          }

          return { ...rest, cat_b_activity_year: activityYear }
        }),
        deductions: member.deductions.map((d) => ({ ...d })),
      }
    }),
  }
}

function personTotalIrs(p: PersonTaxDetail): number {
  return p.irs_after_deductions + p.autonomous_tax + p.solidarity_surcharge + p.nhr_tax
}

/**
 * Compute PPC (Pagamento Por Conta) per Art. 102 CIRS.
 * PPC = max(0, coleta_líquida - retenções) × rate
 * Rate is 76.5% normally, 51% for first 2 years of activity.
 */
function computePpc(
  primaryPerson: PersonTaxDetail,
  projectedActivityYear: number | undefined,
): number {
  const totalIrs = personTotalIrs(primaryPerson)
  const base = Math.max(0, totalIrs - primaryPerson.withholding_total)
  if (base <= 0) return 0
  const isNewActivity = projectedActivityYear !== undefined && projectedActivityYear <= 2
  const rate = isNewActivity ? PPC_NEW_ACTIVITY_RATE : PPC_STANDARD_RATE
  return round2(base * rate)
}

/**
 * Estimate withholding and SS for a projected household based on primary year data.
 *
 * Cat A: withholding = projected_gross × (primary_withholding / primary_gross), SS = 11%
 * Cat B: withholding = 25% × gross + PPC, SS = 70% × gross × 21.4%
 * Other categories: no estimation (withholding/ss_paid remain undefined)
 *
 * Returns a new Household — does not mutate the input.
 */
export function estimateProjectedRetentions(
  projected: Household,
  primary: Household,
  primaryResult: AnalysisResult,
): Household {
  // Build a NIF→primary incomes lookup
  const primaryIncomesByNif = new Map<string, Income[]>()
  for (const member of primary.members) {
    if (member.nif) primaryIncomesByNif.set(member.nif, member.incomes)
  }

  // Build a NIF→primary PersonTaxDetail lookup from recommended scenario
  const recommendedScenario = primaryResult.scenarios.find(
    (s) => s.label === primaryResult.recommended_scenario,
  )
  const primaryDetailByName = new Map<string, PersonTaxDetail>()
  if (recommendedScenario) {
    for (const person of recommendedScenario.persons) {
      primaryDetailByName.set(person.name, person)
    }
  }

  return {
    ...projected,
    members: projected.members.map((member) => {
      const primaryIncomes = member.nif ? primaryIncomesByNif.get(member.nif) : undefined
      const primaryDetail = primaryDetailByName.get(member.name)

      // Build category→aggregated primary income for effective rate estimation
      const primaryByCategory = new Map<string, { totalGross: number; totalWithholding: number }>()
      if (primaryIncomes) {
        for (const pi of primaryIncomes) {
          const prev = primaryByCategory.get(pi.category) ?? { totalGross: 0, totalWithholding: 0 }
          prev.totalGross += pi.gross
          prev.totalWithholding += pi.withholding ?? 0
          primaryByCategory.set(pi.category, prev)
        }
      }

      return {
        ...member,
        incomes: member.incomes.map((income) => {
          if (income.category === 'A') {
            const primary = primaryByCategory.get('A')
            const effectiveRate =
              primary && primary.totalGross > 0 ? primary.totalWithholding / primary.totalGross : 0
            return {
              ...income,
              withholding: round2(income.gross * effectiveRate),
              ss_paid: round2(income.gross * SS_EMPLOYEE_RATE),
            }
          }

          if (income.category === 'B') {
            const baseWithholding = round2(income.gross * CAT_B_RETENTION_RATE)
            const ppc = primaryDetail ? computePpc(primaryDetail, income.cat_b_activity_year) : 0
            return {
              ...income,
              withholding: round2(baseWithholding + ppc),
              ss_paid: round2(income.gross * SS_INDEPENDENT_BASE_RATIO * SS_INDEPENDENT_RATE),
            }
          }

          // Cat E/F/G/H: no estimation
          return { ...income }
        }),
        deductions: member.deductions.map((d) => ({ ...d })),
      }
    }),
    dependents: projected.dependents.map((d) => ({ ...d })),
    ascendants: projected.ascendants?.map((a) => ({ ...a })),
  }
}
