import { describe, it, expect } from 'vitest'
import {
  validateDeclarationFiles,
  validateLiquidacaoFiles,
  validatePreviousYearsFiles,
  validateCrossSection,
  computeDeductionSlots,
  getMandatoryUnfilledSlots,
  type FileInfo,
  type SlotFileInfo,
} from '@/lib/tax/upload-validation'

function makeFile(overrides: Partial<FileInfo> & { name: string }): FileInfo {
  return { docType: 'xml_modelo3', ...overrides }
}

// ─── validateDeclarationFiles ───────────────────────────────

describe('validateDeclarationFiles', () => {
  it('returns no errors for empty list', () => {
    expect(validateDeclarationFiles([])).toEqual([])
  })

  it('returns no errors for 1 file without spouse', () => {
    const files = [makeFile({ name: 'a.xml', nif: '123', year: 2024 })]
    expect(validateDeclarationFiles(files)).toEqual([])
  })

  it('errors when single file references a spouse NIF', () => {
    const files = [makeFile({ name: 'a.xml', nif: '123', year: 2024, nifConjuge: '456' })]
    const errors = validateDeclarationFiles(files)
    expect(errors).toHaveLength(1)
    expect(errors[0].severity).toBeUndefined() // default = error
    expect(errors[0].message).toContain('456')
    expect(errors[0].message).toContain('cônjuge')
  })

  it('no spouse error when single file has no nifConjuge', () => {
    const files = [makeFile({ name: 'a.xml', nif: '123', year: 2024 })]
    expect(validateDeclarationFiles(files)).toEqual([])
  })

  it('returns no errors for 2 files, same year, different NIFs', () => {
    const files = [
      makeFile({ name: 'a.xml', nif: '111', year: 2024 }),
      makeFile({ name: 'b.xml', nif: '222', year: 2024 }),
    ]
    expect(validateDeclarationFiles(files)).toEqual([])
  })

  it('errors when 2 files have the same NIF', () => {
    const files = [
      makeFile({ name: 'a.xml', nif: '111', year: 2024 }),
      makeFile({ name: 'b.xml', nif: '111', year: 2024 }),
    ]
    const errors = validateDeclarationFiles(files)
    expect(errors).toHaveLength(1)
    expect(errors[0].file).toBe('b.xml')
    expect(errors[0].message).toContain('NIF duplicado')
  })

  it('errors when 2 files have different years', () => {
    const files = [
      makeFile({ name: 'a.xml', nif: '111', year: 2023 }),
      makeFile({ name: 'b.xml', nif: '222', year: 2024 }),
    ]
    const errors = validateDeclarationFiles(files)
    expect(errors).toHaveLength(1)
    expect(errors[0].file).toBe('b.xml')
    expect(errors[0].message).toContain('Ano diferente')
  })

  it('errors when 3 files are added', () => {
    const files = [
      makeFile({ name: 'a.xml', nif: '111', year: 2024 }),
      makeFile({ name: 'b.xml', nif: '222', year: 2024 }),
      makeFile({ name: 'c.xml', nif: '333', year: 2024 }),
    ]
    const errors = validateDeclarationFiles(files)
    expect(errors).toHaveLength(1)
    expect(errors[0].file).toBe('c.xml')
    expect(errors[0].message).toContain('Máximo de 2')
  })

  it('returns no errors when NIF matches other conjuge', () => {
    const files = [
      makeFile({ name: 'a.xml', nif: '111', year: 2024, nifConjuge: '222' }),
      makeFile({ name: 'b.xml', nif: '222', year: 2024, nifConjuge: '111' }),
    ]
    expect(validateDeclarationFiles(files)).toEqual([])
  })

  it('returns no errors when only one file has conjuge info and it matches', () => {
    const files = [
      makeFile({ name: 'a.xml', nif: '111', year: 2024, nifConjuge: '222' }),
      makeFile({ name: 'b.xml', nif: '222', year: 2024 }),
    ]
    expect(validateDeclarationFiles(files)).toEqual([])
  })

  it('warns when NIF does not match conjuge', () => {
    const files = [
      makeFile({ name: 'a.xml', nif: '111', year: 2024, nifConjuge: '333' }),
      makeFile({ name: 'b.xml', nif: '222', year: 2024 }),
    ]
    const errors = validateDeclarationFiles(files)
    expect(errors).toHaveLength(1)
    expect(errors[0].severity).toBe('warning')
    expect(errors[0].message).toContain('cônjuges')
  })

  it('returns no errors when no conjuge info is available', () => {
    const files = [
      makeFile({ name: 'a.xml', nif: '111', year: 2024 }),
      makeFile({ name: 'b.xml', nif: '222', year: 2024 }),
    ]
    expect(validateDeclarationFiles(files)).toEqual([])
  })
})

// ─── validateLiquidacaoFiles ────────────────────────────────

