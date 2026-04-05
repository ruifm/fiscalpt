import type { Household, Person, Income, Deduction, Dependent, Ascendant } from './types'

// ─── Types ────────────────────────────────────────────────────

export type ErrorSeverity = 'error' | 'warning'

export interface ValidationError {
  severity: ErrorSeverity
  field: string
  code: string
  message: string
}

// ─── Constants ────────────────────────────────────────────────

const MAX_GROSS = 10_000_000
const MAX_DEDUCTION = 100_000
const MIN_YEAR = 2021
const MIN_BIRTH_YEAR = 1900
const MAX_DEPENDENTS = 10
const MAX_ASCENDANTS = 4

// ─── Helpers ──────────────────────────────────────────────────

interface SanitizeOptions {
  allowNegative?: boolean
  max?: number
}

/**
 * Sanitize a numeric value: replace NaN/Infinity/null/undefined with 0,
 * clamp negatives to 0 (unless allowed), clamp to max, round to 2dp.
 */
export function sanitizeNumber(value: number, options: SanitizeOptions = {}): number {
  if (value === null || value === undefined || !Number.isFinite(value)) return 0
  let n = value
  if (!options.allowNegative && n < 0) n = 0
  if (options.max !== undefined && n > options.max) n = options.max
  // Guard against overflow: n * 100 can exceed Number.MAX_VALUE for very large n
  if (Math.abs(n) > Number.MAX_SAFE_INTEGER / 100) return n
  return Math.round(n * 100) / 100
}

function isInvalidNumber(value: unknown): boolean {
  return typeof value !== 'number' || !Number.isFinite(value)
}

function numericErrors(
  value: number | undefined,
  field: string,
  opts: { required?: boolean; maxWarn?: number; label?: string } = {},
): ValidationError[] {
  const errors: ValidationError[] = []
  if (value === undefined || value === null) {
    if (opts.required) {
      errors.push({
        severity: 'error',
        field,
        code: 'REQUIRED',
        message: `${opts.label ?? field} é obrigatório`,
      })
    }
    return errors
  }
  if (isInvalidNumber(value)) {
    errors.push({
      severity: 'error',
      field,
      code: 'INVALID_NUMBER',
      message: `${opts.label ?? field} não é um número válido`,
    })
    return errors
  }
  if (value < 0) {
    errors.push({
      severity: 'error',
      field,
      code: 'NEGATIVE_VALUE',
      message: `${opts.label ?? field} não pode ser negativo`,
    })
  }
  if (opts.maxWarn !== undefined && value > opts.maxWarn) {
    errors.push({
      severity: 'warning',
      field,
      code: 'SUSPICIOUSLY_HIGH',
      message: `${opts.label ?? field} parece demasiado alto (${value.toLocaleString('pt-PT')}€)`,
    })
  }
  return errors
}

// ─── Income Validation ───────────────────────────────────────

export function validateIncome(income: Income, prefix = ''): ValidationError[] {
  const errors: ValidationError[] = []
  const p = prefix

  errors.push(
    ...numericErrors(income.gross, `${p}gross`, { maxWarn: MAX_GROSS, label: 'Rendimento bruto' }),
  )

  if (income.withholding !== undefined) {
    errors.push(
      ...numericErrors(income.withholding, `${p}withholding`, { label: 'Retenção na fonte' }),
    )
    if (
      Number.isFinite(income.withholding) &&
      Number.isFinite(income.gross) &&
      income.withholding > income.gross &&
      income.gross > 0
    ) {
      errors.push({
        severity: 'warning',
        field: `${p}withholding`,
        code: 'WITHHOLDING_EXCEEDS_GROSS',
        message: 'Retenção na fonte superior ao rendimento bruto',
      })
    }
  }

  if (income.ss_paid !== undefined) {
    errors.push(...numericErrors(income.ss_paid, `${p}ss_paid`, { label: 'Segurança Social paga' }))
  }

  if (income.expenses !== undefined) {
    errors.push(...numericErrors(income.expenses, `${p}expenses`, { label: 'Despesas' }))
  }

  if (income.cat_b_documented_expenses !== undefined) {
    errors.push(
      ...numericErrors(income.cat_b_documented_expenses, `${p}cat_b_documented_expenses`, {
        label: 'Despesas documentadas (trabalho independente)',
      }),
    )
  }

  if (income.foreign_tax_paid !== undefined) {
    errors.push(
      ...numericErrors(income.foreign_tax_paid, `${p}foreign_tax_paid`, {
        label: 'Imposto pago no estrangeiro',
      }),
    )
    if (
      Number.isFinite(income.foreign_tax_paid) &&
      Number.isFinite(income.gross) &&
      income.foreign_tax_paid > income.gross &&
      income.gross > 0
    ) {
      errors.push({
        severity: 'warning',
        field: `${p}foreign_tax_paid`,
        code: 'FOREIGN_TAX_EXCEEDS_GROSS',
        message: 'Imposto estrangeiro superior ao rendimento bruto',
      })
    }
  }

  if (income.rental_contract_duration !== undefined) {
    errors.push(
      ...numericErrors(income.rental_contract_duration, `${p}rental_contract_duration`, {
        label: 'Duração do contrato de arrendamento',
      }),
    )
  }

  if (income.cat_b_activity_year !== undefined) {
    if (income.cat_b_activity_year < 1) {
      errors.push({
        severity: 'error',
        field: `${p}cat_b_activity_year`,
        code: 'OUT_OF_RANGE',
        message: 'Ano de atividade de trabalho independente deve ser pelo menos 1',
      })
    }
  }

  return errors
}

