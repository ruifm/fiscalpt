'use client'

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import {
  FileText,
  FileCode,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronRight,
  Info,
  Shield,
  Receipt,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { XmlGuide, PdfGuide, LiquidacaoGuide } from '@/components/at-guide'
import { parseModelo3Xml } from '@/lib/tax/xml-parser'
import {
  extractTextFromPdf,
  parseLiquidacaoText,
  parseComprovativoPdfText,
  detectDocumentType,
} from '@/lib/tax/pdf-extractor'
import {
  computeDeductionSlots,
  getMandatoryUnfilledSlots,
  maxPreviousYearsFiles,
  getAmendableYears,
  getAllSupportedYears,
  type DeductionSlot,
} from '@/lib/tax/upload-validation'
import { parseDeductionsPageText, type DeductionsParseResult } from '@/lib/tax/deductions-parser'
import { assembleHouseholds } from '@/lib/tax/assemble-households'
import { useT } from '@/lib/i18n'

import type { DocumentUploadProps, UploadedFile, SectionFiles, Section, FileMeta } from './types'
import {
  MAX_FILES,
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_MB,
  NIF_COLORS,
  DOC_TYPE_LABELS,
} from './types'
import { toAssemblyFile, runSectionValidation, formatYearRange } from './file-processing'
import { DropZone } from './drop-zone'
import { SectionFileList, GroupedSectionFileList } from './section-file-list'
import { HelpToggle } from './help-toggle'
import { DeductionSlotsSection } from './deduction-slots'

export function DocumentUpload({ onExtracted }: DocumentUploadProps) {
  const t = useT()
  const [sectionFiles, setSectionFiles] = useState<SectionFiles>({
    declaration: [],
    liquidacao: [],
    previousYears: [],
  })
  const sectionFilesRef = useRef(sectionFiles)
  useEffect(() => {
    sectionFilesRef.current = sectionFiles
  }, [sectionFiles])
  const [processing, setProcessing] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const validationErrorRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (validationError) {
      validationErrorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [validationError])
  const [liquidacaoOpen, setLiquidacaoOpen] = useState(false)
  const [previousYearsOpen, setPreviousYearsOpen] = useState(false)
  const [deductionsPasteOpen, setDeductionsPasteOpen] = useState(false)

  // Section refs for autoscroll
  const deductionsSectionRef = useRef<HTMLDivElement>(null)
  const advanceButtonRef = useRef<HTMLDivElement>(null)

  /** Map of "NIF-year" → { text, parseResult } for pasted deductions */
  const [pastedDeductions, setPastedDeductions] = useState<
    Map<string, { text: string; result: DeductionsParseResult }>
  >(new Map())

  const amendableYears = useMemo(() => getAmendableYears(), [])
  const allSupportedYears = useMemo(() => getAllSupportedYears(), [])

  const hasDeclaration = sectionFiles.declaration.length > 0
  const anyFileProcessing = (Object.values(sectionFiles) as UploadedFile[][]).some((files) =>
    files.some((f) => f.status === 'processing'),
  )

  // Primary declaration year — used to compute max previous-years files
  const primaryDeclYear = useMemo(() => {
    const years = sectionFiles.declaration
      .filter((f) => f.status === 'done' && f.meta?.year != null)
      .map((f) => f.meta!.year!)
    return years.length > 0 ? Math.max(...years) : undefined
  }, [sectionFiles.declaration])

  const maxPrevFiles = maxPreviousYearsFiles(primaryDeclYear)
  const prevFilesAtLimit = sectionFiles.previousYears.length >= maxPrevFiles
  const declAtLimit = sectionFiles.declaration.length >= MAX_FILES.declaration
  const liqAtLimit = sectionFiles.liquidacao.length >= MAX_FILES.liquidacao

  const nifColorMap = useMemo(() => {
    const map = new Map<string, string>()
    const allFiles = [
      ...sectionFiles.declaration,
      ...sectionFiles.liquidacao,
      ...sectionFiles.previousYears,
    ]
    for (const uf of allFiles) {
      if (uf.meta?.nif && !map.has(uf.meta.nif)) {
        map.set(uf.meta.nif, NIF_COLORS[map.size] ?? NIF_COLORS[NIF_COLORS.length - 1])
      }
    }
    return map
  }, [sectionFiles])

  /** Unique (NIF, year) slots derived from parsed declarations, including dependents/ascendants */
  const deductionSlots = useMemo((): DeductionSlot[] => {
    function toSlotFiles(files: UploadedFile[]) {
      return files.map((uf) => ({
        status: uf.status,
        year: uf.meta?.year,
        nif: uf.meta?.nif,
        nifConjuge: uf.meta?.nifConjuge,
        dependentNifs: [
          ...((uf.parsedXml?.raw.dependents.map((d) => d.nif).filter(Boolean) as string[]) ?? []),
          ...((uf.parsedXml?.raw.godchildren.map((d) => d.nif).filter(Boolean) as string[]) ?? []),
          ...(uf.parsedComprovativo?.dependentNifs ?? []),
        ],
        ascendantNifs: [
          ...((uf.parsedXml?.raw.ascendants.map((a) => a.nif).filter(Boolean) as string[]) ?? []),
          ...(uf.parsedComprovativo?.ascendantNifs ?? []),
        ],
        liquidacaoYear: uf.parsedLiquidacao?.year,
      }))
    }

    const declarations = toSlotFiles([...sectionFiles.declaration, ...sectionFiles.previousYears])
    const liquidacaoFiles = toSlotFiles([...sectionFiles.liquidacao, ...sectionFiles.previousYears])

    return computeDeductionSlots(declarations, liquidacaoFiles)
  }, [sectionFiles])

  const deductionsMandatory =
    deductionSlots.length > 0 &&
    deductionSlots.some((s) => s.role === 'taxpayer' && !s.hasLiquidacao)

  // Autoscroll to next action after all files finish processing (only if no errors)
  const prevProcessing = useRef(false)
  const anyFileError = (Object.values(sectionFiles) as UploadedFile[][]).some((files) =>
    files.some((f) => f.status === 'error' || (f.status === 'done' && f.error)),
  )
  useEffect(() => {
    const wasProcessing = prevProcessing.current
    prevProcessing.current = anyFileProcessing
    if (wasProcessing && !anyFileProcessing && hasDeclaration && !anyFileError) {
      setTimeout(() => {
        if (deductionsSectionRef.current && deductionsMandatory) {
          deductionsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
        } else if (advanceButtonRef.current) {
          advanceButtonRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 200)
    }
  }, [anyFileProcessing, hasDeclaration, deductionsMandatory, anyFileError])

  const handleDeductionPaste = useCallback(
    (slotKey: string, expectedNif: string, expectedYear: number, text: string) => {
      let result = parseDeductionsPageText(text)

      // NIF / year mismatch → treat as error
      if (result.ok) {
        if (result.data.nif !== expectedNif) {
          result = {
            ok: false,
            error: t('upload.nifMismatch', {
              pastedNif: result.data.nif,
              expectedNif,
            }),
          }
        } else if (result.data.year !== expectedYear) {
          result = {
            ok: false,
            error: t('upload.yearMismatchPaste', {
              pastedYear: result.data.year,
              expectedYear,
            }),
          }
        }
      }

      setPastedDeductions((prev) => {
        const next = new Map(prev)
        next.set(slotKey, { text, result })
        return next
      })
    },
    [t],
  )

  const removeDeductionPaste = useCallback((slotKey: string) => {
    setPastedDeductions((prev) => {
      const next = new Map(prev)
      next.delete(slotKey)
      return next
    })
  }, [])

  const parseFileAsync = useCallback(
    async (section: Section, file: File) => {
      const updateFile = (update: Partial<UploadedFile>) => {
        setSectionFiles((prev) => {
          const idx = prev[section].findIndex((f) => f.file.name === file.name)
          if (idx === -1) return prev
          return {
            ...prev,
            [section]: prev[section].map((f, i) => (i === idx ? { ...f, ...update } : f)),
          }
        })
      }

      // Re-run validation on all files in the section after a successful parse
      const revalidateSection = () => {
        setSectionFiles((prev) => {
          const errs = runSectionValidation(section, prev[section], prev)
          const errByFile = new Map(errs.map((e) => [e.file, e.message]))
          return {
            ...prev,
            [section]: prev[section].map((f) => {
              if (f.status !== 'done') return f
              const msg = errByFile.get(f.file.name)
              if (msg && f.error !== msg) return { ...f, error: msg }
              if (!msg && f.error) return { ...f, error: undefined }
              return f
            }),
          }
        })
      }

      try {
        const isXml = file.name.toLowerCase().endsWith('.xml')

        if (isXml) {
          const text = await file.text()
          const result = parseModelo3Xml(text)

          if (section === 'liquidacao') {
            updateFile({
              status: 'error',
              error: t('upload.xmlDetected'),
            })
            return
          }

          const year = result.household.year
          const validYears = section === 'previousYears' ? allSupportedYears : amendableYears
          if (!validYears.includes(year)) {
            const hint =
              section === 'previousYears'
                ? t('upload.yearHintPrevious', { range: formatYearRange(allSupportedYears) })
                : t('upload.yearHintAmendable', { range: formatYearRange(amendableYears) })
            updateFile({
              status: 'error',
              error: t('upload.yearNotAccepted', { year, hint }),
            })
            return
          }

          const meta: FileMeta = {
            docTypeLabel: DOC_TYPE_LABELS.xml_modelo3,
            nif: result.raw.subjectA_nif,
            year: result.raw.year,
            nifConjuge: result.raw.subjectB_nif,
          }

          updateFile({ status: 'done', type: 'xml_modelo3', meta, parsedXml: result })
          revalidateSection()
        } else {
          const pdfText = await extractTextFromPdf(file)
          const docType = detectDocumentType(file.name, pdfText)

          if (section === 'declaration' && docType === 'pdf_liquidacao') {
            updateFile({
              status: 'error',
              error: t('upload.wrongDocType'),
            })
            return
          }
          if (section === 'liquidacao' && docType !== 'pdf_liquidacao' && docType !== 'unknown') {
            updateFile({
              status: 'error',
              error: t('upload.notLiquidacao'),
            })
            return
          }

          if (docType === 'pdf_liquidacao') {
            const parsed = parseLiquidacaoText(pdfText)
            const meta: FileMeta = {
              docTypeLabel: DOC_TYPE_LABELS.pdf_liquidacao,
              nif: parsed.nif,
              year: parsed.year,
              taxaEfetiva: parsed.taxaEfetiva,
            }
            updateFile({ status: 'done', type: docType, meta, parsedLiquidacao: parsed })
            revalidateSection()
          } else if (docType === 'pdf_comprovativo') {
            const parsed = parseComprovativoPdfText(pdfText)

            if (parsed.year) {
              const validYears = section === 'previousYears' ? allSupportedYears : amendableYears
              if (!validYears.includes(parsed.year)) {
                const hint =
                  section === 'previousYears'
                    ? t('upload.yearHintPrevious', { range: formatYearRange(allSupportedYears) })
                    : t('upload.yearHintAmendable', { range: formatYearRange(amendableYears) })
                updateFile({
                  status: 'error',
                  error: t('upload.yearNotAccepted', { year: parsed.year, hint }),
                })
                return
              }
            }

            const meta: FileMeta = {
              docTypeLabel: DOC_TYPE_LABELS.pdf_comprovativo,
              nif: parsed.nif,
              year: parsed.year,
              nifConjuge: parsed.nifConjuge,
            }

            updateFile({ status: 'done', type: docType, meta, parsedComprovativo: parsed })
            revalidateSection()
          } else {
            updateFile({
              status: 'error',
              error: t('upload.unrecognizedDoc'),
            })
          }
        }
      } catch (err) {
        updateFile({
          status: 'error',
          error: err instanceof Error ? err.message : t('upload.errorProcessingFile'),
        })
      }
    },
    [amendableYears, allSupportedYears, t],
  )

  const addFiles = useCallback(
    (section: Section, fileList: FileList | File[]) => {
      const errors: string[] = []
      const newFiles: UploadedFile[] = []

      for (const f of Array.from(fileList)) {
        const lower = f.name.toLowerCase()
        const isXml = lower.endsWith('.xml')
        const isPdf = lower.endsWith('.pdf')

        if (!isXml && !isPdf) continue

        if (f.size > MAX_FILE_SIZE_BYTES) {
          errors.push(t('upload.fileTooLarge', { name: f.name, max: MAX_FILE_SIZE_MB }))
          continue
        }

        if (f.size === 0) {
          errors.push(t('upload.fileEmpty', { name: f.name }))
          continue
        }

        if (section === 'liquidacao' && isXml) {
          errors.push(t('upload.liquidacaoPdfOnly', { name: f.name }))
          continue
        }

        newFiles.push({
          file: f,
          type: detectDocumentType(f.name),
          status: 'processing' as const,
        })
      }

      if (newFiles.length === 0) {
        if (errors.length > 0) setValidationError(errors.join(' '))
        return
      }

      // Pre-check limits and duplicates against current state snapshot
      const currentFiles = sectionFilesRef.current[section]
      const merged = [...currentFiles, ...newFiles]
      const limit = section === 'previousYears' ? maxPrevFiles : MAX_FILES[section]

      if (merged.length > limit) {
        setValidationError(t('upload.maxFiles', { max: limit }))
        return
      }

      const names = merged.map((uf) => uf.file.name)
      const dupes = names.filter((n, i) => names.indexOf(n) !== i)
      if (dupes.length > 0) {
        setValidationError(t('upload.duplicateFile', { name: dupes[0] }))
        return
      }

      // Add files to state
      setSectionFiles((prev) => ({ ...prev, [section]: [...prev[section], ...newFiles] }))

      // Always parse — we already validated limits/dupes above
      for (const nf of newFiles) {
        parseFileAsync(section, nf.file)
      }

      if (errors.length > 0) setValidationError(errors.join(' '))
      else setValidationError(null)
    },
    [parseFileAsync, maxPrevFiles, t],
  )

  function removeFile(section: Section, index: number) {
    setSectionFiles((prev) => {
      const updated = prev[section].filter((_, i) => i !== index)
      // Re-run validation on remaining files to update/clear errors
      const next = { ...prev, [section]: updated }
      const errs = runSectionValidation(section, updated, next)
      const errByFile = new Map(errs.map((e) => [e.file, e.message]))
      return {
        ...next,
        [section]: updated.map((f) => {
          if (f.status !== 'done') return f
          const msg = errByFile.get(f.file.name)
          if (msg && f.error !== msg) return { ...f, error: msg }
          if (!msg && f.error) return { ...f, error: undefined }
          return f
        }),
      }
    })
  }

  function processFiles() {
    // Mandatory deduction slot check (UI concern — not in assembly)
    const pastedKeys = new Set(
      [...pastedDeductions.entries()].filter(([_, v]) => v.result.ok).map(([k]) => k),
    )
    const unfilledMandatory = getMandatoryUnfilledSlots(deductionSlots, pastedKeys)
    if (unfilledMandatory.length > 0) {
      setDeductionsPasteOpen(true)
      const nifs = unfilledMandatory.map((s) => `NIF ${s.nif} (${s.year})`).join(', ')
      setValidationError(t('upload.deductionExpensesRequired', { names: nifs }))
      return
    }

    setProcessing(true)
    setValidationError(null)

    const result = assembleHouseholds({
      sectionFiles: {
        declaration: sectionFiles.declaration.map(toAssemblyFile),
        liquidacao: sectionFiles.liquidacao.map(toAssemblyFile),
        previousYears: sectionFiles.previousYears.map(toAssemblyFile),
      },
      pastedDeductions,
      deductionSlots,
    })

    setProcessing(false)

    if (result.ok) {
      onExtracted(result.households, result.issues, result.liquidacao)
    } else {
      switch (result.code) {
        case 'NEED_DECLARATION':
          setValidationError(t('upload.needDeclaration'))
          break
        case 'STILL_PROCESSING':
          setValidationError(t('upload.waitProcessing'))
          break
        case 'VALIDATION_FAILED':
          setValidationError(result.validationMessages?.join(' ') ?? t('upload.extractionFailed'))
          break
        case 'EXTRACTION_FAILED':
          setValidationError(t('upload.extractionFailed'))
          break
      }
    }
  }

  // Auto-expand deductions section when mandatory
  useEffect(() => {
    if (deductionsMandatory && !deductionsPasteOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- derived state sync
      setDeductionsPasteOpen(true)
    }
  }, [deductionsMandatory]) // eslint-disable-line react-hooks/exhaustive-deps

  const deductionsSection = deductionSlots.length > 0 && (
    <div ref={deductionsSectionRef}>
      <Card>
        <button
          type="button"
          onClick={() => setDeductionsPasteOpen(!deductionsPasteOpen)}
          aria-expanded={deductionsPasteOpen}
          className="flex w-full items-center gap-2 px-4 py-3 min-h-[44px] text-left"
        >
          {deductionsPasteOpen ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          )}
          <Receipt className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <span className="font-heading text-base font-medium">
            {t('upload.deductionExpenses')}
          </span>
          {deductionsMandatory ? (
            <Badge>{t('upload.required')}</Badge>
          ) : (
            <Badge variant="outline">{t('upload.optional')}</Badge>
          )}
          {[...pastedDeductions.values()].filter((v) => v.result.ok).length > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {[...pastedDeductions.values()].filter((v) => v.result.ok).length}/
              {deductionSlots.length}
            </Badge>
          )}
        </button>
        {deductionsPasteOpen && (
          <CardContent className="space-y-4 pt-0">
            <p className="text-sm text-muted-foreground">{t('upload.portalInstructions')}</p>

            <DeductionSlotsSection
              title={t('upload.taxpayers')}
              roleDescription={null}
              slots={deductionSlots.filter((s) => s.role === 'taxpayer')}
              pastedDeductions={pastedDeductions}
              nifColorMap={nifColorMap}
              onPaste={handleDeductionPaste}
              onRemove={removeDeductionPaste}
            />

            <DeductionSlotsSection
              title={t('upload.dependents')}
              roleDescription={t('upload.dependentsHelp')}
              slots={deductionSlots.filter((s) => s.role === 'dependent')}
              pastedDeductions={pastedDeductions}
              nifColorMap={nifColorMap}
              onPaste={handleDeductionPaste}
              onRemove={removeDeductionPaste}
              defaultOpen={false}
            />

            <DeductionSlotsSection
              title={t('upload.ascendants')}
              roleDescription={t('upload.ascendantsHelp')}
              slots={deductionSlots.filter((s) => s.role === 'ascendant')}
              pastedDeductions={pastedDeductions}
              nifColorMap={nifColorMap}
              onPaste={handleDeductionPaste}
              onRemove={removeDeductionPaste}
              defaultOpen={false}
            />
          </CardContent>
        )}
      </Card>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Section 1: Declaração de IRS (required) */}
      <Card className="ring-primary/30">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>{t('upload.declarationTitle')}</CardTitle>
            <Badge>{t('upload.required')}</Badge>
          </div>
          <CardDescription>
            {t('upload.declarationDesc')}
            {amendableYears.length > 0 && ` (${formatYearRange(amendableYears)})`}.{' '}
            {t('upload.declarationSpouseNote')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="xml">
            <TabsList className="w-full">
              <TabsTrigger value="xml" className="flex-1">
                <FileCode className="h-3.5 w-3.5" aria-hidden="true" />
                {t('upload.xmlFile')}
                <Badge variant="secondary" className="ml-1 text-[10px]">
                  {t('upload.recommended')}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="pdf" className="flex-1">
                <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                {t('upload.pdfFile')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="xml" className="mt-3 space-y-3">
              <p className="text-sm text-muted-foreground">{t('upload.xmlDesc')}</p>
              <HelpToggle>
                <XmlGuide />
              </HelpToggle>
              {!declAtLimit && (
                <DropZone
                  onFiles={(files) => addFiles('declaration', files)}
                  accept=".xml,.pdf"
                  disabled={processing}
                />
              )}
            </TabsContent>

            <TabsContent value="pdf" className="mt-3 space-y-3">
              <p className="text-sm text-muted-foreground">{t('upload.pdfDesc')}</p>
              <HelpToggle>
                <PdfGuide />
              </HelpToggle>
              <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>{t('upload.pdfAnnexNote')}</span>
              </div>
              {!declAtLimit && (
                <DropZone
                  onFiles={(files) => addFiles('declaration', files)}
                  accept=".xml,.pdf"
                  disabled={processing}
                />
              )}
            </TabsContent>
          </Tabs>

          <SectionFileList
            files={sectionFiles.declaration}
            onRemove={(i) => removeFile('declaration', i)}
            processing={processing}
            nifColorMap={nifColorMap}
          />
        </CardContent>
      </Card>

      {/* Mandatory deductions rendered before optional sections */}
      {deductionsMandatory && deductionsSection}

      {/* Demonstração de Liquidação (optional, collapsible) */}
      {hasDeclaration && (
        <Card>
          <button
            type="button"
            onClick={() => setLiquidacaoOpen(!liquidacaoOpen)}
            aria-expanded={liquidacaoOpen}
            className="flex w-full items-center gap-2 px-4 py-3 min-h-[44px] text-left"
          >
            {liquidacaoOpen ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            )}
            <Shield className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <div className="flex-1">
              <span className="font-heading text-base font-medium">
                {t('upload.liquidacaoTitle')}
              </span>
              <p className="text-xs text-muted-foreground">{t('upload.liquidacaoDesc')}</p>
            </div>
            <Badge variant="outline">{t('upload.optional')}</Badge>
            {sectionFiles.liquidacao.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {sectionFiles.liquidacao.length}
              </Badge>
            )}
          </button>
          {liquidacaoOpen && (
            <CardContent className="space-y-3 pt-0">
              <HelpToggle>
                <LiquidacaoGuide />
              </HelpToggle>
              {!liqAtLimit && (
                <DropZone
                  onFiles={(files) => addFiles('liquidacao', files)}
                  accept=".pdf"
                  disabled={processing}
                />
              )}
              <SectionFileList
                files={sectionFiles.liquidacao}
                onRemove={(i) => removeFile('liquidacao', i)}
                processing={processing}
                nifColorMap={nifColorMap}
              />
            </CardContent>
          )}
        </Card>
      )}

      {/* Section 3: Anos Anteriores (optional, collapsible) */}
      <Card>
        <button
          type="button"
          onClick={() => setPreviousYearsOpen(!previousYearsOpen)}
          aria-expanded={previousYearsOpen}
          className="flex w-full items-center gap-2 px-4 py-3 min-h-[44px] text-left"
        >
          {previousYearsOpen ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          )}
          <span className="font-heading text-base font-medium">{t('upload.previousYears')}</span>
          <Badge variant="outline">{t('upload.optional')}</Badge>
          {sectionFiles.previousYears.length > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {sectionFiles.previousYears.length}
            </Badge>
          )}
        </button>
        {previousYearsOpen && (
          <CardContent className="space-y-3 pt-0">
            <p className="text-sm text-muted-foreground">
              {t('upload.previousYearsDesc', { years: formatYearRange(allSupportedYears) })}
            </p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>{t('upload.previousYearsBenefit1')}</li>
              <li>{t('upload.previousYearsBenefit2')}</li>
              <li>{t('upload.previousYearsBenefit3')}</li>
            </ul>
            <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{t('upload.amendableNote', { years: formatYearRange(amendableYears) })}</span>
            </div>
            {prevFilesAtLimit ? (
              <p className="text-xs text-muted-foreground italic">
                {t('upload.limitReached', { max: maxPrevFiles })}
              </p>
            ) : (
              <DropZone
                onFiles={(files) => addFiles('previousYears', files)}
                accept=".xml,.pdf"
                disabled={processing}
                multiple
              />
            )}
            <GroupedSectionFileList
              files={sectionFiles.previousYears}
              onRemove={(i) => removeFile('previousYears', i)}
              processing={processing}
              nifColorMap={nifColorMap}
            />
          </CardContent>
        )}
      </Card>

      {/* Optional deductions rendered after optional sections */}
      {!deductionsMandatory && deductionsSection}

      {validationError && (
        <div
          ref={validationErrorRef}
          role="alert"
          aria-live="assertive"
          data-testid="upload-validation-error"
          className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/20"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
          <p className="text-sm text-red-800 dark:text-red-200">{validationError}</p>
        </div>
      )}

      {/* Process button — sticky at bottom */}
      <div ref={advanceButtonRef} className="sticky bottom-4 z-10 flex justify-center px-4 sm:px-0">
        <Button
          size="lg"
          onClick={processFiles}
          disabled={processing || anyFileProcessing}
          className="w-full sm:w-auto gap-2 px-8 shadow-lg"
          data-testid="advance-button"
        >
          {processing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              {t('upload.processingDocs')}
            </>
          ) : (
            t('upload.advance')
          )}
        </Button>
      </div>
    </div>
  )
}