describe('validateLiquidacaoFiles', () => {
  const decls = [makeFile({ name: 'decl.xml', nif: '111', year: 2024 })]

  it('returns no errors for empty list', () => {
    expect(validateLiquidacaoFiles([], decls)).toEqual([])
  })

  it('returns no errors when NIF matches declaration', () => {
    const files = [makeFile({ name: 'liq.pdf', nif: '111', year: 2024, docType: 'pdf_liquidacao' })]
    expect(validateLiquidacaoFiles(files, decls)).toEqual([])
  })

  it('errors when NIF does not match any declaration', () => {
    const files = [makeFile({ name: 'liq.pdf', nif: '999', year: 2024, docType: 'pdf_liquidacao' })]
    const errors = validateLiquidacaoFiles(files, decls)
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('não corresponde')
  })

  it('errors when year does not match declaration', () => {
    const files = [makeFile({ name: 'liq.pdf', nif: '111', year: 2023, docType: 'pdf_liquidacao' })]
    const errors = validateLiquidacaoFiles(files, decls)
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('Ano da liquidação')
  })

  it('errors when 2 files have the same NIF', () => {
    const files = [
      makeFile({ name: 'a.pdf', nif: '111', year: 2024, docType: 'pdf_liquidacao' }),
      makeFile({ name: 'b.pdf', nif: '111', year: 2024, docType: 'pdf_liquidacao' }),
    ]
    const errors = validateLiquidacaoFiles(files, decls)
    expect(errors).toHaveLength(1)
    expect(errors[0].file).toBe('b.pdf')
    expect(errors[0].message).toContain('NIF duplicado')
  })

  it('errors when 3 files are added', () => {
    const twoDecls = [
      makeFile({ name: 'd1.xml', nif: '111', year: 2024 }),
      makeFile({ name: 'd2.xml', nif: '222', year: 2024 }),
    ]
    const files = [
      makeFile({ name: 'a.pdf', nif: '111', year: 2024, docType: 'pdf_liquidacao' }),
      makeFile({ name: 'b.pdf', nif: '222', year: 2024, docType: 'pdf_liquidacao' }),
      makeFile({ name: 'c.pdf', nif: '333', year: 2024, docType: 'pdf_liquidacao' }),
    ]
    const errors = validateLiquidacaoFiles(files, twoDecls)
    expect(errors).toHaveLength(1)
    expect(errors[0].file).toBe('c.pdf')
    expect(errors[0].message).toContain('Máximo de 2')
  })

  it('skips NIF check when declarations have no NIFs', () => {
    const declsNoNif = [makeFile({ name: 'decl.xml', year: 2024 })]
    const files = [makeFile({ name: 'liq.pdf', nif: '999', year: 2024, docType: 'pdf_liquidacao' })]
    const errors = validateLiquidacaoFiles(files, declsNoNif)
    // No NIF mismatch error since decls have no NIFs
    expect(errors.filter((e) => e.message.includes('NIF'))).toHaveLength(0)
  })
})

// ─── validatePreviousYearsFiles ─────────────────────────────

