import { describe, it, expect } from 'vitest'
import { parseDeductionsPageText, parsePortugueseAmount } from '../../src/lib/tax/deductions-parser'
import {
  SAMPLE_2025,
  SAMPLE_2024,
  SAMPLE_2023,
  SAMPLE_2022,
  SAMPLE_2021,
} from './fixtures/at-deductions-samples'

// ── parsePortugueseAmount ──────────────────────────────────────────────

describe('parsePortugueseAmount', () => {
  it('parses large amount with thousand separators', () => {
    expect(parsePortugueseAmount('33.735,08 €')).toBe(33735.08)
  })

  it('parses amount without thousand separator', () => {
    expect(parsePortugueseAmount('648,27 €')).toBe(648.27)
  })

  it('parses zero', () => {
    expect(parsePortugueseAmount('0,00 €')).toBe(0)
  })

  it('parses small amount', () => {
    expect(parsePortugueseAmount('14,58 €')).toBe(14.58)
  })

  it('parses amount with multiple thousand separators', () => {
    expect(parsePortugueseAmount('1.234.567,89 €')).toBe(1234567.89)
  })

  it('returns null for text without €', () => {
    expect(parsePortugueseAmount('some random text')).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(parsePortugueseAmount('')).toBeNull()
  })

  it('handles amount embedded in text', () => {
    expect(parsePortugueseAmount('Dedução correspondente à despesa 250,00 €')).toBe(250)
  })
})

// ── parseDeductionsPageText — real samples ─────────────────────────────

