/**
 * Identifies information needed for accurate tax calculations that
 * could not be extracted from AT documents (XML, comprovativo, liquidação).
 *
 * Returns a structured list of questions to ask the user, filtered
 * to only include what's relevant for the specific household.
 */

import type { DeductionCategory, Household, Person, SpecialRegime } from './types'
import { getIrsJovemRegime } from './irs-jovem'
import { sanitizeNumber } from './input-validation'

// ─── Question Types ──────────────────────────────────────────

export type QuestionType = 'number' | 'select' | 'boolean' | 'year'

export interface MissingInputQuestion {
  /** Unique key for this question, e.g. "member.0.birth_year" */
  id: string
  /** Section grouping */
  section: QuestionSection
  /** Portuguese label */
  label: string
  /** Explanation of why this is needed */
  reason: string
  /** Input type */
  type: QuestionType
  /** Options for 'select' type */
  options?: { value: string; label: string }[]
  /** Current value if partially known */
  currentValue?: number | string | boolean
  /** Whether this is a placeholder value that should be confirmed */
  isPlaceholder?: boolean
  /** Priority: critical inputs block accurate calculation */
  priority: 'critical' | 'important' | 'optional'
  /** Path to update in the household object */
  path: string
  /** Per-question validation. Returns error message or null if valid. */
  validate?: (value: string | number | boolean) => string | null
}

export type QuestionSection =
  | 'taxpayer_info'
  | 'dependents'
  | 'ascendants'
  | 'cat_b_details'
  | 'irs_jovem'
  | 'nhr'
  | 'deductions'
  | 'income_options'

export const SECTION_LABELS: Record<QuestionSection, { title: string; description: string }> = {
  taxpayer_info: {
    title: 'Dados dos Contribuintes',
    description: 'Informação pessoal necessária para cálculos de deduções e elegibilidade.',
  },
  dependents: {
    title: 'Dependentes',
    description:
      'A idade dos dependentes afeta o valor das deduções (€900 < 3 anos, €726 entre 3-6, €600 > 6).',
  },
  ascendants: {
    title: 'Ascendentes',
    description: 'Informação sobre ascendentes a cargo para deduções Art. 78-A e Art. 87.',
  },
  cat_b_details: {
    title: 'Trabalho Independente (Cat. B)',
    description: 'Detalhes sobre a atividade independente para reduções e Segurança Social.',
  },
  irs_jovem: {
    title: 'IRS Jovem',
    description: 'Art. 12-F CIRS — verificação de elegibilidade e ano de benefício.',
  },
  nhr: {
    title: 'Residente Não Habitual (RNH)',
    description: 'Art. 72 CIRS — ano de registo e duração do regime.',
  },
  deductions: {
    title: 'Despesas para Deduções',
    description:
      'Valores de despesas para deduções à coleta. Se já declarados no Anexo H, estarão pré-preenchidos.',
  },
  income_options: {
    title: 'Opções de Tributação',
    description: 'Escolhas que podem otimizar o cálculo do imposto.',
  },
}

// ─── Main Function ───────────────────────────────────────────

/**
 * Analyze a household and return a list of questions for information
 * that is missing or has placeholder values.
 *
 * @param otherYearHouseholds — households from other tax years (used to infer
 *   Cat B activity year from historical data).
 */