describe('validatePreviousYearsFiles', () => {
  it('returns no errors for empty list', () => {
    expect(validatePreviousYearsFiles([])).toEqual([])
  })

  it('returns no errors for 2 files same year, different NIFs', () => {
    const files = [
      makeFile({ name: 'a.xml', nif: '111', year: 2022 }),
      makeFile({ name: 'b.xml', nif: '222', year: 2022 }),
    ]
    expect(validatePreviousYearsFiles(files)).toEqual([])
  })

  it('errors on 2 declaration files same year same NIF', () => {
    const files = [
      makeFile({ name: 'a.xml', nif: '111', year: 2022, docType: 'xml_modelo3' }),
      makeFile({ name: 'b.xml', nif: '111', year: 2022, docType: 'xml_modelo3' }),
    ]
    const errors = validatePreviousYearsFiles(files)
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('duplicado')
    expect(errors[0].message).toContain('2022')
  })

  it('allows 4 files per year (2 declarations + 2 liquidações, different NIFs)', () => {
    const files = [
      makeFile({ name: 'a.xml', nif: '111', year: 2022, docType: 'xml_modelo3' }),
      makeFile({ name: 'b.xml', nif: '222', year: 2022, docType: 'xml_modelo3' }),
      makeFile({ name: 'c.pdf', nif: '111', year: 2022, docType: 'pdf_liquidacao' }),
      makeFile({ name: 'd.pdf', nif: '222', year: 2022, docType: 'pdf_liquidacao' }),
    ]
    expect(validatePreviousYearsFiles(files)).toEqual([])
  })

  it('errors on 5th file for the same year', () => {
    const files = [
      makeFile({ name: 'a.xml', nif: '111', year: 2022, docType: 'xml_modelo3' }),
      makeFile({ name: 'b.xml', nif: '222', year: 2022, docType: 'xml_modelo3' }),
      makeFile({ name: 'c.pdf', nif: '111', year: 2022, docType: 'pdf_liquidacao' }),
      makeFile({ name: 'd.pdf', nif: '222', year: 2022, docType: 'pdf_liquidacao' }),
      makeFile({ name: 'e.xml', nif: '333', year: 2022, docType: 'xml_modelo3' }),
    ]
    const errors = validatePreviousYearsFiles(files)
    expect(errors).toHaveLength(1)
    expect(errors[0].file).toBe('e.xml')
    expect(errors[0].message).toContain('Máximo de 4')
  })

  it('errors on duplicate NIF+docType within same year', () => {
    const files = [
      makeFile({ name: 'a.pdf', nif: '111', year: 2022, docType: 'pdf_liquidacao' }),
      makeFile({ name: 'b.pdf', nif: '111', year: 2022, docType: 'pdf_liquidacao' }),
    ]
    const errors = validatePreviousYearsFiles(files)
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('duplicado')
  })

  it('allows same NIF with different doc types in same year', () => {
    const files = [
      makeFile({ name: 'a.xml', nif: '111', year: 2022, docType: 'xml_modelo3' }),
      makeFile({ name: 'b.pdf', nif: '111', year: 2022, docType: 'pdf_liquidacao' }),
    ]
    expect(validatePreviousYearsFiles(files)).toEqual([])
  })

  it('returns no errors for multiple years, 1 file each', () => {
    const files = [
      makeFile({ name: 'a.xml', nif: '111', year: 2021 }),
      makeFile({ name: 'b.xml', nif: '111', year: 2022 }),
      makeFile({ name: 'c.xml', nif: '111', year: 2023 }),
    ]
    expect(validatePreviousYearsFiles(files)).toEqual([])
  })

  it('skips files without a year', () => {
    const files = [makeFile({ name: 'a.xml', nif: '111' }), makeFile({ name: 'b.xml', nif: '111' })]
    expect(validatePreviousYearsFiles(files)).toEqual([])
  })

  it('warns when a declaration references a spouse whose declaration is missing for that year', () => {
    const files = [
      makeFile({
        name: 'a.xml',
        nif: '111',
        year: 2022,
        nifConjuge: '222',
        docType: 'xml_modelo3',
      }),
    ]
    const errors = validatePreviousYearsFiles(files)
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('cônjuge')
    expect(errors[0].message).toContain('222')
  })

  it('no spouse warning when both spouse declarations are present', () => {
    const files = [
      makeFile({
        name: 'a.xml',
        nif: '111',
        year: 2022,
        nifConjuge: '222',
        docType: 'xml_modelo3',
      }),
      makeFile({
        name: 'b.xml',
        nif: '222',
        year: 2022,
        nifConjuge: '111',
        docType: 'xml_modelo3',
      }),
    ]
    expect(validatePreviousYearsFiles(files)).toEqual([])
  })

  it('no spouse warning for declarations without nifConjuge', () => {
    const files = [makeFile({ name: 'a.xml', nif: '111', year: 2022, docType: 'xml_modelo3' })]
    expect(validatePreviousYearsFiles(files)).toEqual([])
  })

  it('warns for missing spouse only on declaration files, not liquidação', () => {
    const files = [
      makeFile({
        name: 'a.pdf',
        nif: '111',
        year: 2022,
        nifConjuge: '222',
        docType: 'pdf_liquidacao',
      }),
    ]
    expect(validatePreviousYearsFiles(files)).toEqual([])
  })
})

// ─── validateCrossSection ───────────────────────────────────

describe('validateCrossSection', () => {
  it('returns no errors when no year overlap', () => {
    const declaration = [makeFile({ name: 'decl.xml', year: 2024 })]
    const previousYears = [makeFile({ name: 'prev.xml', year: 2023 })]
    expect(validateCrossSection(declaration, previousYears)).toEqual([])
  })

  it('warns when same year appears in both sections', () => {
    const declaration = [makeFile({ name: 'decl.xml', year: 2024 })]
    const previousYears = [makeFile({ name: 'prev.xml', year: 2024 })]
    const errors = validateCrossSection(declaration, previousYears)
    expect(errors).toHaveLength(1)
    expect(errors[0].severity).toBe('warning')
    expect(errors[0].message).toContain('2024')
  })

  it('returns no errors when declaration has no year', () => {
    const declaration = [makeFile({ name: 'decl.xml' })]
    const previousYears = [makeFile({ name: 'prev.xml', year: 2024 })]
    expect(validateCrossSection(declaration, previousYears)).toEqual([])
  })

  it('returns no errors when previous years is empty', () => {
    const declaration = [makeFile({ name: 'decl.xml', year: 2024 })]
    expect(validateCrossSection(declaration, [])).toEqual([])
  })
})

