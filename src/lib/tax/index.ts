export {
  computeProgressiveTax,
  getBrackets,
  getMarginalRate,
  computeSolidaritySurcharge,
  computeParcelaAbater,
  BRACKETS_2021,
  BRACKETS_2022,
  BRACKETS_2023,
  BRACKETS_2024,
  BRACKETS_2025,
} from './brackets'
export { computeSSEmployee, computeSSIndependent, computeTotalSS } from './social-security'
export {
  computeDeduction,
  computePersonDeductions,
  computeDependentDeduction,
  computeTotalDependentDeductions,
  computeTotalAscendantDeductions,
  isAscendantEligible,
  computePersonDisabilityDeduction,
  computeDependentDisabilityDeductions,
  computeAscendantDisabilityDeductions,
} from './deductions'
export {
  computeIrsJovemExemption,
  getIrsJovemExemptionRate,
  getIrsJovemCap,
  isEligibleForIrsJovem,
  getIrsJovemRegime,
} from './irs-jovem'
export {
  isNhrActive,
  computeNhrTax,
  getNhrQualifyingIncome,
  getNhrNonQualifyingIncome,
} from './nhr'
export { analyzeHousehold } from './calculator'
export { parseModelo3Xml } from './xml-parser'
export type {
  ParsedXmlResult,
  ParsedAnexoBRaw,
  ParsedAnexoSSRaw,
  ParsedDependentRaw,
  ParsedAscendantRaw,
} from './xml-parser'
export {
  extractTextFromPdf,
  parseLiquidacaoText,
  parseComprovativoPdfText,
  comprativoParsedToHousehold,
  detectDocumentType,
} from './pdf-extractor'
export {
  IAS,
  RMMG,
  MINIMO_EXISTENCIA,
  SPECIFIC_DEDUCTION_BY_YEAR,
  getSpecificDeduction,
  CAT_B_COEFFICIENT,
  CAT_B_MIN_EXPENSE_RATIO,
  CAT_B_NEW_ACTIVITY_FACTORS,
  CAT_B_COEFFICIENTS,
  getCatBCoefficient,
  AUTONOMOUS_RATE_CAT_E,
  AUTONOMOUS_RATE_CAT_F,
  AUTONOMOUS_RATE_CAT_G,
  CAT_F_REDUCED_RATES,
  CAT_G_REAL_ESTATE_INCLUSION_RATE,
  SOLIDARITY_SURCHARGE_BRACKETS,
  SS_EMPLOYEE_RATE,
  SS_EMPLOYER_RATE,
  SS_INDEPENDENT_BASE_RATIO,
  SS_INDEPENDENT_RATE,
  SS_INDEPENDENT_REDUCTION,
  PENSAO_MINIMA_ANUAL,
  ASCENDANT_DEDUCTION_BASE,
  ASCENDANT_DEDUCTION_SINGLE_BONUS,
  DISABILITY_TAXPAYER_IAS_MULTIPLIER,
  DISABILITY_DEPENDENT_IAS_MULTIPLIER,
  DISABILITY_COMPANION_IAS_MULTIPLIER,
  DISABILITY_COMPANION_THRESHOLD,
  DISABILITY_MIN_DEGREE,
  FATURA_DEDUCTION_RATE,
  FATURA_DEDUCTION_CAP,
} from './types'
export { round2, round4, sumGross } from './utils'
export type * from './types'