// ─── Deduction Validation ────────────────────────────────────

export function validateDeduction(deduction: Deduction, prefix = ''): ValidationError[] {
  return numericErrors(deduction.amount, `${prefix}amount`, {
    maxWarn: MAX_DEDUCTION,
    label: `Dedução (${deduction.category})`,
  })
}

// ─── Dependent Validation ────────────────────────────────────

export function validateDependent(dep: Dependent, taxYear: number, prefix = ''): ValidationError[] {
  const errors: ValidationError[] = []

  if (!dep.name || dep.name.trim() === '') {
    errors.push({
      severity: 'error',
      field: `${prefix}name`,
      code: 'REQUIRED',
      message: 'Nome do dependente é obrigatório',
    })
  }

  if (dep.birth_year > taxYear) {
    errors.push({
      severity: 'error',
      field: `${prefix}birth_year`,
      code: 'FUTURE_BIRTH_YEAR',
      message: 'Ano de nascimento não pode ser no futuro',
    })
  } else if (dep.birth_year < MIN_BIRTH_YEAR) {
    errors.push({
      severity: 'error',
      field: `${prefix}birth_year`,
      code: 'OUT_OF_RANGE',
      message: `Ano de nascimento deve ser ≥ ${MIN_BIRTH_YEAR}`,
    })
  }

  if (dep.disability_degree !== undefined) {
    if (dep.disability_degree < 0 || dep.disability_degree > 100) {
      errors.push({
        severity: 'error',
        field: `${prefix}disability_degree`,
        code: 'OUT_OF_RANGE',
        message: 'Grau de incapacidade deve ser entre 0 e 100',
      })
    } else if (dep.disability_degree > 0 && dep.disability_degree < 60) {
      errors.push({
        severity: 'warning',
        field: `${prefix}disability_degree`,
        code: 'BELOW_BENEFIT_THRESHOLD',
        message: 'Grau de incapacidade < 60% não confere benefício fiscal',
      })
    }
  }

  return errors
}

// ─── Ascendant Validation ────────────────────────────────────

export function validateAscendant(asc: Ascendant, taxYear: number, prefix = ''): ValidationError[] {
  const errors: ValidationError[] = []

  if (!asc.name || asc.name.trim() === '') {
    errors.push({
      severity: 'error',
      field: `${prefix}name`,
      code: 'REQUIRED',
      message: 'Nome do ascendente é obrigatório',
    })
  }

  if (asc.birth_year !== undefined) {
    if (asc.birth_year > taxYear) {
      errors.push({
        severity: 'error',
        field: `${prefix}birth_year`,
        code: 'FUTURE_BIRTH_YEAR',
        message: 'Ano de nascimento não pode ser no futuro',
      })
    } else if (asc.birth_year < MIN_BIRTH_YEAR) {
      errors.push({
        severity: 'error',
        field: `${prefix}birth_year`,
        code: 'OUT_OF_RANGE',
        message: `Ano de nascimento deve ser ≥ ${MIN_BIRTH_YEAR}`,
      })
    }
  }

  if (asc.income !== undefined) {
    errors.push(
      ...numericErrors(asc.income, `${prefix}income`, { label: 'Rendimento do ascendente' }),
    )
  }

  if (asc.disability_degree !== undefined) {
    if (asc.disability_degree < 0 || asc.disability_degree > 100) {
      errors.push({
        severity: 'error',
        field: `${prefix}disability_degree`,
        code: 'OUT_OF_RANGE',
        message: 'Grau de incapacidade deve ser entre 0 e 100',
      })
    }
  }

  return errors
}

// ─── Person Validation ───────────────────────────────────────