// ─── Severity Classification (Bug #11: errors, not warnings) ─

describe('Severity classification', () => {
  describe('blocking errors (no severity = error)', () => {
    it('year mismatch between declarations is a blocking error', () => {
      const files = [
        makeFile({ name: 'a.xml', nif: '111', year: 2023 }),
        makeFile({ name: 'b.xml', nif: '222', year: 2024 }),
      ]
      const errors = validateDeclarationFiles(files)
      expect(errors).toHaveLength(1)
      expect(errors[0].severity).toBeUndefined() // undefined = error (blocking)
    })

    it('duplicate NIF is a blocking error', () => {
      const files = [
        makeFile({ name: 'a.xml', nif: '111', year: 2024 }),
        makeFile({ name: 'b.xml', nif: '111', year: 2024 }),
      ]
      const errors = validateDeclarationFiles(files)
      expect(errors).toHaveLength(1)
      expect(errors[0].severity).toBeUndefined()
    })

    it('missing spouse declaration is a blocking error', () => {
      const files = [makeFile({ name: 'a.xml', nif: '111', year: 2024, nifConjuge: '222' })]
      const errors = validateDeclarationFiles(files)
      expect(errors).toHaveLength(1)
      expect(errors[0].severity).toBeUndefined()
    })

    it('liquidação NIF not matching any declaration is a blocking error', () => {
      const decls = [makeFile({ name: 'decl.xml', nif: '111', year: 2024 })]
      const files = [
        makeFile({ name: 'liq.pdf', nif: '999', year: 2024, docType: 'pdf_liquidacao' }),
      ]
      const errors = validateLiquidacaoFiles(files, decls)
      const nifError = errors.find((e) => e.message.includes('NIF'))
      expect(nifError).toBeDefined()
      expect(nifError!.severity).toBeUndefined()
    })

    it('liquidação year not matching declaration is a blocking error', () => {
      const decls = [makeFile({ name: 'decl.xml', nif: '111', year: 2024 })]
      const files = [
        makeFile({ name: 'liq.pdf', nif: '111', year: 2023, docType: 'pdf_liquidacao' }),
      ]
      const errors = validateLiquidacaoFiles(files, decls)
      const yearError = errors.find((e) => e.message.includes('Ano'))
      expect(yearError).toBeDefined()
      expect(yearError!.severity).toBeUndefined()
    })

    it('too many declarations is a blocking error', () => {
      const files = [
        makeFile({ name: 'a.xml', nif: '111', year: 2024 }),
        makeFile({ name: 'b.xml', nif: '222', year: 2024 }),
        makeFile({ name: 'c.xml', nif: '333', year: 2024 }),
      ]
      const errors = validateDeclarationFiles(files)
      expect(errors).toHaveLength(1)
      expect(errors[0].severity).toBeUndefined()
    })

    it('duplicate NIF in previous years is a blocking error', () => {
      const files = [
        makeFile({ name: 'a.xml', nif: '111', year: 2022 }),
        makeFile({ name: 'b.xml', nif: '111', year: 2022 }),
      ]
      const errors = validatePreviousYearsFiles(files)
      expect(errors).toHaveLength(1)
      expect(errors[0].severity).toBeUndefined()
    })
  })

  describe('warnings (non-blocking)', () => {
    it('spouse NIF mismatch is a warning', () => {
      const files = [
        makeFile({ name: 'a.xml', nif: '111', year: 2024, nifConjuge: '333' }),
        makeFile({ name: 'b.xml', nif: '222', year: 2024 }),
      ]
      const errors = validateDeclarationFiles(files)
      expect(errors).toHaveLength(1)
      expect(errors[0].severity).toBe('warning')
    })

    it('cross-section year overlap is a warning', () => {
      const declaration = [makeFile({ name: 'decl.xml', year: 2024 })]
      const previousYears = [makeFile({ name: 'prev.xml', year: 2024 })]
      const errors = validateCrossSection(declaration, previousYears)
      expect(errors).toHaveLength(1)
      expect(errors[0].severity).toBe('warning')
    })
  })
})

// ─── Slot helpers ───────────────────────────────────────────

function makeSlot(overrides: Partial<SlotFileInfo> & { year: number; nif: string }): SlotFileInfo {
  return { status: 'done', ...overrides }
}

function makeLiq(year: number): SlotFileInfo {
  return { status: 'done', liquidacaoYear: year }
}

// ─── computeDeductionSlots ──────────────────────────────────

