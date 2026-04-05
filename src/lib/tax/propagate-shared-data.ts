import type { Household } from './types'

/**
 * Copies shared data from the primary household to a target household.
 * Members are matched by NIF when available, falling back to position (index).
 * This handles cases where Subject A/B order differs across years
 * (e.g., Rui's XML has him as Subject A, but Micha's XML has her as Subject A).
 *
 * Propagated fields: name, nif, birth_year, nhr_start_year, nhr_confirmed,
 * special_regimes (only if target has none).
 */
export function propagateSharedData(primary: Household, target: Household): Household {
  // Build NIF→primary member lookup
  const primaryByNif = new Map(primary.members.filter((m) => m.nif).map((m) => [m.nif!, m]))

  return {
    ...target,
    dependents: target.dependents.map((dep, i) => {
      const match = primary.dependents[i] ?? dep
      return { ...dep, birth_year: match.birth_year || dep.birth_year }
    }),
    members: target.members.map((member, i) => {
      // Match by NIF first, then fall back to position
      const nifMatch = member.nif ? primaryByNif.get(member.nif) : undefined
      const match = nifMatch ?? primary.members[i] ?? member
      return {
        ...member,
        name: match.name,
        nif: match.nif ?? member.nif,
        birth_year: match.birth_year ?? member.birth_year,
        nhr_start_year: match.nhr_start_year ?? member.nhr_start_year,
        nhr_confirmed: member.nhr_confirmed ?? match.nhr_confirmed,
        special_regimes:
          member.special_regimes.length > 0 ? member.special_regimes : match.special_regimes,
      }
    }),
  }
}
