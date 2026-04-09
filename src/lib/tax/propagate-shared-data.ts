import { getIrsJovemRegime } from './irs-jovem'
import type { Dependent, Household, Person } from './types'

/**
 * Match a member to the same person in another household by NIF or name.
 * NIF takes priority (exact match). Name match is case-insensitive.
 * Returns undefined if no match found — caller must handle gracefully.
 */
export function findMatchingMember(
  member: Person,
  others: Person[],
  positionHint?: number,
): Person | undefined {
  if (member.nif) {
    const byNif = others.find((m) => m.nif === member.nif)
    if (byNif) return byNif
  }
  if (member.name) {
    const normalized = member.name.toLowerCase()
    const nameMatches = others.filter((m) => m.name?.toLowerCase() === normalized)
    if (nameMatches.length === 1) return nameMatches[0]
    // Ambiguous name match (e.g. PDF "Sujeito Passivo A" for all members) —
    // use positional hint to disambiguate.
    if (nameMatches.length > 1 && positionHint !== undefined && positionHint < others.length) {
      return others[positionHint]
    }
    if (nameMatches.length > 0) return nameMatches[0]
  }
  return undefined
}

/**
 * Match a dependent across households by name (case-insensitive).
 * Falls back to birth_year if names are generic placeholders.
 */
function findMatchingDependent(dep: Dependent, others: Dependent[]): Dependent | undefined {
  if (dep.name) {
    const normalized = dep.name.toLowerCase()
    const byName = others.find((d) => d.name?.toLowerCase() === normalized)
    if (byName) return byName
  }
  if (dep.birth_year) {
    return others.find((d) => d.birth_year === dep.birth_year)
  }
  return undefined
}

/**
 * Copies shared person-level data from the primary household to a target household.
 * Members are matched by NIF first, then name. No positional fallback — if a
 * member in the target has no match in the primary, their data is kept as-is.
 * This correctly handles households where composition changes across years
 * (single→married, divorce, different spouse).
 *
 * Propagated fields: name, nif, birth_year, nhr_start_year,
 *   irs_jovem_first_work_year, irs_jovem_degree_year.
 * Derived fields: irs_jovem_year, special_regimes['irs_jovem'] — computed from
 *   eligibility data for the target year. Pre-2025 requires degree_year (different
 *   law than post-2025 which only needs first_work_year).
 * NOT propagated: nhr_confirmed — year-specific, comes from each year's XML data.
 */
export function propagateSharedData(primary: Household, target: Household): Household {
  return {
    ...target,
    dependents: target.dependents.map((dep) => {
      const match = findMatchingDependent(dep, primary.dependents)
      if (!match) return dep
      return { ...dep, birth_year: match.birth_year || dep.birth_year }
    }),
    members: target.members.map((member, idx) => {
      const match = findMatchingMember(member, primary.members, idx)
      if (!match) return member

      const firstWorkYear = match.irs_jovem_first_work_year ?? member.irs_jovem_first_work_year
      const degreeYear = match.irs_jovem_degree_year ?? member.irs_jovem_degree_year
      const result: Person = {
        ...member,
        name: match.name,
        nif: match.nif ?? member.nif,
        birth_year: match.birth_year ?? member.birth_year,
        nhr_start_year: match.nhr_start_year ?? member.nhr_start_year,
        irs_jovem_first_work_year: firstWorkYear,
        irs_jovem_degree_year: degreeYear,
      }

      // Derive IRS Jovem eligibility for the target year.
      // Pre-2025 and post-2025 are different laws with different requirements:
      //   Pre-2025: requires a completed degree (irs_jovem_degree_year must be set)
      //     Benefit year = target.year - degreeYear (year 1 = year after degree)
      //   Post-2025: requires only first_work_year (no degree needed)
      //     Benefit year = target.year - firstWorkYear + 1 (year 1 = first work year)
      // Only backfill — never overwrite XML-provided target-year data.
      const isPre2025 = target.year < 2025
      const canDerive = isPre2025 ? degreeYear !== undefined : firstWorkYear !== undefined
      if (canDerive) {
        const regime = getIrsJovemRegime(target.year)
        if (regime) {
          const benefitYear = isPre2025
            ? target.year - degreeYear!
            : target.year - firstWorkYear! + 1
          if (benefitYear >= 1 && benefitYear <= regime.maxBenefitYears) {
            if (!result.special_regimes.includes('irs_jovem')) {
              result.special_regimes = [...result.special_regimes, 'irs_jovem']
            }
            result.irs_jovem_year ??= benefitYear
          } else {
            // Person is NOT eligible for IRS Jovem in this target year —
            // remove any stale flag that came from PDF extraction.
            result.special_regimes = result.special_regimes.filter((r) => r !== 'irs_jovem')
            result.irs_jovem_year = undefined
          }
        } else {
          // No IRS Jovem regime exists for this year — clean up stale flags
          result.special_regimes = result.special_regimes.filter((r) => r !== 'irs_jovem')
          result.irs_jovem_year = undefined
        }
      }

      return result
    }),
  }
}