export function identifyMissingInputs(
  household: Household,
  otherYearHouseholds?: Household[],
): MissingInputQuestion[] {
  const questions: MissingInputQuestion[] = []
  const year = household.year || 2025
  const currentYear = new Date().getFullYear()

  const validateBirthYear = (value: string | number | boolean): string | null => {
    const n = toNumber(value)
    return n >= MIN_BIRTH_YEAR && n <= currentYear ? null : 'Ano de nascimento inválido'
  }

  // ── Taxpayer birth years ─────────────────────────────────
  for (let i = 0; i < household.members.length; i++) {
    const member = household.members[i]
    if (!member.birth_year) {
      questions.push({
        id: `member.${i}.birth_year`,
        section: 'taxpayer_info',
        label: `Ano de nascimento de ${member.name}`,
        reason:
          'Necessário para limites de dedução PPR, elegibilidade IRS Jovem (≤35 anos) e deduções por deficiência.',
        type: 'year',
        priority: hasSpecialRegime(member, 'irs_jovem') ? 'critical' : 'important',
        path: `members.${i}.birth_year`,
        validate: validateBirthYear,
      })
    }
  }

  // ── Dependent birth years ────────────────────────────────
  // Always ask — XML only provides placeholder ages, and users
  // should be able to review/edit birth years when revisiting.
  for (let i = 0; i < household.dependents.length; i++) {
    const dep = household.dependents[i]
    const isPlaceholder = isPlaceholderBirthYear(dep.birth_year, year)
    questions.push({
      id: `dependent.${i}.birth_year`,
      section: 'dependents',
      label: `Ano de nascimento de ${dep.name}`,
      reason: 'A dedução depende da idade: €900 (< 3 anos), €726 (3-6 anos), €600 (> 6 anos).',
      type: 'year',
      currentValue: dep.birth_year,
      isPlaceholder,
      priority: isPlaceholder ? 'important' : 'optional',
      path: `dependents.${i}.birth_year`,
      validate: validateBirthYear,
    })
  }

  // ── Dependent disability ─────────────────────────────────
  for (let i = 0; i < household.dependents.length; i++) {
    const dep = household.dependents[i]
    if (dep.disability_degree === undefined) {
      questions.push({
        id: `dependent.${i}.disability`,
        section: 'dependents',
        label: `${dep.name} tem incapacidade ≥ 60%?`,
        reason: 'Incapacidade ≥ 60% atribui dedução adicional de 2,5 × IAS (Art. 87).',
        type: 'boolean',
        priority: 'optional',
        path: `dependents.${i}.has_disability`,
      })
    }
  }

  // ── Ascendant birth years ────────────────────────────────
  // Only ask if disability ≥ 90% (needed for acompanhamento deduction)
  // or if disability is unknown
  const ascendants = household.ascendants || []
  for (let i = 0; i < ascendants.length; i++) {
    const asc = ascendants[i]
    const disabilityUnknown = asc.disability_degree === undefined
    const highDisability = (asc.disability_degree ?? 0) >= 90
    if (disabilityUnknown || highDisability) {
      questions.push({
        id: `ascendant.${i}.birth_year`,
        section: 'ascendants',
        label: `Ano de nascimento do ascendente ${asc.name}`,
        reason:
          'Incapacidade ≥ 90% atribui dedução de acompanhamento (4 × IAS). Necessário verificar idade.',
        type: 'year',
        priority: 'optional',
        path: `ascendants.${i}.birth_year`,
      })
    }
  }

  // ── Cat B activity details ───────────────────────────────
  for (let i = 0; i < household.members.length; i++) {
    const member = household.members[i]
    for (let j = 0; j < member.incomes.length; j++) {
      const income = member.incomes[j]
      if (income.category !== 'B') continue

      const hasCatBYear = income.cat_b_activity_year !== undefined

      // Skip if we can infer ≥3rd year from historical data:
      // member has Cat B income in ≥2 other tax years → past new-activity period
      if (!hasCatBYear && otherYearHouseholds) {
        const otherYearsWithCatB = otherYearHouseholds.filter((hh) => {
          const match = findMatchingMember(member, hh.members)
          return match?.incomes.some((inc) => inc.category === 'B')
        }).length
        if (otherYearsWithCatB >= 2) continue
      }

      questions.push({
        id: `member.${i}.income.${j}.cat_b_activity_year`,
        section: 'cat_b_details',
        label: `Ano de atividade de ${member.name} (Cat. B)`,
        reason:
          'Art. 31 nº 10: 1.º ano → apenas 50% do rendimento é tributável; 2.º ano → 75%. A partir do 3.º ano: sem redução.',
        type: 'select',
        options: [
          { value: '0', label: '3.º ano ou mais (sem redução)' },
          { value: '1', label: '1.º ano de atividade (50% tributável)' },
          { value: '2', label: '2.º ano de atividade (75% tributável)' },
        ],
        priority: hasCatBYear ? 'optional' : 'critical',
        path: `members.${i}.incomes.${j}.cat_b_activity_year`,
        currentValue: hasCatBYear ? String(income.cat_b_activity_year) : undefined,
        validate: (v: string | number | boolean): string | null => {
          const n = toNumber(v)
          return n >= 0 && n <= 2 ? null : 'Valor inválido'
        },
      })
    }
  }

  // ── Cat F rental contract duration ───────────────────────
  for (let i = 0; i < household.members.length; i++) {
    const member = household.members[i]
    for (let j = 0; j < member.incomes.length; j++) {
      const income = member.incomes[j]
      if (income.category !== 'F') continue

      const hasRentalDuration = income.rental_contract_duration !== undefined
      questions.push({
        id: `member.${i}.income.${j}.rental_duration`,
        section: 'income_options',
        label: `Duração do contrato de arrendamento de ${member.name}`,
        reason:
          'Contratos de longa duração têm taxas reduzidas: ≥2 anos: 26%, ≥5: 23%, ≥10: 14%, ≥20: 10%.',
        type: 'select',
        options: [
          { value: '0', label: 'Sem contrato / < 2 anos (28%)' },
          { value: '2', label: '2-4 anos (26%)' },
          { value: '5', label: '5-9 anos (23%)' },
          { value: '10', label: '10-19 anos (14%)' },
          { value: '20', label: '≥ 20 anos (10%)' },
        ],
        priority: hasRentalDuration ? 'optional' : 'important',
        path: `members.${i}.incomes.${j}.rental_contract_duration`,
        currentValue: hasRentalDuration ? String(income.rental_contract_duration) : undefined,
        validate: (v: string | number | boolean): string | null => {
          const n = toNumber(v)
          return n >= 0 ? null : 'Valor inválido'
        },
      })
    }
  }

  // ── IRS Jovem — benefit year is derived from first_work_year ──
  // No dropdown question needed; the proactive section below asks
  // for first_work_year (or degree_year for pre-2025) and derives
  // the benefit year automatically via applyAnswers.

  // ── NHR details ──────────────────────────────────────────
  for (let i = 0; i < household.members.length; i++) {
    const member = household.members[i]
    if (!hasSpecialRegime(member, 'nhr')) continue

    if (!member.nhr_start_year) {
      // nhr_confirmed (Anexo L present) confirms NHR for THIS year, but
      // nhr_start_year is still needed to determine the 10-year window
      // when propagating to other years. Lower priority if already confirmed.
      questions.push({
        id: `member.${i}.nhr_start_year`,
        section: 'nhr',
        label: `Ano de inscrição RNH de ${member.name}`,
        reason: member.nhr_confirmed
          ? 'RNH confirmado via Anexo L. O ano de inscrição permite calcular a janela de 10 anos para outros anos fiscais.'
          : 'O regime RNH tem duração de 10 anos. Necessário para verificar se ainda está ativo. Novas inscrições a partir de 2024 foram revogadas (Lei 45-A/2024).',
        type: 'year',
        priority: member.nhr_confirmed ? 'important' : 'critical',
        path: `members.${i}.nhr_start_year`,
        validate: (value: string | number | boolean): string | null => {
          const n = toNumber(value)
          return n >= NHR_INCEPTION_YEAR && n <= currentYear ? null : 'Ano de início NHR inválido'
        },
      })
    }
  }

  // NOTE: Deduction expenses are NOT asked here. They are provided exclusively
  // via the copy-paste flow from the AT "Consultar Despesas p/ Deduções" page
  // in the upload step (Section 4 of DocumentUpload).

  // ── Cat E/F/G englobamento choice ────────────────────────
  for (let i = 0; i < household.members.length; i++) {
    const member = household.members[i]
    for (let j = 0; j < member.incomes.length; j++) {
      const income = member.incomes[j]
      if (!['E', 'F'].includes(income.category)) continue
      if (income.englobamento !== undefined) continue

      questions.push({
        id: `member.${i}.income.${j}.englobamento`,
        section: 'income_options',
        label: `Englobamento de rendimentos Cat. ${income.category} de ${member.name}?`,
        reason:
          'Se a taxa marginal for inferior a 28%, o englobamento pode reduzir o imposto. Escolha "Sim" para incluir estes rendimentos na tributação progressiva.',
        type: 'boolean',
        priority: 'optional',
        path: `members.${i}.incomes.${j}.englobamento`,
      })
    }
  }

  // ── IRS Jovem proactive detection / verification ────────
  // For members without IRS Jovem who have Cat A/B income: probe eligibility.
  // Also handles members with unconfirmed irs_jovem from XML (code 417).
  // When first_work_year is already known, we still generate the question with
  // currentValue so it stays visible in the questionnaire for editing.
  for (let i = 0; i < household.members.length; i++) {
    const member = household.members[i]
    // Legacy: skip if irs_jovem_year was set directly (old-style dropdown)
    if (hasSpecialRegime(member, 'irs_jovem') && member.irs_jovem_year) continue
    if (!member.birth_year) continue

    const age = year - member.birth_year
    const hasUnconfirmedIrsJovem = hasSpecialRegime(member, 'irs_jovem') && !member.irs_jovem_year
    // New applicants: must be ≤ 35 at start of benefit
    // Unconfirmed XML: could have started at ≤ 35, benefit up to 10 years → max age 44
    const regime = getIrsJovemRegime(year)
    const maxAge = hasUnconfirmedIrsJovem ? 35 + (regime?.maxBenefitYears ?? 10) - 1 : 35
    if (age > maxAge) continue

    const hasCatAOrB = member.incomes.some((inc) => inc.category === 'A' || inc.category === 'B')
    if (!hasCatAOrB) continue

    if (year >= 2025) {
      // New regime: no degree required, just first year of work in Portugal
      questions.push({
        id: `member.${i}.first_work_year`,
        section: 'irs_jovem',
        label: `Em que ano ${member.name} começou a trabalhar em Portugal?`,
        reason: hasUnconfirmedIrsJovem
          ? 'IRS Jovem detetado na declaração. Indique o ano de início de atividade para verificar elegibilidade.'
          : 'A partir de 2025, o IRS Jovem aplica-se aos primeiros 10 anos de trabalho ' +
            '(sem exigência de grau académico). Se elegível, pode isentar 25%-50% do rendimento.',
        type: 'year',
        currentValue: member.irs_jovem_first_work_year,
        priority: hasUnconfirmedIrsJovem ? 'critical' : 'important',
        path: `members.${i}.first_work_year`,
        validate: (value: string | number | boolean): string | null => {
          const n = toNumber(value)
          return n >= MIN_BIRTH_YEAR && n <= currentYear ? null : 'Ano inválido'
        },
      })
    } else {
      // Pre-2025: requires degree completion
      const degreeYear = member.irs_jovem_first_work_year
        ? member.irs_jovem_first_work_year - 1
        : undefined
      questions.push({
        id: `member.${i}.degree_year`,
        section: 'irs_jovem',
        label: `Em que ano ${member.name} concluiu o grau de ensino mais elevado?`,
        reason: hasUnconfirmedIrsJovem
          ? 'IRS Jovem detetado na declaração. Indique o ano de conclusão do grau para verificar elegibilidade.'
          : 'Até 2024, o IRS Jovem (Art. 12-F) aplica-se nos 5 anos após conclusão do ' +
            'ensino superior. Se elegível, pode isentar 25%-100% do rendimento.',
        type: 'year',
        currentValue: degreeYear,
        priority: hasUnconfirmedIrsJovem ? 'critical' : 'important',
        path: `members.${i}.degree_year`,
        validate: (value: string | number | boolean): string | null => {
          const n = toNumber(value)
          return n >= MIN_BIRTH_YEAR && n <= currentYear ? null : 'Ano inválido'
        },
      })
    }
  }

  return questions
}