describe('computeDeductionSlots', () => {
  it('returns empty when no declarations', () => {
    expect(computeDeductionSlots([], [])).toEqual([])
  })

  it('creates taxpayer slot from declaration NIF', () => {
    const decls = [makeSlot({ nif: '111', year: 2024 })]
    const slots = computeDeductionSlots(decls, [])
    expect(slots).toHaveLength(1)
    expect(slots[0]).toMatchObject({ nif: '111', year: 2024, role: 'taxpayer' })
  })

  it('creates taxpayer slot for spouse NIF', () => {
    const decls = [makeSlot({ nif: '111', year: 2024, nifConjuge: '222' })]
    const slots = computeDeductionSlots(decls, [])
    expect(slots).toHaveLength(2)
    expect(slots.find((s) => s.nif === '222')?.role).toBe('taxpayer')
  })

  it('creates dependent slots from dependentNifs', () => {
    const decls = [makeSlot({ nif: '111', year: 2024, dependentNifs: ['333', '444'] })]
    const slots = computeDeductionSlots(decls, [])
    expect(slots.filter((s) => s.role === 'dependent')).toHaveLength(2)
  })

  it('creates ascendant slots from ascendantNifs', () => {
    const decls = [makeSlot({ nif: '111', year: 2024, ascendantNifs: ['555'] })]
    const slots = computeDeductionSlots(decls, [])
    expect(slots.filter((s) => s.role === 'ascendant')).toHaveLength(1)
    expect(slots.find((s) => s.nif === '555')?.role).toBe('ascendant')
  })

  it('deduplicates same NIF+year across declarations', () => {
    const decls = [
      makeSlot({ nif: '111', year: 2024, dependentNifs: ['333'] }),
      makeSlot({ nif: '222', year: 2024, nifConjuge: '111', dependentNifs: ['333'] }),
    ]
    const slots = computeDeductionSlots(decls, [])
    // 111 (taxpayer) + 222 (taxpayer) + 333 (dependent) = 3 unique
    expect(slots).toHaveLength(3)
  })

  it('marks slot hasLiquidacao=true when liquidação covers the year', () => {
    const decls = [makeSlot({ nif: '111', year: 2024 })]
    const liqs = [makeLiq(2024)]
    const slots = computeDeductionSlots(decls, liqs)
    expect(slots[0].hasLiquidacao).toBe(true)
  })

  it('marks slot hasLiquidacao=false when no liquidação for the year', () => {
    const decls = [makeSlot({ nif: '111', year: 2024 })]
    const liqs = [makeLiq(2023)]
    const slots = computeDeductionSlots(decls, liqs)
    expect(slots[0].hasLiquidacao).toBe(false)
  })

  it('ignores files that are not status=done', () => {
    const decls = [
      makeSlot({ nif: '111', year: 2024, status: 'processing' }),
      makeSlot({ nif: '222', year: 2024, status: 'error' }),
    ]
    expect(computeDeductionSlots(decls, [])).toEqual([])
  })

  it('ignores liquidação files that are not status=done', () => {
    const decls = [makeSlot({ nif: '111', year: 2024 })]
    const liqs: SlotFileInfo[] = [{ status: 'processing', liquidacaoYear: 2024 }]
    const slots = computeDeductionSlots(decls, liqs)
    expect(slots[0].hasLiquidacao).toBe(false)
  })

  it('sorts: taxpayer before dependent before ascendant', () => {
    const decls = [
      makeSlot({ nif: '111', year: 2024, dependentNifs: ['333'], ascendantNifs: ['555'] }),
    ]
    const slots = computeDeductionSlots(decls, [])
    const roles = slots.map((s) => s.role)
    expect(roles).toEqual(['taxpayer', 'dependent', 'ascendant'])
  })

  it('groups all years for same NIF together (NIF grouping for fewer relogins)', () => {
    const decls = [
      makeSlot({ nif: '111', year: 2024 }),
      makeSlot({ nif: '111', year: 2023 }),
      makeSlot({ nif: '222', year: 2024 }),
    ]
    const slots = computeDeductionSlots(decls, [])
    // All NIF 111 slots should be adjacent, before NIF 222
    const nifs = slots.map((s) => s.nif)
    expect(nifs).toEqual(['111', '111', '222'])
  })

  it('sorts years descending within same NIF', () => {
    const decls = [
      makeSlot({ nif: '111', year: 2022 }),
      makeSlot({ nif: '111', year: 2024 }),
      makeSlot({ nif: '111', year: 2023 }),
    ]
    const slots = computeDeductionSlots(decls, [])
    const years = slots.map((s) => s.year)
    expect(years).toEqual([2024, 2023, 2022])
  })
})

// ─── getMandatoryUnfilledSlots ───────────────────────────────

