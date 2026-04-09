import { useState, useCallback } from 'react'
import type {
  Household,
  Person,
  Income,
  Dependent,
  IncomeCategory,
  DeductionCategory,
  SpecialRegime,
  FilingStatus,
} from '@/lib/tax/types'

export function useHouseholdMutations(
  initial: Household,
  defaultDependentName: (n: number) => string,
) {
  const [household, setHousehold] = useState<Household>({ ...initial })

  const updateMember = useCallback((index: number, updated: Person) => {
    setHousehold((prev) => {
      const members = [...prev.members]
      members[index] = updated
      return { ...prev, members }
    })
  }, [])

  const addIncome = useCallback((memberIdx: number) => {
    setHousehold((prev) => {
      const members = [...prev.members]
      const member = { ...members[memberIdx] }
      member.incomes = [...member.incomes, { category: 'A' as IncomeCategory, gross: 0 }]
      members[memberIdx] = member
      return { ...prev, members }
    })
  }, [])

  const removeIncome = useCallback((memberIdx: number, incomeIdx: number) => {
    setHousehold((prev) => {
      const members = [...prev.members]
      const member = { ...members[memberIdx] }
      member.incomes = member.incomes.filter((_, i) => i !== incomeIdx)
      members[memberIdx] = member
      return { ...prev, members }
    })
  }, [])

  const updateIncome = useCallback((memberIdx: number, incomeIdx: number, updated: Income) => {
    setHousehold((prev) => {
      const members = [...prev.members]
      const member = { ...members[memberIdx] }
      const incomes = [...member.incomes]
      incomes[incomeIdx] = updated
      member.incomes = incomes
      members[memberIdx] = member
      return { ...prev, members }
    })
  }, [])

  const addDeduction = useCallback((memberIdx: number) => {
    setHousehold((prev) => {
      const members = [...prev.members]
      const member = { ...members[memberIdx] }
      member.deductions = [
        ...member.deductions,
        { category: 'general' as DeductionCategory, amount: 0 },
      ]
      members[memberIdx] = member
      return { ...prev, members }
    })
  }, [])

  const removeDeduction = useCallback((memberIdx: number, dedIdx: number) => {
    setHousehold((prev) => {
      const members = [...prev.members]
      const member = { ...members[memberIdx] }
      member.deductions = member.deductions.filter((_, i) => i !== dedIdx)
      members[memberIdx] = member
      return { ...prev, members }
    })
  }, [])

  const toggleRegime = useCallback((memberIdx: number, regime: SpecialRegime) => {
    setHousehold((prev) => {
      const members = [...prev.members]
      const member = { ...members[memberIdx] }
      const has = member.special_regimes.includes(regime)
      member.special_regimes = has
        ? member.special_regimes.filter((r) => r !== regime)
        : [...member.special_regimes, regime]
      members[memberIdx] = member
      return { ...prev, members }
    })
  }, [])

  const addDependent = useCallback(() => {
    setHousehold((prev) => ({
      ...prev,
      dependents: [
        ...prev.dependents,
        {
          name: defaultDependentName(prev.dependents.length + 1),
          birth_year: 2020,
        },
      ],
    }))
  }, [defaultDependentName])

  const removeDependent = useCallback((index: number) => {
    setHousehold((prev) => ({
      ...prev,
      dependents: prev.dependents.filter((_, i) => i !== index),
    }))
  }, [])

  const updateDependent = useCallback((index: number, updated: Dependent) => {
    setHousehold((prev) => {
      const dependents = [...prev.dependents]
      dependents[index] = updated
      return { ...prev, dependents }
    })
  }, [])

  const updateYear = useCallback((year: number) => {
    setHousehold((prev) => ({ ...prev, year }))
  }, [])

  const updateFilingStatus = useCallback((filing_status: FilingStatus) => {
    setHousehold((prev) => ({ ...prev, filing_status }))
  }, [])

  return {
    household,
    updateMember,
    addIncome,
    removeIncome,
    updateIncome,
    addDeduction,
    removeDeduction,
    toggleRegime,
    addDependent,
    removeDependent,
    updateDependent,
    updateYear,
    updateFilingStatus,
  }
}