/**
 * Group questions by section, returning only sections that have questions.
 */
export function groupBySection(questions: MissingInputQuestion[]): {
  section: QuestionSection
  meta: (typeof SECTION_LABELS)[QuestionSection]
  questions: MissingInputQuestion[]
}[] {
  const sectionOrder: QuestionSection[] = [
    'taxpayer_info',
    'dependents',
    'ascendants',
    'cat_b_details',
    'irs_jovem',
    'nhr',
    'deductions',
    'income_options',
  ]

  const priorityOrder = { critical: 0, important: 1, optional: 2 }

  return sectionOrder
    .map((section) => ({
      section,
      meta: SECTION_LABELS[section],
      questions: questions
        .filter((q) => q.section === section)
        .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]),
    }))
    .filter((g) => g.questions.length > 0)
}

/**
 * Apply user answers to a household, returning a new household with updates.
 */
export function applyAnswers(
  household: Household,
  answers: Record<string, string | number | boolean>,
): Household {
  // Deep clone to avoid mutations
  const h: Household = JSON.parse(JSON.stringify(household))

  for (const [questionId, value] of Object.entries(answers)) {
    if (value === '' || value === undefined) continue

    // Parse the question ID to determine what to update
    const parts = questionId.split('.')

    if (parts[0] === 'member' && parts[2] === 'birth_year') {
      const idx = parseInt(parts[1])
      if (h.members[idx]) h.members[idx].birth_year = toNumber(value)
    } else if (parts[0] === 'member' && parts[2] === 'irs_jovem_year') {
      const idx = parseInt(parts[1])
      if (h.members[idx]) h.members[idx].irs_jovem_year = toNumber(value)
    } else if (parts[0] === 'member' && parts[2] === 'nhr_start_year') {
      const idx = parseInt(parts[1])
      if (h.members[idx]) h.members[idx].nhr_start_year = toNumber(value)
    } else if (parts[0] === 'member' && parts[2] === 'first_work_year') {
      // IRS Jovem proactive detection (≥2025): derive benefit year from first work year
      const idx = parseInt(parts[1])
      const member = h.members[idx]
      if (member) {
        const firstWorkYear = toNumber(value)
        // Only set if it looks like a plausible year (not a partial keystroke like "20")
        if (firstWorkYear >= MIN_BIRTH_YEAR) {
          member.irs_jovem_first_work_year = firstWorkYear
          const benefitYear = h.year - firstWorkYear + 1
          const regime = getIrsJovemRegime(h.year)
          const maxYears = regime?.maxBenefitYears ?? 10
          if (benefitYear >= 1 && benefitYear <= maxYears) {
            if (!member.special_regimes.includes('irs_jovem')) {
              member.special_regimes = [...member.special_regimes, 'irs_jovem']
            }
            member.irs_jovem_year = benefitYear
          }
        }
      }
    } else if (parts[0] === 'member' && parts[2] === 'degree_year') {
      // IRS Jovem proactive detection (≤2024): derive benefit year from degree year
      const idx = parseInt(parts[1])
      const member = h.members[idx]
      if (member) {
        const degreeYear = toNumber(value)
        if (degreeYear >= MIN_BIRTH_YEAR) {
          // Pre-2025: benefit starts the year after degree completion
          // Store as first_work_year equivalent: degree_year + 1
          member.irs_jovem_first_work_year = degreeYear + 1
          const benefitYear = h.year - degreeYear
          const regime = getIrsJovemRegime(h.year)
          const maxYears = regime?.maxBenefitYears ?? 5
          if (benefitYear >= 1 && benefitYear <= maxYears) {
            if (!member.special_regimes.includes('irs_jovem')) {
              member.special_regimes = [...member.special_regimes, 'irs_jovem']
            }
            member.irs_jovem_year = benefitYear
          }
        }
      }
    } else if (parts[0] === 'member' && parts[2] === 'income') {
      const mIdx = parseInt(parts[1])
      const iIdx = parseInt(parts[3])
      const field = parts[4]
      const member = h.members[mIdx]
      if (!member?.incomes[iIdx]) continue

      if (field === 'cat_b_activity_year') {
        member.incomes[iIdx].cat_b_activity_year = toNumber(value)
      } else if (field === 'rental_duration' || field === 'rental_contract_duration') {
        member.incomes[iIdx].rental_contract_duration = toNumber(value)
      } else if (field === 'englobamento') {
        member.incomes[iIdx].englobamento = value === true || value === 'true'
      }
    } else if (parts[0] === 'member' && parts[2] === 'deduction') {
      const mIdx = parseInt(parts[1])
      const category = parts[3]
      const amount = toNumber(value)
      if (amount > 0 && h.members[mIdx]) {
        // Add or update the deduction
        const existing = h.members[mIdx].deductions.findIndex((d) => d.category === category)
        if (existing >= 0) {
          h.members[mIdx].deductions[existing].amount = amount
        } else {
          h.members[mIdx].deductions.push({
            category: category as DeductionCategory,
            amount,
          })
        }
      }
    } else if (parts[0] === 'dependent' && parts[2] === 'birth_year') {
      const idx = parseInt(parts[1])
      if (h.dependents[idx]) h.dependents[idx].birth_year = toNumber(value)
    } else if (parts[0] === 'dependent' && parts[2] === 'disability') {
      // For the boolean disability question, we just mark the degree
      // A more detailed follow-up could ask for the actual degree
      const idx = parseInt(parts[1])
      if (h.dependents[idx]) {
        h.dependents[idx].disability_degree = value === true || value === 'true' ? 60 : undefined
      }
    } else if (parts[0] === 'ascendant' && parts[2] === 'birth_year') {
      const idx = parseInt(parts[1])
      if (h.ascendants?.[idx]) h.ascendants[idx].birth_year = toNumber(value)
    }
  }

  return h
}