describe('getMandatoryUnfilledSlots', () => {
  it('taxpayer without liquidação and not pasted is mandatory', () => {
    const slots = computeDeductionSlots([makeSlot({ nif: '111', year: 2024 })], [])
    const unfilled = getMandatoryUnfilledSlots(slots, new Set())
    expect(unfilled).toHaveLength(1)
    expect(unfilled[0].nif).toBe('111')
  })

  it('taxpayer WITH liquidação is not mandatory', () => {
    const decls = [makeSlot({ nif: '111', year: 2024 })]
    const liqs = [makeLiq(2024)]
    const slots = computeDeductionSlots(decls, liqs)
    const unfilled = getMandatoryUnfilledSlots(slots, new Set())
    expect(unfilled).toHaveLength(0)
  })

  it('taxpayer with pasted deductions is not mandatory', () => {
    const slots = computeDeductionSlots([makeSlot({ nif: '111', year: 2024 })], [])
    const pasted = new Set(['111-2024'])
    const unfilled = getMandatoryUnfilledSlots(slots, pasted)
    expect(unfilled).toHaveLength(0)
  })

  it('dependent is never mandatory (even without liquidação)', () => {
    const decls = [makeSlot({ nif: '111', year: 2024, dependentNifs: ['333'] })]
    const slots = computeDeductionSlots(decls, [])
    const unfilled = getMandatoryUnfilledSlots(slots, new Set())
    // Only the taxpayer slot is mandatory, not the dependent
    expect(unfilled).toHaveLength(1)
    expect(unfilled[0].role).toBe('taxpayer')
  })

  it('ascendant is never mandatory (even without liquidação)', () => {
    const decls = [makeSlot({ nif: '111', year: 2024, ascendantNifs: ['555'] })]
    const slots = computeDeductionSlots(decls, [])
    const unfilled = getMandatoryUnfilledSlots(slots, new Set())
    expect(unfilled).toHaveLength(1)
    expect(unfilled[0].role).toBe('taxpayer')
  })

  it('mixed scenario: 2 taxpayers, 1 with liquidação, 1 without', () => {
    const decls = [makeSlot({ nif: '111', year: 2024 }), makeSlot({ nif: '222', year: 2024 })]
    const liqs = [makeLiq(2024)]
    // Both have liquidação (year-based)
    const slots = computeDeductionSlots(decls, liqs)
    const unfilled = getMandatoryUnfilledSlots(slots, new Set())
    expect(unfilled).toHaveLength(0)
  })
})

// ─── mergeSpouseHouseholds ─────────────────────────────────

import { mergeSpouseHouseholds, type ParsedDeclaration } from '@/lib/tax/upload-validation'
import type { Household, Person } from '@/lib/tax/types'

function makePerson(name: string, overrides?: Partial<Person>): Person {
  return {
    name,
    incomes: [],
    deductions: [],
    special_regimes: [],
    ...overrides,
  }
}

function makeHousehold(year: number, members: Person[], overrides?: Partial<Household>): Household {
  return {
    year,
    filing_status: 'married_separate',
    members,
    dependents: [],
    ...overrides,
  }
}

function makeDecl(overrides: Partial<ParsedDeclaration> & { nif: string }): ParsedDeclaration {
  return {
    household: makeHousehold(2024, [makePerson('Test')]),
    issues: [],
    ...overrides,
  }
}

