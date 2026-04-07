import type { Dependent, Household, Person } from './types'

/**
 * Match a member to the same person in another household by NIF or name.
 * NIF takes priority (exact match). Name match is case-insensitive.
 * Returns undefined if no match found — caller must handle gracefully.
 */
export function findMatchingMember(member: Person, others: Person[]): Person | undefined {
  if (member.nif) {
    const byNif = others.find((m) => m.nif === member.nif)
    if (byNif) return byNif
  }
  if (member.name) {
    const normalized = member.name.toLowerCase()
    return others.find((m) => m.name?.toLowerCase() === normalized)
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
 * Propagated fields: name, nif, birth_year, nhr_start_year, irs_jovem_first_work_year.
 * NOT propagated: nhr_confirmed, special_regimes — these are year-specific
 * and come from each year's own XML data.
 */
export function propagateSharedData(primary: Household, target: Household): Household {
  return {
    ...target,
    dependents: target.dependents.map((dep) => {
      const match = findMatchingDependent(dep, primary.dependents)
      if (!match) return dep
      return { ...dep, birth_year: match.birth_year || dep.birth_year }
    }),
    members: target.members.map((member) => {
      const match = findMatchingMember(member, primary.members)
      if (!match) return member
      return {
        ...member,
        name: match.name,
        nif: match.nif ?? member.nif,
        birth_year: match.birth_year ?? member.birth_year,
        nhr_start_year: match.nhr_start_year ?? member.nhr_start_year,
        irs_jovem_first_work_year:
          match.irs_jovem_first_work_year ?? member.irs_jovem_first_work_year,
      }
    }),
  }
}