export function validatePerson(person: Person, taxYear: number, prefix = ''): ValidationError[] {
  const errors: ValidationError[] = []
  const p = prefix

  if (!person.name || person.name.trim() === '') {
    errors.push({
      severity: 'error',
      field: `${p}name`,
      code: 'REQUIRED',
      message: 'Nome é obrigatório',
    })
  }

  if (person.birth_year !== undefined) {
    if (person.birth_year < MIN_BIRTH_YEAR || person.birth_year > taxYear) {
      errors.push({
        severity: 'error',
        field: `${p}birth_year`,
        code: 'OUT_OF_RANGE',
        message: `Ano de nascimento deve ser entre ${MIN_BIRTH_YEAR} e ${taxYear}`,
      })
    }
  }

  if (person.disability_degree !== undefined) {
    if (person.disability_degree < 0 || person.disability_degree > 100) {
      errors.push({
        severity: 'error',
        field: `${p}disability_degree`,
        code: 'OUT_OF_RANGE',
        message: 'Grau de incapacidade deve ser entre 0 e 100',
      })
    }
  }

  // Special regime consistency
  if (person.special_regimes.includes('irs_jovem')) {
    if (!person.irs_jovem_year) {
      errors.push({
        severity: 'error',
        field: `${p}irs_jovem_year`,
        code: 'REQUIRED',
        message: 'Ano de IRS Jovem é obrigatório quando o regime está ativo',
      })
    } else if (person.irs_jovem_year < 1 || person.irs_jovem_year > 10) {
      errors.push({
        severity: 'error',
        field: `${p}irs_jovem_year`,
        code: 'OUT_OF_RANGE',
        message: 'Ano de IRS Jovem deve ser entre 1 e 10',
      })
    }
  }

  if (person.special_regimes.includes('nhr')) {
    if (!person.nhr_start_year && !person.nhr_confirmed) {
      errors.push({
        severity: 'error',
        field: `${p}nhr_start_year`,
        code: 'REQUIRED',
        message: 'Ano de início NHR é obrigatório quando o regime está ativo',
      })
    }
  }

  // Validate incomes
  for (let i = 0; i < person.incomes.length; i++) {
    errors.push(...validateIncome(person.incomes[i], `${p}incomes[${i}].`))
  }

  // Validate deductions
  for (let i = 0; i < person.deductions.length; i++) {
    errors.push(...validateDeduction(person.deductions[i], `${p}deductions[${i}].`))
  }

  return errors
}

// ─── Household Validation ────────────────────────────────────

export function validateHousehold(household: Household): ValidationError[] {
  const errors: ValidationError[] = []
  const currentYear = new Date().getFullYear()

  // Year
  if (household.year < MIN_YEAR || household.year > currentYear + 1) {
    errors.push({
      severity: 'error',
      field: 'year',
      code: 'OUT_OF_RANGE',
      message: `Ano fiscal deve ser entre ${MIN_YEAR} e ${currentYear + 1}`,
    })
  }

  // Members
  if (household.members.length === 0) {
    errors.push({
      severity: 'error',
      field: 'members',
      code: 'NO_MEMBERS',
      message: 'O agregado deve ter pelo menos um membro',
    })
  }

  // Filing status consistency
  if (household.filing_status === 'married_joint' && household.members.length < 2) {
    errors.push({
      severity: 'error',
      field: 'filing_status',
      code: 'JOINT_REQUIRES_TWO_MEMBERS',
      message: 'Tributação conjunta requer dois membros no agregado',
    })
  }

  if (household.filing_status === 'single' && household.members.length > 1) {
    errors.push({
      severity: 'error',
      field: 'filing_status',
      code: 'SINGLE_REQUIRES_ONE_MEMBER',
      message: 'Tributação individual deve ter exatamente um membro',
    })
  }

  // Dependents
  if (household.dependents.length > MAX_DEPENDENTS) {
    errors.push({
      severity: 'warning',
      field: 'dependents',
      code: 'TOO_MANY_DEPENDENTS',
      message: `Mais de ${MAX_DEPENDENTS} dependentes parece invulgar`,
    })
  }

  // Ascendants
  if (household.ascendants && household.ascendants.length > MAX_ASCENDANTS) {
    errors.push({
      severity: 'warning',
      field: 'ascendants',
      code: 'TOO_MANY_ASCENDANTS',
      message: `Mais de ${MAX_ASCENDANTS} ascendentes parece invulgar`,
    })
  }

  // Validate members
  for (let i = 0; i < household.members.length; i++) {
    errors.push(...validatePerson(household.members[i], household.year, `members[${i}].`))
  }

  // Validate dependents
  for (let i = 0; i < household.dependents.length; i++) {
    errors.push(...validateDependent(household.dependents[i], household.year, `dependents[${i}].`))
  }

  // Validate ascendants
  if (household.ascendants) {
    for (let i = 0; i < household.ascendants.length; i++) {
      errors.push(
        ...validateAscendant(household.ascendants[i], household.year, `ascendants[${i}].`),
      )
    }
  }

  return errors
}