describe('mergeSpouseHouseholds', () => {
  it('returns null for single declaration', () => {
    expect(mergeSpouseHouseholds([makeDecl({ nif: '111' })])).toBeNull()
  })

  it('returns null when declarations are not spouses', () => {
    const result = mergeSpouseHouseholds([makeDecl({ nif: '111' }), makeDecl({ nif: '222' })])
    expect(result).toBeNull()
  })

  it('returns null when years differ', () => {
    const result = mergeSpouseHouseholds([
      makeDecl({
        nif: '111',
        nifConjuge: '222',
        household: makeHousehold(2024, [makePerson('A')]),
      }),
      makeDecl({
        nif: '222',
        nifConjuge: '111',
        household: makeHousehold(2025, [makePerson('B')]),
      }),
    ])
    expect(result).toBeNull()
  })

  it('merges two separate declarations into one household', () => {
    const personA = makePerson('Alice', {
      incomes: [{ category: 'A', gross: 30000 }],
    })
    const personB_placeholder = makePerson('Titular B (222)', { incomes: [] })

    const personB_real = makePerson('Bob', {
      incomes: [{ category: 'B', gross: 20000 }],
    })
    const personA_placeholder = makePerson('Titular B (111)', { incomes: [] })

    const result = mergeSpouseHouseholds([
      makeDecl({
        nif: '111',
        nifConjuge: '222',
        household: makeHousehold(2024, [personA, personB_placeholder]),
      }),
      makeDecl({
        nif: '222',
        nifConjuge: '111',
        household: makeHousehold(2024, [personB_real, personA_placeholder]),
      }),
    ])

    expect(result).not.toBeNull()
    expect(result!.household.members).toHaveLength(2)
    expect(result!.household.members[0].name).toBe('Alice')
    expect(result!.household.members[0].incomes[0].gross).toBe(30000)
    expect(result!.household.members[1].name).toBe('Bob')
    expect(result!.household.members[1].incomes[0].gross).toBe(20000)
  })

  it('merges when only one declaration references conjuge', () => {
    const result = mergeSpouseHouseholds([
      makeDecl({
        nif: '111',
        nifConjuge: '222',
        household: makeHousehold(2024, [
          makePerson('A', { incomes: [{ category: 'A', gross: 10000 }] }),
          makePerson('Titular B (222)'),
        ]),
      }),
      makeDecl({
        nif: '222',
        // No nifConjuge set
        household: makeHousehold(2024, [
          makePerson('B', { incomes: [{ category: 'A', gross: 15000 }] }),
        ]),
      }),
    ])

    expect(result).not.toBeNull()
    expect(result!.household.members[1].name).toBe('B')
    expect(result!.household.members[1].incomes[0].gross).toBe(15000)
  })

  it('deduplicates dependents by name', () => {
    const dep = { name: 'Child', birth_year: 2015, disability_degree: 0 }
    const result = mergeSpouseHouseholds([
      makeDecl({
        nif: '111',
        nifConjuge: '222',
        household: {
          ...makeHousehold(2024, [makePerson('A'), makePerson('Titular B (222)')]),
          dependents: [dep],
        },
      }),
      makeDecl({
        nif: '222',
        nifConjuge: '111',
        household: {
          ...makeHousehold(2024, [makePerson('B')]),
          dependents: [dep, { name: 'Child2', birth_year: 2018, disability_degree: 0 }],
        },
      }),
    ])

    expect(result!.household.dependents).toHaveLength(2)
    expect(result!.household.dependents.map((d) => d.name)).toEqual(['Child', 'Child2'])
  })

  it('preserves special regimes from spouse source', () => {
    const result = mergeSpouseHouseholds([
      makeDecl({
        nif: '111',
        nifConjuge: '222',
        household: makeHousehold(2024, [makePerson('A'), makePerson('Titular B (222)')]),
      }),
      makeDecl({
        nif: '222',
        nifConjuge: '111',
        household: makeHousehold(2024, [
          makePerson('B', {
            special_regimes: ['irs_jovem'],
            irs_jovem_year: 3,
          }),
        ]),
      }),
    ])

    expect(result!.household.members[1].special_regimes).toEqual(['irs_jovem'])
    expect(result!.household.members[1].irs_jovem_year).toBe(3)
  })

  it('preserves irs_jovem stable anchors from spouse source', () => {
    const result = mergeSpouseHouseholds([
      makeDecl({
        nif: '111',
        nifConjuge: '222',
        household: makeHousehold(2024, [makePerson('A'), makePerson('Titular B (222)')]),
      }),
      makeDecl({
        nif: '222',
        nifConjuge: '111',
        household: makeHousehold(2024, [
          makePerson('B', {
            special_regimes: ['irs_jovem'],
            irs_jovem_year: 3,
            irs_jovem_first_work_year: 2021,
            irs_jovem_degree_year: 2020,
          }),
        ]),
      }),
    ])

    expect(result!.household.members[1].irs_jovem_first_work_year).toBe(2021)
    expect(result!.household.members[1].irs_jovem_degree_year).toBe(2020)
  })

  it('combines issues from both declarations', () => {
    const result = mergeSpouseHouseholds([
      makeDecl({
        nif: '111',
        nifConjuge: '222',
        household: makeHousehold(2024, [makePerson('A'), makePerson('Titular B (222)')]),
        issues: [{ severity: 'warning', code: 'A', message: 'issue A' }],
      }),
      makeDecl({
        nif: '222',
        nifConjuge: '111',
        household: makeHousehold(2024, [makePerson('B')]),
        issues: [{ severity: 'warning', code: 'B', message: 'issue B' }],
      }),
    ])

    expect(result!.issues).toHaveLength(2)
    expect(result!.issues[0].message).toBe('issue A')
    expect(result!.issues[1].message).toBe('issue B')
  })

  it('sets filing status to married_separate if base was single', () => {
    const result = mergeSpouseHouseholds([
      makeDecl({
        nif: '111',
        nifConjuge: '222',
        household: makeHousehold(2024, [makePerson('A'), makePerson('Titular B (222)')], {
          filing_status: 'single',
        }),
      }),
      makeDecl({
        nif: '222',
        nifConjuge: '111',
        household: makeHousehold(2024, [makePerson('B')]),
      }),
    ])

    expect(result!.household.filing_status).toBe('married_separate')
  })

  it('adds spouse when base has only one member', () => {
    const result = mergeSpouseHouseholds([
      makeDecl({
        nif: '111',
        nifConjuge: '222',
        household: makeHousehold(2024, [
          makePerson('A', { incomes: [{ category: 'A', gross: 25000 }] }),
        ]),
      }),
      makeDecl({
        nif: '222',
        nifConjuge: '111',
        household: makeHousehold(2024, [
          makePerson('B', { incomes: [{ category: 'A', gross: 18000 }] }),
        ]),
      }),
    ])

    expect(result!.household.members).toHaveLength(2)
    expect(result!.household.members[1].incomes[0].gross).toBe(18000)
  })

  it('preserves NIF when merging spouse data onto placeholder', () => {
    const result = mergeSpouseHouseholds([
      makeDecl({
        nif: '111',
        nifConjuge: '222',
        household: makeHousehold(2024, [
          makePerson('Alice', { nif: '111' }),
          makePerson('Titular B (222)', { nif: '222' }),
        ]),
      }),
      makeDecl({
        nif: '222',
        nifConjuge: '111',
        household: makeHousehold(2024, [
          makePerson('Bob', { nif: '222', incomes: [{ category: 'A', gross: 20000 }] }),
          makePerson('Titular B (111)', { nif: '111' }),
        ]),
      }),
    ])

    expect(result!.household.members[1].name).toBe('Bob')
    expect(result!.household.members[1].nif).toBe('222')
  })
})