describe('parseDeductionsPageText', () => {
  describe('2025 sample (7 categories)', () => {
    const result = parseDeductionsPageText(SAMPLE_2025)

    it('parses successfully', () => {
      expect(result.ok).toBe(true)
    })

    it('extracts NIF', () => {
      expect(result.ok && result.data.nif).toBe('100000001')
    })

    it('extracts name from greeting', () => {
      expect(result.ok && result.data.name).toBe('CONTRIBUINTE EXEMPLO')
    })

    it('extracts year', () => {
      expect(result.ok && result.data.year).toBe(2025)
    })

    it('finds all 7 categories', () => {
      expect(result.ok && result.data.expenses.length).toBe(7)
    })

    it('parses general expenses', () => {
      if (!result.ok) throw new Error('expected ok')
      const general = result.data.expenses.find((e) => e.category === 'general')!
      expect(general.expenseAmount).toBe(33735.08)
      expect(general.deductionAmount).toBe(250)
    })

    it('parses health expenses', () => {
      if (!result.ok) throw new Error('expected ok')
      const health = result.data.expenses.find((e) => e.category === 'health')!
      expect(health.expenseAmount).toBe(1008.77)
      expect(health.deductionAmount).toBe(151.32)
    })

    it('parses housing expenses', () => {
      if (!result.ok) throw new Error('expected ok')
      const housing = result.data.expenses.find((e) => e.category === 'housing')!
      expect(housing.expenseAmount).toBe(715.16)
      expect(housing.deductionAmount).toBe(107.27)
    })

    it('parses zero-amount categories', () => {
      if (!result.ok) throw new Error('expected ok')
      const education = result.data.expenses.find((e) => e.category === 'education')!
      expect(education.expenseAmount).toBe(0)
      expect(education.deductionAmount).toBe(0)
    })

    it('includes trabalho_domestico category', () => {
      if (!result.ok) throw new Error('expected ok')
      const td = result.data.expenses.find((e) => e.category === 'trabalho_domestico')
      expect(td).toBeDefined()
    })
  })

  describe('2024 sample (non-zero fatura + trabalho doméstico)', () => {
    const result = parseDeductionsPageText(SAMPLE_2024)

    it('parses successfully', () => {
      expect(result.ok).toBe(true)
    })

    it('extracts year 2024', () => {
      expect(result.ok && result.data.year).toBe(2024)
    })

    it('finds all 7 categories', () => {
      expect(result.ok && result.data.expenses.length).toBe(7)
    })

    it('parses general expenses', () => {
      if (!result.ok) throw new Error('expected ok')
      const general = result.data.expenses.find((e) => e.category === 'general')!
      expect(general.expenseAmount).toBe(39861.26)
      expect(general.deductionAmount).toBe(250)
    })

    it('parses education with small non-zero value', () => {
      if (!result.ok) throw new Error('expected ok')
      const education = result.data.expenses.find((e) => e.category === 'education')!
      expect(education.expenseAmount).toBe(14.58)
      expect(education.deductionAmount).toBe(4.37)
    })

    it('parses non-zero fatura', () => {
      if (!result.ok) throw new Error('expected ok')
      const fatura = result.data.expenses.find((e) => e.category === 'fatura')!
      expect(fatura.expenseAmount).toBe(91.29)
      expect(fatura.deductionAmount).toBe(13.69)
    })

    it('parses non-zero trabalho doméstico', () => {
      if (!result.ok) throw new Error('expected ok')
      const td = result.data.expenses.find((e) => e.category === 'trabalho_domestico')!
      expect(td.expenseAmount).toBe(782.59)
      expect(td.deductionAmount).toBe(39.13)
    })
  })

  describe('2023 sample (6 categories, no trabalho doméstico)', () => {
    const result = parseDeductionsPageText(SAMPLE_2023)

    it('parses successfully', () => {
      expect(result.ok).toBe(true)
    })

    it('extracts year 2023', () => {
      expect(result.ok && result.data.year).toBe(2023)
    })

    it('finds 6 categories (no trabalho doméstico)', () => {
      expect(result.ok && result.data.expenses.length).toBe(6)
    })

    it('does not include trabalho_domestico', () => {
      if (!result.ok) throw new Error('expected ok')
      const td = result.data.expenses.find((e) => e.category === 'trabalho_domestico')
      expect(td).toBeUndefined()
    })

    it('parses health expenses', () => {
      if (!result.ok) throw new Error('expected ok')
      const health = result.data.expenses.find((e) => e.category === 'health')!
      expect(health.expenseAmount).toBe(465.99)
      expect(health.deductionAmount).toBe(69.9)
    })
  })

  describe('2022 sample (6 categories, non-zero fatura)', () => {
    const result = parseDeductionsPageText(SAMPLE_2022)

    it('parses successfully', () => {
      expect(result.ok).toBe(true)
    })

    it('extracts year 2022', () => {
      expect(result.ok && result.data.year).toBe(2022)
    })

    it('finds 6 categories', () => {
      expect(result.ok && result.data.expenses.length).toBe(6)
    })

    it('parses non-zero fatura', () => {
      if (!result.ok) throw new Error('expected ok')
      const fatura = result.data.expenses.find((e) => e.category === 'fatura')!
      expect(fatura.expenseAmount).toBe(113.97)
      expect(fatura.deductionAmount).toBe(18.14)
    })
  })

  describe('2021 sample (6 categories, non-zero education + fatura)', () => {
    const result = parseDeductionsPageText(SAMPLE_2021)

    it('parses successfully', () => {
      expect(result.ok).toBe(true)
    })

    it('extracts year 2021', () => {
      expect(result.ok && result.data.year).toBe(2021)
    })

    it('finds 6 categories', () => {
      expect(result.ok && result.data.expenses.length).toBe(6)
    })

    it('parses non-zero education', () => {
      if (!result.ok) throw new Error('expected ok')
      const education = result.data.expenses.find((e) => e.category === 'education')!
      expect(education.expenseAmount).toBe(153.28)
      expect(education.deductionAmount).toBe(45.98)
    })

    it('parses non-zero fatura', () => {
      if (!result.ok) throw new Error('expected ok')
      const fatura = result.data.expenses.find((e) => e.category === 'fatura')!
      expect(fatura.expenseAmount).toBe(283.15)
      expect(fatura.deductionAmount).toBe(44.35)
    })
  })

  // ── All samples share the same NIF ──

  it('all samples extract the same NIF', () => {
    for (const sample of [SAMPLE_2025, SAMPLE_2024, SAMPLE_2023, SAMPLE_2022, SAMPLE_2021]) {
      const r = parseDeductionsPageText(sample)
      expect(r.ok && r.data.nif).toBe('100000001')
    }
  })

  it('all samples extract the same name', () => {
    for (const sample of [SAMPLE_2025, SAMPLE_2024, SAMPLE_2023, SAMPLE_2022, SAMPLE_2021]) {
      const r = parseDeductionsPageText(sample)
      expect(r.ok && r.data.name).toBe('CONTRIBUINTE EXEMPLO')
    }
  })

  // ── Edge cases ────────────────────────────────────────────────────

  describe('error handling', () => {
    it('returns error for empty string', () => {
      const r = parseDeductionsPageText('')
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.error).toContain('vazio')
    })

    it('returns error for null-ish input', () => {
      const r = parseDeductionsPageText(null as unknown as string)
      expect(r.ok).toBe(false)
    })

    it('returns error for whitespace-only input', () => {
      const r = parseDeductionsPageText('   \n\n  ')
      expect(r.ok).toBe(false)
    })

    it('returns error when NIF is missing', () => {
      const text =
        'Ano 2025\nDespesas gerais familiares\n100,00 €\nDedução correspondente à despesa 35,00 €'
      const r = parseDeductionsPageText(text)
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.error).toContain('NIF')
    })

    it('returns error when year is missing', () => {
      const text =
        'NIF: 123456789\nDespesas gerais familiares\n100,00 €\nDedução correspondente à despesa 35,00 €'
      const r = parseDeductionsPageText(text)
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.error).toContain('Ano')
    })

    it('returns error when no expense categories found', () => {
      const text = 'NIF: 123456789\nAno 2025\nSome random text without categories'
      const r = parseDeductionsPageText(text)
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.error).toContain('categoria')
    })

    it('returns empty name when greeting is absent', () => {
      const text = `NIF: 123456789\nAno 2025\nDespesas gerais familiares\n500,00 €\nDedução correspondente à despesa 175,00 €`
      const r = parseDeductionsPageText(text)
      expect(r.ok).toBe(true)
      if (r.ok) expect(r.data.name).toBe('')
    })
  })

  // ── Synthetic minimal input ──────────────────────────────────────

  describe('minimal valid input', () => {
    const text = [
      'Boa tarde, MARIA SILVA',
      'NIF: 123456789',
      'Ano 2024',
      'Despesas gerais familiares',
      '1.000,00 €',
      'Dedução correspondente à despesa 250,00 €',
      'Saúde e seguros de saúde',
      '200,50 €',
      'Dedução correspondente à despesa 30,07 €',
    ].join('\n')

    it('parses minimal 2-category input', () => {
      const r = parseDeductionsPageText(text)
      expect(r.ok).toBe(true)
      if (!r.ok) return
      expect(r.data.nif).toBe('123456789')
      expect(r.data.name).toBe('MARIA SILVA')
      expect(r.data.year).toBe(2024)
      expect(r.data.expenses).toHaveLength(2)
      expect(r.data.expenses[0]).toEqual({
        category: 'general',
        expenseAmount: 1000,
        deductionAmount: 250,
      })
      expect(r.data.expenses[1]).toEqual({
        category: 'health',
        expenseAmount: 200.5,
        deductionAmount: 30.07,
      })
    })
  })
})