// ─── Helpers ─────────────────────────────────────────────────

const MIN_BIRTH_YEAR = 1900
const NHR_INCEPTION_YEAR = 2009

function hasSpecialRegime(member: Person, regime: string): boolean {
  return member.special_regimes.includes(regime as SpecialRegime)
}

/**
 * Detect if a birth year is a placeholder or unknown.
 * Parser may set 0, negative, or the default year-5 when the real value is unknown.
 */
function isPlaceholderBirthYear(birthYear: number, taxYear: number): boolean {
  return birthYear <= 0 || birthYear === taxYear - 5
}

function toNumber(value: string | number | boolean): number {
  if (typeof value === 'number') return sanitizeNumber(value)
  if (typeof value === 'boolean') return value ? 1 : 0
  return sanitizeNumber(parseInt(value))
}

/** Match a member to the same person in another year's household by NIF or name. */
function findMatchingMember(member: Person, others: Person[]): Person | undefined {
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

/** Returns true if there are any critical or important questions. */
export function hasMandatoryQuestions(questions: MissingInputQuestion[]): boolean {
  return questions.some((q) => q.priority === 'critical' || q.priority === 'important')
}

/** Returns only critical/important questions (skip optional). */
export function getMandatoryQuestions(questions: MissingInputQuestion[]): MissingInputQuestion[] {
  return questions.filter((q) => q.priority !== 'optional')
}

/** Check if a specific question was answered. */
export function isAnswered(
  answers: Record<string, string | number | boolean>,
  questionId: string,
): boolean {
  const val = answers[questionId]
  return val !== undefined && val !== ''
}

/** Count unanswered critical questions. */
export function countUnansweredCritical(
  questions: MissingInputQuestion[],
  answers: Record<string, string | number | boolean>,
): number {
  return questions.filter((q) => q.priority === 'critical' && !isAnswered(answers, q.id)).length
}

/**
 * Validate an answer for a specific question.
 * Returns error message string if invalid, null if valid.
 * Questions without a custom `validate` function always pass.
 */
export function validateAnswer(
  question: MissingInputQuestion,
  value: string | number | boolean | undefined,
): string | null {
  if (value === undefined || value === '') return null
  if (!question.validate) return null
  return question.validate(value)
}