// ─── maxPreviousYearsFiles ─────────────────────────────────

import { maxPreviousYearsFiles } from '@/lib/tax/upload-validation'

describe('maxPreviousYearsFiles', () => {
  // MIN_CONTEXT_YEAR = 2021
  // Formula: 4 files/year × (primaryYear - 2021)
  // 4 = 2 doc types (decl + liquidação) × 2 taxpayers

  it('returns 0 when primaryYear is 2021 (no previous years)', () => {
    expect(maxPreviousYearsFiles(2021)).toBe(0)
  })

  it('returns 4 when primaryYear is 2022 (1 previous year)', () => {
    expect(maxPreviousYearsFiles(2022)).toBe(4)
  })

  it('returns 8 when primaryYear is 2023 (2 previous years)', () => {
    expect(maxPreviousYearsFiles(2023)).toBe(8)
  })

  it('returns 16 when primaryYear is 2025 (4 previous years)', () => {
    expect(maxPreviousYearsFiles(2025)).toBe(16)
  })

  it('returns 0 when primaryYear is undefined', () => {
    expect(maxPreviousYearsFiles(undefined)).toBe(0)
  })

  it('returns 0 when primaryYear is before MIN_CONTEXT_YEAR', () => {
    expect(maxPreviousYearsFiles(2020)).toBe(0)
  })
})

// ─── getAmendableYears / getAllSupportedYears ────────────────

import { getAmendableYears, getAllSupportedYears } from '@/lib/tax/upload-validation'

describe('getAmendableYears', () => {
  it('includes current tax year and recent amendable years', () => {
    // On 2026-04-04, latest tax year = 2025
    // Amendment deadline = Jun 30 of taxYear+3
    // 2025: deadline 2028-06-30 → amendable
    // 2024: deadline 2027-06-30 → amendable
    // 2023: deadline 2026-06-30 → amendable (Apr < Jun)
    // 2022: deadline 2025-06-30 → expired
    const now = new Date(2026, 3, 4) // April 4, 2026
    const years = getAmendableYears(now)
    expect(years).toContain(2025)
    expect(years).toContain(2024)
    expect(years).toContain(2023)
    expect(years).not.toContain(2022)
    expect(years).not.toContain(2021)
  })

  it('includes year whose deadline is exactly today', () => {
    // 2022 deadline = June 30, 2025
    const now = new Date(2025, 5, 30, 12, 0, 0) // June 30, 2025 noon
    const years = getAmendableYears(now)
    expect(years).toContain(2022)
  })

  it('excludes year whose deadline has just passed', () => {
    // 2022 deadline = June 30, 2025 at 23:59:59
    const now = new Date(2025, 6, 1) // July 1, 2025
    const years = getAmendableYears(now)
    expect(years).not.toContain(2022)
  })

  it('returns years sorted descending', () => {
    const now = new Date(2026, 3, 4)
    const years = getAmendableYears(now)
    for (let i = 1; i < years.length; i++) {
      expect(years[i - 1]).toBeGreaterThan(years[i])
    }
  })

  it('never includes years before MIN_CONTEXT_YEAR (2021)', () => {
    const now = new Date(2023, 0, 1) // Jan 1, 2023
    const years = getAmendableYears(now)
    expect(years.every((y) => y >= 2021)).toBe(true)
  })
})

describe('getAllSupportedYears', () => {
  it('returns years from 2021 to latest tax year', () => {
    const now = new Date(2026, 3, 4) // April 4, 2026
    const years = getAllSupportedYears(now)
    expect(years).toContain(2021)
    expect(years).toContain(2025)
    expect(years).not.toContain(2026)
  })

  it('returns years sorted descending', () => {
    const now = new Date(2026, 3, 4)
    const years = getAllSupportedYears(now)
    for (let i = 1; i < years.length; i++) {
      expect(years[i - 1]).toBeGreaterThan(years[i])
    }
  })
})
